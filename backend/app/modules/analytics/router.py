import json
import logging
import sys
from typing import Any, Dict
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.deps import get_current_looker_user_id
from app.core.config import settings


class _StdoutJsonHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        sys.stdout.write(record.getMessage() + "\n")
        sys.stdout.flush()


logger = logging.getLogger(__name__)
if not logger.handlers:
    logger.addHandler(_StdoutJsonHandler())
    logger.setLevel(logging.INFO)
    logger.propagate = False

router = APIRouter()
http_client = httpx.AsyncClient(timeout=3.0)


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
            resp = await http_client.post(
                f"{settings.POSTHOG_HOST.rstrip('/')}/capture/",
                json={"api_key": settings.POSTHOG_API_KEY, **event_record},
            )
            resp.raise_for_status()
        except Exception as e:
            logger.error("Failed to forward event to PostHog: %s", e, exc_info=True)
            raise HTTPException(
                status_code=502,
                detail="Failed to forward event to PostHog",
            )
        return {
            "status": "forwarded",
            "provider": "posthog_server",
            "event": body.event,
            "distinct_id": user_id,
        }

    # Emit structured JSON payload directly to stdout for log collection
    logger.info(json.dumps(event_record))
    return {
        "status": "logged",
        "provider": "log",
        "event": body.event,
        "distinct_id": user_id,
    }
