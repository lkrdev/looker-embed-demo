# Report Builder Demo Script & Guide

The Report Builder page (`/report-builder`) represents the pinnacle of custom, headless data application development on the Looker platform. While Query Explorer (`/explore`) embeds Looker's out-of-the-box iframe query builder, Report Builder proves that developers can use the Looker TypeScript SDK to construct a **100% custom, native analytical reporting engine** from the ground up—with zero embedded iframes.

By leveraging the Looker REST SDK (`lookml_model_explore`, `run_inline_query`, and `create_look`), this page delivers an ultra-responsive, bespoke analytical workbench. Users can search and select LookML dimensions and measures via interactive filter chips, execute real-time queries, sort columns, and save reports directly to their Looker personal folders.

This guide walks through how to present the headless Report Builder and Looker SDK architecture during a live technical or customer demo.

---

## Role-Gated Access & Headless Differentiators
* **Advanced Tier Exclusivity**: Reserved for the **Advanced** user tier (`explore`, `save_content`, `save_agents` permissions). Basic and AI tier users see an `<AccessDenied />` upgrade card when navigating to this route, reinforcing data monetization models.
* **100% Native Headless UI**: Demonstrates complete architectural freedom. Every element—from the searchable field picker to the data grid—is rendered natively in the application without iframe styling wrappers or cross-origin limitations.
* **Semantic Layer Governance**: Even though the frontend is entirely custom-built, all queries execute through Looker's semantic API. Row-level security (`brand = "Levi's"`) and LookML join rules are enforced automatically by the Looker backend on every SDK call.

---

## Page Features & Walkthrough

### Section 1: Custom SDK Field Catalog & Chip Selection

Report Builder replaces traditional database trees with a streamlined, searchable chip interface that categorizes LookML fields into intuitive business groups.

| Feature / Capability | Technical Implementation | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Headless Schema Introspection | `sdk.lookml_model_explore('embed_demo', 'order_items')<br>` | Asynchronously queries Looker's backend on load to extract all available model dimensions, measures, and descriptions into application state. | Proves that developers can dynamically build bespoke field pickers and reporting UIs that automatically stay in sync with underlying LookML model changes. |
| Categorical Chip Filtering | LookML Metadata Grouping | Organizes extracted LookML fields into three clean visual filter tabs: **Dates**, **Dimensions**, and **Measures**, with real-time keyword search. | Eliminates visual clutter and allows non-technical users to find and toggle reporting attributes in seconds using familiar e-commerce style filter chips. |
| Dynamic Query Compilation | Asynchronous SDK Execution + `sdk.run_inline_query<br>` | When a user toggles field chips and clicks "Run Report", the application compiles an inline LookML query JSON payload and executes it asynchronously. | Achieves lightning-fast application performance while ensuring every analytical calculation is executed on verified database definitions. |

#### Demo Script

*"When we step into the Report Builder, you are looking at one of the most advanced capabilities of the Looker platform: a 100% custom-built, native reporting engine. Notice there are no iframes on this screen.*

*"Using Looker's TypeScript SDK, our application calls the* `lookml_model_explore` *endpoint when the page loads. Looker returns the full semantic schema of our business model, which we render into this custom searchable chip bar. Notice how we've grouped attributes into Dates, Dimensions, and Measures.*

*"Watch what happens when I search for 'Category', select it, add 'Total Sales Price', and click Run Report. Our frontend compiles a JSON query payload and sends it to Looker's REST API. Looker applies our Calvin Klein brand security filter in the database and returns raw structured JSON. We get the complete creative control of custom frontend development combined with the absolute data governance of Looker."*

---

### Section 2: High-Performance Data Grid & Persistence Loop

To handle massive datasets without UI lag, Report Builder integrates high-performance client data rendering with Looker's backend serialization APIs.

| Feature / Capability | Technical Implementation | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| High-Performance Client Rendering | Optimized DOM Recycling | Renders large datasets smoothly by displaying visible row slices in the viewport, allowing users to scroll through thousands of query records without lag. | Delivers buttery-smooth scrolling and zero UI freezing even when displaying massive multi-column analytical result sets. |
| Interactive Column Sorting | Local & Server-Side Sorting | Allows users to click table headers to sort ascending/descending locally or trigger backend re-sorts via API parameters. | Provides an intuitive, spreadsheet-like data manipulation experience native to the browser. |
| SDK Content Serialization | `sdk.create_look()` & Folder API | Users can enter a report title and save their custom table configuration directly to their Looker personal folder from a dialog. | Completes the headless self-service loop: reports generated in this custom tool are instantly serialized as standard Looker Looks readable by any portal user. |

#### Demo Script

*"Once our query returns, we display the data in a custom high-performance data grid. If your query returns ten thousand rows, ordinary web tables freeze the browser. By combining Looker's JSON API responses with optimized client DOM rendering, our table scrolls at a flawless 60 frames per second.*

*"When your analyst finishes designing their custom table, they can click 'Save Report', give it a name, and store it directly to their Looker personal folder. Because Looker's API serializes the report into standard LookML format, that newly saved report immediately appears in our portal's Report Viewer library. This is what we mean by treating Looker as a data operating system: you build whatever custom UX your customers need while Looker handles the heavy lifting of SQL execution, security, and persistence."*

---

## Technical Architecture & API Reference Table

| Component / Feature | Looker SDK Method Reference | Architecture & Data Flow | Why It Matters |
| --- | --- | --- | --- |
| Schema Introspection | `sdk.lookml_model_explore('embed_demo', 'order_items')<br>` | REST API call returning metadata array of all model fields, labels, types, and descriptions used to populate the field picker. | Uncouples frontend UI code from hardcoded database schemas, enabling automated UI adaptability when LookML models evolve. |
| Headless Query Execution | `sdk.run_inline_query({ body: queryDefinition, result_format: 'json_detail' })<br>` | Compiles selected chip fields, filters, and sorts into an inline Looker query object, returning formatted data and metadata schemas. | Ensures strict calculation accuracy and automatic row-level multi-tenant filtering without writing backend SQL endpoints. |
| Client Grid Optimization | High-Performance Viewport Rendering | Calculates scroll offset and renders only the active viewport row slice, recycling DOM elements efficiently. | Eliminates browser memory exhaustion and UI stutter when rendering large analytical data extracts in custom frontend components. |
| Custom Report Persistence | `sdk.create_look({ title, query_id, folder_id: user.personal_folder_id })<br>` | Serializes the active inline query configuration into a persistent Looker Look object stored within the user's isolated workspace folder. | Bridges custom headless creation tools with standard Looker folder ecosystems for seamless cross-portal consumption. |


