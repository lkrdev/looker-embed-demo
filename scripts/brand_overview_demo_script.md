---
onedoc_gdoc_url: https://docs.google.com/document/d/1OSRxYYdp1dR_G62n__0sxut8SUyYW4C9SjN6zW0AV1Y
onedoc_md_file_id: 0f633e43-9a15-47bc-8637-edd2ae25df85
onedoc_tab_id: t.n4wavgvboqoe
---
# Brand Overview Dashboard Demo Script & Guide

When a brand manager or executive partner logs into the portal, the Brand Overview dashboard delivers an immediate executive briefing on commercial performance. Built using Looker's modern newspaper layout and tabbed navigation, this dashboard organizes metrics into three focused domains: **Sales Pulse**, **Customers**, and **Orders & Logistics**.

Through Looker's dynamic user attribute scoping, row-level filters lock standard queries to the active brand's data (e.g., Calvin Klein or Levi's). This ensures strict multi-tenant data governance without requiring separate database tables, custom backend SQL views, or complex application routing.

This guide walks through how to present the [brand_overview.dashboard.lookml](file:///usr/local/google/home/maluka/looker-embed-demo/lookml/dashboards/brand_overview.dashboard.lookml) dashboard during a live customer or technical demo.

---

## Global Dashboard Controls
* **Date Range Filter (**`order_items.created_date`**)**: Defaults to the last **90 days** with advanced popover UI controls. Dynamically filters all single-value KPI cards, trend curves, and distribution charts across every tab in real time.

---

## Dashboard Sections & Walkthrough

### Section 1: Tab 1 — Sales Pulse

The Sales Pulse tab covers core commercial revenue and order velocity. It gives leadership an immediate read on top-line performance, average transaction size, unit volume, and category revenue distribution.

| Metric / Chart Title | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Total Revenue | `order_items.total_sale_price<br>` | Total commercial sales revenue across all active channels with prior-period comparison. | Primary indicator of financial growth and brand scale. |
| Total Orders | `order_items.order_count<br>` | Total count of distinct orders containing the brand's items. | Measures transaction velocity and customer purchasing frequency. |
| Average Order Value | `order_items.average_sale_price<br>` | Average unit selling price across all transactions. | Tracks pricing power, discount impacts, and basket value health. |
| Units Sold | `order_items.count<br>` | Total count of individual product units sold. | Indicates volume demand and inventory depletion rates. |
| Monthly Revenue Trend | `order_items.created_month<br>``order_items.total_sale_price<br>` | Continuous line curve plotting sales revenue month over month. | Highlights macro growth trajectories, seasonality, and revenue momentum. |
| Revenue by Category | `products.category<br>``order_items.total_sale_price<br>` | Ranked column chart showing the top 15 revenue-generating product categories. | Pinpoints high-performing product lines to guide merchandising and inventory investments. |

#### Demo Script

*"When your brand leadership opens the portal, the Sales Pulse tab gives them instant top-line visibility. Looker evaluates row-level permissions on the fly, locking these revenue, order volume, and AOV cards directly to the logged-in brand—zero custom backend logic required.*

*"Notice the Monthly Revenue Trend and Revenue by Category charts below. Instead of forcing executives to export spreadsheets or wait for weekly analyst reports, Looker visualizes seasonal momentum and identifies top-performing product categories interactively in real time."*

---

### Section 2: Tab 2 — Customers

The Customers tab connects financial output to audience acquisition and demographic distribution. It helps marketing and regional sales leads understand who is buying and where they are located.

| Metric / Chart Title | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Total Customers | `users.count<br>` | Total count of unique buyers who purchased the brand's items in the selected period. | Measures active customer reach and platform penetration. |
| Customer Acquisition by Traffic Source | `users.traffic_source<br>``users.count<br>` | Column chart segmenting buyers by acquisition channel (Search, Display, Email, Organic). | Evaluates marketing ROI and identifies the highest-converting traffic streams. |
| Top 10 States by Customer Count | `users.state<br>``users.count<br>` | Horizontal bar chart ranking the top 10 geographic states by buyer volume. | Uncovers regional demand hotspots for targeted local advertising and distribution planning. |
| Gender Breakdown | `users.gender<br>``users.count<br>` | Pie chart showing the demographic distribution of active buyers. | Informs product design, marketing messaging, and catalog curation. |

#### Demo Script

*"Switching to the Customers tab shifts the focus from revenue to relationships. Here we track total unique buyers, acquisition channels, geographic concentration across top states, and demographic breakdown.*

*"For a marketing lead or regional sales rep, this tab provides immediate answers: it highlights whether Search, Organic, or Display ads are driving customer growth, and shows exactly which geographic states represent your strongest demand hotspots."*

---

### Section 3: Tab 3 — Orders & Logistics

The Orders & Logistics tab provides operational transparency into fulfillment execution. It breaks down order workflows to help operations managers identify bottlenecks, return spikes, or warehouse load imbalances.

| Metric / Chart Title | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Shipped Orders | `order_items.count_shipped<br>` | Count of orders successfully dispatched from distribution centers. | Confirms fulfillment throughput and carrier handoff volume. |
| Processing Orders | `order_items.count_processing<br>` | Count of active orders currently undergoing warehouse picking and packing. | Highlights current warehouse queue depth and immediate operational load. |
| Returned Orders | `order_items.count_returned<br>` | Count of order items sent back by customers. | Early warning indicator for sizing, quality, or expectation friction. |
| Cancelled Orders | `order_items.count_cancelled<br>` | Count of orders terminated before fulfillment completion. | Flags stockouts, payment failures, or buyer remorse patterns. |
| Orders Breakdown by Status | `order_items.status<br>``order_items.count<br>` | Column chart comparing total volume across all order lifecycle states. | Provides macro visibility into operational efficiency and fulfillment completion rates. |
| Fulfillment Volume by Distribution Center | `distribution_centers.name<br>``order_items.count<br>` | Ranked horizontal bar chart displaying order volume handled per warehouse facility. | Ensures supply chain leads can balance inventory allocation and prevent warehouse bottlenecks. |

#### Demo Script

*"Finally, the Orders & Logistics tab delivers operational transparency. We separate order statuses into clean KPI cards—Shipped, Processing, Returned, and Cancelled—so operations managers can spot return spikes or fulfillment delays immediately.*

*"The Fulfillment Volume chart on the right maps output across your distribution centers. If one warehouse is absorbing 60% of total volume while another sits idle, supply chain teams can reallocate inventory before shipping delays impact customer satisfaction."*

---

## LookML Field Reference Table

| Dashboard Title | Model / Explore | Dimensions | Measures | What It Shows |
| --- | --- | --- | --- | --- |
| Total Revenue | `embed_demo` / `order_items<br>` | None | `order_items.total_sale_price<br>` | Total sales revenue across all channels. |
| Total Orders | `embed_demo` / `order_items<br>` | None | `order_items.order_count<br>` | Total order count containing brand items. |
| Average Order Value | `embed_demo` / `order_items<br>` | None | `order_items.average_sale_price<br>` | Mean selling price per item unit. |
| Units Sold | `embed_demo` / `order_items<br>` | None | `order_items.count<br>` | Total individual product units sold. |
| Monthly Revenue Trend | `embed_demo` / `order_items<br>` | `order_items.created_month<br>` | `order_items.total_sale_price<br>` | Monthly revenue growth trajectory over time. |
| Revenue by Category | `embed_demo` / `order_items<br>` | `products.category<br>` | `order_items.total_sale_price<br>` | Revenue distribution across top product categories. |
| Total Customers | `embed_demo` / `order_items<br>` | None | `users.count<br>` | Total count of distinct purchasing buyers. |
| Customer Acquisition by Traffic Source | `embed_demo` / `order_items<br>` | `users.traffic_source<br>` | `users.count<br>` | Customer acquisition volume by marketing channel. |
| Top 10 States by Customer Count | `embed_demo` / `order_items<br>` | `users.state<br>` | `users.count<br>` | Top 10 geographic states ranked by buyer count. |
| Gender Breakdown | `embed_demo` / `order_items<br>` | `users.gender<br>` | `users.count<br>` | Demographic distribution of active buyers. |
| Shipped Orders | `embed_demo` / `order_items<br>` | None | `order_items.count_shipped<br>` | Total dispatched order count. |
| Processing Orders | `embed_demo` / `order_items<br>` | None | `order_items.count_processing<br>` | Active order count in warehouse processing. |
| Returned Orders | `embed_demo` / `order_items<br>` | None | `order_items.count_returned<br>` | Total customer return order count. |
| Cancelled Orders | `embed_demo` / `order_items<br>` | None | `order_items.count_cancelled<br>` | Total cancelled order count before shipping. |
| Orders Breakdown by Status | `embed_demo` / `order_items<br>` | `order_items.status<br>` | `order_items.count<br>` | Overall distribution of order lifecycle statuses. |
| Fulfillment Volume by Distribution Center | `embed_demo` / `order_items<br>` | `distribution_centers.name<br>` | `order_items.count<br>` | Order fulfillment volume per warehouse facility. |


