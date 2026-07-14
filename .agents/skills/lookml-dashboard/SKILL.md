---
name: lookml-dashboard
description: Comprehensive standards, UI design principles, tabbed report architecture, and automation patterns for creating and managing modern LookML dashboards using local LookML files and Looker MCP/CLI tools.
---

# Overview & Purpose

The `lookml-dashboard` skill establishes the architectural standards and UI design principles required when creating, beautifying, consolidating, and deploying LookML dashboards (`*.dashboard.lookml`) in this codebase.

Rather than building basic, unstyled reports or relying on Looker UI manual creation, agents must follow a **local-first authoring approach** that emphasizes rich HSL/hex visual theming, semantic KPI cards, interactive filtering, dual Y-axis precision, and master **tabbed report consolidation**.

---

# Core Architectural Workflow

## 1. Local First Authoring (CRITICAL)
All LookML dashboards are defined as code inside the repository under `lookml/dashboards/`.
1. Create or edit `.dashboard.lookml` files locally using standard file tools (`write_to_file` / `replace_file_content`).
2. Verify that the central LookML model file (`lookml/models/*.model.lkml`) explicitly imports the dashboards:
   ```lkml
   include: "/dashboards/**/*.dashboard.lookml"
   ```

## 2. Synchronization & Deployment Lifecycle
Synchronization between local code and remote Looker developer/production workspaces is handled exclusively via the turnkey `lkr-dev-cli` CLI tool (`uvx --from lkr-dev-cli lkr`) and verified via the `looker` MCP server.

- **Push to Development Mode (Single File Preferred for Edits)**:
  ```bash
  # Preferred for editing single dashboards: Push single file (preserves remote orphans)
  uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account> tools lookml push lookml --project=<project_name> --file=dashboards/brand_overview.dashboard.lookml

  # Bulk changes or setup: Push full lookml directory
  uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account> tools lookml push lookml --project=<project_name>
  ```
- **Validate Project via MCP**:
  Invoke `call_mcp_tool` on `looker/validate_project` (`{"project_id": "<project_name>"}`) to check for syntax errors, missing fields, or broken relationship assumptions.
- **Deploy to Production Policy**:
  - **Project `embed-demo`**: Never append `--deploy` automatically. Always ask user for confirmation before deploying to production on `embed-demo`.
  - **Other Projects**: `--deploy` can be appended automatically to commit and deploy to production.
  ```bash
  uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account> tools lookml push lookml --project=<other_project> --file=dashboards/brand_overview.dashboard.lookml --deploy
  ```

### One-Way Mirroring & Orphan Cleanup
`lkr-dev-cli` enforces strict one-way mirroring. When consolidating multiple standalone dashboards into a single tabbed dashboard, delete the obsolete local files. Launching `push` automatically purges remote orphan dashboards on the Looker server.

---

# Deep Dive: Tabbed Report Architecture

To prevent dashboard sprawl, reduce cognitive load, and eliminate redundant filter definitions, combine related subject areas into discrete tabs within a single master dashboard.

## 1. Defining Tabs
Declare the tab structure at the dashboard root level using `tabs:`. Each tab requires a unique internal `name` and a user-facing `label`.

```yaml
- dashboard: brand_overview
  title: Brand Overview
  layout: newspaper
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  tabs:
  - name: Sales Pulse
    label: Sales Pulse
  - name: Customers
    label: Customers
  - name: Orders & Logistics
    label: Orders & Logistics
```

## 2. Assigning Elements to Tabs
Every tile in the `elements:` array MUST specify its host tab via the `tab_name:` parameter.

```yaml
  elements:
  - title: Total Revenue
    name: Total Revenue
    type: single_value
    # ...
    tab_name: Sales Pulse
```

## 3. Tab Grid Coordinate System
Looker's `newspaper` layout operates on a standard **24-column grid** (`col: 0` to `col: 18` for width 6 tiles). 
In a tabbed dashboard, **each tab maintains its own isolated vertical layout**. Tiles sharing identical `row` and `col` coordinates will not collide if they are assigned to different `tab_name` values. Always reset `row: 0` for the top KPI banner of each respective tab.

---

# UI Design, Advanced Vis Config & Visual Excellence

## 1. Global Embed Theme Inheritance vs Explicit Styling
When dashboards are embedded within a host application that supplies a global Looker embed theme (e.g., `VITE_THEME`), **do not hardcode explicit `embed_style:` blocks or per-element `text_color:` / `series_colors:` properties** unless explicitly requested. Allowing the dashboard to inherit styling from the global theme guarantees seamless visual consistency with the host application.

