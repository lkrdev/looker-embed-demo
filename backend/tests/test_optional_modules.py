from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.config import Settings

from app.modules.adk_agent.router import router as adk_agent_router



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
