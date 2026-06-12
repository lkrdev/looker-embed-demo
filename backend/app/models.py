from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.core.security import decrypt_token, encrypt_token
from pydantic import BaseModel, Field, field_validator

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "viewer": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "see_lookml_dashboards",
        "gemini_in_looker",
        "chat_with_agent",
        "chat_with_explore",
    ],
    "explorer": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "save_content",
        "see_lookml_dashboards",
        "explore",
        "embed_browse_spaces",
        "gemini_in_looker",
        "chat_with_agent",
        "chat_with_explore",
        "save_agents",
        "admin_agents",
    ],
}


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
        try:
            # If it decrypts successfully, it's already encrypted
            decrypt_token(v, settings.ENCRYPTION_KEY)
            return v
        except Exception:
            # Otherwise, encrypt it securely
            return encrypt_token(v, settings.ENCRYPTION_KEY)


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
    session_reference_token_ttl: Optional[int] = None


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


class LookerUser(BaseModel):
    """Pydantic schema representing the full context of a logged-in Looker user, cached in cookie."""

    looker_user_id: str
    role_id: str = "viewer"
    permissions: List[str] = Field(default_factory=list)
    models: List[str] = Field(default_factory=lambda: ["thelook"])
    user_attributes: Dict[str, Any] = Field(default_factory=dict)


class LookerLoginRequest(BaseModel):
    """Pydantic schema for parameters passed when logging in or switching user configurations."""

    role_id: str = "viewer"
    locale: str = "en_US"
    brand: str = "Levi's"
