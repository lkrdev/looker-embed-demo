import ast
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_data_apps_lookml_bundles_and_manifest_parity() -> None:
    manifest = (ROOT / "lookml" / "manifest.lkml").read_text(encoding="utf-8")
    declared_apps = set(re.findall(r"application:\s*([A-Za-z0-9_-]+)\s*\{", manifest))

    app_sources = sorted((ROOT / "data_apps").glob("*/app.js"))
    assert app_sources, "Expected at least one data_apps/<app>/app.js"

    res = subprocess.run(
        [sys.executable, str(ROOT / "data_apps" / "sync_lookml_bundles.py"), "--check"],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, res.stderr

    for src in app_sources:
        app_id = src.parent.name
        assert app_id in declared_apps, f"Missing `application: {app_id}` in lookml/manifest.lkml"
        deploy_py = src.parent / "deploy.py"
        if deploy_py.is_file():
            deploy_text = deploy_py.read_text(encoding="utf-8")
            tree = ast.parse(deploy_text, filename=str(deploy_py))
            prints = [
                n.lineno
                for n in ast.walk(tree)
                if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "print"
            ]
            assert not prints, f"{deploy_py} contains print() on line(s) {prints} (corrupts Code Mode stdio)"
            assert f'"{app_id}"' in deploy_text or f"'{app_id}'" in deploy_text, f"{deploy_py} must reference {app_id}"
            assert "query_specs" in deploy_text, f"{deploy_py} must define query_specs for Viewer embed permissions"
