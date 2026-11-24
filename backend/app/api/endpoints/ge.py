import base64
import hashlib
import hmac
import html
import json
import logging
import re
import shlex
import time
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated, Any
from urllib.parse import parse_qs, urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
    PlainTextResponse,
    RedirectResponse,
    StreamingResponse,
)
from pydantic import BaseModel, Field

from app.api.deps import get_looker_service
from app.core.config import settings
from app.core.cookies import get_looker_user_from_cookie, set_looker_user_cookie
from app.core.security import seal_token, unseal_token
from app.models import (
    DEFAULT_LOOKER_GROUP_IDS,
    DEFAULT_LOOKER_MODELS,
    ROLE_PERMISSIONS,
    LookerUser,
)
from app.services.looker import LookerService

logger = logging.getLogger(__name__)
router = APIRouter()

LookerSvcDep = Annotated[LookerService, Depends(get_looker_service)]

GE_OAUTH_CLIENT_ID = "looker-embed-demo"
GE_ALLOWED_REDIRECT_URIS = {
    "https://vertexaisearch.cloud.google.com/oauth-redirect",
}
VALID_LOCATIONS = {"global", "us", "eu"}
SAFE_RESOURCE_TOKEN_RE = re.compile(r"^[a-zA-Z0-9_.-]{1,128}$")

EXTENSION_A2UI_URI = "https://a2ui.org/a2a-extension/a2ui/v0.8"
EXTENSION_CLIENT_ID_URI = (
    "https://docs.cloud.google.com/gemini/docs/"
    "conversational-analytics-api/reference/a2a/extensions/client-id/v1"
)
EXTENSION_AUTHORIZATIONS_URI = (
    "https://www.googleapis.com/gemini-enterprise/a2a/extensions/authorizations/v1"
)

# ponytail: module-level 5-min dict cache for Looker agent metadata; swap for Redis only if multi-tenant agent configs diverge
_agent_info_cache: dict[str, tuple[float, dict[str, Any]]] = {}
AGENT_CACHE_TTL_SECONDS = 300

FALLBACK_GOLDEN_QUERIES: list[dict[str, str]] = [
    {
        "question": "Plot monthly revenue vs returned sales over the past 12 months.",
        "badge": "A2UI Multi-Line",
        "variant": "blue",
    },
    {
        "question": "Chart our top 10 product categories by successful order revenue.",
        "badge": "A2UI Ranked Bar",
        "variant": "blue",
    },
    {
        "question": "Break down order item count by status across our top 6 product categories.",
        "badge": "A2UI Stacked Bar",
        "variant": "blue",
    },
    {
        "question": "Show the share of total revenue by customer traffic source.",
        "badge": "A2UI Channel Mix",
        "variant": "blue",
    },
    {
        "question": "Who are our top 10 loyal customers by total revenue, and which cities are they in?",
        "badge": "Semantic Rule",
        "variant": "purple",
    },
    {
        "question": "Compare total revenue, average sale price, and return count across our top 10 US states.",
        "badge": "Geo Comparison",
        "variant": "blue",
    },
    {
        "question": "Which 10 products generate the highest total sales, and how do their retail prices compare to cost?",
        "badge": "Unit Economics",
        "variant": "blue",
    },
    {
        "question": "Using monthly revenue over the past 24 months, forecast the next 3 months of sales and plot the trend.",
        "badge": "Python Forecast",
        "variant": "purple",
    },
    {
        "question": "Calculate the return rate percentage by product category and highlight any statistical outliers.",
        "badge": "Python Outliers",
        "variant": "purple",
    },
    {
        "question": "Which brand am I currently viewing, and what are my top 5 best-selling products and total revenue?",
        "badge": "Live Brand RLS",
        "variant": "green",
    },
]


class GeInstallRequest(BaseModel):
    project: str = Field(..., min_length=1, max_length=128)
    location: str = Field(default="global")
    engine_id: str = Field(..., min_length=1, max_length=128)
    gcp_access_token: str = Field(..., min_length=10)


def _derive_ge_client_secret() -> str:
    return hmac.new(
        settings.ENCRYPTION_KEY.encode(),
        b"ge-oauth-client-secret",
        hashlib.sha256,
    ).hexdigest()


def _resolve_public_origin(request: Request) -> str:
    if settings.PUBLIC_BASE_URL:
        return settings.PUBLIC_BASE_URL.rstrip("/")
    proto = request.headers.get("x-forwarded-proto", request.url.scheme or "https").split(",")[0].strip()
    host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc)).split(",")[0].strip()
    return f"{proto}://{host}".rstrip("/")


