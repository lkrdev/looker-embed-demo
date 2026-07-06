# Report Viewer Demo Script & Guide

The Report Viewer page (`/report-viewer`) demonstrates how organizations can deliver a curated, self-service content library within their custom portal. Rather than restricting users to a hardcoded list of navigation tabs, Report Viewer dynamically reads from Looker's folder ecosystem to display shared corporate dashboards alongside personal reports created by individual users.

This page showcases a powerful hybrid architecture: the left-hand navigation sidebar is a native, headless React tree built using Looker SDK folder API calls (`useSharedReports` and `usePersonalReports`), while the right-hand display area leverages the shared `GlobalLookerContainer` iframe to render the selected dashboard or Look on demand.

This guide walks through how to present the Report Viewer content library and self-service reporting loop during a live technical or customer demo.

---

## Global Library Controls & Tiering
* **Collapsible Content Folders**: Separates analytical assets into clean organizational tiers: **Corporate Dashboards** (shared instance content), **My Created Reports** (user personal folder), and **Corporate Looks** (standalone saved visualizations).
* **Live Folder Refresh (**`RefreshCw`**)**: Allows users to poll Looker's backend for newly created or updated reports in real time without reloading the application.
* **Inline Report Deletion (**`Trash2`**)**: Gives users direct content management control over their personal creations, executing Looker SDK delete mutations directly from the portal interface.

---

## Page Features & Walkthrough

![Image](images/report_viewer_demo_script/kix.49cgxe3djzuh.png)

### Section 1: Headless Folder Navigation & Instant Iframe Routing

The core technical differentiator of Report Viewer is how it separates content discovery (headless REST API) from content visualization (embedded iframe).

| Feature / Capability | Looker Architecture | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Dynamic Content Catalog | Looker SDK `folder_dashboards` & `folder_looks<br>` | Asynchronously queries folder ID `12542` and the user's personal folder to construct an interactive React sidebar tree. | Proves that portal administrators can publish new dashboards to client folders in Looker without requiring code changes or application redeployments. |
| Preloaded Iframe Repositioning | `GlobalLookerContainer` + `navigateIframe<br>` | When a user clicks a report in the sidebar, the application updates the iframe src without unmounting or reloading the iframe container. | Eliminates iframe warmboot delays and white screens, delivering instantaneous tab-switching performance. |
| Dual-Scope Folder Isolation | Tenant Folder vs. Personal Space | Seamlessly combines corporate published assets with user-specific scratchpad content in a unified UI. | Allows enterprises to distribute standardized executive reporting while empowering power users to build and save their own customized views. |

#### Demo Script

*"When we open the Report Viewer, notice how we've combined a custom React sidebar with an embedded Looker viewer. The list of folders on the left isn't hardcoded into our frontend code; our application is calling the Looker API in real time to fetch the available dashboards and Looks assigned to this user's folder.*

*"Watch how fast the visualization changes when I click between 'Brand Overview', 'Sales Performance', and 'Customer Demographics'. Because we use a preloaded iframe container, switching reports doesn't trigger typical loading delays. Best of all, if your data team builds a new dashboard in Looker and drops it into the client's folder, it appears here instantly for your users—zero engineering tickets or app redeployments required."*

---

### ![Image](images/report_viewer_demo_script/kix.u6zd3s6gqlne.png)![Image](images/report_viewer_demo_script/kix.jbt6nueftywa.png)

### Section 2: End-to-End Self-Service Reporting Loop

Report Viewer serves as the consumption hub for Looker's self-service analytics engine, seamlessly connecting with Query Explorer (`/explore`) and Report Builder (`/report-builder`).

| Demonstration Step | Portal Action | Observed Behavior | Talk Track Alignment |
| --- | --- | --- | --- |
| 1. Initiate Report Creation | Click **+ Create New Report** button in sidebar header | Application transitions user to the `/explore` ad-hoc visual query builder. | *"When power users need an answer that isn't in a standard corporate dashboard, we give them a direct path to self-service creation."* |
| 2. Build & Save Content | In Explore, select fields -> Click **Settings** (gear icon) -> Save as Look to Personal Folder | Looker compiles LookML schema, executes query, and stores visualization in the user's personal Looker space. | *"Users can drag and drop dimensions and measures, format charts, and save custom reports directly to their personal workspace."* |
| 3. Refresh & Consume | Return to `/report-viewer` -> Click **Refresh** icon -> Expand **My Created Reports** | The newly created report appears in the React sidebar tree; clicking it renders the visualization immediately. | *"When we jump back to Report Viewer and hit refresh, our API pulls the new report into their personal folder. They can view, manage, or delete their custom creations right here."* |

---

## Technical Architecture & API Reference Table

| Component / Feature | Looker SDK / API Method | Architecture & Data Flow | Why It Matters |
| --- | --- | --- | --- |
| Shared Reports Hook (`useSharedReports`) | `sdk.folder_dashboards(LOOKER_FOLDER_ID)<br>``sdk.folder_looks(LOOKER_FOLDER_ID)<br>` | Fetches published dashboards and Looks from corporate folder ID `12542`, mapping titles and IDs to frontend React state. | Delivers centralized, governance-controlled corporate reporting to all authenticated tenant users. |
| Personal Reports Hook (`usePersonalReports`) | `sdk.me()` -> `sdk.folder_dashboards(user.personal_folder_id)<br>` | Retrieves the authenticated user's unique Looker identity to query their isolated personal workspace folder. | Enables personalized multi-tenant self-service without risking data or report leakage between users. |
| Report Deletion Handler | `sdk.delete_dashboard(id)<br>``sdk.delete_look(id)<br>` | Executes API deletion mutation when user confirms trash icon click, triggering automatic client data refresh. | Empowers users with full lifecycle management over their saved analytical assets directly from the UI. |
| Iframe Navigation Bridge | `navigateIframe('/embed/dashboards/' + id)<br>` | Updates the URL location target of the persistent Looker iframe container overlaying the `/report-viewer` route anchor. | Achieves smooth, SPA-like navigation speeds while embedding complex external reporting engines. |


