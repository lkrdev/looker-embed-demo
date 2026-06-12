import os
from typing import List, Optional


class Settings:
    LOOKERSDK_BASE_URL: Optional[str]
    LOOKERSDK_CLIENT_ID: Optional[str]
    LOOKERSDK_CLIENT_SECRET: Optional[str]
    LOOKERSDK_VERIFY_SSL: bool
    ENCRYPTION_KEY: str
    DIST_DIR: str
    LOOKER_MODEL: str
    EMBED_MODELS: List[str] = []

    def __init__(self) -> None:
        self.LOOKERSDK_BASE_URL = os.getenv("LOOKERSDK_BASE_URL")
        self.LOOKERSDK_CLIENT_ID = os.getenv("LOOKERSDK_CLIENT_ID")
        self.LOOKERSDK_CLIENT_SECRET = os.getenv("LOOKERSDK_CLIENT_SECRET")
        self.LOOKERSDK_VERIFY_SSL = os.getenv(
            "LOOKERSDK_VERIFY_SSL", "true"
        ).lower() in ("true", "1", "yes")
        self.ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")
        self.DIST_DIR = os.getenv("DIST_DIR", "./frontend/dist")
        self.LOOKER_MODEL = os.getenv("LOOKER_MODEL", "embed_demo")
        self.EMBED_MODELS = [
            m.strip() for m in self.LOOKER_MODEL.split(",") if m.strip()
        ]

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
