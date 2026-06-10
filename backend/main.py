import base64
import json
import logging
import time
from typing import Any, Optional

import looker_sdk
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from looker_sdk.sdk.api40 import models
from models import (
    ROLE_PERMISSIONS,
    CachedAccessToken,
    CookielessAcquireRequest,
    CookielessClientResponse,
    Environment,
    StoredEmbedTokens,
)
from utils import decrypt_token, generate_external_user_id

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_sdk: Optional[Any] = None


def get_sdk() -> Any:
    global _sdk
    if _sdk is None:
        _sdk = looker_sdk.init40()
    return _sdk


# Cookie and Configuration Constants
COOKIE_EXTERNAL_USER_ID = "looker-external-user-id"
COOKIE_LOOKER_USER_ID = "looker-user-id"
COOKIE_ACCESS_TOKEN = "looker-access-token"
COOKIE_EMBED_TOKENS = "looker-embed-tokens"
COOKIE_MAX_AGE_5_YEARS = 5 * 365 * 24 * 60 * 60  # 5 years in seconds
COOKIE_MAX_AGE_SHORT = 30 * 24 * 60 * 60  # 30 days in seconds

app = FastAPI(
    title="Looker Embed Demo Backend",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url="/api/redoc",
)
api_router = APIRouter(prefix="/api")

# Validate environment variables and Looker SDK configuration eagerly upon startup
env = Environment()


@app.middleware("http")
async def ensure_external_user_id(request: Request, call_next):
    """
    Middleware ensuring the end user has a 'looker-external-user-id' cookie.
    If not present, generates a 12-character alphanumeric ID (a-zA-Z0-9).
    Assumes a secure environment (Secure=True, HttpOnly=True, SameSite=strict).
    """
    external_user_id = request.cookies.get(COOKIE_EXTERNAL_USER_ID)
    set_cookie = False
    if not external_user_id:
        external_user_id = generate_external_user_id()
        set_cookie = True

    # Attach to request state for effortless access in downstream routes
    request.state.external_user_id = external_user_id

    looker_user_id = request.cookies.get(COOKIE_LOOKER_USER_ID)
    if not looker_user_id:
        looker_user_id = await run_in_threadpool(get_looker_user_id, request)

    request.state.looker_user_id = looker_user_id

    response: Response = await call_next(request)

    if set_cookie and isinstance(response, Response):
        response.set_cookie(
            key=COOKIE_EXTERNAL_USER_ID,
            value=external_user_id,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=COOKIE_MAX_AGE_5_YEARS,
        )

    return response


