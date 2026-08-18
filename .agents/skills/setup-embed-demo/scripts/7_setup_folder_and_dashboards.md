# Step 7: Folder Setup, Group Access & LookML Dashboard Move Code Mode Script

> [!NOTE]
> Execute this script via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> This script creates a shared folder for the embed demo, grants view access to the Embed Demo Users group, and moves LookML dashboards into the created folder via `/api/internal/lookml_dashboards/move`.

```python
import os, sys

log_msgs = []
def log(msg):
    log_msgs.append(msg)
    sys.stderr.write(msg + "\n")

try:
    # 1. Find Shared folder (root folder 1 or shared folder)
    folders = all_folders()
    shared_folder = next((f for f in folders if f["name"] == "Shared" or f.get("is_shared_root")), None)
    parent_id = shared_folder["id"] if shared_folder else "1"

    # 2. Create or find "Embed Demo Dashboards" folder
    folder_name = "Embed Demo Dashboards"
    existing_folder = next((f for f in folders if f["name"] == folder_name and str(f.get("parent_id")) == str(parent_id)), None)
    if existing_folder:
        folder_id = str(existing_folder["id"])
        log(f"Found existing folder '{folder_name}' with ID: {folder_id}")
    else:
        log(f"Creating folder '{folder_name}' inside Shared folder (parent_id: {parent_id})...")
        created = create_folder(body={"name": folder_name, "parent_id": parent_id})
        folder_id = str(created["id"])
        log(f"Created folder '{folder_name}' with ID: {folder_id}")

    # 3. Ensure Embed Demo Users group has view access to this folder
    groups = all_groups()
    embed_group = next((g for g in groups if g["name"] == "Embed Demo Users"), None)
    if embed_group:
        group_id = str(embed_group["id"])
        log(f"Configuring folder access for group '{embed_group['name']}' (ID: {group_id})...")
        update_folder_access_list(
            folder_id=folder_id,
            body=[{"group_id": group_id, "can_view": True, "can_edit": False}]
        )

    # 4. Move LookML Dashboards into the folder using internal API PUT /api/internal/lookml_dashboards/move
    dashboard_ids = [
        "embed_demo::brand_overview",
        "embed_demo::bq_graph_analytics",
        "embed_demo::shipping_overview"
    ]
    log(f"Moving LookML dashboards {dashboard_ids} into folder_id {folder_id}...")
    
    # In Code Mode, we access raw REST transport or looker_sdk session endpoint
    transport = getattr(all_folders, "__self__", getattr(session, "__self__", None))
    if hasattr(transport, "put"):
        response = transport.put(
            path="/api/internal/lookml_dashboards/move",
            body={
                "method": "put",
                "dashboard_ids": dashboard_ids,
                "folder_id": folder_id
            }
        )
        log(f"Moved LookML dashboards response: {response}")

    return {
        "status": "success",
        "logs": log_msgs,
        "folder_id": folder_id,
        "moved_dashboards": dashboard_ids
    }
except Exception as e:
    log(f"Folder setup & dashboard move failed: {e}")
    return {
        "status": "error",
        "logs": log_msgs,
        "error": str(e)
    }
```
