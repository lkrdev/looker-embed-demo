import base64
import hashlib
import hmac
import html
import json
import logging
import os
import re
import subprocess
import time
import uuid
from collections.abc import AsyncGenerator
from typing import Annotated, Any
from urllib.parse import parse_qs, unquote, urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
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
BQ_GRAPH_EXPLORES = {
    "bought_together_recommendations",
    "product_jaccard_affinity",
    "brand_lookalike_audiences",
    "omnichannel_customer_journey",
}
EXTENSION_A2UI_URI = "https://a2ui.org/a2a-extension/a2ui/v0.8"
EXTENSION_CLIENT_ID_URI = (
    "https://docs.cloud.google.com/gemini/docs/"
    "conversational-analytics-api/reference/a2a/extensions/client-id/v1"
)
EXTENSION_AUTHORIZATIONS_URI = (
    "https://www.googleapis.com/gemini-enterprise/a2a/extensions/authorizations/v1"
)
GCP_METADATA_BASE = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default"
PLACEHOLDER_SA_EMAIL = "your-cloud-run-sa@your-project.iam.gserviceaccount.com"
_cached_installer_sa_email: str | None = None

# ponytail: module-level 5-min dict cache for Looker agent metadata; swap for Redis only if multi-tenant agent configs diverge
_agent_info_cache: dict[str, tuple[float, dict[str, Any]]] = {}
AGENT_CACHE_TTL_SECONDS = 300

