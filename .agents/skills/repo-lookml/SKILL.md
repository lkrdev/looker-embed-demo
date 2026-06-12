---
name: repo-lookml
description: Standards, workflow rules, and helper patterns for managing LookML files in the Looker project using the `lkr-dev-cli` CLI tool and synchronizing/deploying them with Looker.
---

# Overview & Scope

The `repo-lookml` skill defines the rigorous, standardized workflow required whenever you modify, create, initialize, or deploy LookML files in this codebase.

In this project, LookML files are authored locally in the repository and synchronized and deployed to Looker using the state-of-the-art `lkr-dev-cli` CLI tool (`uvx lkr-dev-cli`). To ensure source control integrity and prevent drift between the remote Looker server and the local file system, all LookML file synchronization and deployment must use this CLI tool.

---

# Mandatory Execution Prerequisites

## 1. Global Environment Configuration
To ensure all agents operate consistently across different Looker instances or developer environments, this repository maintains target project, database connection, and embed domain settings as environment variables in the central **`.env`** file:

```env
LOOKER_PROJECT_NAME=embed-demo
LOOKER_CONNECTION_NAME=looker-private-demo
LOOKER_EMBED_DOMAIN=https://localhost:8008
VITE_LOOKER_INSTANCE_URL=https://googledemo2.cloud.looker.com
```

Whenever performing LookML or setup operations, confirm these identifiers (especially `LOOKER_PROJECT_NAME`) to ensure you are operating against the correct Looker project.

## 2. Determining the OAuth Account Name
Before running `lkr-dev-cli` CLI commands, determine the correct OAuth account name for the target instance:
1. Run `uvx lkr-dev-cli auth list` to view all authenticated Looker instances.
2. Match the active instance URL (e.g., from `VITE_LOOKER_INSTANCE_URL` in `.env`) to the corresponding `Instance` account name (e.g., `dev-googledemo2`).

---

# Core Workflow Rules

## 1. Local First, Remote Second (CRITICAL)
Whenever you need to create or update LookML files or directories:
1. **Always write the files locally to the repository's `lookml/` directory first** (using standard local file editing tools like `write_to_file` or `replace_file_content`).
2. **Synchronize and deploy** to the remote Looker project using the `lkr-dev-cli` CLI tool.

## 2. Pushing LookML & Production Deployment (`uvx lkr-dev-cli tools lookml push`)
Whenever the user requests to **"sync"**, **"sync files"**, **"sync lookml"**, **"push"**, or **"deploy"** LookML:
1. **Never use Code Mode or `run_python_code` for pushing or deploying LookML files.** We rely exclusively on the `lkr-dev-cli` CLI.
2. Execute the following turnkey command to push local LookML and commit/deploy to production in a single robust operation:

```bash
uvx lkr-dev-cli --oauth-account=<oauth_account_name> tools lookml push <local_folder> --project=<looker_project_name> --deploy
```

- `--oauth-account`: The target OAuth account name from `uvx lkr-dev-cli auth list` (e.g., `dev-googledemo2`).
- `local_folder`: The local directory containing LookML files (in this project, always `lookml`).
- `--project`: The Looker target project ID (from `LOOKER_PROJECT_NAME` in `.env`, e.g., `embed-demo`).
- `--deploy`: Automatically commits the changes and deploys them to production on the Looker instance.

### Example Execution:
```bash
uvx lkr-dev-cli --oauth-account=dev-googledemo2 tools lookml push lookml --project=embed-demo --deploy
```

*(Note: The user must approve the command before it runs. Once launched, you will be automatically notified when the command finishes.)*

## 3. Instance Configuration & Security Allowlists
When provisioning a new Looker instance or adjusting administrative settings, use the `lkr_dev_cli_codemode` MCP server with `run_python_code` (`dev_mode=True`) to:
1. **Brand User Attribute**: Verify or create a user attribute named `"brand"` (`type="string"`, `value_is_hidden=False`, `user_can_view=True`).
2. **Embed Settings**: Verify or configure `"sso_auth_enabled": True` and `"embed_cookieless_v2": True`.
3. **Domain Allowlist**: Add the target `LOOKER_EMBED_DOMAIN` to the instance allowlist.

