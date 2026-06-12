import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse

from app.api.deps import get_current_looker_user_id, get_looker_service
from app.core.config import settings
from app.core.cookies import (
    COOKIE_ACCESS_TOKEN,
    COOKIE_EMBED_TOKENS,
    COOKIE_MAX_AGE_SHORT,
    set_looker_user_cookie,
)
from app.core.security import decrypt_token
from app.models import (
    ROLE_PERMISSIONS,
    CachedAccessToken,
    CookielessAcquireRequest,
    CookielessClientResponse,
    LookerLoginRequest,
    LookerUser,
    StoredEmbedTokens,
)
from app.services.looker import LookerService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login")
def looker_login(
    request: Request,
    response: Response,
    body_req: Optional[LookerLoginRequest] = None,
    looker_svc: LookerService = Depends(get_looker_service),
):
    """
    POST /api/looker/login
    Executed upon frontend page load. Resolves or provisions a Looker user ID
    for the current visitor and caches it in a Secure HttpOnly cookie.
    """
    if body_req is None:
        body_req = LookerLoginRequest()

    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        external_user_id = getattr(request.state, "external_user_id", None)
        if not external_user_id:
            raise HTTPException(
                status_code=500, detail="External user ID missing from request state"
            )

        user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
        # Default user provisioning uses explorer permissions mapping
        looker_user_id = looker_svc.provision_embed_user(
            external_user_id=external_user_id,
            permissions=ROLE_PERMISSIONS["explorer"],
            user_agent=user_agent,
        )

    if not looker_user_id:
        raise HTTPException(
            status_code=500, detail="Failed to resolve or provision Looker user"
        )

    # Resolve permissions from mapped role name
    permissions = ROLE_PERMISSIONS.get(body_req.role_id, ROLE_PERMISSIONS["viewer"])

    looker_user = LookerUser(
        looker_user_id=looker_user_id,
        role_id=body_req.role_id,
        permissions=permissions,
        models=["thelook"],
        user_attributes={
            "locale": body_req.locale,
            "brand": body_req.brand,
        },
    )

    res_body = {
        "status": "success",
        "external_user_id": getattr(request.state, "external_user_id", None),
        "looker_user": looker_user.model_dump(),
        "message": f"Looker user {looker_user_id} active with configuration",
    }

    # Construct the JSONResponse and attach the cookie
    res = JSONResponse(res_body)
    set_looker_user_cookie(res, looker_user)
    res.delete_cookie(
        key=COOKIE_EMBED_TOKENS,
        secure=True,
        httponly=True,
        samesite="strict",
    )
    return res


@router.post("/access-token")
def get_looker_access_token(
    request: Request,
    looker_user_id: str = Depends(get_current_looker_user_id),
    looker_svc: LookerService = Depends(get_looker_service),
):
    """
    Runs login_user, retrieves an access token, and stores it in the browser as an
    HttpOnly, Secure cookie ('looker-access-token').
    Implements TTL validation to reuse active cached access tokens instantly.
    """
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
        access_token_obj = looker_svc.login_user(looker_user_id)
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


@router.post("/acquire-embed-session")
def acquire_embed_session(
    request: Request,
    body_req: Optional[CookielessAcquireRequest] = None,
    looker_svc: LookerService = Depends(get_looker_service),
    looker_user_id: str = Depends(get_current_looker_user_id),
):
    """
    Implements cookieless embed session acquisition.
    Separates the stateful 'session_reference_token' into an HttpOnly, Secure cookie
    ('looker-embed-tokens') while delivering authorization/navigation tokens safely
    to the frontend via Pydantic response schemas.
    """
    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")
    external_user_id = getattr(request.state, "external_user_id", None)
    if not external_user_id:
        raise HTTPException(status_code=401, detail="External user ID missing")

    # 1. Resolve configuration from request state (cookie-based LookerUser)
    looker_user = getattr(request.state, "looker_user", None)

    first_name = "Embedded"
    last_name = "User"
    session_length = 3600
    force_logout_login = True
    permissions = ROLE_PERMISSIONS["viewer"]
    user_models = ["thelook"]
    user_attrs = {}

    if looker_user:
        permissions = looker_user.permissions
        user_models = looker_user.models
        user_attrs = looker_user.user_attributes
    elif body_req:
        first_name = body_req.first_name
        last_name = body_req.last_name
        session_length = body_req.session_length
        force_logout_login = body_req.force_logout_login
        permissions = body_req.get_permissions()
        user_models = body_req.models
        user_attrs = body_req.user_attributes

    existing_cookie = request.cookies.get(COOKIE_EMBED_TOKENS)
    session_ref = None
    if existing_cookie:
        try:
            enc_session_ref = json.loads(existing_cookie).get("session_reference_token")
            if enc_session_ref:
                session_ref = decrypt_token(enc_session_ref, settings.ENCRYPTION_KEY)
        except Exception:
            pass

    try:
        acquire_resp = looker_svc.acquire_cookieless_session(
            external_user_id=external_user_id,
            first_name=first_name,
            last_name=last_name,
            session_length=session_length,
            force_logout_login=force_logout_login,
            permissions=permissions,
            models=user_models,
            user_attributes=user_attrs,
            session_reference_token=session_ref,
            user_agent=user_agent,
        )
    except Exception as e:
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
        session_reference_token_ttl=getattr(
            acquire_resp, "session_reference_token_ttl", None
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


@router.post("/generate-embed-tokens")
def generate_embed_tokens(
    request: Request,
    looker_svc: LookerService = Depends(get_looker_service),
    looker_user_id: str = Depends(get_current_looker_user_id),
):
    """
    Implements cookieless embed token refresh.
    Generates new API and navigation tokens using the encrypted
    'session_reference_token' stored in the HttpOnly cookie.
    """
    user_agent = request.headers.get("user-agent", "LookerEmbedDemo/1.0")

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
        session_ref = decrypt_token(enc_session_ref, settings.ENCRYPTION_KEY)
    except Exception:
        raise HTTPException(
            status_code=401, detail="Failed to decrypt session reference token"
        )

    try:
        gen_resp = looker_svc.generate_cookieless_tokens(
            session_reference_token=session_ref,
            navigation_token=cookie_data.get("navigation_token"),
            api_token=cookie_data.get("api_token"),
            user_agent=user_agent,
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
        session_reference_token_ttl=getattr(
            gen_resp, "session_reference_token_ttl", None
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

    # Simultaneously refresh standard API token if user ID can be resolved
    try:
        if looker_user_id:
            api_token_obj = looker_svc.login_user(looker_user_id)
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
