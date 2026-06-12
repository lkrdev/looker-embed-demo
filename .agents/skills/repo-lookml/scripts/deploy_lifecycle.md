# Deploy Lifecycle Code Mode Script

> [!WARNING]
> **DEPRECATED**: Do NOT use this script for deploying LookML or guaranteeing parity!
> Execute the new turnkey `lkr` CLI command in the terminal instead:
> `uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account_name> tools lookml push lookml --project=<looker_project_name> --deploy`

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
    current_session = session()
    if current_session.get("workspace_id") != "dev":
        raise ValueError("Execution context must be in Looker Development Mode ('dev').")

    target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")

    # 1. Validate Project Relations
    log("Validating project relations...")
    validation = validate_project(project_id=target_project)

    # 2. Explicit REST Git Commit
    log("Executing explicit REST Git commit prior to production deployment...")
    try:
        try:
            post(f"/projects/{target_project}/git_branch/commit", body={"message": "Automated Code Mode commit prior to deployment"})
        except Exception:
            commit(project_id=target_project)
    except Exception as commit_err:
        log(f"Git commit notice: {commit_err}")

    # 3. Deploy to Production
    log("Deploying committed LookML workspace to production...")
    deploy_result = deploy_to_production(project_id=target_project)
    log("Production deployment completed successfully.")

    return {
        "status": "success",
        "logs": log_msgs,
        "validation": validation,
        "deploy_result": deploy_result
    }
except Exception as e:
    log(f"Deployment lifecycle failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
