# Verify Credentials Code Mode Script

> [!NOTE]
> This script is designed to be executed via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> Because Code Mode automatically initializes and injects all Looker SDK endpoint methods directly into the global namespace, you do not need an `sdk` object (e.g., instead of calling `sdk.me()`, you simply call `me()`).

```python
import sys

# CRITICAL: Never use standard print() statements as they pollute stdout and destroy the stdio JSON-RPC IPC stream.
log_msgs = []
def log(msg):
    log_msgs.append(msg)
    sys.stderr.write(msg + "\n")

try:
    log("Verifying Looker SDK authentication...")
    user = me()
    log(f"Successfully authenticated as: {user.display_name} (ID: {user.id}, Role ID: {user.role_ids})")
    
    # Check if user has admin role (role_id 2 is typically Admin)
    is_admin = 2 in user.role_ids if user.role_ids else False
    if not is_admin:
        log("Note: User does not appear to hold the standard Admin role (role_id: 2). Verify privileges if needed.")

    return {
        "status": "success",
        "logs": log_msgs,
        "user": {
            "id": user.id,
            "display_name": user.display_name,
            "email": user.email,
            "role_ids": user.role_ids,
            "is_admin": is_admin
        }
    }
except Exception as e:
    log(f"Authentication verification failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
