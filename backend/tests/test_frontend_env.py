import json
import pathlib
import re


def test_constants_ts_and_env_js_keys_match():
    current_dir = pathlib.Path(__file__).resolve().parent
    project_root = current_dir.parent.parent

    constants_ts_path = project_root / "frontend" / "src" / "config" / "constants.ts"
    env_js_path = project_root / "frontend" / "public" / "env.js"

    assert constants_ts_path.exists(), f"Could not find {constants_ts_path}"
    assert env_js_path.exists(), f"Could not find {env_js_path}"

    # Extract all VITE_* environment variables from constants.ts
    constants_content = constants_ts_path.read_text(encoding="utf-8")
    matches = re.findall(r"import\.meta\.env\.VITE_([A-Z0-9_]+)", constants_content)
    assert matches, "No import.meta.env.VITE_* variables found in constants.ts"

    expected_keys = {m.lower() for m in matches}

    # Extract window.vite keys from env.js
    env_js_content = env_js_path.read_text(encoding="utf-8")
    assert "window.vite =" in env_js_content, "env.js does not contain window.vite assignment"

    json_part = env_js_content.split("window.vite =", 1)[1].rsplit(";", 1)[0].strip()
    try:
        data = json.loads(json_part)
    except json.JSONDecodeError as e:
        raise AssertionError(f"Could not parse JSON in env.js: {e}\nContent was: {json_part}")

    actual_keys = set(data.keys())

    # Assert complete equality between expected and actual sets
    missing_in_env_js = expected_keys - actual_keys
    extra_in_env_js = actual_keys - expected_keys

    error_msg = []
    if missing_in_env_js:
        error_msg.append(f"Keys found in constants.ts but missing in env.js: {sorted(missing_in_env_js)}")
    if extra_in_env_js:
        error_msg.append(f"Keys found in env.js but missing in constants.ts: {sorted(extra_in_env_js)}")

    assert not error_msg, "; ".join(error_msg)
