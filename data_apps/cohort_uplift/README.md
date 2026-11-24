# Repeat & Cross-Category Customer Spend Uplift (Looker Data App)

Editorial scrollytelling cohort study built on the [Looker Data Apps Toolkit (`1.3.0`)](https://www.gstatic.com/looker-data-apps/versions/1.3.0/data-app.js) and the **`embed_demo`** LookML model (`orders_with_share_of_wallet_application` and `order_items`).

## How It Integrates with Looker Embed Demo

- **Auto-Discovery & Selective Activation**: Report Viewer (`/report-viewer`) checks `VITE_LOOKER_FOLDER_ID` (`12542` on `googledemo2`) for a child folder named **`Data Apps`**.
  - When `"Data Apps"` exists and contains one or more dashboards, a collapsible **`DATA APPS`** section renders directly below **`DASHBOARDS`**.
  - When `"Data Apps"` is absent or empty, the **`DATA APPS`** section is hidden automatically—no `.env` changes or redeploy required.
- **Deep Linking (`/report-viewer`)**: Report Viewer syncs the active item to URL search parameters so any Data App, Dashboard, or Look can be shared directly:
  - Dashboards & Data Apps (uses `dashboard.slug` when available, falling back to `dashboard.id`, and accepts either on load):
    `/report-viewer?dashboard=K4HQpuwgccbcTrVvB8Z37l` (or `/report-viewer?dashboard=177`)
  - Looks (uses `look.id`):
    `/report-viewer?look=23`
- **Inherited Folder Permissions**: In Looker, child folders default to `content_metadata.inherits = true`. Creating `"Data Apps"` inside `VITE_LOOKER_FOLDER_ID` (`12542`) automatically inherits `view` access for the shared embed content group (`group_id="8"`, `"Embed Demo Group Shared Content"`). `deploy.py` also registers all 4 `embed_demo` queries in `dashboard_element.rich_content_json` (`data_app_queries_version: 1`) so viewer-only embed users (without `explore` permission) can execute them.

## How Embed Themes Are Passed Into Data Apps

Looker mounts Data App bundles inside a nested `<iframe sandbox="allow-scripts" src="data:text/html;base64,...">` inside `/embed/dashboards/<id>`:

1. **Outer Looker Shell (`?theme=` + Initial-Boot `_theme`)**:
   - Looker applies `?theme=<Brand>_Light` / `<Brand>_Dark` to the outer `/embed/dashboards/<id>` page, and evaluates inline `_theme` JSON overrides (`show_dashboard_header: false`, `page_margin_*: "0px"`, `tile_shadow: false`) via `Turboload` **only on initial iframe document load** (not on SPA `loadUrl()` transitions from `/embed/preload`).
   - `DataAppEmbedFrame` (`frontend/src/routes/report-viewer.tsx`) mounts Data Apps via `new LookerEmbedExSDK().createDashboardWithId(id).withTheme(embedTheme).withParams({ _theme })` so Looker's native dashboard header is hidden (`0px`) on boot.
2. **Inner Sandboxed Data App (`window.top` ↔ `event.source` `postMessage` Bridge)**:
   - Because Looker does not forward `?theme=` or theme CSS variables across the `data:` iframe boundary, `app.js` posts `{ type: 'embed-demo-theme-request' }` to `window.top` at module evaluation time (before `data-app.js` vendor assets finish loading) and in `connectedCallback()`.
   - `PortalContext.tsx` (`window.top`) replies directly to `event.source` with `{ type: 'embed-demo-theme', theme, isDark, brand, accent, palette }` using `BRAND_THEME_PALETTES` (`frontend/src/config/constants.ts`), and broadcasts updates whenever Light/Dark mode or Brand changes.
   - `DataAppEmbedFrame` keeps the outer iframe masked (`backgroundColor: 'var(--background)'`, `opacity: 0 → 1`) until `embed-demo-theme-request` fires, preventing any white flash in Dark Mode.
   - When opened standalone in Looker (outside the Portal), `app.js` falls back cleanly to its default light/dark CSS tokens via OS `prefers-color-scheme`.

```mermaid
sequenceDiagram
    participant Portal as Portal (PortalContext + DataAppEmbedFrame)
    participant Looker as Looker (/embed/dashboards/177?theme=...&_theme=...)
    participant App as Data App (sandbox="allow-scripts" data: iframe)

    Portal->>Looker: createDashboardWithId(177).withTheme(embedTheme).withParams({_theme})
    Note over Portal,Looker: Outer iframe masked (opacity: 0) on var(--background)
    Looker->>App: Mount inline bundle.js inside data:text/html;base64 iframe
    App->>Portal: window.top.postMessage({ type: "embed-demo-theme-request" }, "*")
    Portal->>App: event.source.postMessage({ type: "embed-demo-theme", isDark, brand, palette }, "*")
    Note over App: Sets DataApp.isDark + --app-* / --es-* tokens before first paint
    Note over Portal: Reveals iframe (opacity: 1) with zero white flash
```

### Minimal Theme Listener Pattern for New Data Apps

Any new Data App placed in the `"Data Apps"` subfolder can adopt Portal themes with ~20 lines:

```js
let _earlyTheme = null;
window.addEventListener('message', (e) => {
  if (e?.data?.type === 'embed-demo-theme') _earlyTheme = e.data;
});
if (window.top && window.top !== window) {
  window.top.postMessage({ type: 'embed-demo-theme-request' }, '*');
}

// Inside your DataApp subclass:
connectedCallback() {
  super.connectedCallback();
  const apply = (msg) => {
    if (msg?.type !== 'embed-demo-theme') return;
    this.isDark = Boolean(msg.isDark);
    if (msg.palette) {
      document.documentElement.style.setProperty('--app-bg', msg.palette.bg);
      document.documentElement.style.setProperty('--app-card-bg', msg.palette.surface);
      document.documentElement.style.setProperty('--app-text', msg.palette.ink);
      document.documentElement.style.setProperty('--app-primary', msg.palette.accent);
    }
  };
  if (_earlyTheme) apply(_earlyTheme);
  window.addEventListener('message', (e) => apply(e.data));
}
```

## Looker Instance Prerequisites

1. **Extension Framework**: Enable **Admin → Platform → Extension Framework** (`extension_framework_enabled`). *(Note: Looker 26.24 returns `401` on `db::` `/inline_extension/*/bundle.js` in Cookieless Embed, so `cohort_uplift` is registered as a LookML project `application:` in `lookml/manifest.lkml` served via `/project-resource/public/*`.)*
2. **LookML Model**: Ensure the `embed_demo` model (`orders_with_share_of_wallet_application` and `order_items` explores) and `lookml/data_apps/cohort_uplift.js` are deployed and included in the embed user's model set.
3. **Shared Parent Folder**: Note the target environment's `VITE_LOOKER_FOLDER_ID` (e.g., `12542` on `googledemo2`).

## Deploying Across Environments

1. **Sync the ES module into `lookml/data_apps/cohort_uplift.js`** after editing `data_apps/cohort_uplift/app.js`:

```bash
uv run --script data_apps/cohort_uplift/sync_lookml_bundle.py
```

2. **Push & deploy `manifest.lkml` and `data_apps/cohort_uplift.js`** to the target Looker project (`repo-lookml` workflow; ask for confirmation before `--deploy` on `embed-demo`):

```bash
lkr --oauth-account=<target-account> tools lookml push lookml --project=<project-id> --file=manifest.lkml --reset
lkr --oauth-account=<target-account> tools lookml push lookml --project=<project-id> --file=data_apps/cohort_uplift.js --no-reset --deploy
```

3. **Create or update the `"Data Apps"` subfolder and extension dashboard** via `lkr code-mode sandbox`:

```bash
lkr --oauth-account=<target-account> code-mode sandbox \
  --file=data_apps/cohort_uplift/deploy.py \
  -v parent_folder_id=<LOOKER_FOLDER_ID>
```

### Example (`dev-googledemo2`)

```bash
uv run --script data_apps/cohort_uplift/sync_lookml_bundle.py
lkr --oauth-account=dev-googledemo2 tools lookml push lookml --project=embed-demo --file=manifest.lkml --reset
lkr --oauth-account=dev-googledemo2 tools lookml push lookml --project=embed-demo --file=data_apps/cohort_uplift.js --no-reset --deploy
lkr --oauth-account=dev-googledemo2 code-mode sandbox \
  --file=data_apps/cohort_uplift/deploy.py \
  -v parent_folder_id=12542
```

Re-running `deploy.py` updates the existing `"Repeat & Cross-Category Customer Spend Uplift"` dashboard in place without changing its dashboard ID or slug.
