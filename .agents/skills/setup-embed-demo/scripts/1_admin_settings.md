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

    return {
        "status": "success",
        "logs": log_msgs,
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
