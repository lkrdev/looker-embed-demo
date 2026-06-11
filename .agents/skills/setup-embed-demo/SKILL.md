---
name: setup-embed-demo
description: Automated onboarding and provisioning skill that sets up the Looker Embed Demo project, database connection, LookML files, LookML model configuration, brand user attribute, and instance embed settings on a new Looker instance.
---

# Overview & Purpose

The `setup-embed-demo` skill provides a completely comprehensive, turnkey onboarding workflow. When a developer clones this repository and asks to *"setup the embed demo"*, the assisting LLM follows this mandatory execution pipeline to validate prerequisites, capture environment selections, configure instance user attributes and embed security allowlists, instantiate the project and LookML model, push local files, and deploy the codebase to production.

> [!CRITICAL]
> **1. NEVER write ad-hoc scratch local Python scripts** to perform these tasks. You must rely exclusively on the pre-packaged Code Mode scripts in `./scripts/` and execute them via the `run_python_code` tool provided by the `lkr_dev_cli_codemode` MCP server.
> **2. The `print()` Statement Trap (Stdio IPC Stream Corruption)**: `lkr_dev_cli_codemode` uses `stdio` to transport JSON-RPC messages between the MCP server and the host client. If any Python code executed via `run_python_code` contains standard `print()` statements, the printed text is written directly into `stdout`, corrupting the underlying JSON-RPC communication channel and permanently crashing the client connection (`invalid character ... looking for beginning of value`). **NEVER use `print()` or write to `stdout` inside Code Mode scripts.** Log messages must be accumulated in an output dictionary or written strictly to `sys.stderr`.

---

# Mandatory LLM Execution Steps

## 1. Prerequisite Authentication & Environment Variable Verification (CRITICAL)
Before running any configuration logic, the LLM must confirm that Looker API credentials are configured via standard Looker SDK environment variables, rather than relying on OAuth.
- **Credential Prompting**: Instruct the user to provide their Looker API credentials by exporting the following environment variables (or updating their active MCP configuration):
  - `LOOKERSDK_BASE_URL` (e.g., `https://myinstance.cloud.looker.com`)
  - `LOOKERSDK_CLIENT_ID`
  - `LOOKERSDK_CLIENT_SECRET`
  *(Note: An example of how these environment variables are configured for the `lkr_dev_cli_codemode` MCP server can be found in `lkrdev/looker-embed-demo/.gemini/config/mcp_config.json`).*
- **Interactive Pause**: You **must prompt the user** to input or confirm these credentials before continuing.
- **Verification via Code Mode**: Once configured, verify that authentication is working correctly by executing the Python code block inside the verification script located at [./scripts/verify_credentials.md](./scripts/verify_credentials.md) via `run_python_code`. This script invokes `me()` (since Code Mode automatically injects SDK methods into the namespace) to confirm that a valid user is returned and checks for Admin privileges.

## 2. Onboarding & Alignment Prompting
The LLM must interactively establish active environment targets with the user:
1. **Target Project Name**: Ask the user what Looker project name to use (suggesting `embed-demo` as the default).
2. **Database Connection Selection**:
   - Query `all_connections()` to list existing Looker database connections.
   - Filter for suitable BigQuery (`"bigquery_standard_sql"`) connections. If none exists, offer to create a working placeholder via `create_connection(...)`.
   - Ask the user to confirm the exact connection name.
3. **Embed Domain Capture**:
   - Check if `LOOKER_EMBED_DOMAIN` is successfully configured in the user's local `.env` file.
   - If `.env` is inaccessible or missing the domain, explicitly ask the user for their target embed domain (e.g., `http://localhost:3000`).

## 3. Persisting Local Targets (`.env`)
The LLM must ensure that all confirmed choices are written directly into the developer's **`.env`** file (and **`.env.example`**):

```env
LOOKER_PROJECT_NAME=embed-demo
LOOKER_CONNECTION_NAME=looker-private-demo
LOOKER_EMBED_DOMAIN=http://localhost:3000
```

## 4. Remote Automated Pipeline (Modular Code Mode Scripts)
To ensure reliable execution and avoid monolithic protocol drops, execute the remote bootstrapping pipeline in four highly structured, modular steps via `run_python_code` (`dev_mode=True`):

1. **Step 1: Administrative Configuration** (`./scripts/1_admin_settings.md`): Verify development workspace state, create the required `"brand"` user attribute if missing, and enforce global embed configurations and domain allowlisting.
2. **Step 2: Project setup** (`./scripts/2_project_setup.md`): Register the new Looker project name and gracefully configure its Git service as a `"bare"` repository.
3. **Step 3: LookML File Synchronization** (`./scripts/3_file_sync.md`): Populate the script payload with the exact contents of the developer's local `lookml/` inventory. Execute the script to push all files and rigorously verify that every local target exists in the remote workspace inventory. Re-synchronize any missing files immediately.
4. **Step 4: Model Registration & Production Deployment** (`./scripts/4_model_deploy.md`): Register the LookML model, validate project relations, explicitly execute a raw REST Git commit (`post("/projects/{id}/git_branch/commit", ...)`), and deploy the workspace to production.
5. **Report Success & Output Clickable UI Model Link**: At the end of the onboarding turn, present a clear summary of what was configured and provide a clickable URL linking directly to the newly deployed model file in the Looker UI, formatted exactly like this:
   ```
   https://{looker_instance_url}/projects/{project_name}/files/embed_demo.model.lkml
   ```
   *(If the file was uploaded into a structured folder, format as `/projects/{project_name}/files/models/embed_demo.model.lkml`)*

---

# Modular Implementation Scripts (`scripts/`)

To keep Code Mode operations fast, modular, and maintainable, this skill encapsulates automation scripts within its `scripts/` directory (`./scripts/`). You should inspect and execute these pre-written scripts via `run_python_code` when assisting developers.

## Onboarding Automation Packages (`./scripts/`)

- [Step 1: Administrative Configuration (`./scripts/1_admin_settings.md`)](./scripts/1_admin_settings.md)
- [Step 2: Project setup (`./scripts/2_project_setup.md`)](./scripts/2_project_setup.md)
- [Step 3: LookML File Synchronization (`./scripts/3_file_sync.md`)](./scripts/3_file_sync.md)
- [Step 4: Model Deployment (`./scripts/4_model_deploy.md`)](./scripts/4_model_deploy.md)
