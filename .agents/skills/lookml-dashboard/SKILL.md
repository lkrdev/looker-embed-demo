---
name: lookml-dashboard
description: Comprehensive standards, UI design principles, tabbed report architecture, and automation patterns for creating and managing modern LookML dashboards using local LookML files and Looker MCP/CLI tools.
---

# Overview & Purpose

The `lookml-dashboard` skill establishes the architectural standards and UI design principles required when creating, beautifying, consolidating, and deploying LookML dashboards (`*.dashboard.lookml`) in this codebase.

Rather than building basic, unstyled reports or relying on Looker UI manual creation, agents must follow a **local-first authoring approach** that emphasizes rich HSL/hex visual theming, semantic KPI colorization, unified filtering, and master **tabbed report consolidation**.

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
Synchronization between local code and remote Looker developer/production workspaces is handled exclusively via the turnkey `lkr-dev-cli` tool (with `[tools]` extra dependencies) and verified via the `looker` MCP server.

- **Push to Development Mode**:
  ```bash
  uvx --from "lkr-dev-cli[tools]" lkr-dev-cli --oauth-account=<oauth_account> tools lookml push lookml --project=<project_name>
  ```
- **Validate Project via MCP**:
  Invoke `call_mcp_tool` on `looker/validate_project` (`{"project_id": "<project_name>"}`) to check for syntax errors, missing fields, or broken relationship assumptions.
- **Deploy to Production**:
  Append `--deploy` to automatically commit and promote local LookML directly to Looker production:
  ```bash
  uvx --from "lkr-dev-cli[tools]" lkr-dev-cli --oauth-account=<oauth_account> tools lookml push lookml --project=<project_name> --deploy
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
  tabs:
  - name: Sales Pulse
    label: Sales Pulse
  - name: Customer Demographics
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

# UI Design & Visual Excellence

Standard Looker dashboards suffer from harsh white backgrounds, unstyled dark text, and generic primary color charts. Agents must elevate reports using curated design system tokens.

## 1. Global Embed Styling (`embed_style`)
Inject `embed_style:` at the root level of every dashboard to soften the canvas background and enforce modern card aesthetics (`12px` border radius).

```yaml
  embed_style:
    background_color: "#f0f4f9"       /* Soft neutral container match */
    show_title: false                 /* Let host app header drive title */
    title_color: "#1f1f1f"
    show_filters_bar: true
    tile_text_color: "#1f1f1f"
    text_tile_text_color: "#1f1f1f"
    tile_separator_color: "#e0e2e6"
    tile_border_radius: 12            /* Modern rounded cards */
    show_tile_shadow: true
```

## 2. Semantic KPI Single Value Tiles
Single value metrics (`type: single_value`) serve as executive anchors. Colorize the primary numbers (`text_color`) to convey semantic meaning aligned with the host application's CSS theme:

- **Revenue / Primary Business Metrics**: Brand Blue (`#0b57d0`)
- **Order Volume / Secondary Growth Metrics**: Brand Indigo / Purple (`#a142f4`)
- **Conversion / Efficiency / Success KPIs**: Success Green (`#1e8e3e`)
- **Units Sold / Return Rates / Warning KPIs**: Warning Amber (`#e37400`)
- **Cancellations / Error KPIs**: Error Red (`#d93025`)

```yaml
  - title: Average Order Value
    name: Average Order Value
    type: single_value
    fields: [order_items.average_sale_price]
    font_size: medium
    text_color: '#1e8e3e'             /* Semantic Success Green */
```

## 3. Curated Visualization Palettes (`series_colors`)
Never rely on browser default chart colors. For `looker_line`, `looker_column`, `looker_bar`, and `looker_pie` visualizations, explicitly wire `series_colors` mapping field identifiers or series labels to harmonious hex tokens.

```yaml
  - title: Monthly Revenue Trend
    type: looker_line
    fields: [order_items.created_month, order_items.total_sale_price]
    series_colors:
      order_items.total_sale_price: '#0b57d0'
```

---

# Filter Architecture & Security Alignment

## 1. Unified Popover Filters
Define shared filters in the `filters:` block and bind them across all dashboard tabs via element `listen:` blocks. Use `ui_config.display: popover` for a compact, modern UI footprint.

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

## 2. Row-Level Security vs. UI Filters
In embedded applications enforcing tenant or brand isolation via LookML Explore `access_filter` (e.g., matching a Looker user attribute like `brand`), **DO NOT declare a dashboard filter for that attribute**. 
Removing redundant UI filters prevents security confusion and allows Looker's underlying query engine to automatically isolate data per authenticated session.

---

# Reference Implementation

See [examples/tabbed_overview.dashboard.lookml](./examples/tabbed_overview.dashboard.lookml) for a complete, production-ready reference implementation demonstrating global embed styling, 24-grid tab layouts, semantic KPI cards, and cohesive chart palettes.
