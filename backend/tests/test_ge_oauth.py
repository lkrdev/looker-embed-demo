import base64
import hashlib
import os
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_looker_service
from app.api.endpoints.ge import (
    _agent_info_cache,
    _derive_ge_client_secret,
    format_ge_install_error,
)
from app.core.config import settings
from app.core.cookies import COOKIE_EXTERNAL_USER_ID
from app.core.security import seal_token, unseal_token
from main import app


def _pkce_pair(
    verifier: str = "super-secret-pkce-verifier-value-1234567890",
) -> tuple[str, str]:
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
    assert "Looker Embed Portal" in ok.text
    assert "Executive eCommerce Suite" in ok.text
    assert "Connect to Gemini Enterprise" in ok.text
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
        assert mock_svc.acquire_cookieless_session.called

        loc = urlparse(auth_resp.headers["location"])
        assert loc.netloc == "vertexaisearch.cloud.google.com"
        qs = parse_qs(loc.query)
        assert qs["state"] == ["state_999"]
        code = qs["code"][0]

        client_secret = _derive_ge_client_secret()

        no_secret = client.post(
            "/api/ge/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": verifier,
            },
        )
        assert no_secret.status_code == 401

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
    mock_svc.get_user_permissions.return_value = {
        "access_data",
        "see_lookml_dashboards",
    }

    def fake_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/api/4.0/user"):
            return httpx.Response(200, json={"id": 42})
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


def test_agent_info_discovers_bq_graph_agent_and_cloud_run_sa():
    _agent_info_cache.clear()
    mock_svc = MagicMock()
    mock_svc.get_agent_metadata.return_value = {
        "id": "ea126",
        "name": "Ecomm Data Agent",
        "description": "Ecomm Business Analytics Agent",
        "golden_queries": [
            {
                "is_active": True,
                "questions": ["Which brand am I currently viewing?"],
                "fields": ["products.brand", "order_items.total_sale_price"],
            }
        ],
    }
    mock_svc.search_agents.return_value = [
        {
            "id": "02a7899f3d8c45dc955b69e3156c1a3e",
            "name": "BigQuery Graph Analytics",
            "description": "BQ Graph Analytics Agent",
            "sources": [{"model": "embed_demo", "explore": "product_jaccard_affinity"}],
            "golden_queries": [],
        }
    ]

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        client = TestClient(app)
        info_resp = client.get("/api/ge/agent-info")
        assert info_resp.status_code == 200
        info = info_resp.json()
        assert "@" in info["installer_service_account"]
        assert len(info["agents"]) == 2
        assert info["agents"][1]["name"] == "BigQuery Graph Analytics"
        assert len(info["agents"][1]["prompts"]) == 4
    finally:
        app.dependency_overrides.pop(get_looker_service, None)
        _agent_info_cache.clear()


def test_install_points_oauth_to_public_base_url_and_formats_errors():
    _agent_info_cache.clear()
    mock_svc = MagicMock()
    mock_svc.get_agent_metadata.return_value = {
        "id": "ea126",
        "name": "Ecomm Data Agent",
        "description": "Ecomm Business Analytics Agent",
        "golden_queries": [],
    }
    mock_svc.search_agents.return_value = []
    captured: list[httpx.Request] = []

    def fake_de_handler(req: httpx.Request) -> httpx.Response:
        captured.append(req)
        url = str(req.url)
        if url.endswith("/computeMetadata/v1/instance/service-accounts/default/token"):
            return httpx.Response(200, json={"access_token": "sa_token_xyz"})
        if url.endswith("/computeMetadata/v1/instance/service-accounts/default/email"):
            return httpx.Response(200, text="test-installer@example-project.iam.gserviceaccount.com")
        if "/authorizations/" in url and req.method == "GET":
            return httpx.Response(404, json={"error": "not found"})
        if "authorizationId=" in url:
            return httpx.Response(
                200,
                json={"name": "projects/123456/locations/global/authorizations/looker-demo-auth"},
            )
        if url.endswith("/assistants/default_assistant/agents"):
            return httpx.Response(200, json={"name": "projects/123456/agents/ag1"})
        return httpx.Response(500, text=url)

    mock_transport = httpx.MockTransport(fake_de_handler)
    orig_client = httpx.AsyncClient

    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        with (
            patch.dict(
                os.environ,
                {
                    "K_SERVICE": "appembeddemo",
                    "PUBLIC_BASE_URL": "https://portal.example.com",
                },
            ),
            patch(
                "app.api.endpoints.ge.httpx.AsyncClient",
                side_effect=lambda **kw: orig_client(transport=mock_transport, **kw),
            ),
        ):
            client = TestClient(app)
            ok_res = client.post(
                "/api/ge/install",
                json={
                    "project": "my-gcp-project",
                    "location": "global",
                    "engine_id": "eng1",
                },
            )
            assert ok_res.status_code == 200, ok_res.text
            assert ok_res.json()["public_origin"] == "https://portal.example.com"

            auth_post = [r for r in captured if "authorizationId=" in str(r.url)][0]
            assert "https://portal.example.com/api/ge/oauth/authorize" in auth_post.content.decode()
            assert "googledemo2.cloud.looker.com/auth" not in auth_post.content.decode()

        raw_rpc_err = (
            'Discovery Engine Authorization failed: { "error": { "code": 401, '
            '"status": "UNAUTHENTICATED", "details": [ { "reason": "ACCESS_TOKEN_TYPE_UNSUPPORTED" }, '
            '{ "detail": "https://accounts.google.com/info/servicerestricted" } ] } }'
        )
        code, msg = format_ge_install_error(
            raw_rpc_err,
            "test-installer@example-project.iam.gserviceaccount.com",
            "my-gcp-project",
            "eng1",
            "global",
        )
        assert code == 401
        assert "Google Workspace domain policy" in msg
        assert "{" not in msg
    finally:
        app.dependency_overrides.pop(get_looker_service, None)
        _agent_info_cache.clear()
