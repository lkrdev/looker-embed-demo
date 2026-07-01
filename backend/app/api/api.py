from fastapi import APIRouter
from app.api.endpoints import auth, system
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/looker", tags=["looker-auth"])
api_router.include_router(system.router, tags=["system"])

# Dynamic Optional Module Registration
if settings.ENABLE_MODULE_ADK_AGENT:
    try:
        from app.modules.adk_agent.router import router as adk_agent_router

        api_router.include_router(
            adk_agent_router, prefix="/modules/adk-agent", tags=["adk-agent"]
        )
        logger.info("Optional module 'adk_agent' enabled and mounted successfully.")
    except Exception as e:
        logger.error(f"Failed to mount optional module 'adk_agent': {e}", exc_info=True)

