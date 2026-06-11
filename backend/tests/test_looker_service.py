from unittest.mock import MagicMock
from app.services.looker import LookerService


def test_get_looker_user_id_fallback():
    looker_svc = LookerService()
    mock_sdk = MagicMock()
    looker_svc._sdk = mock_sdk

    # Setup mock to raise an exception on first call (user not found), then return a valid user on second call
    mock_user = MagicMock()
    mock_user.id = 999

    mock_sdk.user_for_credential.side_effect = [Exception("Not found"), mock_user]

    user_id = looker_svc.get_looker_user_id_by_external_id("ext123")
    
    # Before our fix, user_id will be None because it doesn't fall back to provisioning
    assert user_id == "999"
    assert mock_sdk.acquire_embed_cookieless_session.called
