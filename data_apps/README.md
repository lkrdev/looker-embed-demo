# Looker Data Apps (`data_apps/`)

Version-controlled Looker Data Apps built on the [Looker Data Apps Toolkit (`1.3.0`)](https://www.gstatic.com/looker-data-apps/versions/1.3.0/data-app.js) (`DataApp`, `html`, `nothing`) and the **`embed_demo`** LookML model, embedded as genuine `/embed/dashboards/<id>` Cookieless Embed iframes in Report Viewer (`/report-viewer`).

- **[`cohort_uplift/`](cohort_uplift/README.md)** — Editorial scrollytelling repeat & cross-category spend uplift study (`embed-demo::cohort_uplift`, `#177` / `K4HQpuwgccbcTrVvB8Z37l`).

---

## Adding or Updating a Data App (`data_apps/<app_id>/`)

### 1. Author `data_apps/<app_id>/app.js` (ES Module, Light DOM)
- Import `{ DataApp, html, nothing }` from `'https://www.gstatic.com/looker-data-apps/versions/1.3.0/data-app.js'`.
- **Light DOM CSS (`createRenderRoot() { return this; }`) & Custom Element Registration**: Style against `:root, <my-element>` and `:root.dark-theme, <my-element>.dark-theme` (not `:host`), wrapping content in `.da-container` and mapping `--app-bg`, `--app-card-bg`, `--app-text`, and `--app-primary`. Register and export the element at the bottom of `app.js` so `data-app.js` auto-mounts it:
  ```js
  export const elementName = '<my-element>';
  if (!customElements.get(elementName)) customElements.define(elementName, MyApp);
  export default MyApp;
  ```
- **Zero-Flash Portal Theme Handshake (`window.top` ↔ `event.source`)**:
  ```js
  let _earlyHostTheme = null;
  if (typeof window !== 'undefined') {
    document.documentElement.style.background = 'transparent';
    window.addEventListener('message', (e) => {
      if (e?.data?.type === 'embed-demo-theme') {
        _earlyHostTheme = e.data;
        document.documentElement.classList.toggle('dark-theme', Boolean(e.data.isDark));
        if (e.data.palette?.bg) {
          document.documentElement.style.setProperty('--app-bg', e.data.palette.bg);
          document.documentElement.style.background = e.data.palette.bg;
        }
      }
    });
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: 'embed-demo-theme-request' }, '*');
    }
  }
  ```
  In `connectedCallback()`, apply `_earlyHostTheme` and subscribe to `message` events (`{ type: 'embed-demo-theme', theme, isDark, brand, accent, palette }`), setting `this.isDark = Boolean(msg.isDark)` and falling back to `matchMedia('(prefers-color-scheme: dark)')` when opened standalone in Looker.
- **Queries (`this.lookerModel = 'embed_demo'`)**: Execute queries via `await this.runQuery({ model: 'embed_demo', explore: 'order_items', fields, filters: this.getEffectiveFilters(baseFilters), sorts, limit }, signal)` (pass the `AbortSignal` directly as the 2nd argument—passing `{ signal }` in `data-app.js` `1.3.0` reclassifies it as `options` and drops request cancellation) and re-fetch in `willUpdate(changed)` when `dashboardFilters` or `crossFilters` change.
  - Core `embed_demo` / `order_items` fields (brand-scoped automatically via Looker `access_filter` on `products.brand`):
    - Dimensions: `products.brand`, `products.category`, `products.department`, `order_items.created_date`, `order_items.created_month`, `order_items.status`, `users.id`, `users.created_date`
    - Measures: `users.count`, `order_items.count`, `order_items.order_count`, `order_items.order_count_complete`, `order_items.order_count_returned`, `order_items.count_complete`, `order_items.total_sale_price`, `order_items.average_sale_price`, `products.count`

### 2. Sync LookML Wrapper & Register in `lookml/manifest.lkml`
- Run the shared bundler (covers **all** `data_apps/*/app.js` → `lookml/data_apps/<app_id>.js`; no per-app bundler needed):
  ```bash
  uv run --script data_apps/sync_lookml_bundles.py
  ```
  *(Why LookML `file:` instead of `db::` inline? Looker `26.24` returns `401` on `/inline_extension/*/bundle.js` in Cookieless Embed without a `rack.session` cookie, whereas `/project-resource/public/*` works cookieless; the wrapper appends an uncredentialed `<script type="module" src="blob:...">` so `gstatic` `ACAO: *` imports succeed under CSP `strict-dynamic`.)*
- Add the matching `application: <app_id>` block in [`../lookml/manifest.lkml`](../lookml/manifest.lkml):
  ```lkml
  application: <app_id> {
    label: "<Human Title>"
    file: "data_apps/<app_id>.js"
    mount_points: {
      dashboard_tile: yes
      dashboard_vis: no
      standalone: no
    }
    entitlements: {
      new_window: yes
      core_api_methods: ["run_inline_query", "dashboard", "dashboard_element"]
    }
  }
  ```

### 3. Configure `data_apps/<app_id>/deploy.py` (Code Mode / Monty Contract)
- Copy [`cohort_uplift/deploy.py`](cohort_uplift/deploy.py) and customize `_raw_title`, `_app_id = "<app_id>"`, and `query_specs`:
  - **No `print()` statements & top-level `return {...}`**: `print()` corrupts Code Mode MCP JSON-RPC `stdout`; Monty evaluates `deploy.py` inside an implicit wrapper where a top-level `return {...}` returns the result (parsed by `ast.parse` in `backend/tests/test_data_apps.py`, intentionally excluded from `ruff`).
  - **Monty optional inputs**: Use `try/except NameError` (Monty omits `globals()`).
  - **Viewer-tier `rich_content_json` (`data_app_queries_version: 1`)**: Enforced by Looker's host (`ExtensionFrame2`)—register every base query (`model`, `view`, `fields`, `filters`, `sorts`, `limit` matching `app.js`'s `this.runQuery` calls) in `query_specs` so Viewer embed users without `explore` permission can run them.

