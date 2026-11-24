import base64
import hashlib
import subprocess
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_looker_service
from app.api.endpoints.ge import _agent_info_cache, _derive_ge_client_secret
from app.core.config import settings
from app.core.cookies import COOKIE_EXTERNAL_USER_ID
from app.core.security import seal_token, unseal_token
from main import app


def _pkce_pair(verifier: str = "super-secret-pkce-verifier-value-1234567890") -> tuple[str, str]:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


def test_seal_and_unseal_tamper_resistance():
    sealed = seal_token('{"u":"abc"}', settings.ENCRYPTION_KEY)
    assert unseal_token(sealed, settings.ENCRYPTION_KEY) == '{"u":"abc"}'

    tampered = sealed[:-2] + ("AA" if not sealed.endswith("AA") else "BB")
    with pytest.raises(ValueError):
        unseal_token(tampered, settings.ENCRYPTION_KEY)


def test_authorize_get_rejects_bad_redirect_and_preserves_cookies():
    client = TestClient(app)

    bad = client.get(
        "/api/ge/oauth/authorize",
        params={"redirect_uri": "https://evil.example.com/callback"},
    )
    assert bad.status_code == 400

    ok = client.get(
        "/api/ge/oauth/authorize",
        params={
            "redirect_uri": "https://vertexaisearch.cloud.google.com/oauth-redirect",
            "state": "xyz123",
            "code_challenge": "challenge_abc",
        },
    )
    assert ok.status_code == 200
    assert "Connect to Gemini Enterprise" in ok.text
    # Critical: initial cross-site GET must NOT mint a new looker-external-user-id cookie
    assert COOKIE_EXTERNAL_USER_ID not in ok.cookies


def test_full_pkce_oauth_and_refresh_flow():
    mock_svc = MagicMock()
    mock_svc.get_looker_user_id_by_external_id.return_value = "42"
    token_obj = MagicMock()
    token_obj.access_token = "looker_live_token_abc"
    token_obj.expires_in = 3600
    mock_svc.login_user.return_value = token_obj

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        client = TestClient(app)
        client.cookies.set(COOKIE_EXTERNAL_USER_ID, "visitor12345")
        verifier, challenge = _pkce_pair()

        auth_resp = client.post(
            "/api/ge/oauth/authorize",
            data={
                "redirect_uri": "https://vertexaisearch.cloud.google.com/oauth-redirect",
                "state": "state_999",
                "code_challenge": challenge,
                "code_challenge_method": "S256",
            },
            follow_redirects=False,
        )
        assert auth_resp.status_code == 302
        # Should auto-provision/upgrade session with gemini permissions
        assert mock_svc.acquire_cookieless_session.called

        loc = urlparse(auth_resp.headers["location"])
        assert loc.netloc == "vertexaisearch.cloud.google.com"
        qs = parse_qs(loc.query)
        assert qs["state"] == ["state_999"]
        code = qs["code"][0]

        client_secret = _derive_ge_client_secret()

        # Missing client_secret fails with 401
        no_secret = client.post(
            "/api/ge/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": verifier,
            },
        )
        assert no_secret.status_code == 401

        # Wrong PKCE verifier fails
        bad_tok = client.post(
            "/api/ge/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": "wrong_verifier",
                "client_secret": client_secret,
            },
        )
        assert bad_tok.status_code == 400

        # Valid PKCE verifier returns Looker access_token + stateless refresh_token
        tok_resp = client.post(
            "/api/ge/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": verifier,
                "client_secret": client_secret,
            },
        )
        assert tok_resp.status_code == 200
        body = tok_resp.json()
        assert body["access_token"] == "looker_live_token_abc"
        assert body["token_type"] == "Bearer"
        assert "refresh_token" in body

        # Refresh token exchange mints fresh Looker token for the exact same external_user_id
        token_obj_2 = MagicMock()
        token_obj_2.access_token = "looker_refreshed_token_xyz"
        token_obj_2.expires_in = 3600
        mock_svc.login_user.return_value = token_obj_2

        ref_resp = client.post(
            "/api/ge/oauth/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": body["refresh_token"],
                "client_secret": client_secret,
            },
        )
        assert ref_resp.status_code == 200
        assert ref_resp.json()["access_token"] == "looker_refreshed_token_xyz"
        mock_svc.get_looker_user_id_by_external_id.assert_called_with("visitor12345")
    finally:
        app.dependency_overrides.pop(get_looker_service, None)


