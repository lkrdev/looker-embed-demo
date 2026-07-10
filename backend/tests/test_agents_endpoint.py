import pytest
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
