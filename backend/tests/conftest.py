import os
import pathlib

os.environ["LOOKERSDK_BASE_URL"] = "https://looker.example.com:19999"
os.environ["LOOKERSDK_CLIENT_ID"] = "test_client_id"
os.environ["LOOKERSDK_CLIENT_SECRET"] = "test_client_secret"
os.environ["ENCRYPTION_KEY"] = "dummy_encryption_key_for_testing_only_123"

project_root = pathlib.Path(__file__).resolve().parent.parent.parent
os.environ["DIST_DIR"] = str(project_root / "frontend" / "dist")