## 2. Identifier Naming Rules (CRITICAL)
Looker LookML validation strictly forbids period (`.`) characters inside element `name:` or filter `name:` identifiers.
- **Correct**: `name: Acquisition Value vs Volume by Traffic Source`
- **Incorrect**: `name: Acquisition Value vs. Volume by Traffic Source` (fails validation due to period after `vs`)

## 3. Advanced Visualization Configuration (`advanced_vis_config`)
When customizing chart visualizations, agents should reference official Looker Chart Config Editor documentation and sub-links for full Highcharts formatting options and syntax context:
- **Looker Chart Config Editor Documentation**: https://docs.cloud.google.com/looker/docs/chart-config-editor

For cartesian (`looker_line`, `looker_column`, `looker_bar`, `looker_area`) and pie/donut (`looker_pie`) charts, use Highcharts JSON overrides (`defaults_version: 1` + `advanced_vis_config`) to modernize chart geometry:
- **Rounded Containers & Series**: Apply `borderRadius: 12` to containers and `borderRadius: 8` to columns/bars.
- **Donut Pie Geometry**: Use `innerSize: "75%"` and `borderWidth: 0` for sleek donut charts.
- **Clean Tooltip Inheritance**: Enable `shadow: true` on tooltips without hardcoding opaque background colors.

```yaml
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
```

## 4. Dual Y-Axis & Unpinned Scaling Architecture
When plotting two measures with completely different units or numeric ranges (e.g., Total Revenue in dollars vs. Units/Users/Orders count), combining them onto a single Y-axis causes severe vertical compression.
Always configure **Dual Y-Axes** (`y_axis_combined: false`) with explicit `left` and `right` axis mappings, and unpin axes from 0 (`y_axis_unpinned: true` / `unpinAxis: true`) for optimal data resolution:

```yaml
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Total Revenue
      orientation: left
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Units Sold
      orientation: right
      series:
      - id: order_items.count
        name: Units Sold
        axisId: order_items.count
      showLabels: true
      showValues: true
      unpinAxis: true
```

## 5. Legend Positioning (`legend_position`)
Always set `legend_position:` to valid Looker values (`center`, `top`, `right`, or `none`). Never use unsupported values like `bottom` or `left`, which default to squishing legends vertically over Y-axis labels.

---

# Filter Architecture & Interactive Controls

## 1. Cross-Filtering Enablement
Include `crossfilter_enabled: true` at the root dashboard level so users can click chart bars, slices, or data points to dynamically filter all listening tiles across the active view.

## 2. Unified Popover Filters (`filters:` block)
Define global filters in the `filters:` block and bind them across all dashboard elements via element `listen:` blocks. Use `ui_config.display: popover` for a clean UI footprint.

```yaml
  filters:
  - name: Date Range
    title: Date Range
    type: date_filter
    default_value: 90 days
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
```

## 3. Placing Filters Directly on the Dashboard Grid (`type: filter`)
In addition to global filter bars, interactive filter controls can be placed directly onto the dashboard grid or inside specific tabs as element tiles using `type: filter`:

```yaml
  elements:
  - type: filter
    name: Product Category
    row: 0
    col: 0
    width: 12
    height: 2
    tab_name: Sales Pulse
```

## 4. Row-Level Security vs. UI Filters
In embedded applications enforcing tenant or brand isolation via LookML Explore `access_filter` (e.g., matching a Looker user attribute like `brand`), **DO NOT declare a dashboard filter for that attribute**. 
Removing redundant UI filters prevents security confusion and allows Looker's underlying query engine to automatically isolate data per authenticated session.

---

# Reference Implementations

See the following examples in [`examples/`](./examples/) for production-ready LookML patterns:
- [`examples/advanced_vis_config.dashboard.lookml`](./examples/advanced_vis_config.dashboard.lookml): Demonstrates Highcharts `advanced_vis_config` JSON customization, dual left/right Y-axes, unpinned axis scaling, and centered legends.
- [`examples/filters_as_tiles.dashboard.lookml`](./examples/filters_as_tiles.dashboard.lookml): Demonstrates placing interactive filter controls directly onto dashboard canvas tabs alongside global filter bars and cross-filtering.
- [`examples/tabbed_overview.dashboard.lookml`](./examples/tabbed_overview.dashboard.lookml): Demonstrates complete 24-grid tabbed report layout architecture.
