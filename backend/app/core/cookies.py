import logging
from typing import Optional
from fastapi import Request, Response
from app.core.config import settings
from app.core.security import decrypt_token, encrypt_token
from app.models import LookerUser

logger = logging.getLogger(__name__)

# Cookie and Configuration Constants
COOKIE_EXTERNAL_USER_ID = "looker-external-user-id"
COOKIE_LOOKER_USER = "looker-user"
COOKIE_ACCESS_TOKEN = "looker-access-token"
COOKIE_EMBED_TOKENS = "looker-embed-tokens"
COOKIE_MAX_AGE_5_YEARS = 5 * 365 * 24 * 60 * 60  # 5 years in seconds
COOKIE_MAX_AGE_SHORT = 30 * 24 * 60 * 60  # 30 days in seconds


def get_looker_user_from_cookie(request: Request) -> Optional[LookerUser]:
    """Helper to decrypt and parse the Looker user config cookie."""
    cookie_val = request.cookies.get(COOKIE_LOOKER_USER)
    if not cookie_val:
        return None
    try:
        decrypted = decrypt_token(cookie_val, settings.ENCRYPTION_KEY)
        return LookerUser.model_validate_json(decrypted)
    except Exception as e:
        logger.warning(f"Failed to decrypt/parse looker-user cookie: {e}")
        return None


def set_looker_user_cookie(response: Response, looker_user: LookerUser):
    """Helper to encrypt and store the Looker user config in the cookie."""
    encrypted = encrypt_token(looker_user.model_dump_json(), settings.ENCRYPTION_KEY)
    response.set_cookie(
        key=COOKIE_LOOKER_USER,
        value=encrypted,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE_SHORT,
    )
