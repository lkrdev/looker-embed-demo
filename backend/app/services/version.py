import os

def get_version() -> str:
    """Retrieves the active application version from the environment."""
    return os.getenv("VERSION", "local")
