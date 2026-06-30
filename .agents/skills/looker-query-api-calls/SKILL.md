---
name: looker-query-api-calls
description: Guidelines and architectural best practices for executing Looker SDK data queries, comparing static IDs (run_query) vs dynamic queries (run_inline_query), and choosing between json and json_detail result formats for HTML/currency consistency.
---

# Looker SDK Data Query Architecture & API Calls

When building custom data-driven React experiences with the Looker SDK (`lookerBrowserSdk`), you must choose the appropriate query execution method (`run_query` vs. `run_inline_query`) and response formatting (`json` vs. `json_detail`). This skill defines the standards for data querying in this repository.

---

## 1. Query Execution: Static ID (`run_query`) vs. Dynamic (`run_inline_query`)

### A. Static Query ID (`run_query`) - *Preferred for Application KPIs*
Executing a query against a static Looker Query ID runs an existing, pre-compiled query definition stored on the Looker server.

```typescript
const response = await lookerBrowserSdk.ok(
  lookerBrowserSdk.run_query({
    query_id: queryId, // e.g., KPI_TOTAL_REVENUE_QUERY_ID from constants.ts
    result_format: 'json_detail',
    apply_formatting: true,
    limit: 1,
    cache: false
  })
)
```

- **Why This Application Uses Static IDs**: For our eCommerce home page KPI cards (`useKpiQuery`), this application uses **static query IDs** (defined in `src/config/constants.ts` such as `KPI_TOTAL_REVENUE_QUERY_ID`, `KPI_TOTAL_ORDERS_QUERY_ID`, and `KPI_AVERAGE_ORDER_VALUE_QUERY_ID`).
- **Benefits**:
  - **Decoupled Architecture**: Query logic (dimensions, measures, filters, formatting) is managed centrally in Looker; modifying a KPI definition does not require frontend code deployments.
  - **Network Efficiency**: Sends a lightweight query ID string rather than transmitting large JSON query body payloads over the wire.
  - **Optimized Performance**: Leverages Looker's server-side query optimization and backend query caching.
- **When to Use**: Standard home page KPI cards, fixed overview summaries, and any stable application metrics where field selection and core filtering rules remain constant.

### B. Inline Dynamic Queries (`run_inline_query`)
Executing an inline query transmits the full query specification dynamically from the client at request time.

```typescript
const response = await lookerBrowserSdk.ok(
  lookerBrowserSdk.run_inline_query({
    result_format: 'json',
    body: {
      model: 'embed_demo',
      view: 'ai_executive_briefing',
      fields: ['ai_executive_briefing.insight_id', 'ai_executive_briefing.insight_title'],
      limit: '3'
    }
  })
)
```

- **How it Works**: You specify the `model`, `view`, `fields`, `filters`, `sorts`, and `limit` dynamically within the `body` parameter.
- **When to Use**:
  - **Ad-Hoc Exploration & Report Builders**: When users dynamically check/uncheck dimensions, add custom filter rules, or change sorting in React (e.g., custom report builder tools).
  - **Specialized Data Fetching**: When pulling specific fields from specialized native derived tables (such as `useExecutiveBriefing`), where query structures are bound to specific component lifecycles or require runtime parameterization.

---

## 2. Result Formats: `json` vs. `json_detail` (HTML & Currency Consistency)

Choosing the correct `result_format` is essential for ensuring that custom React components display data consistently with embedded Looker iframes.

### A. Why Standard `json` Format Falls Short for UI Styling
When calling `run_query` or `run_inline_query` with `result_format: 'json'`, Looker returns an array of simple key-value pairs containing only raw, unformatted numerical or string values (e.g., `1450230.50`).
- **The Limitation**: Raw JSON completely ignores LookML formatting parameters, including Liquid `html:` blocks (such as `html: @{currency_html} ;;`) and custom number formatting. Using raw JSON in KPI cards can cause currency figures to render as plain numbers without symbols (`$`, `€`, `¥`) or proper regional separators.

### B. Why We Use `json_detail` for Visual Consistency
To bridge the gap between embedded iframe visualizations and direct API data fetching, use `result_format: 'json_detail'`.

When requesting `json_detail`, Looker evaluates LookML metadata and returns an array of row objects where each cell contains a detailed metadata structure:
```json
{
  "order_items.total_revenue": {
    "value": 1450230.50,
    "rendered": "$1,450,230.50",
    "html": "<span class='currency-eur'>1 450 230,50 €</span>"
  }
}
```

- **The Three Metadata Fields**:
  - **`value`**: The underlying raw data type (number, date, string) used for mathematical calculations or charting.
  - **`rendered`**: The standard LookML value formatted according to `value_format` / `value_format_name`.
  - **`html`**: The fully evaluated output of LookML `html:` parameters (including Liquid expressions like `@{currency_html}` that evaluate `_user_attributes['locale']`).

- **Guaranteeing Consistency Between iFrame and API Calls**: By parsing the `.html` or `.rendered` property from a `json_detail` response in our frontend hooks (`useKpiQuery`), custom React components display the exact same currency symbol (`$`, `€`, `¥`), number typography, and HTML styling as Looker's embedded iframe reports!

---

## 3. Standard Implementation Pattern (`useKpiQuery`)

When fetching data for custom UI components that render currency or LookML-formatted text, use the following robust parsing pattern to safely extract the formatted string from `json_detail`:

```typescript
// Inside useKpiQuery.ts
const response = await lookerBrowserSdk.ok(
  lookerBrowserSdk.run_query({
    query_id: queryId,
    result_format: 'json_detail',
    apply_formatting: true,
    limit: 1,
    cache: false
  })
)

const res = response as any
if (res && Array.isArray(res.data) && res.data.length > 0) {
  const row = res.data[0]
  if (row && typeof row === 'object') {
    const cell = Object.values(row)[0] as any
    if (cell && typeof cell === 'object') {
      // 1. Prioritize HTML formatting from LookML (evaluates @{currency_html})
      // 2. Fall back to rendered format
      // 3. Fall back to raw value
      const val = cell.html ?? cell.rendered ?? cell.value
      if (val !== undefined && val !== null) {
        return String(val).replace(/\s+/g, ' ').trim()
      }
    }
  }
}
return 'N/A'
```

---

## 4. Quick Reference Summary Table

| Requirement | Preferred Query Method | Preferred Result Format | Reason |
| :--- | :--- | :--- | :--- |
| **Home Page KPIs & Summary Cards** | `run_query` (Static ID) | `json_detail` | Leverages cached server definitions and brings through LookML Liquid `html` currency symbols (`€`, `¥`, `$`) for iframe consistency. |
| **Ad-Hoc / Custom Report Builder** | `run_inline_query` | `json` or `json_detail` | Allows dynamic client-side filtering, sorting, and field selection at runtime. |
| **Raw Data / Charting Components** | Either | `json` or `json_detail` (`.value`) | Raw numbers are required for D3/Visx canvas calculations and chart axes. |
