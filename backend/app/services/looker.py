import logging
from typing import Any, Dict, List, Optional

import looker_sdk
from app.models import DEFAULT_LOOKER_MODELS
from looker_sdk.sdk.api40 import models as sdk_models

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
