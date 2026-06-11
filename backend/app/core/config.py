import os
from typing import Optional


class Settings:
    LOOKERSDK_BASE_URL: Optional[str] = os.getenv("LOOKERSDK_BASE_URL")
    LOOKERSDK_CLIENT_ID: Optional[str] = os.getenv("LOOKERSDK_CLIENT_ID")
    LOOKERSDK_CLIENT_SECRET: Optional[str] = os.getenv("LOOKERSDK_CLIENT_SECRET")
    LOOKERSDK_VERIFY_SSL: bool = os.getenv("LOOKERSDK_VERIFY_SSL", "true").lower() in ("true", "1", "yes")
    ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")
    DIST_DIR: str = os.getenv("DIST_DIR", "./frontend/dist")

    def validate(self) -> None:
        """Validate critical environment configurations eagerly on start."""
        if not self.LOOKERSDK_BASE_URL:
            raise ValueError("LOOKERSDK_BASE_URL environment variable is not set.")
        if not self.LOOKERSDK_CLIENT_ID:
            raise ValueError("LOOKERSDK_CLIENT_ID environment variable is not set.")
        if not self.LOOKERSDK_CLIENT_SECRET:
            raise ValueError("LOOKERSDK_CLIENT_SECRET environment variable is not set.")
        if not self.ENCRYPTION_KEY:
            raise ValueError("ENCRYPTION_KEY environment variable is not set.")

settings = Settings()
