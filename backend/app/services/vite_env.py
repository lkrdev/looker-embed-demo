from functools import lru_cache
import json
import logging
import os
import pathlib
import re

logger = logging.getLogger(__name__)


def get_vite_env_vars() -> dict[str, str]:
    """Parse VITE_ environment variables from OS environment."""
    env_vars: dict[str, str] = {}

    for k, v in os.environ.items():
        if k.startswith("VITE_"):
            env_vars[k] = v

    return env_vars


def get_expected_vite_keys() -> set[str]:
    """Inspect frontend/src/config/constants.ts for all expected import.meta.env.VITE_* keys."""
    try:
        current_file = pathlib.Path(__file__).resolve()
        project_root = current_file.parent.parent.parent.parent
        constants_ts = project_root / "frontend" / "src" / "config" / "constants.ts"
        if constants_ts.exists():
            content = constants_ts.read_text(encoding="utf-8")
            matches = re.findall(r"import\.meta\.env\.VITE_([A-Z0-9_]+)", content)
            return {m.lower() for m in matches}
    except Exception as e:
        logger.warning(f"Could not read constants.ts to get expected VITE keys: {e}")

    return {"api_base_url", "looker_instance_url", "chat_agent_id", "dashboard_id", "theme", "explore_path", "looker_folder_id"}


@lru_cache(maxsize=1)
def generate_env_js_content() -> str:
    """Generate JavaScript string to populate window.vite with all expected keys (cached singleton)."""
    vite_vars = get_vite_env_vars()
    expected_keys = get_expected_vite_keys()

    config = {}

    for key in expected_keys:
        val = vite_vars.get(f"VITE_{key.upper()}")
        config[key] = val

    for k, v in vite_vars.items():
        sub_k = k[5:].lower()
        if sub_k not in config:
            config[sub_k] = v

    json_str = json.dumps(config, indent=2)
    return f"window.vite = {json_str};\n"