### 4. Verify All Repo Checks in One Command
- Run [`../check.sh`](../check.sh) from the repository root (auto-resolves `nvm`/`pnpm`/`uv` `PATH`s, verifies `sync_lookml_bundles.py --check`, and runs `pytest`, `ruff`, `ty`, `tsc --noEmit`, `vitest`, and `pnpm run build`):
  ```bash
  ./check.sh
  ```
- Note on `git grep`: `lookml/data_apps/*.js` are generated single-line bundles (`linguist-generated=true -diff` in `.gitattributes`); pass `-- ':!lookml/data_apps'` when grepping across the repo.

### 5. How Report Viewer Discovers & Embeds Data Apps (`No Frontend Code Edits Needed`)
- `useSharedReports` ([`../frontend/src/hooks/useFolderReports.ts` (`L16–59`)](../frontend/src/hooks/useFolderReports.ts)) inspects `VITE_LOOKER_FOLDER_ID` (`constants.ts:76-95, 127-130`) for a `"Data Apps"` child folder (inheriting `group_id="8"` ACLs automatically) and lists all dashboards in it under **`DATA APPS`** in [`../frontend/src/routes/report-viewer.tsx` (`L460–499`)](../frontend/src/routes/report-viewer.tsx).
- Selecting a Data App syncs `/report-viewer?dashboard=<slug|id>` (`report-viewer.tsx:42-51, 268-310`) and mounts `DataAppEmbedFrame` (`report-viewer.tsx:58-172`) via `LookerEmbedExSDK.createDashboardWithId(id).withTheme(embedTheme).withParams({ _theme: DATA_APP_THEME_OVERRIDE })` (initial-boot `_theme` hides Looker's native dashboard header), while [`../frontend/src/context/PortalContext.tsx` (`L49–93`)](../frontend/src/context/PortalContext.tsx) replies directly via `event.source.postMessage` on `embed-demo-theme-request`.
