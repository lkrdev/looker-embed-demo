import os
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from utils import decrypt_token, encrypt_token

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "viewer": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "see_lookml_dashboards",
    ],
    "explorer": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "save_content",
        "see_lookml_dashboards",
        "explore",
        "embed_browse_spaces",
    ],
}


class Environment:
    """Model validating core Looker SDK configuration and application secrets."""

    lookersdk_base_url: str | None
    lookersdk_client_id: str | None
    lookersdk_client_secret: str | None
    lookersdk_verify_ssl: bool
    encryption_key: str

    def __init__(self) -> None:
        self.lookersdk_base_url: str | None = os.getenv("LOOKERSDK_BASE_URL")
        self.lookersdk_client_id: str | None = os.getenv("LOOKERSDK_CLIENT_ID")
        self.lookersdk_client_secret: str | None = os.getenv("LOOKERSDK_CLIENT_SECRET")
        self.lookersdk_verify_ssl: bool = bool(os.getenv("LOOKERSDK_VERIFY_SSL", True))
        self.encryption_key: str | None = os.getenv("ENCRYPTION_KEY")

    def validate(self) -> None:
        """Validate environment variables."""
        if not self.lookersdk_base_url:
            raise ValueError("LOOKERSDK_BASE_URL is not set.")
        if not self.lookersdk_client_id:
            raise ValueError("LOOKERSDK_CLIENT_ID is not set.")
        if not self.lookersdk_client_secret:
            raise ValueError("LOOKERSDK_CLIENT_SECRET is not set.")
        if not self.encryption_key:
            raise ValueError("ENCRYPTION_KEY is not set.")


class CachedAccessToken(BaseModel):
    """Pydantic schema representing the cached Looker API access token stored in cookie."""

    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    expires_on: int


class StoredEmbedTokens(BaseModel):
    """
    Pydantic schema representing the stateful session reference tokens stored in HttpOnly cookie.
    Autonomous field validation automatically encrypts raw session reference tokens on the fly.
    """

    session_reference_token: str
    api_token: Optional[str] = ""
    navigation_token: Optional[str] = ""
    authentication_token: Optional[str] = ""

    @field_validator("session_reference_token")
    @classmethod
    def enforce_encryption(cls, v: str) -> str:
        """Ensures session_reference_token is securely encrypted before storage."""
        if not v:
            return v
        env = Environment()
        try:
            # If it decrypts successfully, it's already encrypted
            decrypt_token(v, env.encryption_key)
            return v
        except Exception:
            # Otherwise, encrypt it securely
            return encrypt_token(v, env.encryption_key)


class CookielessClientResponse(BaseModel):
    """Pydantic schema for the non-sensitive embed tokens delivered to the frontend client."""

    status: str = "success"
    external_user_id: Optional[str] = None
    api_token: Optional[str] = None
    api_token_ttl: Optional[int] = None
    navigation_token: Optional[str] = None
    navigation_token_ttl: Optional[int] = None
    authentication_token: Optional[str] = None
    authentication_token_ttl: Optional[int] = None


class CookielessAcquireRequest(BaseModel):
    """Pydantic schema for optional client body overrides during cookieless session acquisition via role mappings."""

    first_name: str = "Embedded"
    last_name: str = "User"
    session_length: int = 3600
    force_logout_login: bool = True
    role: str = Field(
        default="viewer",
        description="Role mapping for Looker permissions: 'viewer' or 'explorer'",
    )
    models: List[str] = Field(default=["thelook"])
    user_attributes: Dict[str, Any] = Field(
        default={"locale": "en_US", "brand": "Levi's"}
    )

    def get_permissions(self) -> List[str]:
        """Resolves active Looker permission strings from the requested role mapping."""
        return ROLE_PERMISSIONS.get(self.role.lower(), ROLE_PERMISSIONS["viewer"])
