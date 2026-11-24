import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.api.deps import get_looker_service
from app.core.config import settings
from app.core.cookies import COOKIE_ACCESS_TOKEN
from app.services.looker import LookerService

logger = logging.getLogger(__name__)
router = APIRouter()


class SeedConversationRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    agent_id: str | None = Field(default=None)
    language: str | None = Field(default=None)


def is_verbose_schema_message(msg: Dict[str, Any]) -> bool:
    """
    Checks if an incoming message block is a verbose schema/metadata intermediate dump
    (e.g., containing explore schema, tool descriptions, or giant exploreUrl dumps).
    """
    if not isinstance(msg, dict):
        return False

    # Check for explore schema metadata in system/thought messages
    sys_msg = msg.get("system_message") or msg.get("systemMessage") or {}
    data = sys_msg.get("data") if isinstance(sys_msg, dict) else {}
    if isinstance(data, dict):
        if "exploreUrl" in data or "fields" in data or "dimensions" in data:
            return True
        query = data.get("query")
        if isinstance(query, dict) and "looker" in query:
            if "exploreUrl" in query["looker"]:
                return True

    # Check large raw schema/tool definition string dumps inside THOUGHT parts
    text_obj = sys_msg.get("text") if isinstance(sys_msg, dict) else {}
    if isinstance(text_obj, dict):
        parts = text_obj.get("parts", [])
        if isinstance(parts, list):
            for part in parts:
                if isinstance(part, str) and len(part) > 1200 and ("exploreUrl" in part or "dimensions" in part or "measures" in part):
                    return True

    return False