FALLBACK_ECOMM_PROMPTS: list[dict[str, str]] = [
    {
        "question": "Plot monthly revenue vs returned sales over the past 12 months.",
        "badge": "Multi-Line",
        "variant": "blue",
    },
    {
        "question": "Chart our top 10 product categories by successful order revenue.",
        "badge": "Ranked Bar",
        "variant": "blue",
    },
    {
        "question": "Break down order item count by status across our top 6 product categories.",
        "badge": "Stacked Bar",
        "variant": "blue",
    },
    {
        "question": "Show the share of total revenue by customer traffic source.",
        "badge": "Channel Mix",
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

BQ_GRAPH_PROMPTS: list[dict[str, str]] = [
    {
        "question": "Which competitor brands in shoppers' carts most often lead to co-purchases of our products, and which of our items win?",
        "badge": "Cart Conquesting",
        "variant": "purple",
    },
    {
        "question": "Which product pairs have the highest Jaccard co-purchase affinity score for bundle merchandising?",
        "badge": "Jaccard Affinity",
        "variant": "blue",
    },
    {
        "question": "How large is our lookalike prospect audience, and who are the top 15 prospects with the highest category overlap?",
        "badge": "Lookalike Audience",
        "variant": "green",
    },
    {
        "question": "Which online product categories and US states drive the most physical retail store visits?",
        "badge": "Omnichannel Journey",
        "variant": "blue",
    },
]


class GeInstallRequest(BaseModel):
    project: str = Field(..., min_length=1, max_length=128)
    location: str = Field(default="global")
    engine_id: str = Field(..., min_length=1, max_length=128)
    agent_id: str | None = Field(default=None)


def _derive_ge_client_secret() -> str:
    return hmac.new(
        settings.ENCRYPTION_KEY.encode(),
        b"ge-oauth-client-secret",
        hashlib.sha256,
    ).hexdigest()


def _classify_prompt(gq: dict[str, Any]) -> dict[str, str] | None:
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
        badge, variant = "Stacked Bar", "blue"
    elif any("month" in f or "date" in f for f in fields):
        badge, variant = "Multi-Line", "blue"
    elif "users.traffic_source" in fields:
        badge, variant = "Channel Mix", "blue"
    elif "users.state" in fields:
        badge, variant = "Geo Comparison", "blue"
    elif "products.cost" in fields:
        badge, variant = "Unit Economics", "blue"
    else:
        badge, variant = "Ranked Bar", "blue"

    return {"question": q, "badge": badge, "variant": variant}


def _discover_bq_graph_agent(
    looker_svc: LookerService, primary_agent_id: str
) -> dict[str, Any] | None:
    explicit_id = (settings.BQ_GRAPH_AGENT_ID or "").strip()
    if explicit_id:
        try:
            meta = looker_svc.get_agent_metadata(explicit_id)
            if meta.get("id"):
                return meta
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Could not fetch explicit BQ_GRAPH_AGENT_ID {explicit_id}: {e}")

    try:
        candidates = looker_svc.search_agents()
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Could not search Looker agents for BQ Graph agent: {e}")
        return None

    for agent in candidates:
        aid = str(agent.get("id") or "").strip()
        if not aid or aid == primary_agent_id:
            continue
        sources = agent.get("sources") or []
        explores = {
            str(s.get("explore") or "")
            for s in sources
            if isinstance(s, dict)
        }
        if explores & BQ_GRAPH_EXPLORES:
            return agent
    return None


async def _resolve_installer_sa_email() -> str:
    global _cached_installer_sa_email
    env_sa = (
        os.getenv("VITE_LOOKER_GE_SA_EMAIL")
        or os.getenv("GE_INSTALLER_SA_EMAIL")
        or settings.LOOKER_GE_SA_EMAIL
        or ""
    ).strip()
    if env_sa:
        return env_sa
    if _cached_installer_sa_email:
        return _cached_installer_sa_email
    if os.getenv("K_SERVICE"):
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                resp = await client.get(
                    f"{GCP_METADATA_BASE}/email",
                    headers={"Metadata-Flavor": "Google"},
                )
                if resp.status_code == 200 and "@" in resp.text:
                    _cached_installer_sa_email = resp.text.strip()
                    return _cached_installer_sa_email
        except Exception:  # noqa: BLE001
            pass
    return PLACEHOLDER_SA_EMAIL


def _fetch_cached_agent_info(
    looker_svc: LookerService, agent_id: str
) -> dict[str, Any]:
    now = time.time()
    cached = _agent_info_cache.get(agent_id)
    if cached and cached[0] > now:
        return cached[1]

    try:
        raw = looker_svc.get_agent_metadata(agent_id)
        name = str(raw.get("name") or "Ecomm Data Agent").strip()
        desc = str(
            raw.get("description")
            or "Governed Looker Conversational Analytics agent for e-commerce data."
        ).strip()
        raw_gqs = raw.get("golden_queries") or []
        ecomm_prompts = [
            item
            for gq in raw_gqs
            if isinstance(gq, dict) and (item := _classify_prompt(gq))
        ] or FALLBACK_ECOMM_PROMPTS

        agents_list: list[dict[str, Any]] = [
            {
                "agent_id": agent_id,
                "name": name,
                "description": desc,
                "prompts": ecomm_prompts,
            }
        ]

        graph_raw = _discover_bq_graph_agent(looker_svc, agent_id)
        if graph_raw and graph_raw.get("id"):
            graph_gqs = [
                item
                for gq in (graph_raw.get("golden_queries") or [])
                if isinstance(gq, dict) and (item := _classify_prompt(gq))
            ]
            agents_list.append(
                {
                    "agent_id": str(graph_raw["id"]),
                    "name": str(graph_raw.get("name") or "BigQuery Graph Analytics").strip(),
                    "description": str(
                        graph_raw.get("description")
                        or "BigQuery Property Graph analytics for affinity, lookalikes, and omnichannel journeys."
                    ).strip(),
                    "prompts": graph_gqs or BQ_GRAPH_PROMPTS,
                }
            )

        info = {
            "agent_id": agent_id,
            "name": name,
            "description": desc,
            "golden_queries": ecomm_prompts,
            "agents": agents_list,
        }
        _agent_info_cache[agent_id] = (now + AGENT_CACHE_TTL_SECONDS, info)
        return info
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Falling back to default prompts for {agent_id}: {e}")
        info = {
            "agent_id": agent_id,
            "name": "Ecomm Data Agent",
            "description": "Governed Looker Conversational Analytics agent for e-commerce data.",
            "golden_queries": FALLBACK_ECOMM_PROMPTS,
            "agents": [
                {
                    "agent_id": agent_id,
                    "name": "Ecomm Data Agent",
                    "description": "Governed Looker Conversational Analytics agent for e-commerce data.",
                    "prompts": FALLBACK_ECOMM_PROMPTS,
                }
            ],
        }
        _agent_info_cache[agent_id] = (now + 30, info)
        return info


@router.get("/agent-info")
async def get_ge_agent_info(looker_svc: LookerSvcDep):
    info = await run_in_threadpool(
        _fetch_cached_agent_info, looker_svc, settings.CHAT_AGENT_ID
    )
    sa_email = await _resolve_installer_sa_email()
    return JSONResponse({**info, "installer_service_account": sa_email})


def _resolve_public_origin(request: Request) -> str:
    explicit = (
        os.getenv("PUBLIC_BASE_URL")
        or os.getenv("VITE_PUBLIC_BASE_URL")
        or settings.PUBLIC_BASE_URL
        or ""
    ).strip().rstrip("/")
    if explicit:
        return explicit
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or request.url.netloc
    ).split(",")[0].strip()
    proto = (
        request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
    ).split(",")[0].strip()
    return f"{proto}://{host}".rstrip("/")


@router.get("/oauth/authorize")
async def ge_oauth_authorize_page(
    request: Request,
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
    e_host = html.escape(_resolve_public_origin(request), quote=True)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Looker Embed Portal · Connect Gemini Enterprise</title>
  <style>
    :root {{
      --bg: #f0f4f9; --card: #ffffff; --border: #e0e2e6; --ink: #1f1f1f;
      --muted: #5f6368; --meta-bg: #f8fafd; --accent: #0b57d0;
    }}
    html.dark {{
      --bg: #131314; --card: #1e1f20; --border: #333537; --ink: #e3e3e3;
      --muted: #9aa0a6; --meta-bg: #17181a; --accent: #a8c7fa;
    }}
    body {{
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      background: var(--bg); color: var(--ink); padding: 20px; box-sizing: border-box;
    }}
    .card {{
      background: var(--card); border: 1px solid var(--border); border-radius: 22px;
      max-width: 450px; width: 100%; padding: 26px 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.14);
    }}
    .portal-bar {{
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1px solid var(--border);
    }}
    .portal-brand {{ display: flex; align-items: center; gap: 10px; }}
    .logo-box {{
      width: 34px; height: 34px; border-radius: 10px; background: rgba(11, 87, 208, 0.1);
      color: var(--accent); display: flex; align-items: center; justify-content: center;
    }}
    .portal-name {{ font-size: 15px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.2; }}
    .portal-sub {{ font-size: 11px; color: var(--muted); font-weight: 500; }}
    .pill {{
      font-size: 10.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; padding: 4px 9px; border-radius: 999px;
      background: rgba(161, 66, 244, 0.14); color: #a142f4;
    }}
    h1 {{ font-size: 20px; margin: 0 0 8px; letter-spacing: -0.02em; }}
    p {{ font-size: 13.5px; color: var(--muted); line-height: 1.5; margin: 0 0 18px; }}
    .meta {{
      background: var(--meta-bg); border: 1px solid var(--border); border-radius: 12px;
      padding: 10px 14px; font-size: 13px; margin-bottom: 18px;
      display: flex; flex-direction: column; gap: 8px;
    }}
    .meta-row {{ display: flex; justify-content: space-between; align-items: center; }}
    .meta-lbl {{ color: var(--muted); font-size: 12.5px; }}
    .badge {{
      font-weight: 700; font-size: 12px; color: #fff; background: var(--accent);
      padding: 3px 10px; border-radius: 999px;
    }}
    .meta-val {{ font-weight: 600; font-size: 12.5px; }}
    button {{
      width: 100%; height: 44px; border: none; border-radius: 999px;
      background: #0b57d0; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
    }}
    button:hover {{ filter: brightness(0.93); }}
    .host-foot {{
      margin-top: 14px; text-align: center; font-size: 11px; color: var(--muted);
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="portal-bar">
      <div class="portal-brand">
        <div class="logo-box" id="logo-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11.9475 0c-1.1598.0021-2.0982.944-2.096 2.1038a2.1 2.1 0 00.356 1.166l.895-.8959a.884.884 0 11.565.564l-.895.895c.9593.6478 2.2621.3953 2.91-.564.6478-.9593.3953-2.262-.564-2.91A2.096 2.096 0 0011.9475 0zm-.835 6.1128a3.2629 3.2629 0 00-.653-1.965l-1.164 1.162a1.667 1.667 0 01-.318 2.012l.632 1.5449a3.2819 3.2819 0 001.503-2.754zm-3.2499 1.666h-.03c-.9217.0009-1.6697-.7455-1.6707-1.6673-.001-.9217.7454-1.6697 1.6672-1.6707a1.669 1.669 0 01.9195.275l1.152-1.152c-1.4069-1.141-3.4724-.9257-4.6135.4811s-.9257 3.4723.481 4.6135a3.2799 3.2799 0 002.7275.6652l-.633-1.5439v-.001zm4.1279 1.3359c-.728 0-1.452.106-2.15.315l.922 2.2519c2.6872-.6819 5.4184.9438 6.1002 3.631.6818 2.6873-.9439 5.4184-3.6311 6.1002s-5.4184-.9439-6.1002-3.631c-.5682-2.2394.4655-4.5774 2.5041-5.6643l-.91-2.2449c-3.6908 1.808-5.2173 6.2657-3.4093 9.9567l.0005.001c1.808 3.6909 6.2657 5.2173 9.9567 3.4093l.001-.0005c3.6913-1.8071 5.2187-6.2645 3.4116-9.9558a7.4417 7.4417 0 00-6.6865-4.1696h-.008l-.001.001z" />
          </svg>
        </div>
        <div>
          <div class="portal-name">Looker Embed Portal</div>
          <div class="portal-sub">Executive eCommerce Suite</div>
        </div>
      </div>
      <span class="pill">✦ Gemini Enterprise</span>
    </div>
    <h1>Connect Your Portal Session</h1>
    <p>Authorize Gemini Enterprise to query Looker using your active Looker Embed Portal visitor profile. Switching Brand or Language in the portal updates Gemini Enterprise live.</p>
    <div class="meta">
      <div class="meta-row">
        <span class="meta-lbl">Active Portal Brand</span>
        <span class="badge" id="active-brand">Levi's</span>
      </div>
      <div class="meta-row">
        <span class="meta-lbl">Portal Language</span>
        <span class="meta-val" id="active-lang">English</span>
      </div>
    </div>
    <form method="POST" action="/api/ge/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="{e_redirect}" />
      <input type="hidden" name="state" value="{e_state}" />
      <input type="hidden" name="client_id" value="{e_client}" />
      <input type="hidden" name="code_challenge" value="{e_cc}" />
      <input type="hidden" name="code_challenge_method" value="{e_ccm}" />
      <button type="submit" id="connect-btn">Connect to Gemini Enterprise</button>
    </form>
    <div class="host-foot">Looker Embed Portal · {e_host}</div>
  </div>
  <script>
    try {{
      var t = localStorage.getItem('theme');
      var dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
      var b = localStorage.getItem('brand') || "Levi's";
      document.getElementById('active-brand').textContent = b;
      document.getElementById('active-lang').textContent = localStorage.getItem('language') || 'English';
      var accents = dark
        ? {{"Levi's": "#dc2626", "Calvin Klein": "#334155", "Allegra K": "#9333ea", "Columbia": "#0284c7"}}
        : {{"Levi's": "#C41230", "Calvin Klein": "#111111", "Allegra K": "#9333ea", "Columbia": "#00589b"}};
      var ac = accents[b];
      if (ac) {{
        document.getElementById('active-brand').style.background = ac;
        document.getElementById('connect-btn').style.background = ac;
        document.getElementById('logo-box').style.color = ac;
      }}
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
        raise HTTPException(status_code=401, detail="Missing external visitor ID")

    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
    looker_user = get_looker_user_from_cookie(request) or getattr(
        request.state, "looker_user", None
    )

    upgraded_user: LookerUser | None = None
    if not looker_user or "chat_with_agent" not in (looker_user.permissions or []):
        attrs = (looker_user.user_attributes if looker_user else None) or {
            "locale": "en",
            "brand": "Levi's",
        }
        models = (looker_user.models if looker_user else None) or list(
            DEFAULT_LOOKER_MODELS
        )
        groups = (looker_user.group_ids if looker_user else None) or list(
            DEFAULT_LOOKER_GROUP_IDS
        )
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
    if auth_header.lower().startswith("basic "):
        try:
            decoded = base64.b64decode(auth_header[6:].strip()).decode()
            if ":" in decoded:
                _, basic_secret = decoded.split(":", 1)
                client_secret = client_secret or unquote(basic_secret)
        except (ValueError, UnicodeDecodeError) as err:
            raise HTTPException(status_code=401, detail="Invalid Basic auth") from err

    expected_secret = _derive_ge_client_secret()
    if not client_secret or not hmac.compare_digest(client_secret, expected_secret):
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
    try:
        req = client.build_request(
            "POST", upstream_url, headers=upstream_headers, content=raw_body
        )
        resp = await client.send(req, stream=True)
    except Exception:
        await client.aclose()
        raise

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
                    headers={"Cache-Control": "no-cache"},
                )

            rpc_id = parsed_req.get("id")
            return JSONResponse(
                {
                    "jsonrpc": "2.0",
                    "id": rpc_id,
                    "result": {
                        "kind": "message",
                        "messageId": str(uuid.uuid4()),
                        "role": "agent",
                        "parts": [{"kind": "text", "text": friendly_msg}],
                    },
                }
            )

        return JSONResponse(
            status_code=resp.status_code,
            content={"detail": err_bytes.decode(errors="ignore") or "Not found"},
        )

    media_type = (
        resp.headers.get("content-type") or "text/event-stream"
    ).split(";")[0].strip()

    async def _raw_passthrough() -> AsyncGenerator[bytes]:
        try:
            async for chunk in resp.aiter_raw():
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
        raise HTTPException(status_code=400, detail="Invalid GCP project ID")
    if not SAFE_RESOURCE_TOKEN_RE.fullmatch(eng):
        raise HTTPException(
            status_code=400, detail="Invalid Gemini Enterprise engine ID"
        )
    return proj, loc, eng


def format_ge_install_error(
    raw_error: str, sa_email: str, proj: str, eng: str, loc: str
) -> tuple[int, str]:
    """Translates verbose Looker / Google RPC JSON errors into concise, actionable messages."""
    low = raw_error.lower()

    if "access_token_type_unsupported" in low or "servicerestricted" in low:
        return (
            401,
            f"Google Workspace domain policy blocked your local gcloud user token on project '{proj}'. "
            f"Grant {sa_email} access in Steps 1 & 2 and run Install Agent from your deployed Cloud Run app.",
        )

    if "permission_denied" in low or "permission denied" in low or " 403" in low or '"code": 403' in low:
        return (
            403,
            f"Permission denied on GCP project '{proj}'. Confirm Step 1: grant Discovery Engine Admin "
            f"(roles/discoveryengine.admin) to {sa_email} in Google Cloud IAM.",
        )

    if "failed to register agent" in low or "license" in low or "manage users" in low:
        return (
            400,
            f"Gemini Enterprise rejected agent registration. Confirm Step 2: assign a user license to "
            f"{sa_email} in Gemini Enterprise → Manage Users (or enable 'Assign licenses automatically').",
        )

    if "not_found" in low or "was not found" in low or " 404" in low or '"code": 404' in low:
        return (
            404,
            f"Gemini Enterprise app '{eng}' was not found in project '{proj}' (region '{loc}'). "
            "Verify your GCP Project ID, Region, and App / Engine ID.",
        )

    # Strip embedded raw JSON / DebugInfo dumps if present
    brace_idx = raw_error.find("{")
    if brace_idx != -1:
        try:
            parsed = json.loads(raw_error[brace_idx:])
            err_body = parsed.get("error") if isinstance(parsed, dict) else None
            if isinstance(err_body, dict) and err_body.get("message"):
                clean_msg = str(err_body["message"]).split(" See https://")[0].strip()
                code = int(err_body.get("code") or 400)
                return (code if 400 <= code < 600 else 400), clean_msg
            if isinstance(parsed, dict) and parsed.get("message"):
                return 400, str(parsed["message"]).strip()[:260]
        except (ValueError, TypeError, json.JSONDecodeError):
            pass

    clean = re.sub(r"\s+", " ", raw_error).strip()
    return 400, clean[:260] if clean else "Failed to install agent in Gemini Enterprise."


def _discovery_engine_base_uri(location: str) -> str:
    loc = location.strip().lower()
    prefix = "" if loc == "global" else f"{loc}-"
    return f"https://{prefix}discoveryengine.googleapis.com/v1alpha"


def build_ge_registration_specs(
    public_origin: str, agent_meta: dict[str, Any]
) -> dict[str, Any]:
    agent_id = str(agent_meta["agent_id"])
    name = str(agent_meta["name"])
    description = str(agent_meta["description"])
    examples = [
        str(g["question"])
        for g in (agent_meta.get("prompts") or [])
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
        "display_name": name,
        "agent_body": lambda auth_res: {
            "displayName": name,
            "description": description,
            "a2aAgentDefinition": {"jsonAgentCard": card_json},
            "authorizationConfig": {"agentAuthorization": auth_res},
        },
    }


async def _resolve_installer_token(sa_email: str) -> tuple[str, bool]:
    """Returns (bearer_token, send_quota_project_header)."""
    if os.getenv("K_SERVICE"):
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(
                    f"{GCP_METADATA_BASE}/token",
                    headers={"Metadata-Flavor": "Google"},
                )
                if resp.status_code == 200:
                    tok = str(resp.json().get("access_token") or "").strip()
                    if tok:
                        return tok, False
        except Exception:  # noqa: BLE001
            pass

    def _local_gcloud_token() -> tuple[str, bool]:
        try:
            imp = subprocess.run(
                [
                    "gcloud",
                    "auth",
                    "print-access-token",
                    f"--impersonate-service-account={sa_email}",
                ],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
            if imp.returncode == 0 and imp.stdout.strip():
                return imp.stdout.strip(), False
        except (subprocess.SubprocessError, FileNotFoundError):
            pass

        try:
            res = subprocess.run(
                ["gcloud", "auth", "print-access-token"],
                capture_output=True,
                text=True,
                timeout=4,
                check=False,
            )
            return (res.stdout.strip(), True) if res.returncode == 0 else ("", True)
        except (subprocess.SubprocessError, FileNotFoundError):
            return ("", True)

    try:
        tok, send_quota = await run_in_threadpool(_local_gcloud_token)
        if tok:
            return tok, send_quota
    except Exception:  # noqa: BLE001
        pass

    raise HTTPException(
        status_code=400,
        detail=(
            f"GCP credentials for {sa_email} are not available on localhost. "
            f"Run on Cloud Run or grant your local gcloud user Service Account Token Creator on {sa_email}."
        ),
    )


@router.post("/install")
async def install_ge_agent(
    body: GeInstallRequest,
    request: Request,
    looker_svc: LookerSvcDep,
):
    proj, loc, eng = _validate_install_params(
        body.project, body.location, body.engine_id
    )
    target_agent_id = (body.agent_id or "").strip() or settings.CHAT_AGENT_ID
    if not SAFE_RESOURCE_TOKEN_RE.fullmatch(target_agent_id):
        raise HTTPException(status_code=400, detail="Invalid Looker agent ID")

    sa_email = await _resolve_installer_sa_email()
    token, send_quota_header = await _resolve_installer_token(sa_email)

    info = await run_in_threadpool(
        _fetch_cached_agent_info, looker_svc, settings.CHAT_AGENT_ID
    )
    matched_agent = next(
        (
            a
            for a in (info.get("agents") or [])
            if a.get("agent_id") == target_agent_id
        ),
        None,
    )
    if not matched_agent:
        try:
            raw_meta = await run_in_threadpool(
                looker_svc.get_agent_metadata, target_agent_id
            )
        except Exception as err:  # noqa: BLE001
            raise HTTPException(
                status_code=404,
                detail=f"Looker agent '{target_agent_id}' was not found.",
            ) from err
        if not raw_meta or "id" not in raw_meta:
            raise HTTPException(
                status_code=404,
                detail=f"Looker agent '{target_agent_id}' was not found.",
            )
        matched_agent = {
            "agent_id": target_agent_id,
            "name": str(raw_meta.get("name") or "Looker Data Agent").strip(),
            "description": str(raw_meta.get("description") or "Looker Data Agent").strip(),
            "prompts": [],
        }

    public_origin = _resolve_public_origin(request)
    specs = build_ge_registration_specs(public_origin, matched_agent)
    de_base = _discovery_engine_base_uri(loc)

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if send_quota_header:
        headers["X-Goog-User-Project"] = proj

    async with httpx.AsyncClient(timeout=30.0) as client:
        auth_path = f"projects/{proj}/locations/{loc}/authorizations/{specs['auth_id']}"
        get_auth_resp = await client.get(f"{de_base}/{auth_path}", headers=headers)
        if get_auth_resp.status_code == 200:
            auth_resp = await client.patch(
                f"{de_base}/{auth_path}?updateMask=serverSideOauth2",
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
            code, friendly = format_ge_install_error(
                auth_resp.text, sa_email, proj, eng, loc
            )
            raise HTTPException(status_code=code, detail=friendly)

        canonical_auth_res = str(auth_resp.json().get("name") or auth_path)
        agents_url = (
            f"{de_base}/projects/{proj}/locations/{loc}"
            f"/collections/default_collection/engines/{eng}"
            f"/assistants/default_assistant/agents"
        )
        reg_resp = await client.post(
            agents_url, headers=headers, json=specs["agent_body"](canonical_auth_res)
        )
        if reg_resp.status_code >= 400:
            code, friendly = format_ge_install_error(
                reg_resp.text, sa_email, proj, eng, loc
            )
            raise HTTPException(status_code=code, detail=friendly)

        created = reg_resp.json()

    return JSONResponse(
        {
            "status": "installed",
            "project": proj,
            "location": loc,
            "engine_id": eng,
            "agent_id": target_agent_id,
            "public_origin": public_origin,
            "platform_agent_id": created.get("name"),
            "display_name": specs["display_name"],
        }
    )
