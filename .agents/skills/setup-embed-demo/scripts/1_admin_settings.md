# Step 1: Administrative Settings Code Mode Script

> [!NOTE]
> Execute this script via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> You do not need an `sdk` object; Code Mode automatically injects Looker SDK endpoint methods directly into the global namespace.

```python
import os, sys

# CRITICAL: Never use standard print() statements as they pollute stdout and destroy the stdio JSON-RPC IPC stream.
log_msgs = []
def log(msg):
    log_msgs.append(msg)
    sys.stderr.write(msg + "\n")

try:
    # 1. Verify Looker Development Mode
    current_session = session()
    if current_session.get("workspace_id") != "dev":
        raise ValueError("Execution context must be switched to Looker Development Mode ('dev').")

    # 2. Capture targets
    target_domain = os.getenv("LOOKER_EMBED_DOMAIN", "http://localhost:3000")

    # 3. Provision Brand User Attribute
    log("Checking for required 'brand' user attribute...")
    uas = all_user_attributes()
    if not any(ua["name"] == "brand" for ua in uas):
        log("Creating 'brand' user attribute...")
        create_user_attribute(body={
            "name": "brand",
            "label": "Brand",
            "type": "string",
            "value_is_hidden": False,
            "user_can_view": True,
            "user_can_edit": False
        })

    # 4. Enforce Instance Embed Configurations
    log("Inspecting instance embed settings...")
    current_settings = get_setting()
    embed_config = current_settings.get("embed_config", {})

    embed_config["embed_enabled"] = True
    embed_config["sso_auth_enabled"] = True
    embed_config["embed_cookieless_v2"] = True

    allowlist = embed_config.get("domain_allowlist", [])
    if target_domain and target_domain not in allowlist:
        log(f"Adding {target_domain} to embed domain allowlist...")
        allowlist.append(target_domain)
        embed_config["domain_allowlist"] = allowlist

    log("Committing updated embed configuration to instance...")
    set_setting(body={
        "embed_config": embed_config,
        "embed_enabled": True,
        "embed_cookieless_v2": True
    })

    # 5. Provision Embed Content Access Group
    log("Checking for embed content access group...")
    groups = all_groups()
    target_group_name = "Embed Demo Users"
    target_group = next((g for g in groups if g["name"] == target_group_name), None)
    if not target_group:
        log(f"Creating '{target_group_name}' group...")
        target_group = create_group(body={"name": target_group_name, "can_add_to_content_metadata": True})
    group_id = str(target_group["id"])
    log(f"Embed content access group ID: {group_id}")

    return {
        "status": "success",
        "logs": log_msgs,
        "group_id": group_id,
        "domain_allowlist": embed_config.get("domain_allowlist")
    }
except Exception as e:
    log(f"Admin settings verification failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```

> [!IMPORTANT]
> **Updating Default Group ID in Code**:
> The group `id` (returned in `group_id` by this script from Looker API's `POST /groups` / `create_group`) is required to give all embed users (`simple`, `gemini`, and `advanced` alike) shared access to the main content folder in this environment. Upon successful execution, you **must** replace the default group ID (`"8"`) in the following files with the new group `id`:
> - [backend/app/models.py](file:///usr/local/google/home/maluka/looker-embed-demo/backend/app/models.py) (`DEFAULT_LOOKER_GROUP_IDS`)
> - [frontend/src/config/constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts) (`getRoleUserObject`)
> - [frontend/src/components/dialogs/UserDetailsDialog.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/dialogs/UserDetailsDialog.tsx) (`userSettingsJson`)
