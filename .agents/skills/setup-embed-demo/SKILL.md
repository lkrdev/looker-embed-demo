---
name: setup-embed-demo
description: Automated onboarding and provisioning skill that sets up the Looker Embed Demo project, database connection, LookML files via `lkr-dev-cli` CLI, LookML model configuration, brand user attribute, and instance embed settings on a new Looker instance.
---

# Overview & Purpose

The `setup-embed-demo` skill provides a completely comprehensive, turnkey onboarding workflow. When a developer clones this repository and asks to *"setup the embed demo"*, the assisting LLM follows this mandatory execution pipeline to validate prerequisites, capture environment selections, configure instance user attributes and embed security allowlists, instantiate the project and LookML model, push local files via the `lkr-dev-cli` CLI, and link the model to production.

> [!CRITICAL]
> **1. Use Code Mode MCP for ANY and ALL Scripting**: NEVER write ad-hoc scratch local Python scripts or use `uv run` in the shell to perform onboarding or Looker API tasks. You must execute any and all Python scripting strictly through the `run_python_code` tool provided by the `lkr_codemode` or `lkr_dev_cli_codemode` MCP server. When executing modular scripts or custom logic, always invoke `call_mcp_tool` (or the native eager equivalent) specifying `ServerName: "lkr_codemode"` (or `"lkr_dev_cli_codemode"`), `ToolName: "run_python_code"`, and passing the script content in the `code` argument.
> **2. The `print()` Statement Trap (Stdio IPC Stream Corruption)**: `lkr_dev_cli_codemode` uses `stdio` to transport JSON-RPC messages between the MCP server and the host client. If any Python code executed via `run_python_code` contains standard `print()` statements, the printed text is written directly into `stdout`, corrupting the underlying JSON-RPC communication channel and permanently crashing the client connection (`invalid character ... looking for beginning of value`). **NEVER use `print()` or write to `stdout` inside Code Mode scripts.** Log messages must be accumulated in an output dictionary or written strictly to `sys.stderr`.

---

# Mandatory Execution Steps

## 1. Authentication & Environment Variable Verification
Before running configuration logic:
- Confirm that Looker API credentials are configured via standard Looker SDK environment variables or that the active OAuth account is known via `uvx --from lkr-dev-cli lkr auth list`.
- **Looker Core Sudo / Impersonation Issue**: Ask the user: *"Are you setting up on a Looker Core instance?"* On Google Cloud Looker Core instances, sudo authentication and embed user impersonation can fail if the API client credentials belong to a standard user account with email login credentials or identity provider SSO. If on Looker Core, **ensure a dedicated Service Account user** (created in Looker Admin -> Users with NO email credentials and no web login access, only API keys) is provisioned and its API Client ID and Secret (`LOOKERSDK_CLIENT_ID` / `LOOKERSDK_CLIENT_SECRET`) are used in `.env`.
- **Verify strictly via Code Mode MCP**: Verify SDK credentials by executing [./scripts/verify_credentials.md](./scripts/verify_credentials.md) strictly through the Code Mode MCP tool (`call_mcp_tool` or eager equivalent with `ServerName: "lkr_codemode"`, `ToolName: "run_python_code"`, `Arguments: {"code": "<content>"}`). **Do not write scratch Python scripts or use `uv run` to perform this check.** This script invokes `me()` to confirm a valid user and checks Admin privileges.

## 2. Onboarding & Alignment Prompting
Interactively establish active environment targets with the user:
1. **Target Project Name**: Ask the user what Looker project name to use (suggesting `embed-demo` as the default).
2. **Database Connection & PDT Temp Schema Selection**:
   - Query `all_connections()` to list existing Looker database connections.
   - Filter for suitable BigQuery (`"bigquery_standard_sql"`) connections. If none exists, offer to create a working placeholder via `create_connection(...)`.
   - Ask the user to confirm the exact connection name.
   - **PDT Temp Schema Verification (Argolis / BigQuery)**: Ask the user to confirm that a Persistent Derived Table (PDT) temp schema / scratch dataset (e.g., `looker_scratch`) has been enabled and configured on the database connection in Looker Admin -> Connections. PDT temp schemas are required for derived tables, Jaccard affinity models, and BigQuery ML graph analytics.
