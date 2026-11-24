import ast
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REQUIRED_QUERY_SPEC_KEYS = {"widget_id", "title", "model", "view", "fields", "limit"}


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
        app_js = src.read_text(encoding="utf-8")
        assert "looker-data-apps/versions/1.3.0/data-app.js" in app_js, f"{src} must target Data Apps 1.3.0"
        assert "embed-demo-theme-request" in app_js and "embed-demo-theme" in app_js, f"{src} missing theme bridge"
        assert not re.search(r"\.runQuery\(\s*(?:\{[^{}]*\}|[\w$.]+)\s*,\s*\{[^}]*\bsignal\b", app_js), (
            f"{src} passes an options object containing signal instead of signal directly to this.runQuery(query, signal)"
        )
        assert app_id in declared_apps, f"Missing `application: {app_id}` in lookml/manifest.lkml"
        assert f'file: "data_apps/{app_id}.js"' in manifest, f'Missing file: "data_apps/{app_id}.js" in manifest.lkml'

        deploy_py = src.parent / "deploy.py"
        assert deploy_py.is_file(), f"Missing {deploy_py}"
        deploy_text = deploy_py.read_text(encoding="utf-8")
        parsable_text = re.sub(r"^return\b", "_ = ", deploy_text, flags=re.MULTILINE)
        tree = ast.parse(parsable_text, filename=str(deploy_py))
        prints = [
            n.lineno
            for n in ast.walk(tree)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "print"
        ]
        assert not prints, f"{deploy_py} contains print() on line(s) {prints} (corrupts Code Mode stdio)"
        assert f'"{app_id}"' in deploy_text or f"'{app_id}'" in deploy_text, f"{deploy_py} must reference {app_id}"

        specs_nodes = [
            n.value
            for n in tree.body
            if (
                isinstance(n, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id == "query_specs" for t in n.targets)
            )
            or (
                isinstance(n, ast.AnnAssign)
                and isinstance(n.target, ast.Name)
                and n.target.id == "query_specs"
                and n.value is not None
            )
        ]
        assert specs_nodes, f"{deploy_py} must assign top-level `query_specs = [...]`"
        specs = ast.literal_eval(specs_nodes[0])
        assert isinstance(specs, list) and specs, f"{deploy_py} `query_specs` must be a non-empty list"
        for spec in specs:
            assert isinstance(spec, dict), f"{deploy_py} query_spec item must be a dict, got {type(spec)}"
            missing = REQUIRED_QUERY_SPEC_KEYS - set(spec)
            assert not missing, f"{deploy_py} query_spec missing keys {missing}: {spec}"
