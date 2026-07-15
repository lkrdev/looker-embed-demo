import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

try:
    import google.auth  # type: ignore[import-not-found,import-untyped]  # ty:ignore[unresolved-import]
    import google.auth.transport.requests  # type: ignore[import-not-found,import-untyped]  # ty:ignore[unresolved-import]
    import httpx
except ImportError as e:
    logger.warning(
        f"Optional module dependencies missing ({e}). "
        "Please install them via `uv sync --extra adk_agent` or pip install google-auth httpx."
    )
    google: Any = None
    httpx: Any = None



def get_gcp_bearer_token() -> str:
    """Retrieves an Application Default Credentials (ADC) Bearer token."""
    if google is None:
        raise RuntimeError("google-auth is not installed. Run `uv sync --extra adk_agent`.")
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token


async def run_adk_agent_query(
    agent_id: str,
    project_id: str,
    region: str,
    user_payload: Dict[str, Any],
    looker_access_token: str,
) -> Dict[str, Any]:
    """
    Executes a query against the remote Vertex Reasoning Engine / ADK Agent.
    Passes GCP ADC token for Cloud Run/Vertex auth, and forwards Looker Access Token header.
    """
    if httpx is None:
        raise RuntimeError("httpx is not installed. Run `uv sync --extra adk_agent`.")

    gcp_token = get_gcp_bearer_token()
    headers = {
        "Authorization": f"Bearer {gcp_token}",
        "X-Looker-Access-Token": looker_access_token,
        "Content-Type": "application/json",
        "X-Goog-User-Project": project_id,
    }

    # Target Vertex Reasoning Engine query endpoint
    endpoint_url = f"https://{region}-aiplatform.googleapis.com/v1/{agent_id}:query"

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(endpoint_url, headers=headers, json=user_payload)
        resp.raise_for_status()
        return resp.json()
