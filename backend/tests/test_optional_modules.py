from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.config import Settings

from app.modules.adk_agent.router import router as adk_agent_router
from app.modules.analytics.router import router as analytics_router



def test_optional_module_settings_parsing(monkeypatch):
    monkeypatch.setenv("ENABLE_MODULE_ADK_AGENT", "true")
    monkeypatch.setenv("ADK_CA_AGENT_ID", "ca-test-123")
    monkeypatch.setenv("ADK_MCP_AGENT_ID", "mcp-test-456")
    monkeypatch.setenv("ADK_ADVANCED_AGENT_ID", "adv-test-789")
    monkeypatch.setenv("GCP_PROJECT_ID", "test-gcp-project")

    settings = Settings()
    assert settings.ENABLE_MODULE_ADK_AGENT is True
    assert settings.ADK_CA_AGENT_ID == "ca-test-123"
    assert settings.ADK_MCP_AGENT_ID == "mcp-test-456"
    assert settings.ADK_ADVANCED_AGENT_ID == "adv-test-789"
    assert settings.GCP_PROJECT_ID == "test-gcp-project"


def test_adk_agent_endpoint_routing(monkeypatch):
    monkeypatch.setenv("ADK_CA_AGENT_ID", "ca-test-123")
    monkeypatch.setenv("GCP_PROJECT_ID", "test-gcp-project")

    app = FastAPI()
    app.include_router(adk_agent_router, prefix="/modules/adk-agent")
    client = TestClient(app)

    # Calling without authentication should fail on user_id dependency
    resp = client.post("/modules/adk-agent/run/ca", json={"prompt": "hello"})
    assert resp.status_code == 404
    assert "Looker user ID not found" in resp.json()["detail"]


@patch("app.modules.adk_agent.router.run_adk_agent_query", new_callable=AsyncMock)
def test_adk_agent_execution_mocked(mock_query, monkeypatch):
    from app.api.deps import get_current_looker_user_id, get_looker_service
    from app.modules.adk_agent import router as router_mod

    monkeypatch.setattr(router_mod.settings, "ADK_CA_AGENT_ID", "ca-test-123")
    monkeypatch.setattr(router_mod.settings, "GCP_PROJECT_ID", "test-gcp")
    monkeypatch.setattr(router_mod.settings, "GCP_REGION", "us-central1")

    app = FastAPI()
    app.include_router(adk_agent_router, prefix="/modules/adk-agent")

    # Override authentication and looker service dependencies
    app.dependency_overrides[get_current_looker_user_id] = lambda: "test_user_id"

    class DummyToken:
        access_token = "dummy_looker_token"

    class DummyService:
        def login_user(self, user_id):
            return DummyToken()

    app.dependency_overrides[get_looker_service] = lambda: DummyService()

    mock_query.return_value = {"answer": "Hello from Looker CA agent!"}

    client = TestClient(app)
    resp = client.post("/modules/adk-agent/run/ca", json={"message": "hi"})

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "success",
        "agent_type": "ca",
        "data": {"answer": "Hello from Looker CA agent!"},
    }
    mock_query.assert_called_once_with(
        agent_id="ca-test-123",
        project_id="test-gcp",
        region="us-central1",
        user_payload={"message": "hi"},
        looker_access_token="dummy_looker_token",
    )


def test_analytics_module_settings_parsing(monkeypatch):
    monkeypatch.setenv("ENABLE_MODULE_ANALYTICS", "true")
    monkeypatch.setenv("POSTHOG_API_KEY", "phc_test_key")
    monkeypatch.setenv("POSTHOG_HOST", "https://eu.i.posthog.com")

    settings = Settings()
    assert settings.ENABLE_MODULE_ANALYTICS is True
    assert settings.POSTHOG_API_KEY == "phc_test_key"
    assert settings.POSTHOG_HOST == "https://eu.i.posthog.com"


@patch("app.modules.analytics.router.http_client.post", new_callable=AsyncMock)
def test_analytics_posthog_server_endpoint(mock_post, monkeypatch):
    from app.api.deps import get_current_looker_user_id
    from app.modules.analytics import router as analytics_mod

    monkeypatch.setattr(analytics_mod.settings, "POSTHOG_API_KEY", "phc_test_123")
    monkeypatch.setattr(analytics_mod.settings, "POSTHOG_HOST", "https://us.i.posthog.com")
    mock_post.return_value.raise_for_status = lambda: None

    app = FastAPI()
    app.include_router(analytics_router, prefix="/modules/analytics")
    app.dependency_overrides[get_current_looker_user_id] = lambda: "embed_user_viewer"

    client = TestClient(app)
    resp = client.post(
        "/modules/analytics/events",
        json={"event": "dashboard:run:complete", "properties": {"status": "complete"}},
    )

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "forwarded",
        "provider": "posthog_server",
        "event": "dashboard:run:complete",
        "distinct_id": "embed_user_viewer",
    }
    mock_post.assert_called_once_with(
        "https://us.i.posthog.com/capture/",
        json={
            "api_key": "phc_test_123",
            "source": "looker_embed_sdk",
            "event": "looker.dashboard:run:complete",
            "distinct_id": "embed_user_viewer",
            "properties": {"status": "complete"},
        },
    )


def test_analytics_log_stdout_endpoint(monkeypatch, capsys):
    import json
    from app.api.deps import get_current_looker_user_id
    from app.modules.analytics import router as analytics_mod

    monkeypatch.setattr(analytics_mod.settings, "POSTHOG_API_KEY", None)

    app = FastAPI()
    app.include_router(analytics_router, prefix="/modules/analytics")
    app.dependency_overrides[get_current_looker_user_id] = lambda: "embed_user_viewer"

    client = TestClient(app)
    resp = client.post(
        "/modules/analytics/events",
        json={"event": "dashboard:filters:changed", "properties": {"Brand": "Levi's"}},
    )

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "logged",
        "provider": "log",
        "event": "dashboard:filters:changed",
        "distinct_id": "embed_user_viewer",
    }
    captured = json.loads(capsys.readouterr().out.strip())
    assert captured == {
        "source": "looker_embed_sdk",
        "event": "looker.dashboard:filters:changed",
        "distinct_id": "embed_user_viewer",
        "properties": {"Brand": "Levi's"},
    }