3. **Embed Domain Allowlist Capture**:
   - Check if `LOOKER_EMBED_DOMAIN` is configured in `.env` (e.g., `https://localhost:8008`).
   - Standard localhost addresses (`http://localhost:3000`, `http://localhost:8008`, `http://localhost:5173`, `https://localhost:8008`) plus the target domain will automatically be added to Looker's instance embed domain allowlist.
4. **Brand Website & Styling Discovery**:
   - Allow for pasting a customer website URL in theme setup to automatically extract theme colors, typography, palettes, and custom CSS styling for Light and Dark embed themes.

## 3. Persisting Local Targets (`.env`)
Ensure all confirmed choices are written directly into the developer's **`.env`** file (and **`.env.example`**):

```env
LOOKER_PROJECT_NAME=embed-demo
LOOKER_CONNECTION_NAME=looker-private-demo
LOOKER_EMBED_DOMAIN=https://localhost:8008
VITE_LOOKER_INSTANCE_URL=https://googledemo2.cloud.looker.com
VITE_DASHBOARD_ID=embed_demo::brand_overview
VITE_DASHBOARD_DATE_FILTER_NAMES="Date Range,Date"
VITE_CHAT_AGENT_ID=ea1262d262ab43b1a9bb23152f25c236
VITE_LOOKER_FOLDER_ID=12542
```

> [!NOTE]
> If embedding a custom dashboard via `VITE_DASHBOARD_ID`, ensure `VITE_DASHBOARD_DATE_FILTER_NAMES` matches the exact LookML date filter name(s) defined on that dashboard so that the top date picker applies filters correctly.

## 4. Onboarding Execution Pipeline (Modular Steps + CLI)
To ensure highly reliable execution, absolute security sandboxing, and clear division of responsibilities, you must run the onboarding pipeline in these discrete steps. **Under NO circumstances are you permitted to write temporary or scratch Python files to the disk and execute them via `uv run`, `python3`, or similar terminal commands.** All scripting MUST be executed strictly inside the Code Mode MCP sandbox.

1. **Step 1: Administrative Configuration & Domain Allowlist** (`./scripts/1_admin_settings.md`): Read the contents of `1_admin_settings.md` and execute it strictly via Code Mode MCP to provision the required `"brand"` user attribute, verify/create the shared content access group (`"Embed Demo Users"` with `"can_add_to_content_metadata": True`), enable cookieless embed v2/SSO, and add standard localhost addresses (`http://localhost:3000`, `http://localhost:8008`, `http://localhost:5173`, `https://localhost:8008`) plus the target domain to the Looker instance embed domain allowlist. **IMPORTANT:** Replace the default group ID (`"8"`) in `backend/app/models.py`, `frontend/src/config/constants.ts`, and `frontend/src/components/dialogs/UserDetailsDialog.tsx` with the returned `group_id`.
2. **Step 2: Project setup** (`./scripts/2_project_setup.md`): Read the contents of `2_project_setup.md` and execute it strictly via Code Mode MCP to register the Looker project name and configure its Git service as a `"bare"` repository.
3. **Step 3: LookML Push & Production Deployment**: In the terminal, run the `lkr-dev-cli` (or `lkr`) turnkey command to push all local LookML files and deploy them to production:
   ```bash
   uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account_name> tools lookml push lookml --project=<looker_project_name> --deploy
   ```
   *(Match `oauth_account_name` from `uvx --from lkr-dev-cli lkr auth list` using the target instance URL.)*
4. **Step 4: Model Registration**: Execute `create_lookml_model` strictly via an inline Code Mode MCP tool call to link the model name to the target project and database connections:
   ```python
   import os
   target_project = os.getenv("LOOKER_PROJECT_NAME", "embed-demo")
   target_connection = os.getenv("LOOKER_CONNECTION_NAME", "looker-private-demo")
   create_lookml_model(body={
       "name": "embed_demo",
       "project_name": target_project,
       "allowed_db_connection_names": [target_connection],
       "unlimited_db_connections": False
   })
   ```
