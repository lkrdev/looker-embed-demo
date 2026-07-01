import json
import logging
from typing import Any, Dict, Literal
from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_looker_user_id, get_looker_service
from app.core.config import settings
from app.core.cookies import COOKIE_ACCESS_TOKEN
from app.modules.adk_agent.service import run_adk_agent_query
from app.services.looker import LookerService

logger = logging.getLogger(__name__)
router = APIRouter()


def get_active_looker_token(
    request: Request, user_id: str, looker_svc: LookerService
) -> str:
    """Retrieves the active Looker Access Token from cookie or generates a fresh one."""
    cached_cookie = request.cookies.get(COOKIE_ACCESS_TOKEN)
    if cached_cookie:
        try:
            data = json.loads(cached_cookie)
            if data.get("access_token"):
                return str(data["access_token"])
        except Exception:
            pass
    # Fallback: login to obtain token
    token_obj = looker_svc.login_user(user_id)
    return getattr(token_obj, "access_token", "")


@router.post("/run/{agent_type}")
async def execute_agent(
    agent_type: Literal["ca", "mcp", "advanced"],
    request: Request,
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_looker_user_id),
    looker_svc: LookerService = Depends(get_looker_service),
) -> Dict[str, Any]:
    """
    Optional backend runner endpoint for Looker CA, MCP, or Advanced ADK agents.
    Uses GCP Application Default Credentials (ADC) for Vertex auth,
    and forwards the active user's Looker Access Token as an HTTP header.
    """
    agent_id_map = {
        "ca": settings.ADK_CA_AGENT_ID,
        "mcp": settings.ADK_MCP_AGENT_ID,
        "advanced": settings.ADK_ADVANCED_AGENT_ID,
    }
    agent_id = agent_id_map.get(agent_type)
    if not agent_id:
        raise HTTPException(
            status_code=404,
            detail=f"ADK {agent_type.upper()} Agent ID is not configured.",
        )

    if not settings.GCP_PROJECT_ID:
        raise HTTPException(
            status_code=500,
            detail="GCP_PROJECT_ID environment variable is not configured.",
        )

    looker_access_token = get_active_looker_token(request, user_id, looker_svc)
    if not looker_access_token:
        raise HTTPException(
            status_code=401,
            detail="Unable to resolve Looker Access Token for agent execution.",
        )

    try:
        response_data = await run_adk_agent_query(
            agent_id=agent_id,
            project_id=settings.GCP_PROJECT_ID,
            region=settings.GCP_REGION,
            user_payload=payload,
            looker_access_token=looker_access_token,
        )
        return {"status": "success", "agent_type": agent_type, "data": response_data}
    except Exception as e:
        logger.error(
            f"Error executing ADK {agent_type.upper()} agent: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with remote ADK {agent_type.upper()} agent.",
        )