def _discovery_engine_base_uri(location: str) -> str:
    loc = location.strip().lower()
    prefix = "" if loc == "global" else f"{loc}-"
    return f"https://{prefix}discoveryengine.googleapis.com/v1alpha"


def _classify_golden_query(gq: dict[str, Any]) -> dict[str, str] | None:
    if gq.get("is_active") is False:
        return None
    raw_qs = gq.get("questions") or []
    if not isinstance(raw_qs, list) or not raw_qs:
        return None
    q = str(raw_qs[0]).strip()
    if not q:
        return None

    q_lower = q.lower()
    fields = [str(f) for f in (gq.get("fields") or [])]
    pivots = gq.get("pivots") or []
    filters = gq.get("filters") or {}

    if "currently viewing" in q_lower or "products.brand" in fields:
        badge, variant = "Live Brand RLS", "green"
    elif "forecast" in q_lower:
        badge, variant = "Python Forecast", "purple"
    elif "outlier" in q_lower:
        badge, variant = "Python Outliers", "purple"
    elif "loyal" in q_lower or "order_items.count" in filters:
        badge, variant = "Semantic Rule", "purple"
    elif pivots:
        badge, variant = "A2UI Stacked Bar", "blue"
    elif any("month" in f or "date" in f for f in fields):
        badge, variant = "A2UI Multi-Line", "blue"
    elif "users.traffic_source" in fields:
        badge, variant = "A2UI Channel Mix", "blue"
    elif "users.state" in fields:
        badge, variant = "Geo Comparison", "blue"
    elif "products.cost" in fields:
        badge, variant = "Unit Economics", "blue"
    else:
        badge, variant = "A2UI Ranked Bar", "blue"

    return {"question": q, "badge": badge, "variant": variant}


def _fetch_cached_agent_info(
    looker_svc: LookerService, agent_id: str
) -> dict[str, Any]:
    now = time.time()
    cached = _agent_info_cache.get(agent_id)
    if cached and cached[0] > now:
        return cached[1]

    try:
        raw = looker_svc.get_agent_metadata(agent_id)
        name = str(raw.get("name") or "Looker Ecomm Data Agent").strip()
        desc = str(
            raw.get("description")
            or "Governed Looker Conversational Analytics agent for e-commerce data."
        ).strip()
        raw_gqs = raw.get("golden_queries") or []
        prompts = [
            item
            for gq in raw_gqs
            if isinstance(gq, dict) and (item := _classify_golden_query(gq))
        ]
        info = {
            "agent_id": agent_id,
            "name": name,
            "description": desc,
            "golden_queries": prompts or FALLBACK_GOLDEN_QUERIES,
        }
        _agent_info_cache[agent_id] = (now + AGENT_CACHE_TTL_SECONDS, info)
        return info
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Falling back to default golden queries for {agent_id}: {e}")
        return {
            "agent_id": agent_id,
            "name": "Looker Ecomm Data Agent",
            "description": "Governed Looker Conversational Analytics agent for e-commerce data.",
            "golden_queries": FALLBACK_GOLDEN_QUERIES,
        }


