# Step 3: LookML Strict File Synchronization & Automatic Deployment Code Mode Script

> [!WARNING]
> **DEPRECATED**: Do NOT use this script or `run_python_code` for syncing LookML files!
> Use the new `lkr` CLI turnkey command in the terminal instead:
> `uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account_name> tools lookml push lookml --project=<looker_project_name> --deploy`

> [!NOTE]
> Execute this script via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> You do not need an `sdk` object; Code Mode automatically injects Looker SDK endpoint methods directly into the global namespace.
> 
> **One-Way Mirror & Automatic Deployment**: This script enforces a strict one-way mirror from local to remote (deleting extra files on the remote instance that aren't in `files_to_push`, and overwriting/creating the rest). It automatically reads the local `lookml/` folder on disk and **automatically validates, commits, and deploys to production** unless `skip_deploy` is explicitly set to `True`.


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
    skip_deploy = False  # Set to True if you do NOT want to deploy to production

    # 1. Read all local LookML files directly from disk
    current_dir = os.getcwd()
    while current_dir and current_dir != "/":
        if os.path.exists(os.path.join(current_dir, "lookml")):
            lookml_dir = os.path.join(current_dir, "lookml")
            break
        current_dir = os.path.dirname(current_dir)
    else:
        lookml_dir = "/usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/lookml"

    files_to_push = []
    log(f"Reading local LookML inventory from {lookml_dir}...")
    for root, _, files in os.walk(lookml_dir):
        for file in files:
            if file.endswith(".lkml") or file.endswith(".json") or file.endswith(".dashboard.lookml"):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, lookml_dir)
                with open(full_path, "r") as f:
                    content = f.read()
                files_to_push.append({
                    "path": rel_path,
                    "root_name": file,
                    "content": content
                })

    local_paths = {f["path"] for f in files_to_push}.union({f["root_name"] for f in files_to_push})

    # 2. Strict One-Way Mirror: Delete existing remote orphans not present locally
    log("Retrieving remote file inventory to enforce one-way mirror...")
    existing_remote = all_project_files(project_id=target_project)
    for rf in existing_remote:
        rf_path = rf["path"]
        if rf_path not in local_paths and not rf_path.endswith(".gitkeep") and not rf_path == "manifest.lkml":
            log(f"Deleting remote orphan file: {rf_path}")
            try:
                delete_project_file(project_id=target_project, file_path=rf_path)
            except Exception as dpe:
                log(f"Deletion notice for {rf_path}: {dpe}")

    # 3. Iterate and upload/overwrite all local targets
    for f in files_to_push:
        structured_path = f["path"]
        root_path = f["root_name"]
        content = f["content"]
        
        # Attempt pushing to structured folder path first
        try:
            log(f"Uploading/Overwriting file: {structured_path}")
            try:
                create_project_file(project_id=target_project, path=structured_path, body={"mime_type": "text/plain"})
            except Exception:
                pass
            update_project_file(project_id=target_project, file_path=structured_path, body={"content": content})
            continue
        except Exception as struct_err:
            log(f"Structured upload notice ({struct_err}), initiating fallback to project root...")
        
        # Fallback: If missing parent folder causes rejection, write to project root and adjust model include
        if root_path == "embed_demo.model.lkml":
            content = content.replace('include: "/views/**/*.view.lkml"', 'include: "/*.view.lkml"')
            
        try:
            create_project_file(project_id=target_project, path=root_path, body={"mime_type": "text/plain"})
        except Exception:
            pass
        update_project_file(project_id=target_project, file_path=root_path, body={"content": content})

    # 4. Automatic Production Deployment (unless explicitly instructed not to)
    validation = None
    deploy_result = None
    ui_model_url = None
    
    if not skip_deploy:
        log("Executing automatic Model Registration, Project Validation, and Production Deployment...")
        model_name = "embed_demo"
        
        # Register LookML Model
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

        # Validate Project Relations
        log("Validating project relations...")
        validation = validate_project(project_id=target_project)

        # Explicit REST Git Commit
        log("Executing explicit REST Git commit prior to production deployment...")
        try:
            try:
                post(f"/projects/{target_project}/git_branch/commit", body={"message": "Automated Code Mode strict multi-file sync and commit"})
            except Exception:
                commit(project_id=target_project)
        except Exception as commit_err:
            log(f"Git commit notice: {commit_err}")

        # Deploy to Production
        log("Deploying committed LookML workspace to production...")
        deploy_result = deploy_to_production(project_id=target_project)
        log("Production deployment completed successfully.")
        
        base_host = current_session.get("api_url", "https://your-looker-instance.cloud.looker.com").replace("/api/4.0", "").replace("/api/3.1", "")
        remote_inventory = {f["path"] for f in all_project_files(project_id=target_project)}
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
    log(f"File synchronization & deployment pipeline failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
