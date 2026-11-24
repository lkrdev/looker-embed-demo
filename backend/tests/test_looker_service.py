import pytest
from unittest.mock import MagicMock, patch
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


def test_global_sdk_reuse():
    # Ensure global SDK is clean before test
    if hasattr(LookerService, "reset_global_sdk"):
        LookerService.reset_global_sdk()

    with patch("app.services.looker.looker_sdk.init40") as mock_init:
        mock_init.return_value = MagicMock()

        svc1 = LookerService()
        sdk1 = svc1.sdk

        svc2 = LookerService()
        sdk2 = svc2.sdk

        # Both instances should share the exact same SDK instance
        assert sdk1 is sdk2
        # init40 should have been called only once
        mock_init.assert_called_once()

    # Clean up after test
    if hasattr(LookerService, "reset_global_sdk"):
        LookerService.reset_global_sdk()


def test_fetch_inline_extension_bundle_validates_id_and_uses_bearer():
    svc = LookerService()
    with pytest.raises(ValueError, match="Invalid inline extension ID"):
        svc.fetch_inline_extension_bundle("../etc/passwd", "tok123")

    fake_resp = MagicMock()
    fake_resp.__enter__.return_value = fake_resp
    fake_resp.read.return_value = b"export default 42;"

    with (
        patch("app.services.looker.settings.LOOKERSDK_BASE_URL", "https://example.looker.com/"),
        patch("app.services.looker.urllib.request.urlopen", return_value=fake_resp) as mock_open,
    ):
        code = svc.fetch_inline_extension_bundle("aceabbc7-e7f8-408a", "tok123")
        assert code == "export default 42;"
        req = mock_open.call_args[0][0]
        assert req.full_url == "https://example.looker.com/api/4.0/inline_extension/aceabbc7-e7f8-408a/bundle.js"
        assert req.get_header("Authorization") == "Bearer tok123"
