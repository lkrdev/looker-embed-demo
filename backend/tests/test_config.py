import os
from unittest.mock import patch
from app.core.config import Settings


def test_embed_models_default():
    with patch.dict(os.environ, {}, clear=True):
        settings = Settings()
        assert settings.LOOKER_MODEL == "embed_demo"
        assert settings.EMBED_MODELS == ["embed_demo"]


def test_embed_models_custom_comma_separated():
    with patch.dict(os.environ, {"LOOKER_MODEL": "  embed_demo , thelook, , model3  "}):
        settings = Settings()
        assert settings.LOOKER_MODEL == "  embed_demo , thelook, , model3  "
        assert settings.EMBED_MODELS == ["embed_demo", "thelook", "model3"]