def build_ge_registration_specs(
    public_origin: str, agent_info: dict[str, Any]
) -> dict[str, Any]:
    agent_id = str(agent_info["agent_id"])
    name = str(agent_info["name"])
    description = str(agent_info["description"])
    examples = [
        str(g["question"])
        for g in (agent_info.get("golden_queries") or [])
        if g.get("question")
    ][:10]

    auth_url = f"{public_origin}/api/ge/oauth/authorize"
    token_url = f"{public_origin}/api/ge/oauth/token"
    a2a_url = f"{public_origin}/api/ge/a2a/agents/{agent_id}/chat"

    host_hash = hashlib.sha256(public_origin.encode()).hexdigest()[:8]
    agent_hash = hashlib.sha256(agent_id.encode()).hexdigest()[:8]
    auth_id = f"looker-demo-{host_hash}-{agent_hash}"

    card: dict[str, Any] = {
        "protocolVersion": "0.3.0",
        "version": "1.0.0",
        "name": name,
        "description": description,
        "url": a2a_url,
        "preferredTransport": "INTERNAL_HTTP+JSON",
        "defaultInputModes": ["text/plain", "application/json"],
        "defaultOutputModes": [
            "text/plain",
            "application/json",
            "text/event-stream",
        ],
        "capabilities": {
            "streaming": True,
            "pushNotifications": False,
            "extensions": [
                {
                    "uri": EXTENSION_A2UI_URI,
                    "description": "Ability to render A2UI",
                    "required": True,
                    "params": {"acceptsInlineCatalogs": False},
                },
                {
                    "uri": EXTENSION_CLIENT_ID_URI,
                    "description": "Google Data Analytics Client ID extension",
                    "required": True,
                    "params": {},
                },
                {
                    "uri": EXTENSION_AUTHORIZATIONS_URI,
                    "description": "Google Gemini Enterprise authorization extension",
                    "required": False,
                    "params": {},
                },
            ],
        },
        "securitySchemes": {
            "LookerOAuth2": {
                "type": "oauth2",
                "flows": {
                    "authorizationCode": {
                        "authorizationUrl": auth_url,
                        "tokenUrl": token_url,
                        "scopes": {"cors_api": "Access Looker Analytics"},
                    }
                },
            }
        },
        "security": [{"LookerOAuth2": ["cors_api"]}],
        "skills": [
            {
                "id": "query_looker_data",
                "name": name,
                "description": description,
                "tags": ["looker", "conversational-analytics", "data"],
                **({"examples": examples} if examples else {}),
            }
        ],
    }

    card_json = json.dumps(card, ensure_ascii=False)
    if len(card_json.encode()) > 10_240:
        card["skills"][0].pop("examples", None)
        card_json = json.dumps(card, ensure_ascii=False)

    auth_resource_body = {
        "displayName": f"Looker Embed Demo ({public_origin})",
        "serverSideOauth2": {
            "clientId": GE_OAUTH_CLIENT_ID,
            "clientSecret": _derive_ge_client_secret(),
            "authorizationUri": (
                f"{auth_url}?client_id={GE_OAUTH_CLIENT_ID}"
                "&scope=cors_api&response_type=code&code_challenge_method=S256"
            ),
            "tokenUri": token_url,
            "pkceVerificationEnabled": True,
            "scopes": ["cors_api"],
        },
    }

    return {
        "auth_id": auth_id,
        "auth_resource_body": auth_resource_body,
        "agent_card_json": card_json,
        "display_name": name,
        "description": description,
        "agent_body": lambda auth_res: {
            "displayName": name,
            "description": description,
            "a2aAgentDefinition": {"jsonAgentCard": card_json},
            "authorizationConfig": {"agentAuthorization": auth_res},
        },
    }


@router.get("/agent-info")
async def get_ge_agent_info(looker_svc: LookerSvcDep):
    info = await run_in_threadpool(
        _fetch_cached_agent_info, looker_svc, settings.CHAT_AGENT_ID
    )
    return JSONResponse(info)


