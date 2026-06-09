import os

# Looker instance URL and Embed domain from environment variables
LOOKER_INSTANCE_URL = os.getenv("LOOKER_INSTANCE_URL", "https://looker.lukapuka.co")
LOOKER_EMBED_DOMAIN = os.getenv("LOOKER_EMBED_DOMAIN", "http://localhost:3000")

# The static target path for embedding Looker conversational analytics
EMBED_PATH = "/embed/conversations?ds.agent=43d365a4dc6647b29d0eb1b07868470f&theme=Light_Mode"

# Constructed target URL
TARGET_URL = f"{LOOKER_INSTANCE_URL.rstrip('/')}{EMBED_PATH}"

# Simple embed user configuration
SIMPLE_USER = {
    "session_length": 3600,
    "force_logout_login": True,
    "external_user_id": "looker-ca-embed-test-simple",
    "first_name": "Simple",
    "last_name": "User",
    "user_timezone": "America/New_York",
    "permissions": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "gemini_in_looker",
        "chat_with_agent",
        "chat_with_explore"
    ],
    "models": ["thelook"],
    "group_ids": [],
    "external_group_id": "",
    "user_attributes": {},
    "embed_domain": LOOKER_EMBED_DOMAIN
}

# Advanced embed user configuration
ADVANCED_USER = {
    "session_length": 3600,
    "force_logout_login": True,
    "external_user_id": "looker-ca-embed-test-advanced",
    "first_name": "Advanced",
    "last_name": "User",
    "user_timezone": "America/New_York",
    "permissions": [
        "access_data",
        "see_looks",
        "see_user_dashboards",
        "explore",
        "save_content",
        "download_with_limit",
        "gemini_in_looker",
        "chat_with_agent",
        "chat_with_explore",
        "save_agents",
        "admin_agents"
    ],
    "models": ["thelook"],
    "group_ids": ["506"],
    "external_group_id": "",
    "user_attributes": {},
    "embed_domain": LOOKER_EMBED_DOMAIN
}
