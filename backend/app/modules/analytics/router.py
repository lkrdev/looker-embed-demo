import json
import logging
from typing import Any, Dict
import httpx
from fastapi import APIRouter, Depends
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
    event_record = {
        "source": "looker_embed_sdk",
        "event": f"looker.{body.event}",
        "distinct_id": user_id,
        "properties": body.properties,
    }

    if settings.POSTHOG_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(
                    f"{settings.POSTHOG_HOST.rstrip('/')}/capture/",
                    json={"api_key": settings.POSTHOG_API_KEY, **event_record},
                )
                resp.raise_for_status()
        except Exception as e:
            logger.error("Failed to forward event to PostHog: %s", e, exc_info=True)
            return {
                "status": "failed_to_forward",
                "provider": "posthog_server",
                "event": body.event,
                "distinct_id": user_id,
            }
        return {
            "status": "forwarded",
            "provider": "posthog_server",
            "event": body.event,
            "distinct_id": user_id,
        }

    # Emit structured JSON payload directly to stdout for log collection
    print(json.dumps(event_record), flush=True)
    return {
        "status": "logged",
        "provider": "log",
        "event": body.event,
        "distinct_id": user_id,
    }