def create_schema_progress_substitute(orig_msg: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a clean, user-friendly descriptive progress message substituting
    a large raw schema/metadata dump.
    """
    return {
        "id": orig_msg.get("id", "schema_progress"),
        "type": orig_msg.get("type", "system"),
        "systemMessage": {
            "text": {
                "parts": ["Analyzing Explore schema and relevant LookML fields..."],
                "textType": "THOUGHT",
            }
        },
    }


def extract_json_objects_from_buffer(buffer: str) -> tuple[list[Dict[str, Any]], str]:
    """
    Safely extracts all complete top-level JSON objects (`{ ... }`) from a text buffer.
    """
    blocks = []
    remaining = buffer

    while True:
        start_idx = remaining.find("{")
        if start_idx == -1:
            break

        depth = 0
        in_string = False
        escaped = False
        found_end = -1

        for i in range(start_idx, len(remaining)):
            char = remaining[i]
            if escaped:
                escaped = False
                continue
            if char == "\\" and in_string:
                escaped = True
                continue
            if char == '"':
                in_string = not in_string
                continue
            if not in_string:
                if char == "{":
                    depth += 1
                elif char == "}":
                    depth -= 1
                    if depth == 0:
                        found_end = i
                        break

        if found_end != -1:
            candidate = remaining[start_idx : found_end + 1]
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    blocks.append(parsed)
                remaining = remaining[found_end + 1 :]
            except Exception:
                remaining = remaining[start_idx + 1 :]
        else:
            remaining = remaining[start_idx:]
            break

    return blocks, remaining


async def stream_looker_chat_proxy(
    url: str,
    headers: Dict[str, str],
    body: Dict[str, Any],
) -> AsyncGenerator[str, None]:
    """
    Async generator that proxies POST requests to Looker 4.0 conversational analytics,
    disables intermediate gzip buffering (`Accept-Encoding: identity`), extracts JSON
    chunks in real time, substitutes verbose schema messages, and yields SSE frames.
    """
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            async with client.stream("POST", url, headers=headers, json=body) as response:
                if response.status_code >= 400:
                    error_text = await response.aread()
                    err_msg = {
                        "error": {
                            "code": response.status_code,
                            "message": error_text.decode("utf-8", errors="ignore"),
                        }
                    }
                    yield f"data: {json.dumps(err_msg)}\n\n"
                    return

                def _fmt(b: Dict[str, Any]) -> Dict[str, Any]:
                    return create_schema_progress_substitute(b) if is_verbose_schema_message(b) else b

                buffer = ""
                async for text_chunk in response.aiter_text():
                    buffer += text_chunk
                    blocks, buffer = extract_json_objects_from_buffer(buffer)
                    for block in blocks:
                        yield f"data: {json.dumps(_fmt(block))}\n\n"

                trimmed = buffer.strip()
                if trimmed.startswith("{") and trimmed.endswith("}"):
                    try:
                        parsed = json.loads(trimmed)
                        if isinstance(parsed, dict):
                            yield f"data: {json.dumps(_fmt(parsed))}\n\n"
                    except Exception:
                        pass
        except Exception as e:
            logger.error(f"Error proxying Looker chat stream: {e}", exc_info=True)
            err_msg = {"error": {"code": 500, "message": f"Proxy streaming error: {str(e)}"}}
            yield f"data: {json.dumps(err_msg)}\n\n"


@router.post("/chat")
async def proxy_agents_chat(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_looker_access_token: Optional[str] = Header(None, alias="X-Looker-Access-Token"),
):
    """
    POST /api/agents/chat
    Proxies streaming Conversational Analytics chat requests to Looker 4.0 API
    using the embed user's access token, applying schema substitution and SSE streaming.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    elif authorization and authorization.startswith("token "):
        token = authorization.split("token ")[1].strip()
    elif x_looker_access_token:
        token = x_looker_access_token.strip()

    if not token:
        raise HTTPException(status_code=401, detail="Looker embed access token is required")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON request body")

    base_url = (settings.LOOKERSDK_BASE_URL or "").rstrip("/")
    looker_url = f"{base_url}/api/4.0/conversational_analytics/chat"

    upstream_headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/json",
        "Accept": "application/x-ndjson, text/event-stream, application/jsonlines, application/json, */*",
        "Accept-Encoding": "identity",  # Ensure intermediate proxies do not gzip buffer
    }

    return StreamingResponse(
        stream_looker_chat_proxy(looker_url, upstream_headers, body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _resolve_visitor_looker_token(
    request: Request, looker_svc: LookerService
) -> str:
    cached_cookie = request.cookies.get(COOKIE_ACCESS_TOKEN)
    if cached_cookie:
        try:
            token_data = json.loads(cached_cookie)
            if (
                token_data.get("expires_on", 0) > int(time.time()) + 10
                and token_data.get("access_token")
            ):
                return str(token_data["access_token"])
        except Exception:
            pass

    looker_user_id = getattr(request.state, "looker_user_id", None)
    if not looker_user_id:
        ext_id = getattr(request.state, "external_user_id", None)
        if ext_id:
            looker_user_id = await run_in_threadpool(
                looker_svc.get_looker_user_id_by_external_id, ext_id
            )
    if not looker_user_id:
        raise HTTPException(status_code=401, detail="Looker embed session not initialized.")

    token_obj = await run_in_threadpool(looker_svc.login_user, looker_user_id)
    tok = getattr(token_obj, "access_token", "")
    if not tok:
        raise HTTPException(status_code=500, detail="Failed to acquire Looker token.")
    return str(tok)


@router.post("/seed")
async def seed_looker_conversation(
    body: SeedConversationRequest,
    request: Request,
    looker_svc: LookerService = Depends(get_looker_service),
):
    """Creates a Looker conversation, runs the initial CA turn, and persists raw messages."""
    token = await _resolve_visitor_looker_token(request, looker_svc)
    question = body.question.strip()
    agent_id = (body.agent_id or "").strip() or settings.CHAT_AGENT_ID
    effective_text = (
        f"{question}\n\n[Instruction: Please respond in {body.language}.]"
        if body.language and body.language != "English"
        else question
    )
    base_url = (settings.LOOKERSDK_BASE_URL or "").rstrip("/")
    headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/json",
        "Accept-Encoding": "identity",
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        conv_resp = await client.post(
            f"{base_url}/api/4.0/conversations",
            headers=headers,
            json={
                "agent_id": agent_id,
                "category": "conversation",
                "name": question[:80],
            },
        )
        if conv_resp.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail="Could not create Looker conversation. Ensure your profile has Gemini permissions.",
            )
        conv_id = str(conv_resp.json().get("id") or "")
        if not conv_id:
            raise HTTPException(status_code=502, detail="Empty Looker conversation ID.")

        chat_resp = await client.post(
            f"{base_url}/api/4.0/conversational_analytics/chat",
            headers=headers,
            json={"conversation_id": conv_id, "user_message": effective_text},
        )
        if chat_resp.status_code >= 400:
            raise HTTPException(
                status_code=502, detail="Looker Conversational Analytics chat failed."
            )

        blocks, _ = extract_json_objects_from_buffer(chat_resp.text)
        messages_to_persist = [
            {
                "type": "user",
                "message": {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "userMessage": {"text": question},
                },
            },
            *[
                {
                    "type": b.get("type") or ("user" if b.get("userMessage") else "system"),
                    "message": b.get("message") or b,
                }
                for b in blocks
            ],
        ]

        persist_resp = await client.post(
            f"{base_url}/api/4.0/conversations/{conv_id}/messages",
            headers=headers,
            json={"messages": messages_to_persist},
        )
        if persist_resp.status_code >= 400:
            raise HTTPException(
                status_code=502, detail="Failed to persist seeded Looker messages."
            )

    return {"conversation_id": conv_id}
