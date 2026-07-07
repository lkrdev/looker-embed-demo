# Brand Overview Dashboard Demo Script & Guide

When a brand manager or executive partner logs into the portal, the **Brand Overview** dashboard delivers an immediate executive briefing on commercial performance. Built using Looker's modern newspaper layout and tabbed navigation, this dashboard organizes metrics into three focused domains: **Sales Pulse**, **Customers**, and **Orders & Logistics**.

Through Looker's dynamic user attribute scoping, row-level filters lock standard queries to the active brand's data (e.g., Calvin Klein or Levi's). This ensures strict multi-tenant data governance without requiring separate database tables, custom backend SQL views, or complex application routing.

Every chart leverages modern visual configurations: **dual Y-axes** for cleanly scaling disparate metrics (e.g., revenue in dollars vs. item/user count), **unpinned Y-axes** for optimal data resolution, and **centered bottom legends** for maximum chart readability.

This guide walks through how to present the [brand_overview.dashboard.lookml](file:///usr/local/google/home/maluka/looker-embed-demo/lookml/dashboards/brand_overview.dashboard.lookml) dashboard during a live customer or technical demo.

---

## Global & Interactive Tab Filters
* **Date Range Filter (`order_items.created_date`)**: Defaults to the last **90 days** with advanced popover UI controls. Dynamically filters all single-value KPI cards, trend curves, and distribution charts across every tab in real time.
* **In-Tab Popover Filters**: Interactive filter controls embedded directly on each tab layout:
  * **Sales Pulse**: `Product Category` and `Department`
  * **Customers**: `Country` and `Traffic Source`
  * **Orders & Logistics**: `Order Status`

---

## Dashboard Sections & Walkthrough

### Section 1: Tab 1 — Sales Pulse

The **Sales Pulse** tab covers core commercial revenue and order velocity. It gives leadership an immediate read on top-line performance, average transaction size, unit volume, and category/department revenue distribution.

| Metric / Chart Title | LookML Fields | Visualization & Configuration | What It Shows & Why It Matters |
| --- | --- | --- | --- |
| **Total Revenue** | `order_items.total_sale_price` | Single Value KPI | Total commercial sales revenue across all active channels with prior-period comparison. Primary indicator of financial growth. |
| **Total Orders** | `order_items.order_count` | Single Value KPI | Total count of distinct orders containing the brand's items. Measures transaction velocity. |
| **Average Order Value** | `order_items.average_sale_price` | Single Value KPI | Average unit selling price across all transactions. Tracks pricing power and basket value health. |
| **Units Sold** | `order_items.count` | Single Value KPI | Total count of individual product units sold. Indicates volume demand and inventory depletion. |
| **Monthly Revenue & AOV Trajectory** | `order_items.created_month`, `order_items.total_sale_price`, `order_items.average_sale_price` | Dual Y-Axis Line Chart | Plots monthly total revenue (left axis) against Average Order Value trajectory (right axis) over time. Highlights macro growth and seasonal trends. |
| **Revenue Share by Department** | `products.department`, `order_items.total_sale_price` | Donut Chart (75% Inner Size) | Proportional contribution of major product departments (e.g., Men vs Women) to overall top-line revenue. |
| **Top Categories by Revenue & Volume** | `products.category`, `order_items.total_sale_price`, `order_items.count` | Dual Y-Axis Vertical Column Chart | Compares top 10 categories ranked by total revenue (left axis) and unit count (right axis) to identify high-performing product lines. |
| **Daily Revenue Velocity by Day of Week** | `order_items.created_day_of_week`, `order_items.total_sale_price`, `order_items.order_count` | Dual Y-Axis Vertical Column Chart | Breaks down weekly purchasing patterns by day of week across total revenue (left axis) and order volume (right axis). |

#### Demo Script

*"When your brand leadership opens the portal, the Sales Pulse tab gives them instant top-line visibility across Revenue, Orders, AOV, and Units Sold. Notice the inline interactive filters for Product Category and Department right on the tab grid.*

*"Looking at our multi-metric charts like Monthly Revenue & AOV Trajectory and Top Categories by Revenue & Volume, notice how Looker uses independent left and right Y-axes. This allows executives to compare dollar revenue alongside unit volume or AOV on a single cohesive chart without scale distortion."*

---

### Section 2: Tab 2 — Customers

The **Customers** tab connects financial output to audience acquisition and demographic distribution. It helps marketing and regional sales leads understand who is buying and where they are located.

| Metric / Chart Title | LookML Fields | Visualization & Configuration | What It Shows & Why It Matters |
| --- | --- | --- | --- |
| **Total Active Customers** | `users.count` | Single Value KPI | Total count of unique buyers who purchased the brand's items in the selected period. |
| **Customer Average Spend** | `order_items.average_sale_price` | Single Value KPI | Average spend per customer order across active accounts. |
| **Orders per Customer** | `order_items.order_count` | Single Value KPI | Cumulative order transactions generated by customer cohorts. |
| **New Customer Acquisitions** | `users.count` (Filtered) | Single Value KPI | Customers acquired through attributed digital marketing channels (`traffic_source != NULL`). |
| **Acquisition Value vs Volume by Traffic Source** | `users.traffic_source`, `users.count`, `order_items.total_sale_price` | Dual Y-Axis Vertical Column Chart | Evaluates customer acquisition volume (left axis) against actual total revenue generated (right axis) per marketing channel. |
| **Customer Gender Composition** | `users.gender`, `users.count` | Donut Chart (75% Inner Size) | Demographic distribution of active buyers across gender segments. |
| **Top Geographic Footprint by State** | `users.state`, `users.count` | Horizontal Bar Chart | Ranks the top 10 geographic states by registered buyer density to uncover regional demand hotspots. |
| **Customer Signup Growth Over Time** | `users.created_month`, `users.count` | Line Chart | Longitudinal analysis of monthly customer account signups over time. |

#### Demo Script

*"Switching to the Customers tab shifts the focus from revenue to customer relationships and acquisition efficiency. Inline filters for Country and Traffic Source let marketing teams slice data immediately.*

*"Look at 'Acquisition Value vs Volume by Traffic Source'—by plotting acquired user volume on the left Y-axis and total dollar spend on the right Y-axis, marketing managers can immediately see which acquisition channels generate not just high traffic, but the highest lifetime commercial value."*

---

### Section 3: Tab 3 — Orders & Logistics

The **Orders & Logistics** tab provides operational transparency into fulfillment execution. It breaks down order workflows to help operations managers identify bottlenecks, return spikes, or warehouse load imbalances.

| Metric / Chart Title | LookML Fields | Visualization & Configuration | What It Shows & Why It Matters |
| --- | --- | --- | --- |
| **Shipped Orders** | `order_items.count_shipped` | Single Value KPI | Count of order items successfully dispatched from distribution centers. |
| **Processing Orders** | `order_items.count_processing` | Single Value KPI | Count of active order items currently undergoing warehouse picking and packing. |
| **Returned Orders** | `order_items.count_returned` | Single Value KPI | Count of order items sent back by customers. Early warning indicator for sizing or expectation friction. |
| **Cancelled Orders** | `order_items.count_cancelled` | Single Value KPI | Count of order items terminated before fulfillment completion. |
| **Fulfillment Pipeline Status Breakdown** | `order_items.status`, `order_items.count`, `order_items.total_sale_price` | Dual Y-Axis Vertical Column Chart | Compares item count (left axis) against total revenue value (right axis) across all lifecycle statuses. |
| **Fulfillment Load by Distribution Center** | `distribution_centers.name`, `order_items.count`, `order_items.total_sale_price` | Dual Y-Axis Vertical Column Chart | Displays item throughput (left axis) and dollar volume handled (right axis) across regional fulfillment facilities. |
| **Monthly Order Fulfillment Status Evolution** | `order_items.created_month`, `order_items.status`, `order_items.count` | Stacked Column Chart | Monthly stacked comparison of order statuses highlighting fulfillment reliability and return trends over time. |
| **Return & Cancellation Hotspots by Category** | `products.category`, `order_items.count_returned`, `order_items.count_cancelled` | Vertical Column Chart | Identifies reverse-logistics and cancellation bottlenecks across the top 10 product categories. |

#### Demo Script

*"Finally, the Orders & Logistics tab delivers operational transparency. We separate order statuses into clean KPI cards—Shipped, Processing, Returned, and Cancelled—with an inline Order Status filter.*

*"In charts like 'Fulfillment Load by Distribution Center' and 'Fulfillment Pipeline Status Breakdown', dual Y-axes show operations leaders exactly how many physical units flow through each facility alongside the monetary value at risk, preventing supply chain bottlenecks."*
