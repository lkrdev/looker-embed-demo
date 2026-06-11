---
name: repo-lookml
description: Standards, workflow rules, and helper patterns for managing LookML files in the Looker project using the `lkr_dev_cli_codemode` MCP and synchronizing them with the local repository's `lookml/` folder.
---

# Overview & Scope

The `repo-lookml` skill defines the rigorous, standardized workflow required whenever you modify, create, initialize, or deploy LookML files in this codebase.

In this project, LookML files are developed using Looker's Code Mode via the `lkr_dev_cli_codemode` MCP. To ensure source control integrity and prevent drift between the remote Looker server and the local file system, all file operations must follow strict **synchronization, configuration, and deployment lifecycles**.

---

# Mandatory Execution Prerequisites

## 1. Prerequisite MCP Verification (CRITICAL)
Before executing any project or Code Mode logic, the LLM must confirm that the **`lkr_dev_cli_codemode` MCP server** is fully loaded and available in its context.
- If `lkr_dev_cli_codemode` is missing, the LLM must halt and instruct the user to enable or load the `lkr_dev_cli_codemode` MCP server before proceeding.

## 2. Global Environment Configuration
To ensure all agents and setup scripts operate consistently across different Looker instances or developer environments, this repository maintains target project, database connection, and embed domain settings as environment variables in the central **`.env`** file (with a template provided in **`.env.example`**):

```env
LOOKER_PROJECT_NAME=embed-demo
LOOKER_CONNECTION_NAME=looker-private-demo
LOOKER_EMBED_DOMAIN=http://localhost:3000
```

Whenever performing onboarding or configuration operations, the LLM must actively prompt the user to choose or confirm these identifiers (offering to create a placeholder connection via `create_connection` if none exists) and explicitly write the confirmed selections into `.env`.

---

# Core Workflow Rules

## 1. Local First, Remote Second (CRITICAL)
Whenever you need to create or update LookML files or directories:
1. **Always write the files locally to the repository's `lookml/` directory first** (using standard local file tools like `write_to_file` or `replace_file_content`).
2. **Only after verifying the local write**, send off the corresponding Code Mode create or update file/directory requests to the remote Looker project via the `lkr_dev_cli_codemode` MCP.

## 2. Remote Generation Synchronization
When using automated SDK generation methods (such as `generate_lookml_with_new_files`) which create files directly on the Looker server:
1. Execute the generation SDK call on the server.
2. Immediately inspect the response to identify newly created or modified remote files.
3. Use `get_file_content` to pull the exact LookML content of those remote files.
4. Write the content to the local `lookml/` directory to restore perfect parity.

## 3. Instance Configuration & Security Allowlists
When provisioning a Looker instance for embedding, the LLM must enforce:
1. **Brand User Attribute**: Verifying or creating a user attribute named `"brand"` with settings `type="string"`, `value_is_hidden=false` (`hide values No`), and `user_can_view=true` (`user access view`).
2. **Embed Settings**: Calling `get_setting()` to enforce `"sso_auth_enabled": true` and `"embed_cookieless_v2": true` inside `"embed_config"`.
3. **Domain Allowlist**: Adding the target `LOOKER_EMBED_DOMAIN` to the `"domain_allowlist"` array in `"embed_config"` and saving it via `set_setting(body=...)`.

## 4. Instantiating New Projects & Bare Git Repositories
When setting up a brand new project on a Looker instance:
1. **Verify Development Mode**: Confirm your execution context is actively running in Looker Development Mode by querying `session()` and raising a `ValueError` if `workspace_id` is not `dev`.
2. Call `create_project` to register the new project.
3. Call `update_project` to configure a Looker server-hosted ('bare') Git repository by setting `git_remote_url` to `null` and `git_service_name` to `"bare"`.

## 5. Creating New Model Configurations
When creating a new `.model.lkml` file, creating the project file is not enough. You must also register the LookML model configuration in Looker Admin so that it links the model name to the target project and allowed database connections:
1. Create the model file locally in `lookml/models/`.
2. Sync the model file to the remote Looker project (`create_project_file`).
3. Execute `create_lookml_model` via the SDK, scoping it exactly to the target connection specified in `LOOKER_CONNECTION_NAME`.

## 6. Deployment Lifecycle (`./scripts/deploy_lifecycle.md`)
To push LookML changes to production, execute the pre-packaged deployment script at [./scripts/deploy_lifecycle.md](./scripts/deploy_lifecycle.md) via `run_python_code` (which automates the following mandatory steps):
1. Confirm that all local files are fully synchronized to the remote workspace.
2. Validate the project (`validate_project`) to verify there are no LookML syntax or relational broken references.
3. Explicitly execute a raw REST Git commit (`post("/projects/{id}/git_branch/commit", ...)`) to guarantee all dev mode changes are committed.
4. Execute `deploy_to_production` to deploy the committed project to the active production environment.

---

# MCP `lkr_dev_cli_codemode` Usage & Best Practices

The `lkr_dev_cli_codemode` MCP provides the lazy tool `run_python_code` for executing Python scripts against Looker's Node/Python SDK.

### Essential Rules for `run_python_code`:
- **No Imports**: Do not attempt to `import looker_sdk`.
- **Global SDK Methods**: All SDK API methods are natively injected as global functions (e.g., `create_project_file(...)`, `get_file_content(...)`) or accessible on the `sdk` object (e.g., `sdk.me()`).
- **Dict Return Values**: Return values are standard Python dictionaries, not class instances. Use dictionary syntax (`file["id"]`), not attribute syntax (`file.id`).
- **Development Mode Verification**: Always check `session()` to verify your workspace is in Development Mode before performing modifications (`if session().get("workspace_id") != "dev": raise ValueError(...)`). Include `dev_mode=True` when invoking the tool.
- **Return Results**: Use `return` at the end of your code snippet instead of `print()`.

---

# Code Mode SDK Examples

## 1. Initializing an Embedded Project with Full Instance Configuration

```python
import os

# 1. Verify Development Mode
current_session = session()
if current_session.get("workspace_id") != "dev":
    raise ValueError("Execution context must be in Looker Development Mode ('dev').")

target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")
target_connection = os.getenv("LOOKER_CONNECTION_NAME", "looker-private-demo")
target_domain = os.getenv("LOOKER_EMBED_DOMAIN", "http://localhost:3000")

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

# ... push all project files ...

# 5. Register LookML Model
create_lookml_model(body={
    "name": "embed_demo",
    "project_name": target_project,
    "allowed_db_connection_names": [target_connection],
    "unlimited_db_connections": False
})

# 6. Validate, Explicit Commit, and Deploy
validate_project(project_id=target_project)
try:
    post(f"/projects/{target_project}/git_branch/commit", body={"message": "Automated commit via Code Mode"})
except Exception:
    commit(project_id=target_project)
deploy_to_production(project_id=target_project)

return {"status": "deployed"}
```
