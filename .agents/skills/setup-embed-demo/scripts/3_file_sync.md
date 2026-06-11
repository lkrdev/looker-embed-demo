# Step 3: LookML File Synchronization Code Mode Script

> [!NOTE]
> Execute this script via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> You do not need an `sdk` object; Code Mode automatically injects Looker SDK endpoint methods directly into the global namespace.
> 
> **Developer Target Alignment**: Assisting agents should update the `files_to_push` dictionary below with the complete, verified contents of the user's local LookML project files.

```python
import os, sys

# CRITICAL: Never use standard print() statements as they pollute stdout and destroy the stdio JSON-RPC IPC stream.
log_msgs = []
def log(msg):
    log_msgs.append(msg)
    sys.stderr.write(msg + "\n")

try:
    target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")
    target_connection = os.getenv("LOOKER_CONNECTION_NAME", "looker-private-demo")

    # 1. Define files to push (Assisting agent populates this with exact developer targets)
    files_to_push = [
        {
            "path": "models/embed_demo.model.lkml",
            "root_name": "embed_demo.model.lkml",
            "content": f"connection: \"{target_connection}\"\n\ninclude: \"/views/**/*.view.lkml\"\n\nexplore: order_items {{}}\n"
        },
        {
            "path": "views/order_items.view.lkml",
            "root_name": "order_items.view.lkml",
            "content": "view: order_items {\n  sql_table_name: `thelook.order_items` ;;\n  dimension: id { primary_key: yes type: number sql: ${TABLE}.id ;; }\n}\n"
        }
    ]

    # 2. Iterate and upload files
    for f in files_to_push:
        structured_path = f["path"]
        root_path = f["root_name"]
        content = f["content"]
        
        # Attempt pushing to structured folder path first
        try:
            log(f"Uploading file: {structured_path}")
            create_project_file(project_id=target_project, path=structured_path, body={"mime_type": "text/plain"})
            update_project_file(project_id=target_project, file_path=structured_path, body={"content": content})
            continue
        except Exception as struct_err:
            log(f"Structured upload notice ({struct_err}), initiating fallback to project root...")
        
        # Fallback: If missing parent folder causes 400 rejection, write to project root and adjust model include
        if root_path == "embed_demo.model.lkml":
            content = content.replace('include: "/views/**/*.view.lkml"', 'include: "/*.view.lkml"')
            
        try:
            create_project_file(project_id=target_project, path=root_path, body={"mime_type": "text/plain"})
        except Exception:
            pass
        update_project_file(project_id=target_project, file_path=root_path, body={"content": content})

    # 3. Verify Local vs Remote File Inventory
    log("Verifying remote project file inventory against local targets...")
    remote_inventory = {f.path for f in all_project_files(project_id=target_project)}
    log(f"Found {len(remote_inventory)} remote files in dev workspace.")
    
    missing = [f["path"] for f in files_to_push if f["path"] not in remote_inventory and f["root_name"] not in remote_inventory]
    if missing:
        log(f"WARNING: File synchronization mismatch discovered for: {missing}. Re-run synchronization if needed.")
    else:
        log("File inventory completely synchronized and verified successfully.")

    return {
        "status": "success",
        "logs": log_msgs,
        "remote_files": list(remote_inventory),
        "missing_files": missing
    }
except Exception as e:
    log(f"File synchronization failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