5. **Step 5: Create Embed Themes (Light & Dark)**: Leverage the `embed-themes` skill as a mandatory part of setup to programmatically create Light and Dark embed themes (`<brand>_Light` and `<brand>_Dark`) with `show_dashboard_header=True` and `show_title=False`. Allow for pasting a customer website URL to extract brand colors, palettes, and CSS styling.
6. **Step 6: Provision Looker Conversational Analytics Agent (`VITE_CHAT_AGENT_ID`)**: As a mandatory part of setup, create or verify a Looker Conversational Analytics agent linked to the newly deployed LookML model/explore (e.g. `embed_demo`) using `looker-cli` / `lkr-dev-cli` or Code Mode MCP. Capture the returned agent ID (`agent_id`) and save it as `VITE_CHAT_AGENT_ID` in `.env`.
7. **Step 7: Create Homepage KPI & AI Executive Briefing Queries**: Programmatically create or verify the required Looker saved queries for the eCommerce homepage:
   - Three single-value KPI queries against the `order_items` explore: Total Revenue (`KPI_TOTAL_REVENUE_QUERY_ID`), Total Orders (`KPI_TOTAL_ORDERS_QUERY_ID`), and Average Order Value (`KPI_AVERAGE_ORDER_VALUE_QUERY_ID`).
   - One query against the **AI Executive Briefing** explore (`embed_demo::ai_executive_briefing`) to power executive insights.
8. **Step 8: Shared Folder Setup, Group Access & LookML Dashboard Move** (`./scripts/7_setup_folder_and_dashboards.md`): Execute [./scripts/7_setup_folder_and_dashboards.md](./scripts/7_setup_folder_and_dashboards.md) strictly via Code Mode MCP to:
   - Create a folder named `"Embed Demo Dashboards"` inside Looker's Shared root folder.
   - Grant view-only permission on this folder to the created `"Embed Demo Users"` group (`update_folder_access_list`).
   - Use Looker's internal API `PUT /api/internal/lookml_dashboards/move` endpoint to move the LookML dashboards (`embed_demo::brand_overview`, `embed_demo::bq_graph_analytics`, `embed_demo::shipping_overview`) into the created folder:
     ```json
     {
         "method": "put",
         "dashboard_ids": [
             "embed_demo::brand_overview",
             "embed_demo::bq_graph_analytics",
             "embed_demo::shipping_overview"
           ],
         "folder_id": "<folder_id>"
     }
     ```
   - Persist the returned `folder_id` as `VITE_LOOKER_FOLDER_ID` in `.env` and `frontend/src/config/constants.ts`.
9. **Step 9: Optional Module Opt-In**: Ask the user if they would like to enable optional plug-and-play modules (such as the Looker GE ADK Agent).
10. **Step 10: Report Success & Output Clickable UI Model Link**: At the end of the onboarding turn, present a clear summary of what was configured and provide a clickable URL linking directly to the newly deployed model file in the Looker UI, formatted exactly like this:
    ```
    https://{looker_instance_url}/projects/{project_name}/files/embed_demo.model.lkml
    ```

---

# Modular Implementation Packages (`scripts/`)

To keep operations fast, modular, and maintainable, this skill encapsulates automation scripts within its `scripts/` directory (`./scripts/`).

## Onboarding Packages

- [Step 1: Administrative Configuration (`./scripts/1_admin_settings.md`)](./scripts/1_admin_settings.md)
- [Step 2: Project Setup (`./scripts/2_project_setup.md`)](./scripts/2_project_setup.md)
- [Step 8: Folder Setup & LookML Dashboard Move (`./scripts/7_setup_folder_and_dashboards.md`)](./scripts/7_setup_folder_and_dashboards.md)
- [Verify Credentials (`./scripts/verify_credentials.md`)](./scripts/verify_credentials.md)
