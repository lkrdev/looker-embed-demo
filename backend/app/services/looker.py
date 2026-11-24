import logging
import re
import ssl
import urllib.request
from typing import Any, Dict, List, Optional

import looker_sdk
from app.core.config import settings
from app.models import DEFAULT_LOOKER_GROUP_IDS, DEFAULT_LOOKER_MODELS
from looker_sdk.sdk.api40 import models as sdk_models

_INLINE_EXT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")

logger = logging.getLogger(__name__)

# Global Looker SDK instance shared across Cloud Run function invocations
_global_sdk: Optional[Any] = None


class LookerService:
    """Service class encapsulating Looker SDK logic for loose coupling and mockability."""

    def __init__(self) -> None:
        self._sdk: Optional[Any] = None

    @classmethod
    def reset_global_sdk(cls) -> None:
        """Resets the shared global SDK instance (useful for unit testing)."""
        global _global_sdk
        _global_sdk = None

    @property
    def sdk(self) -> Any:
        # Allow explicit instance-level mock override (e.g., for unit tests)
        if self._sdk is not None:
            return self._sdk

        global _global_sdk
        if _global_sdk is None:
            logger.info("Initializing global Looker SDK instance for Cloud Run reuse")
            _global_sdk = looker_sdk.init40()
        return _global_sdk

    def get_looker_user_id_by_external_id(
        self, external_user_id: str, auto_provision: bool = True
    ) -> Optional[str]:
        """Looks up the Looker internal user ID associated with an external user ID."""
        try:
            user = self.sdk.user_for_credential("embed", external_user_id)
            if user and user.id:
                return str(user.id)
        except Exception as e:
            logger.warning(f"Looker SDK user lookup failed for {external_user_id}: {e}")
            if auto_provision:
                logger.info(
                    f"Auto-provisioning cookieless embed user for {external_user_id}"
                )
                from app.models import ROLE_PERMISSIONS

                return self.provision_embed_user(
                    external_user_id=external_user_id,
                    permissions=ROLE_PERMISSIONS["explorer"],
                    user_agent="LookerEmbedDemo/1.0",
                )
        return None

    def provision_embed_user(
        self,
        external_user_id: str,
        permissions: List[str],
        user_agent: str,
    ) -> Optional[str]:
        """Provisions an embed user by triggering a dummy cookieless session acquisition."""
        opts = {"headers": {"User-Agent": user_agent}}
        try:
            cfg = sdk_models.EmbedCookielessSessionAcquire(
                external_user_id=external_user_id,
                first_name="Embedded",
                last_name="User",
                session_length=3600,
                force_logout_login=True,
                permissions=permissions,
                models=DEFAULT_LOOKER_MODELS,
                group_ids=DEFAULT_LOOKER_GROUP_IDS,
            )
            self.sdk.acquire_embed_cookieless_session(cfg, transport_options=opts)
            return self.get_looker_user_id_by_external_id(
                external_user_id, auto_provision=False
            )
        except Exception as e:
            logger.error(f"Provisioning embed user failed: {e}")
            return None

    def login_user(self, looker_user_id: str) -> Any:
        """Retrieves Looker API user credentials (access token)."""
        return self.sdk.login_user(looker_user_id)

    def acquire_cookieless_session(
        self,
        external_user_id: str,
        first_name: str,
        last_name: str,
        session_length: int,
        force_logout_login: bool,
        permissions: List[str],
        models: List[str],
        user_attributes: Dict[str, Any],
        session_reference_token: Optional[str],
        user_agent: str,
        group_ids: Optional[List[str]] = None,
    ) -> Any:
        """Acquires a cookieless session, with automatic retry fallback if session_reference_token is rejected."""
        opts = {"headers": {"User-Agent": user_agent}}
        cfg = sdk_models.EmbedCookielessSessionAcquire(
            external_user_id=external_user_id,
            first_name=first_name,
            last_name=last_name,
            session_length=session_length,
            force_logout_login=force_logout_login,
            permissions=permissions,
            models=models,
            group_ids=group_ids or DEFAULT_LOOKER_GROUP_IDS,
            user_attributes=user_attributes,
            session_reference_token=session_reference_token,
        )
        try:
            return self.sdk.acquire_embed_cookieless_session(
                cfg, transport_options=opts
            )
        except Exception as e:
            if session_reference_token:
                logger.warning(
                    f"Acquire session failed with token, retrying without token: {e}"
                )
                cfg.session_reference_token = None
                return self.sdk.acquire_embed_cookieless_session(
                    cfg, transport_options=opts
                )
            raise e

    def generate_cookieless_tokens(
        self,
        session_reference_token: str,
        navigation_token: Optional[str],
        api_token: Optional[str],
        user_agent: str,
    ) -> Any:
        """Refreshes and generates new tokens for a cookieless embed session."""
        opts = {"headers": {"User-Agent": user_agent}}
        gen_req = sdk_models.EmbedCookielessSessionGenerateTokens(
            session_reference_token=session_reference_token,
            navigation_token=navigation_token,
            api_token=api_token,
        )
        return self.sdk.generate_tokens_for_cookieless_session(
            gen_req, transport_options=opts
        )

    def get_agent_metadata(self, agent_id: str) -> dict[str, Any]:
        """Fetches Looker Conversational Analytics agent details including golden_queries."""
        res = self.sdk.get(path=f"/agents/{agent_id}", structure=dict)
        return res if isinstance(res, dict) else {}

    def get_user_permissions(self, looker_user_id: str) -> set[str]:
        """Returns the union of Looker permission strings assigned to a user across all roles."""
        perms: set[str] = set()
        roles = self.sdk.user_roles(user_id=str(looker_user_id)) or []
        for role in roles:
            pset = getattr(role, "permission_set", None)
            role_perms = getattr(pset, "permissions", None) if pset else None
            if role_perms:
                perms.update(str(p) for p in role_perms)
        return perms

    def fetch_inline_extension_bundle(
        self, inline_extension_id: str, access_token: str
    ) -> str:
        """Fetches a db:: Data App ES module via Looker Core API 4.0 as the authenticated embed user."""
        # ponytail: Looker 26.24's web route /inline_extension/:id/bundle.js requires rack.session (401 in
        # Cookieless Embed), and Core API /api/4.0/inline_extension/:id/bundle.js sets ACAO: null; fetching
        # server-to-server with the embed user's OAuth token preserves Looker RBAC without a session cookie.
        if not _INLINE_EXT_ID_RE.fullmatch(inline_extension_id):
            raise ValueError("Invalid inline extension ID")
        base_url = (settings.LOOKERSDK_BASE_URL or "").rstrip("/")
        if not base_url:
            raise ValueError("LOOKERSDK_BASE_URL is not configured")
        url = f"{base_url}/api/4.0/inline_extension/{inline_extension_id}/bundle.js"
        req = urllib.request.Request(
            url, headers={"Authorization": f"Bearer {access_token}"}
        )
        ctx = (
            ssl.create_default_context()
            if settings.LOOKERSDK_VERIFY_SSL
            else ssl._create_unverified_context()
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            return resp.read().decode("utf-8")