## 4. Instantiating New Projects & Bare Git Repositories
When setting up a brand new project on a Looker instance via Code Mode (`run_python_code`):
1. **Verify Development Mode**: Confirm your execution context is actively running in Looker Development Mode (`if session().get("workspace_id") != "dev": raise ValueError(...)`).
2. Call `create_project` to register the new project.
3. Call `update_project` to configure a Looker server-hosted ('bare') Git repository by setting `git_remote_url` to `None` and `git_service_name` to `"bare"`.

## 5. Creating New Model Configurations
When creating a new `.model.lkml` file, uploading the file is not enough. You must also register the LookML model configuration in Looker Admin so that it links the model name to the target project and allowed database connections:
1. Create the `.model.lkml` file locally in `lookml/models/`.
2. Push and deploy the LookML using the `uvx lkr-dev-cli tools lookml push ... --deploy` command.
3. Execute `create_lookml_model` via Code Mode (`run_python_code`), scoping it exactly to the target connection specified in `LOOKER_CONNECTION_NAME`.

---

# MCP `lkr_dev_cli_codemode` Usage (For Admin / SDK Operations)

While LookML file sync is now fully driven by the `lkr-dev-cli` CLI, the `lkr_dev_cli_codemode` MCP server remains the tool of choice for executing Python administrative scripts against Looker's SDK.

### Essential Rules for `run_python_code`:
- **No Imports**: Do not attempt to `import looker_sdk`.
- **Global SDK Methods**: All SDK API methods are natively injected as global functions (e.g., `create_project(...)`, `create_lookml_model(...)`).
- **Dict Return Values**: Return values are standard Python dictionaries. Use dictionary syntax (`file["id"]`), not attribute syntax (`file.id`).
- **Development Mode Verification**: Always check `session()` to verify your workspace is in Development Mode before performing modifications.
- **Return Results**: Use `return` at the end of your code snippet instead of `print()`.

---

# Code Examples

## 1. Pushing and Deploying LookML via CLI
```bash
uvx lkr-dev-cli --oauth-account=dev-googledemo2 tools lookml push lookml --project=embed-demo --deploy
```

## 2. Initializing an Embedded Project & Model via Code Mode
```python
import os

# 1. Verify Development Mode
current_session = session()
if current_session.get("workspace_id") != "dev":
    raise ValueError("Execution context must be in Looker Development Mode ('dev').")

target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")
target_connection = os.getenv("LOOKER_CONNECTION_NAME", "looker-private-demo")
target_domain = os.getenv("LOOKER_EMBED_DOMAIN", "https://localhost:8008")

# 2. Provision Brand User Attribute
uas = all_user_attributes()
if not any(ua["name"] == "brand" for ua in uas):
    create_user_attribute(body={
        "name": "brand",
        "label": "Brand",
        "type": "string",
        "value_is_hidden": False,
        "user_can_view": True,
        "user_can_edit": False
    })

# 3. Enforce Instance Embed Configurations & Allowlist
current_settings = get_setting()
embed_config = current_settings.get("embed_config", {})

embed_config["embed_enabled"] = True
embed_config["sso_auth_enabled"] = True
embed_config["embed_cookieless_v2"] = True

allowlist = embed_config.get("domain_allowlist", [])
if target_domain and target_domain not in allowlist:
    allowlist.append(target_domain)
    embed_config["domain_allowlist"] = allowlist

set_setting(body={
    "embed_config": embed_config,
    "embed_enabled": True,
    "embed_cookieless_v2": True
})

# 4. Create Project & Configure Bare Git Repo
create_project(body={"name": target_project})
update_project(
    project_id=target_project,
    body={
        "git_remote_url": None,
        "git_service_name": "bare"
    }
)

# (Next step: Execute the 'uvx lkr-dev-cli tools lookml push ... --deploy' CLI command in the terminal)

# 5. Register LookML Model
create_lookml_model(body={
    "name": "embed_demo",
    "project_name": target_project,
    "allowed_db_connection_names": [target_connection],
    "unlimited_db_connections": False
})

return {"status": "project_and_model_configured"}
```
