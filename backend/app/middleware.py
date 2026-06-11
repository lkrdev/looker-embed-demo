import base64
import json
import logging
from typing import Optional
from fastapi import Request, Response
from fastapi.concurrency import run_in_threadpool
from app.core.cookies import (
    COOKIE_EMBED_TOKENS,
    COOKIE_EXTERNAL_USER_ID,
    COOKIE_MAX_AGE_5_YEARS,
    get_looker_user_from_cookie,
)
from app.models import LookerUser
from app.services.looker import LookerService
from utils import generate_external_user_id

logger = logging.getLogger(__name__)
looker_service = LookerService()


def get_looker_user_id_from_cookie(request: Request) -> Optional[str]:
    """
    Attempts to resolve the Looker user ID from active cookieless embed authentication token credentials.
    """
    embed_tokens_cookie = request.cookies.get(COOKIE_EMBED_TOKENS)
    if embed_tokens_cookie:
        try:
            tokens = json.loads(embed_tokens_cookie)
            auth_token = tokens.get("authentication_token")
            if auth_token and "." in auth_token:
                payload_b64 = auth_token.split(".")[1]
                # Pad base64 payload properly
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
                user_id_val = payload.get("credentials", {}).get("user_id")
                if user_id_val:
                    return str(user_id_val)
        except Exception as e:
            logger.warning(f"Failed parsing authentication token: {e}")
    return None


def resolve_looker_user_context(request: Request) -> Optional[LookerUser]:
    """Resolves the LookerUser configuration from cookies or fallbacks."""
    # 1. Try resolving from custom configuration cookie
    looker_user = get_looker_user_from_cookie(request)
    if looker_user:
        return looker_user

    # 2. Fall back to resolving raw user ID from tokens or lookup
    looker_user_id = get_looker_user_id_from_cookie(request)
    if not looker_user_id:
        external_user_id = getattr(request.state, "external_user_id", None)
        if external_user_id:
            looker_user_id = looker_service.get_looker_user_id_by_external_id(
                external_user_id
            )

    if looker_user_id:
        return LookerUser(looker_user_id=looker_user_id)

    return None


async def ensure_external_user_id_middleware(request: Request, call_next):
    """
    Middleware ensuring the end user has a 'looker-external-user-id' cookie.
    If not present, generates a 12-character alphanumeric ID (a-zA-Z0-9).
    """
    external_user_id = request.cookies.get(COOKIE_EXTERNAL_USER_ID)
    set_cookie = False
    if not external_user_id:
        external_user_id = generate_external_user_id()
        set_cookie = True

    # Attach to request state for access in downstream routes
    request.state.external_user_id = external_user_id

    # Resolve LookerUser configuration from cookie or fallback
    looker_user = await run_in_threadpool(resolve_looker_user_context, request)
    request.state.looker_user = looker_user
    request.state.looker_user_id = looker_user.looker_user_id if looker_user else None

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
