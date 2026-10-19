import logging
from typing import Any, Dict
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.deps import get_current_looker_user_id
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyticsEventRequest(BaseModel):
    event: str
    properties: Dict[str, Any] = Field(default_factory=dict)


@router.post("/events")
async def ingest_analytics_event(
    body: AnalyticsEventRequest,
    user_id: str = Depends(get_current_looker_user_id),
) -> Dict[str, Any]:
    logger.info("Looker JS Event [%s] from '%s': %s", body.event, user_id, body.properties)

    if settings.POSTHOG_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{settings.POSTHOG_HOST.rstrip('/')}/capture/",
                    json={
                        "api_key": settings.POSTHOG_API_KEY,
                        "event": f"looker.{body.event}",
                        "distinct_id": user_id,
                        "properties": {"source": "looker_embed_sdk", **body.properties},
                    },
                )
                resp.raise_for_status()
        except Exception as e:
            logger.error("Failed to forward event to PostHog: %s", e, exc_info=True)
            raise HTTPException(status_code=502, detail="Failed to forward analytics event to PostHog.")

    return {
        "status": "forwarded" if settings.POSTHOG_API_KEY else "logged",
        "provider": "posthog_server",
        "event": body.event,
        "distinct_id": user_id,
    }
