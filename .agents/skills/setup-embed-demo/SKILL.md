---
name: setup-embed-demo
description: Automated onboarding and provisioning skill that sets up the Looker Embed Demo project, database connection, LookML files via `lkr` CLI, LookML model configuration, brand user attribute, and instance embed settings on a new Looker instance.
---

# Overview & Purpose

The `setup-embed-demo` skill provides a completely comprehensive, turnkey onboarding workflow. When a developer clones this repository and asks to *"setup the embed demo"*, the assisting LLM follows this mandatory execution pipeline to validate prerequisites, capture environment selections, configure instance user attributes and embed security allowlists, instantiate the project and LookML model, push local files via the `lkr` CLI, and link the model to production.

> [!CRITICAL]
> **1. NEVER write ad-hoc scratch local Python scripts** to perform these tasks. Rely exclusively on the modular scripts in `./scripts/` and the `lkr` CLI turnkey commands.
> **2. The `print()` Statement Trap (Stdio IPC Stream Corruption)**: `lkr_dev_cli_codemode` uses `stdio` to transport JSON-RPC messages between the MCP server and the host client. If any Python code executed via `run_python_code` contains standard `print()` statements, the printed text is written directly into `stdout`, corrupting the underlying JSON-RPC communication channel and permanently crashing the client connection (`invalid character ... looking for beginning of value`). **NEVER use `print()` or write to `stdout` inside Code Mode scripts.** Log messages must be accumulated in an output dictionary or written strictly to `sys.stderr`.

---

# Mandatory Execution Steps

## 1. Authentication & Environment Variable Verification
Before running configuration logic:
- Confirm that Looker API credentials are configured via standard Looker SDK environment variables or that the active OAuth account is known via `uvx --from lkr-dev-cli lkr auth list`.
- **Verify via Code Mode**: Verify SDK credentials by executing [./scripts/verify_credentials.md](./scripts/verify_credentials.md) via `run_python_code`. This script invokes `me()` to confirm a valid user and checks Admin privileges.

## 2. Onboarding & Alignment Prompting
Interactively establish active environment targets with the user:
1. **Target Project Name**: Ask the user what Looker project name to use (suggesting `embed-demo` as the default).
2. **Database Connection Selection**:
   - Query `all_connections()` to list existing Looker database connections.
   - Filter for suitable BigQuery (`"bigquery_standard_sql"`) connections. If none exists, offer to create a working placeholder via `create_connection(...)`.
   - Ask the user to confirm the exact connection name.
3. **Embed Domain Capture**:
   - Check if `LOOKER_EMBED_DOMAIN` is successfully configured in the user's local `.env` file.
   - If `.env` is inaccessible or missing the domain, explicitly ask the user for their target embed domain (e.g., `https://localhost:8008`).

## 3. Persisting Local Targets (`.env`)
Ensure all confirmed choices are written directly into the developer's **`.env`** file (and **`.env.example`**):

```env
LOOKER_PROJECT_NAME=embed-demo
LOOKER_CONNECTION_NAME=looker-private-demo
LOOKER_EMBED_DOMAIN=https://localhost:8008
VITE_LOOKER_INSTANCE_URL=https://googledemo2.cloud.looker.com
```

## 4. Onboarding Execution Pipeline (Modular Steps + CLI)
To ensure highly reliable execution and clear division of responsibilities, run the onboarding pipeline in these four discrete steps:

1. **Step 1: Administrative Configuration** (`./scripts/1_admin_settings.md`): Execute via `run_python_code` (`dev_mode=True`) to create the required `"brand"` user attribute and enforce global embed configurations and domain allowlisting.
2. **Step 2: Project setup** (`./scripts/2_project_setup.md`): Execute via `run_python_code` (`dev_mode=True`) to register the Looker project name and configure its Git service as a `"bare"` repository.
3. **Step 3: LookML Push & Production Deployment**: In the terminal, run the state-of-the-art `lkr` CLI command to push all local LookML files and deploy them to production:
   ```bash
   uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account_name> tools lookml push lookml --project=<looker_project_name> --deploy
   ```
   *(Match `oauth_account_name` from `lkr auth list` using the target instance URL.)*
4. **Step 4: Model Registration** (`./scripts/4_register_model.md`): Execute via `run_python_code` (`dev_mode=True`) to link the model name to the target project and database connections.
5. **Report Success & Output Clickable UI Model Link**: At the end of the onboarding turn, present a clear summary of what was configured and provide a clickable URL linking directly to the newly deployed model file in the Looker UI, formatted exactly like this:
   ```
   https://{looker_instance_url}/projects/{project_name}/files/embed_demo.model.lkml
   ```
   *(If the file was uploaded into a structured folder, format as `/projects/{project_name}/files/models/embed_demo.model.lkml`)*

---

# Modular Implementation Packages (`scripts/`)

To keep operations fast, modular, and maintainable, this skill encapsulates automation scripts within its `scripts/` directory (`./scripts/`).

## Onboarding Packages

- [Step 1: Administrative Configuration (`./scripts/1_admin_settings.md`)](./scripts/1_admin_settings.md)
- [Step 2: Project Setup (`./scripts/2_project_setup.md`)](./scripts/2_project_setup.md)
- [Step 4: Model Registration (`./scripts/4_register_model.md`)](./scripts/4_register_model.md)
- [Verify Credentials (`./scripts/verify_credentials.md`)](./scripts/verify_credentials.md)

*(Note: Legacy scripts `3_file_sync.md` and `4_model_deploy.md` are deprecated in favor of the `lkr tools lookml push` CLI workflow.)*
