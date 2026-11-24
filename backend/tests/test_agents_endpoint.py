from app.api.endpoints.agents import (
    create_schema_progress_substitute,
    extract_json_objects_from_buffer,
    is_verbose_schema_message,
)


def test_is_verbose_schema_message():
    # Regular thought or final response should return False
    normal_msg = {
        "id": "1",
        "type": "system",
        "system_message": {
            "text": {"parts": ["Hello world"], "textType": "FINAL_RESPONSE"}
        },
    }
    assert is_verbose_schema_message(normal_msg) is False

    # Message containing exploreUrl / fields schema dump should return True
    schema_msg = {
        "id": "2",
        "type": "system",
        "system_message": {
            "data": {
                "exploreUrl": "https://example.com/explore/123",
                "fields": ["order_items.id", "order_items.sale_price"],
            }
        },
    }
    assert is_verbose_schema_message(schema_msg) is True


def test_create_schema_progress_substitute():
    schema_msg = {"id": "msg_schema_1", "type": "system"}
    substitute = create_schema_progress_substitute(schema_msg)

    assert substitute["id"] == "msg_schema_1"
    assert substitute["type"] == "system"
    assert "Analyzing Explore schema" in substitute["systemMessage"]["text"]["parts"][0]


def test_extract_json_objects_from_buffer():
    raw_buffer = 'data: {"id": 1}\n\n{"id": 2, "nested": {"foo": "bar"}}\n{"incomplete":'
    blocks, remaining = extract_json_objects_from_buffer(raw_buffer)

    assert len(blocks) == 2
    assert blocks[0] == {"id": 1}
    assert blocks[1] == {"id": 2, "nested": {"foo": "bar"}}
    assert remaining == '{"incomplete":'


def test_seed_looker_conversation_creates_streams_and_persists():
    from unittest.mock import MagicMock, patch
    import httpx
    from fastapi.testclient import TestClient
    from app.api.deps import get_looker_service
    from app.core.cookies import COOKIE_EXTERNAL_USER_ID
    from main import app

    mock_svc = MagicMock()
    mock_svc.get_looker_user_id_by_external_id.return_value = "42"
    tok = MagicMock()
    tok.access_token = "looker_tok_seed"
    mock_svc.login_user.return_value = tok

    persisted_payload: dict = {}

    def fake_handler(req: httpx.Request) -> httpx.Response:
        path = req.url.path
        if path.endswith("/api/4.0/conversations"):
            return httpx.Response(200, json={"id": "conv_999"})
        if path.endswith("/api/4.0/conversational_analytics/chat"):
            return httpx.Response(
                200,
                text='{"systemMessage":{"text":{"parts":["Revenue by channel"]}}}',
            )
        if path.endswith("/api/4.0/conversations/conv_999/messages"):
            import json as _json
            persisted_payload.update(_json.loads(req.content.decode()))
            return httpx.Response(200, json=[{"id": "m1"}, {"id": "m2"}])
        return httpx.Response(500, text=path)

    mock_transport = httpx.MockTransport(fake_handler)
    orig_client = httpx.AsyncClient
    app.dependency_overrides[get_looker_service] = lambda: mock_svc
    try:
        with patch(
            "app.api.endpoints.agents.httpx.AsyncClient",
            side_effect=lambda **kw: orig_client(transport=mock_transport, **kw),
        ):
            client = TestClient(app)
            client.cookies.set(COOKIE_EXTERNAL_USER_ID, "visitor_seed")
            res = client.post(
                "/api/agents/seed",
                json={
                    "question": "Show share of revenue by channel.",
                    "agent_id": "ea126",
                    "language": "Spanish",
                },
            )
            assert res.status_code == 200, res.text
            assert res.json() == {"conversation_id": "conv_999"}
            assert len(persisted_payload["messages"]) == 2
            assert persisted_payload["messages"][0]["type"] == "user"
    finally:
        app.dependency_overrides.pop(get_looker_service, None)