def get_looker_user_id(request: Request) -> Optional[str]:
    """
    Attempts to resolve the Looker user ID for the current external user:
    1. From active cookieless embed authentication token credentials
    2. Lookup via Looker SDK user_for_credential
    """
    looker_user_id: Optional[str] = None

    # Check active cookieless embed authentication token
    embed_tokens_cookie = request.cookies.get(COOKIE_EMBED_TOKENS)
    if embed_tokens_cookie:
        try:
            tokens = json.loads(embed_tokens_cookie)
            auth_token = tokens.get("authentication_token")
            if auth_token and "." in auth_token:
                payload_b64 = auth_token.split(".")[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
                user_id_val = payload.get("credentials", {}).get("user_id")
                if user_id_val:
                    looker_user_id = str(user_id_val)
        except Exception as e:
            logger.warning(f"Failed parsing authentication token: {e}")

    if not looker_user_id:
        external_user_id = getattr(request.state, "external_user_id", None)
        if external_user_id:
            try:
                user = get_sdk().user_for_credential("embed", external_user_id)
                if user and user.id:
                    looker_user_id = str(user.id)
            except Exception:
                pass

    return looker_user_id


def resolve_or_provision_looker_user_id(request: Request) -> Optional[str]:
    """Resolves existing Looker user ID from request state or acquires a session to guarantee provisioning."""
    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        external_user_id = getattr(request.state, "external_user_id", None)
        if not external_user_id:
            return None

        user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
        opts = {"headers": {"User-Agent": user_agent}}

        try:
            cfg = models.EmbedCookielessSessionAcquire(
                external_user_id=external_user_id,
                first_name="Embedded",
                last_name="User",
                session_length=3600,
                force_logout_login=True,
                permissions=ROLE_PERMISSIONS["explorer"],
                models=["thelook"],
            )
            get_sdk().acquire_embed_cookieless_session(cfg, transport_options=opts)
            user = get_sdk().user_for_credential("embed", external_user_id)
            if user and user.id:
                looker_user_id = str(user.id)
                request.state.looker_user_id = looker_user_id
        except Exception as e:
            logger.error(f"Provisioning embed user failed: {e}")

    return looker_user_id


@api_router.post("/looker/login")
def looker_login(request: Request):
    """
    POST /api/looker/login
    Executed upon frontend page load. Resolves or provisions a Looker user ID
    for the current visitor and caches it in a Secure HttpOnly cookie.
    """
    looker_user_id = resolve_or_provision_looker_user_id(request)
    if not looker_user_id:
        raise HTTPException(
            status_code=500, detail="Failed to resolve or provision Looker user"
        )

    response = JSONResponse(
        {
            "status": "success",
            "external_user_id": getattr(request.state, "external_user_id", None),
            "looker_user_id": looker_user_id,
            "message": f"Looker user {looker_user_id} active",
        }
    )
    response.set_cookie(
        key=COOKIE_LOOKER_USER_ID,
        value=str(looker_user_id),
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE_SHORT,
    )
    return response


@api_router.post("/looker/access-token")
def get_looker_access_token(request: Request):
    """
    Runs login_user, retrieves an access token, and stores it in the browser as an
    HttpOnly, Secure cookie ('looker-access-token').
    Implements TTL validation to reuse active cached access tokens instantly.
    """
    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        raise HTTPException(
            status_code=404,
            detail="Looker user ID not found. Please invoke /api/looker/login first.",
        )

    now = int(time.time())

    # 1. Check if token already exists in cookie and is active (with 10s buffer)
    cached_cookie = request.cookies.get(COOKIE_ACCESS_TOKEN)
    if cached_cookie:
        try:
            token_data = json.loads(cached_cookie)
            expires_on = token_data.get("expires_on")
            if expires_on and expires_on > now + 10:
                return JSONResponse(
                    {
                        "message": "API token is still valid",
                        "access_token": token_data,
                    }
                )
        except Exception:
            pass  # Proceed to login if parsing fails

    # 2. Perform login_user
    try:
        access_token_obj = get_sdk().login_user(looker_user_id)
        expires_in = getattr(access_token_obj, "expires_in", 3600) or 3600

        token_schema = CachedAccessToken(
            access_token=getattr(access_token_obj, "access_token", ""),
            token_type=getattr(access_token_obj, "token_type", "Bearer"),
            expires_in=expires_in,
            expires_on=now + expires_in,
        )

        response = JSONResponse(
            {
                "message": "API token acquired successfully",
                "access_token": token_schema.model_dump(),
            }
        )

        response.set_cookie(
            key=COOKIE_ACCESS_TOKEN,
            value=token_schema.model_dump_json(),
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=COOKIE_MAX_AGE_SHORT,
        )
        return response

    except Exception as e:
        logger.error(f"Error calling login_user: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to acquire API token: {str(e)}"
        )


@api_router.post("/looker/acquire-embed-session")
def acquire_embed_session(
    request: Request, body_req: Optional[CookielessAcquireRequest] = None
):
    """
    Implements cookieless embed session acquisition.
    Separates the stateful 'session_reference_token' into an HttpOnly, Secure cookie
    ('looker-embed-tokens') while delivering authorization/navigation tokens safely
    to the frontend via Pydantic response schemas.
    """
    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        raise HTTPException(
            status_code=404,
            detail="Looker user ID not found. Please invoke /api/looker/login first.",
        )

    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
    opts = {"headers": {"User-Agent": user_agent}}

    external_user_id = getattr(request.state, "external_user_id", None)
    if not external_user_id:
        raise HTTPException(status_code=401, detail="External user ID missing")

    if body_req is None:
        body_req = CookielessAcquireRequest()

    enc_key = env.encryption_key
    existing_cookie = request.cookies.get(COOKIE_EMBED_TOKENS)
    session_ref = None
    if existing_cookie:
        try:
            enc_session_ref = json.loads(existing_cookie).get("session_reference_token")
            if enc_session_ref:
                session_ref = decrypt_token(enc_session_ref, enc_key)
        except Exception:
            pass

    cfg = models.EmbedCookielessSessionAcquire(
        external_user_id=external_user_id,
        first_name=body_req.first_name,
        last_name=body_req.last_name,
        session_length=body_req.session_length,
        force_logout_login=body_req.force_logout_login,
        permissions=body_req.get_permissions(),
        models=body_req.models,
        user_attributes=body_req.user_attributes,
        session_reference_token=session_ref,
    )

    try:
        acquire_resp = get_sdk().acquire_embed_cookieless_session(
            cfg, transport_options=opts
        )
    except Exception as e:
        if session_ref:
            cfg.session_reference_token = None
            acquire_resp = get_sdk().acquire_embed_cookieless_session(
                cfg, transport_options=opts
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Acquire embed session failed: {str(e)}"
            )

    stored_schema = StoredEmbedTokens(
        session_reference_token=getattr(acquire_resp, "session_reference_token", ""),
        api_token=getattr(acquire_resp, "api_token", ""),
        navigation_token=getattr(acquire_resp, "navigation_token", ""),
        authentication_token=getattr(acquire_resp, "authentication_token", ""),
    )

    client_schema = CookielessClientResponse(
        status="success",
        external_user_id=external_user_id,
        api_token=getattr(acquire_resp, "api_token", None),
        api_token_ttl=getattr(acquire_resp, "api_token_ttl", None),
        navigation_token=getattr(acquire_resp, "navigation_token", None),
        navigation_token_ttl=getattr(acquire_resp, "navigation_token_ttl", None),
        authentication_token=getattr(acquire_resp, "authentication_token", None),
        authentication_token_ttl=getattr(
            acquire_resp, "authentication_token_ttl", None
        ),
    )

    response = JSONResponse(client_schema.model_dump())
    response.set_cookie(
        key=COOKIE_EMBED_TOKENS,
        value=stored_schema.model_dump_json(),
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE_SHORT,
    )
    return response


@api_router.post("/looker/generate-embed-tokens")
def generate_embed_tokens(request: Request):
    """
    Implements cookieless embed token refresh.
    Generates new API and navigation tokens using the encrypted
    'session_reference_token' stored in the HttpOnly cookie.
    """
    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        raise HTTPException(
            status_code=404,
            detail="Looker user ID not found. Please invoke /api/looker/login first.",
        )

    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
    opts = {"headers": {"User-Agent": user_agent}}

    enc_key = env.encryption_key
    existing_cookie = request.cookies.get(COOKIE_EMBED_TOKENS)
    if not existing_cookie:
        raise HTTPException(status_code=401, detail="No Looker tokens found in cookies")

    try:
        cookie_data = json.loads(existing_cookie)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token cookie format")

    enc_session_ref = cookie_data.get("session_reference_token")
    if not enc_session_ref:
        raise HTTPException(
            status_code=401,
            detail="Missing encrypted session reference token in cookie",
        )

    try:
        session_ref = decrypt_token(enc_session_ref, enc_key)
    except Exception:
        raise HTTPException(
            status_code=401, detail="Failed to decrypt session reference token"
        )

    gen_req = models.EmbedCookielessSessionGenerateTokens(
        session_reference_token=session_ref,
        navigation_token=cookie_data.get("navigation_token"),
        api_token=cookie_data.get("api_token"),
    )

    try:
        gen_resp = get_sdk().generate_tokens_for_cookieless_session(
            gen_req, transport_options=opts
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Generate tokens failed: {str(e)}")

    stored_schema = StoredEmbedTokens(
        session_reference_token=getattr(gen_resp, "session_reference_token", "")
        or session_ref,
        api_token=getattr(gen_resp, "api_token", "")
        or cookie_data.get("api_token", ""),
        navigation_token=getattr(gen_resp, "navigation_token", "")
        or cookie_data.get("navigation_token", ""),
        authentication_token=cookie_data.get("authentication_token", ""),
    )

    client_schema = CookielessClientResponse(
        status="success",
        api_token=getattr(gen_resp, "api_token", None),
        api_token_ttl=getattr(gen_resp, "api_token_ttl", None),
        navigation_token=getattr(gen_resp, "navigation_token", None),
        navigation_token_ttl=getattr(gen_resp, "navigation_token_ttl", None),
    )

    response = JSONResponse(client_schema.model_dump())
    response.set_cookie(
        key=COOKIE_EMBED_TOKENS,
        value=stored_schema.model_dump_json(),
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE_SHORT,
    )

    # Simultaneously refresh standard API token if user ID can be resolved
    try:
        looker_user_id = getattr(request.state, "looker_user_id", None)
        if looker_user_id:
            api_token_obj = get_sdk().login_user(looker_user_id)
            exp_in = getattr(api_token_obj, "expires_in", 3600) or 3600
            token_schema = CachedAccessToken(
                access_token=getattr(api_token_obj, "access_token", ""),
                token_type=getattr(api_token_obj, "token_type", "Bearer"),
                expires_in=exp_in,
                expires_on=int(time.time()) + exp_in,
            )
            response.set_cookie(
                key=COOKIE_ACCESS_TOKEN,
                value=token_schema.model_dump_json(),
                httponly=True,
                secure=True,
                samesite="strict",
                max_age=COOKIE_MAX_AGE_SHORT,
            )
    except Exception as e:
        logger.warning(
            f"Optional login_user refresh during generate tokens failed: {e}"
        )

    return response


@api_router.get("/hello/{name}")
def hello(name: str):
    return {"message": f"Hello, {name}!"}


app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8009, reload=True)