def test_a2a_stream_returns_meaningful_error_when_gemini_permission_removed():
    mock_svc = MagicMock()
    # User switched back to Simple User (only has viewer permissions, missing chat_with_agent & gemini_in_looker)
    mock_svc.get_user_permissions.return_value = {
        "access_data",
        "see_lookml_dashboards",
    }

    def fake_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/api/4.0/user"):
            return httpx.Response(200, json={"id": 42})
        # Looker A2A controller returns bare 404 when authorize!(:chat, agent) fails
        return httpx.Response(404, json={"message": "Not found"})

    mock_transport = httpx.MockTransport(fake_handler)
    orig_client = httpx.AsyncClient

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        with patch(
            "app.api.endpoints.ge.httpx.AsyncClient",
            side_effect=lambda **kw: orig_client(transport=mock_transport, **kw),
        ):
            client = TestClient(app)
            resp = client.post(
                "/api/ge/a2a/agents/agent123/chat/v1/message:stream",
                headers={"Authorization": "Bearer valid_viewer_token"},
                json={"message": {"contextId": "ctx-1", "content": [{"text": "Hi"}]}},
            )
            assert resp.status_code == 200
            assert "text/event-stream" in resp.headers["content-type"]
            assert "gemini_in_looker" in resp.text
            assert "chat_with_agent" in resp.text
            assert "TASK_STATE_COMPLETED" in resp.text
    finally:
        app.dependency_overrides.pop(get_looker_service, None)


def test_a2a_stream_propagates_401_for_token_refresh():
    mock_svc = MagicMock()
    mock_transport = httpx.MockTransport(
        lambda req: httpx.Response(401, json={"message": "Requires authentication"})
    )
    orig_client = httpx.AsyncClient

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        with patch(
            "app.api.endpoints.ge.httpx.AsyncClient",
            side_effect=lambda **kw: orig_client(transport=mock_transport, **kw),
        ):
            client = TestClient(app)
            resp = client.post(
                "/api/ge/a2a/agents/agent123/chat/v1/message:stream",
                headers={"Authorization": "Bearer expired_token"},
                json={"message": {"content": [{"text": "Hi"}]}},
            )
            assert resp.status_code == 401
    finally:
        app.dependency_overrides.pop(get_looker_service, None)


def test_install_script_syntax_and_agent_info():
    _agent_info_cache.clear()
    mock_svc = MagicMock()
    mock_svc.get_agent_metadata.return_value = {
        "id": "ea126",
        "name": "Ecomm Data Agent",
        "description": 'Analytics for "Levi\'s" & $brands',
        "golden_queries": [
            {
                "is_active": True,
                "questions": ["Which brand am I currently viewing?"],
                "fields": ["products.brand", "order_items.total_sale_price"],
            }
        ],
    }

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        client = TestClient(app)
        info_resp = client.get("/api/ge/agent-info")
        assert info_resp.status_code == 200
        info = info_resp.json()
        assert info["golden_queries"][0]["badge"] == "Live Brand RLS"

        sh_resp = client.get(
            "/api/ge/install.sh",
            params={
                "project": "974752897662",
                "location": "global",
                "engine": "my-ge-engine_123",
            },
        )
        assert sh_resp.status_code == 200
        assert "a2ui.org/a2a-extension/a2ui/v0.8" in sh_resp.text
        # Validate generated shell script with `bash -n`
        syntax = subprocess.run(
            ["bash", "-n"],
            input=sh_resp.text,
            text=True,
            capture_output=True,
            check=False,
        )
        assert syntax.returncode == 0, syntax.stderr
    finally:
        app.dependency_overrides.pop(get_looker_service, None)
        _agent_info_cache.clear()
