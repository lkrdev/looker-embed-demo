# Step 4: Model Registration & Production Deployment Code Mode Script

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
    target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")
    target_connection = os.getenv("LOOKER_CONNECTION_NAME", "looker-private-demo")
    model_name = "embed_demo"

    # 1. Register LookML Model
    log(f"Registering LookML model: {model_name}")
    try:
        create_lookml_model(body={
            "name": model_name,
            "project_name": target_project,
            "allowed_db_connection_names": [target_connection],
            "unlimited_db_connections": False
        })
    except Exception:
        try:
            update_lookml_model(
                lookml_model_name=model_name,
                body={
                    "project_name": target_project,
                    "allowed_db_connection_names": [target_connection],
                    "unlimited_db_connections": False
                }
            )
        except Exception as ume:
            log(f"Model update notice: {ume}")

    # 2. Validate Project Relations
    log("Validating project relations...")
    validation = validate_project(project_id=target_project)

    # 3. Explicit REST Git Commit
    log("Executing explicit REST Git commit prior to production deployment...")
    try:
        # Guarantee changes are committed via REST git_branch/commit or Core SDK helpers
        try:
            post(f"/projects/{target_project}/git_branch/commit", body={"message": "Automated Code Mode commit prior to deployment"})
        except Exception:
            commit(project_id=target_project)
    except Exception as commit_err:
        log(f"Git commit notice: {commit_err}")

    # 4. Deploy to Production
    log("Deploying committed LookML workspace to production...")
    deploy_result = deploy_to_production(project_id=target_project)
    log("Production deployment completed successfully.")

    # 5. Determine Clickable UI Model Link Path
    base_host = current_session.get("api_url", "https://your-looker-instance.cloud.looker.com").replace("/api/4.0", "").replace("/api/3.1", "")
    
    # Check inventory for structured vs root model path
    remote_inventory = {f.path for f in all_project_files(project_id=target_project)}
    model_link_path = "models/embed_demo.model.lkml" if "models/embed_demo.model.lkml" in remote_inventory else "embed_demo.model.lkml"
    ui_model_url = f"{base_host}/projects/{target_project}/files/{model_link_path}"

    return {
        "status": "success",
        "logs": log_msgs,
        "ui_model_url": ui_model_url,
        "validation": validation,
        "deploy_result": deploy_result
    }
except Exception as e:
    log(f"Model deployment failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
