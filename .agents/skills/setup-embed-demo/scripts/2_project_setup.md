# Step 2: Project Creation & Bare Git Repo Code Mode Script

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
    target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")

    # 1. Instantiating Looker Project
    try:
        log(f"Instantiating Looker project: {target_project}")
        create_project(body={"name": target_project})
    except Exception as e:
        log(f"Project creation notice (may already exist or hold active relations): {e}")

    # 2. Gracefully Configure Bare Git Repo
    try:
        log(f"Configuring 'bare' git repository for: {target_project}")
        update_project(
            project_id=target_project,
            body={
                "git_remote_url": None,
                "git_service_name": "bare"
            }
        )
        log("Bare Git repository successfully configured.")
    except Exception as e:
        log(f"Bare repo configuration notice (production directory likely already initialized): {e}")

    return {
        "status": "success",
        "logs": log_msgs,
        "project_name": target_project
    }
except Exception as e:
    log(f"Project setup failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