@router.get("/oauth/authorize")
async def ge_oauth_authorize_page(
    redirect_uri: Annotated[str, Query()],
    state: Annotated[str, Query()] = "",
    client_id: Annotated[str, Query()] = GE_OAUTH_CLIENT_ID,
    code_challenge: Annotated[str, Query()] = "",
    code_challenge_method: Annotated[str, Query()] = "S256",
):
    if redirect_uri not in GE_ALLOWED_REDIRECT_URIS:
        raise HTTPException(status_code=400, detail="Unsupported redirect_uri")

    e_redirect = html.escape(redirect_uri, quote=True)
    e_state = html.escape(state, quote=True)
    e_client = html.escape(client_id, quote=True)
    e_cc = html.escape(code_challenge, quote=True)
    e_ccm = html.escape(code_challenge_method, quote=True)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect Gemini Enterprise · Looker Embed Demo</title>
  <style>
    body {{
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: #f0f4f9; color: #1f1f1f; padding: 20px;
    }}
    .card {{
      background: #fff; border: 1px solid #e0e2e6; border-radius: 20px;
      max-width: 440px; width: 100%; padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
    }}
    .pill {{
      display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; padding: 4px 10px; border-radius: 999px;
      background: #f3e8fd; color: #a142f4; margin-bottom: 12px;
    }}
    h1 {{ font-size: 21px; margin: 0 0 8px; letter-spacing: -0.02em; }}
    p {{ font-size: 14px; color: #5f6368; line-height: 1.5; margin: 0 0 18px; }}
    .meta {{
      background: #f8fafd; border: 1px solid #e0e2e6; border-radius: 12px;
      padding: 12px 14px; font-size: 13px; margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: center;
    }}
    .brand {{ font-weight: 700; color: #137333; background: #e6f4ea; padding: 3px 10px; border-radius: 999px; }}
    button {{
      width: 100%; height: 44px; border: none; border-radius: 999px;
      background: #0b57d0; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
    }}
    button:hover {{ background: #0842a0; }}
  </style>
</head>
<body>
  <div class="card">
    <span class="pill">✦ Gemini Enterprise Link</span>
    <h1>Authorize Looker Embed Session</h1>
    <p>Link Gemini Enterprise to your active Looker Embed Portal visitor session. Switching your Brand or Language in the portal will automatically update Gemini Enterprise.</p>
    <div class="meta">
      <span>Active Portal Brand</span>
      <span class="brand" id="active-brand">Levi's</span>
    </div>
    <form method="POST" action="/api/ge/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="{e_redirect}" />
      <input type="hidden" name="state" value="{e_state}" />
      <input type="hidden" name="client_id" value="{e_client}" />
      <input type="hidden" name="code_challenge" value="{e_cc}" />
      <input type="hidden" name="code_challenge_method" value="{e_ccm}" />
      <button type="submit">Connect to Gemini Enterprise</button>
    </form>
  </div>
  <script>
    try {{
      var b = localStorage.getItem('brand');
      if (b) document.getElementById('active-brand').textContent = b;
    }} catch (e) {{}}
  </script>
</body>
</html>"""
    return HTMLResponse(content=page, headers={"Cache-Control": "no-store"})


@router.post("/oauth/authorize")
async def ge_oauth_authorize_submit(
    request: Request,
    looker_svc: LookerSvcDep,
):
    raw_form = parse_qs((await request.body()).decode(errors="ignore"))
    redirect_uri = (raw_form.get("redirect_uri") or [""])[0].strip()
    state = (raw_form.get("state") or [""])[0]
    code_challenge = (raw_form.get("code_challenge") or [""])[0].strip()
    code_challenge_method = (
        raw_form.get("code_challenge_method") or ["S256"]
    )[0].strip() or "S256"

    if redirect_uri not in GE_ALLOWED_REDIRECT_URIS:
        raise HTTPException(status_code=400, detail="Unsupported redirect_uri")

    external_user_id = getattr(request.state, "external_user_id", None)
    if not external_user_id:
        raise HTTPException(status_code=500, detail="Missing external visitor ID")

    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
    looker_user = get_looker_user_from_cookie(request) or getattr(
        request.state, "looker_user", None
    )

    upgraded_user: LookerUser | None = None
    if not looker_user or "chat_with_agent" not in (looker_user.permissions or []):
        attrs = (looker_user.user_attributes if looker_user else None) or {"locale": "en", "brand": "Levi's"}
        models = (looker_user.models if looker_user else None) or list(DEFAULT_LOOKER_MODELS)
        groups = (looker_user.group_ids if looker_user else None) or list(DEFAULT_LOOKER_GROUP_IDS)
        await run_in_threadpool(
            looker_svc.acquire_cookieless_session,
            external_user_id,
            "Embedded",
            "User",
            3600,
            False,
            ROLE_PERMISSIONS["gemini"],
            models,
            attrs,
            None,
            user_agent,
            groups,
        )
        resolved_uid = await run_in_threadpool(
            looker_svc.get_looker_user_id_by_external_id, external_user_id
        )
        if resolved_uid:
            upgraded_user = LookerUser(
                looker_user_id=resolved_uid,
                role_id="gemini",
                permissions=ROLE_PERMISSIONS["gemini"],
                models=models,
                group_ids=groups,
                user_attributes=attrs,
            )

    code_payload = json.dumps(
        {
            "t": "code",
            "u": external_user_id,
            "cc": code_challenge,
            "ccm": code_challenge_method,
            "exp": int(time.time()) + 300,
        }
    )
    sealed_code = seal_token(code_payload, settings.ENCRYPTION_KEY)
    params = {"code": sealed_code}
    if state:
        params["state"] = state

    resp = RedirectResponse(
        url=f"{redirect_uri}?{urlencode(params)}", status_code=302
    )
    if upgraded_user:
        set_looker_user_cookie(resp, upgraded_user)
    return resp


def _verify_pkce(verifier: str, challenge: str, method: str) -> bool:
    if not challenge:
        return True
    if not verifier:
        return False
    if method.upper() == "S256":
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
        return hmac.compare_digest(computed, challenge)
    if method.lower() == "plain":
        return hmac.compare_digest(verifier, challenge)
    return False


@router.post("/oauth/token")
async def ge_oauth_token(
    request: Request,
    looker_svc: LookerSvcDep,
):
    content_type = (request.headers.get("content-type") or "").lower()
    raw_bytes = await request.body()
    if "application/json" in content_type:
        try:
            parsed_json = json.loads(raw_bytes.decode())
            data = {k: str(v) for k, v in parsed_json.items() if v is not None}
        except (UnicodeDecodeError, json.JSONDecodeError, AttributeError) as err:
            raise HTTPException(
                status_code=400, detail="Invalid JSON payload"
            ) from err
    else:
        qs = parse_qs(raw_bytes.decode(errors="ignore"))
        data = {k: v[0] for k, v in qs.items() if v}

    client_secret = data.get("client_secret")
    auth_header = request.headers.get("authorization") or ""
    if auth_header.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth_header[6:].strip()).decode()
            if ":" in decoded:
                _, basic_secret = decoded.split(":", 1)
                client_secret = client_secret or basic_secret
        except (ValueError, UnicodeDecodeError) as err:
            raise HTTPException(status_code=401, detail="Invalid Basic auth") from err

    if client_secret and not hmac.compare_digest(
        client_secret, _derive_ge_client_secret()
    ):
        raise HTTPException(status_code=401, detail="Invalid client_secret")

    grant_type = data.get("grant_type", "")
    external_user_id: str | None = None

    if grant_type == "authorization_code":
        raw_code = data.get("code", "")
        if not raw_code:
            raise HTTPException(status_code=400, detail="Missing code")
        try:
            code_obj = json.loads(unseal_token(raw_code, settings.ENCRYPTION_KEY))
        except (ValueError, json.JSONDecodeError) as err:
            raise HTTPException(
                status_code=400, detail="Invalid authorization code"
            ) from err

        if code_obj.get("t") != "code" or int(code_obj.get("exp", 0)) < int(
            time.time()
        ):
            raise HTTPException(status_code=400, detail="Expired authorization code")

        if not _verify_pkce(
            data.get("code_verifier", ""),
            str(code_obj.get("cc") or ""),
            str(code_obj.get("ccm") or "S256"),
        ):
            raise HTTPException(status_code=400, detail="PKCE verification failed")

        external_user_id = str(code_obj.get("u") or "")

    elif grant_type == "refresh_token":
        raw_rt = data.get("refresh_token", "")
        if not raw_rt:
            raise HTTPException(status_code=400, detail="Missing refresh_token")
        try:
            rt_obj = json.loads(unseal_token(raw_rt, settings.ENCRYPTION_KEY))
        except (ValueError, json.JSONDecodeError) as err:
            raise HTTPException(
                status_code=400, detail="Invalid refresh_token"
            ) from err
        if rt_obj.get("t") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid refresh_token type")
        external_user_id = str(rt_obj.get("u") or "")
    else:
        raise HTTPException(
            status_code=400, detail=f"Unsupported grant_type: {grant_type}"
        )

    if not external_user_id:
        raise HTTPException(status_code=400, detail="Missing user binding")

    looker_user_id = await run_in_threadpool(
        looker_svc.get_looker_user_id_by_external_id, external_user_id
    )
    if not looker_user_id:
        raise HTTPException(
            status_code=500, detail="Could not resolve Looker embed user"
        )

    token_obj = await run_in_threadpool(looker_svc.login_user, looker_user_id)
    access_token = getattr(token_obj, "access_token", "")
    expires_in = getattr(token_obj, "expires_in", 3600) or 3600
    if not access_token:
        raise HTTPException(status_code=500, detail="Empty Looker access token")

    refresh_token = seal_token(
        json.dumps({"t": "refresh", "u": external_user_id}),
        settings.ENCRYPTION_KEY,
    )
    return JSONResponse(
        {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "scope": "cors_api",
            "refresh_token": refresh_token,
        },
        headers={"Cache-Control": "no-store"},
    )


def _extract_bearer_token(request: Request) -> str:
    scheme, _, tok = (request.headers.get("authorization") or "").partition(" ")
    if scheme.lower() in {"bearer", "token"} and tok.strip():
        return tok.strip()
    raise HTTPException(status_code=401, detail="Missing Bearer token")


def _permission_denied_markdown() -> str:
    return (
        "⚠️ **Gemini in Looker Permission Required**\n\n"
        "Your Looker user account does not currently have the `gemini_in_looker` and `chat_with_agent` "
        "permissions required to use this agent (for example, your Embed Portal profile was switched to **Simple Embed User**).\n\n"
        "- **In the Looker Embed Portal**: Open **Settings → User Type**, select **Gemini Embed User** or **Advanced Embed User**, "
        "and send your message again (no need to reconnect).\n"
        "- **In Looker Admin**: Grant a role containing `gemini_in_looker` and `chat_with_agent` on the `embed_demo` model."
    )


async def _diagnose_looker_a2a_denial(
    looker_base: str, bearer_token: str, looker_svc: LookerService
) -> tuple[int, str | None]:
    """Checks whether a 403/404 from Looker A2A was caused by an expired token or missing Gemini permissions."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        me_resp = await client.get(
            f"{looker_base}/api/4.0/user",
            headers={"Authorization": f"token {bearer_token}"},
        )
    if me_resp.status_code == 401:
        return 401, None
    if me_resp.status_code >= 400:
        return 403, _permission_denied_markdown()

    user_id = str(me_resp.json().get("id") or "")
    if user_id:
        try:
            perms = await run_in_threadpool(
                looker_svc.get_user_permissions, user_id
            )
            if "chat_with_agent" not in perms or "gemini_in_looker" not in perms:
                return 200, _permission_denied_markdown()
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Failed checking permissions for user {user_id}: {e}")

    return 404, None


async def _proxy_looker_a2a(
    request: Request,
    looker_svc: LookerService,
    upstream_suffix: str,
    is_internal_http_stream: bool,
) -> StreamingResponse | JSONResponse:
    bearer_token = _extract_bearer_token(request)
    raw_body = await request.body()
    looker_base = (settings.LOOKERSDK_BASE_URL or "").rstrip("/")
    upstream_url = f"{looker_base}/api/4.0/a2a/agents/{upstream_suffix}"

    upstream_headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": request.headers.get("content-type", "application/json"),
        "Accept": request.headers.get("accept", "text/event-stream, application/json"),
        "Accept-Encoding": "identity",
    }

    client = httpx.AsyncClient(timeout=180.0)
    req = client.build_request(
        "POST", upstream_url, headers=upstream_headers, content=raw_body
    )
    resp = await client.send(req, stream=True)

    if resp.status_code == 401:
        await resp.aclose()
        await client.aclose()
        raise HTTPException(status_code=401, detail="Looker token expired")

    if resp.status_code in (403, 404):
        err_bytes = await resp.aread()
        await resp.aclose()
        await client.aclose()

        diag_status, friendly_msg = await _diagnose_looker_a2a_denial(
            looker_base, bearer_token, looker_svc
        )
        if diag_status == 401:
            raise HTTPException(status_code=401, detail="Looker token expired")
        if friendly_msg:
            try:
                parsed_req = json.loads(raw_body.decode())
            except (UnicodeDecodeError, json.JSONDecodeError):
                parsed_req = {}

            if is_internal_http_stream:
                ctx_id = (
                    (parsed_req.get("message") or {}).get("contextId")
                    or str(uuid.uuid4())
                )
                task_id = str(uuid.uuid4())
                art_frame = {
                    "artifactUpdate": {
                        "taskId": task_id,
                        "artifact": {
                            "artifactId": f"perm_{task_id[:8]}",
                            "parts": [{"text": friendly_msg}],
                        },
                    }
                }
                done_frame = {
                    "statusUpdate": {
                        "taskId": task_id,
                        "contextId": ctx_id,
                        "final": True,
                        "status": {"state": "TASK_STATE_COMPLETED"},
                    }
                }

                async def _perm_stream() -> AsyncGenerator[bytes]:
                    yield f"data: {json.dumps(art_frame)}\n\n".encode()
                    yield f"data: {json.dumps(done_frame)}\n\n".encode()

                return StreamingResponse(
                    _perm_stream(),
                    media_type="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
                )

            rpc_id = parsed_req.get("id") or str(uuid.uuid4())
            ctx_id = (
                ((parsed_req.get("params") or {}).get("message") or {}).get("contextId")
                or str(uuid.uuid4())
            )
            return JSONResponse(
                {
                    "jsonrpc": "2.0",
                    "id": rpc_id,
                    "result": {
                        "kind": "message",
                        "messageId": str(uuid.uuid4()),
                        "contextId": ctx_id,
                        "role": "agent",
                        "parts": [{"kind": "text", "text": friendly_msg}],
                    },
                }
            )

        raise HTTPException(
            status_code=resp.status_code,
            detail=err_bytes.decode(errors="ignore") or "Agent not found",
        )

    media_type = (
        resp.headers.get("content-type", "text/event-stream").split(";")[0].strip()
    )

    async def _raw_passthrough() -> AsyncGenerator[bytes]:
        try:
            async for chunk in resp.aiter_bytes():
                yield chunk
        finally:
            await resp.aclose()
            await client.aclose()

    return StreamingResponse(
        _raw_passthrough(),
        status_code=resp.status_code,
        media_type=media_type,
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/a2a/agents/{agent_id}/chat/v1/{stream_action:path}")
async def proxy_a2a_internal_stream(
    agent_id: str,
    stream_action: str,
    request: Request,
    looker_svc: LookerSvcDep,
):
    return await _proxy_looker_a2a(
        request,
        looker_svc,
        upstream_suffix=f"{agent_id}/chat/v1/{stream_action}",
        is_internal_http_stream=True,
    )


@router.post("/a2a/agents/{agent_id}")
async def proxy_a2a_jsonrpc(
    agent_id: str,
    request: Request,
    looker_svc: LookerSvcDep,
):
    return await _proxy_looker_a2a(
        request,
        looker_svc,
        upstream_suffix=agent_id,
        is_internal_http_stream=False,
    )


def _validate_install_params(
    project: str, location: str, engine: str
) -> tuple[str, str, str]:
    proj = project.strip()
    loc = location.strip().lower() or "global"
    eng = engine.strip()
    if loc not in VALID_LOCATIONS:
        raise HTTPException(
            status_code=400, detail="location must be global, us, or eu"
        )
    if not SAFE_RESOURCE_TOKEN_RE.fullmatch(proj):
        raise HTTPException(status_code=400, detail="Invalid GCP project value")
    if not SAFE_RESOURCE_TOKEN_RE.fullmatch(eng):
        raise HTTPException(status_code=400, detail="Invalid Gemini Enterprise engine ID")
    return proj, loc, eng


@router.get("/install.sh")
async def get_ge_install_script(
    request: Request,
    project: Annotated[str, Query(description="GCP Project Number or ID")],
    engine: Annotated[str, Query(description="Gemini Enterprise App / Engine ID")],
    looker_svc: LookerSvcDep,
    location: Annotated[str, Query()] = "global",
):
    proj, loc, eng = _validate_install_params(project, location, engine)
    public_origin = _resolve_public_origin(request)
    agent_info = await run_in_threadpool(
        _fetch_cached_agent_info, looker_svc, settings.CHAT_AGENT_ID
    )
    specs = build_ge_registration_specs(public_origin, agent_info)
    de_base = _discovery_engine_base_uri(loc)

    auth_json = json.dumps(specs["auth_resource_body"], indent=2)
    agent_template_json = json.dumps(
        specs["agent_body"]("__AUTH_RES_PLACEHOLDER__"), indent=2
    )

    script = f"""#!/usr/bin/env bash
set -euo pipefail

RAW_PROJECT={shlex.quote(proj)}
LOCATION={shlex.quote(loc)}
ENGINE_ID={shlex.quote(eng)}
AUTH_ID={shlex.quote(specs["auth_id"])}
DE_BASE={shlex.quote(de_base)}

if [[ "$RAW_PROJECT" =~ ^[0-9]+$ ]]; then
  PROJECT_NUMBER="$RAW_PROJECT"
else
  echo "Resolving project number for '$RAW_PROJECT'..."
  PROJECT_NUMBER="$(gcloud projects describe "$RAW_PROJECT" --format='value(projectNumber)')"
fi

TOKEN="$(gcloud auth print-access-token)"
AUTH_RES="projects/$PROJECT_NUMBER/locations/$LOCATION/authorizations/$AUTH_ID"

echo "1/2 Configuring OAuth authorization ($AUTH_ID)..."
STATUS="$(curl -s -o /dev/null -w '%{{http_code}}' \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Goog-User-Project: $PROJECT_NUMBER" \\
  "$DE_BASE/$AUTH_RES")"

AUTH_BODY=$(cat <<'__AUTH_EOF__'
{auth_json}
__AUTH_EOF__
)

if [[ "$STATUS" == "200" ]]; then
  curl -fsS -X PATCH "$DE_BASE/$AUTH_RES?updateMask=serverSideOauth2" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "X-Goog-User-Project: $PROJECT_NUMBER" \\
    -H "Content-Type: application/json" \\
    -d "$AUTH_BODY" > /dev/null
else
  curl -fsS -X POST "$DE_BASE/projects/$PROJECT_NUMBER/locations/$LOCATION/authorizations?authorizationId=$AUTH_ID" \\
    -H "Authorization: Bearer $TOKEN" \\
    -H "X-Goog-User-Project: $PROJECT_NUMBER" \\
    -H "Content-Type: application/json" \\
    -d "$AUTH_BODY" > /dev/null
fi

echo "2/2 Registering Looker agent in Gemini Enterprise ($ENGINE_ID)..."
AGENT_TEMPLATE=$(cat <<'__AGENT_EOF__'
{agent_template_json}
__AGENT_EOF__
)
AGENT_BODY="${{AGENT_TEMPLATE//__AUTH_RES_PLACEHOLDER__/$AUTH_RES}}"

curl -fsS -X POST "$DE_BASE/projects/$PROJECT_NUMBER/locations/$LOCATION/collections/default_collection/engines/$ENGINE_ID/assistants/default_assistant/agents" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "X-Goog-User-Project: $PROJECT_NUMBER" \\
  -H "Content-Type: application/json" \\
  -d "$AGENT_BODY" > /dev/null

echo ""
echo "✅ Installed {shlex.quote(specs['display_name'])} into Gemini Enterprise ($ENGINE_ID)!"
echo "👉 Open your Gemini Enterprise app, select '{shlex.quote(specs['display_name'])}', and click Connect."
"""
    return PlainTextResponse(script, headers={"Cache-Control": "no-store"})


@router.post("/install")
async def install_ge_agent_direct(
    body: GeInstallRequest,
    request: Request,
    looker_svc: LookerSvcDep,
):
    proj, loc, eng = _validate_install_params(
        body.project, body.location, body.engine_id
    )
    token = body.gcp_access_token.strip()
    public_origin = _resolve_public_origin(request)
    agent_info = await run_in_threadpool(
        _fetch_cached_agent_info, looker_svc, settings.CHAT_AGENT_ID
    )
    specs = build_ge_registration_specs(public_origin, agent_info)
    de_base = _discovery_engine_base_uri(loc)

    async with httpx.AsyncClient(timeout=30.0) as client:
        if not proj.isdigit():
            crm_resp = await client.get(
                f"https://cloudresourcemanager.googleapis.com/v1/projects/{proj}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if crm_resp.status_code >= 400:
                raise HTTPException(
                    status_code=400,
                    detail="Could not resolve project ID to numeric project number; pass your numeric GCP Project Number directly.",
                )
            proj = str(crm_resp.json().get("projectNumber") or "").strip()
            if not proj.isdigit():
                raise HTTPException(
                    status_code=400, detail="Numeric GCP Project Number required"
                )

        headers = {
            "Authorization": f"Bearer {token}",
            "X-Goog-User-Project": proj,
            "Content-Type": "application/json",
        }
        auth_res_name = f"projects/{proj}/locations/{loc}/authorizations/{specs['auth_id']}"
        get_auth_resp = await client.get(
            f"{de_base}/{auth_res_name}", headers=headers
        )
        if get_auth_resp.status_code == 200:
            auth_resp = await client.patch(
                f"{de_base}/{auth_res_name}?updateMask=serverSideOauth2",
                headers=headers,
                json=specs["auth_resource_body"],
            )
        else:
            auth_resp = await client.post(
                f"{de_base}/projects/{proj}/locations/{loc}/authorizations",
                params={"authorizationId": specs["auth_id"]},
                headers=headers,
                json=specs["auth_resource_body"],
            )
        if auth_resp.status_code >= 400:
            raise HTTPException(
                status_code=auth_resp.status_code,
                detail=f"Discovery Engine Authorization failed: {auth_resp.text}",
            )

        agents_url = (
            f"{de_base}/projects/{proj}/locations/{loc}"
            f"/collections/default_collection/engines/{eng}"
            f"/assistants/default_assistant/agents"
        )
        reg_resp = await client.post(
            agents_url, headers=headers, json=specs["agent_body"](auth_res_name)
        )
        if reg_resp.status_code >= 400:
            raise HTTPException(
                status_code=reg_resp.status_code,
                detail=f"Discovery Engine Agent registration failed: {reg_resp.text}",
            )

        created = reg_resp.json()

    return JSONResponse(
        {
            "status": "installed",
            "project_number": proj,
            "location": loc,
            "engine_id": eng,
            "platform_agent_id": created.get("name"),
            "display_name": specs["display_name"],
        }
    )
