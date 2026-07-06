---
onedoc_gdoc_url: https://docs.google.com/document/d/1OSRxYYdp1dR_G62n__0sxut8SUyYW4C9SjN6zW0AV1Y
onedoc_md_file_id: 6c858b4c-eb41-4c2c-8ea9-3d8c007dd6ab
onedoc_tab_id: t.3jxru6b9z6sb
---
# Brand Lookup Dashboard Demo Script & Guide

When a brand manager from Calvin Klein or Levi's logs into the portal, Looker scopes the dashboard to their account. Row-level filters lock standard queries to their brand data. For broader metrics like Share of Wallet, Looker runs aggregate queries across the whole platform so the brand can track their market share without seeing competing row-level records.

This guide walks through how to present the [brand_lookup.dashboard.lookml](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/lookml/dashboards/brand_lookup.dashboard.lookml) dashboard during a live demo.

---

## Global Dashboard Controls
* Use the Date filter (`order_items.created_date` and `events.event_date`) to set your timeframe. It defaults to 90 days.
* Use the State filter (`users.state`) to zoom in on specific regions or logistics zones.

---

## Dashboard Sections & Walkthrough

### Section 1: Brand Overview

This section covers core sales performance: revenue totals, order volume, pricing stability, product mix, and long-term customer spend retention.

| Metric / Dimension | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Total Customers | `users.count<br>` | Count of distinct buyers who bought this brand in the selected period. | Shows total customer reach on the platform. |
| Average Order Value | `order_items.average_sale_price<br>` | Mean selling price per unit for this brand. | Tracks pricing strength and upsell performance. |
| Total Orders | `order_items.order_count<br>` | Total order volume containing this brand's items. | Measures transaction speed and shipping demand. |
| Sales & Sale Price Trend | `order_items.created_date<br>``order_items.total_sale_price<br>``order_items.average_sale_price<br>` | Daily revenue plotted alongside average unit sale price over time. | Highlights revenue growth versus price discounting over time. |
| Most Popular Categories | `products.category<br>``products.department<br>``order_items.total_sale_price<br>` | Revenue breakdown by product category across Mens and Womens departments. | Shows which product lines generate the most revenue to guide inventory choices. |
| Brand Share of Wallet | `order_items.months_since_signup<br>``order_items_share_of_wallet.brand_share_of_wallet_within_company<br>``order_items_share_of_wallet.total_sale_price_brand_v2<br>` | Percentage of total platform spend this brand captures as customer account age increases up to 18 months. | Shows whether buyers stay loyal to your brand over time or switch to competitors as they spend more on the platform. |

#### Demo Script

"When a brand partner opens this dashboard, the overview section answers a simple question: how is our business doing here?

Looker automatically filters these numbers for the logged-in user. You see customer count, order volume, and average order value right away. The Share of Wallet metric goes a step further: it shows what percentage of a buyer's total fashion spend stays with your brand over their first 18 months on the platform. That tells you straight away if customer loyalty is growing or dropping off."

---

### Section 2: Affinity Analysis

This section looks at basket composition and brand co-purchasing to help plan product bundles and promotions.

| Metric / Dimension | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Most Correlated Items | `product_a.item_name<br>``product_b.item_name<br>``affinity.avg_order_affinity<br>``affinity.avg_user_affinity<br>` | Product pairs bought together in the same basket (`order_affinity`) or by the same user over time (`user_affinity`). | Points directly to product pairings for bundles, kits, and recommended cross-sells. |
| Purchasers of This Brand Also Bought | `product_a.brand<br>``product_b.brand<br>``affinity.avg_order_affinity<br>``affinity.avg_user_affinity<br>``affinity.combined_affinity<br>` | External marketplace brands most frequently bought by your customers. | Highlights potential co-marketing partners and brand affinity overlaps. |

#### Demo Script

"To grow basket sizes, you need to know what else your customers buy. The Affinity section uses Looker's market basket engine to track product pairings.

You can see which items land in the same shopping cart, which makes planning product bundles straightforward. The Brand Affinity table also shows which other brands your buyers check out, giving you real data for co-promotions."

---

### Section 3: Web Analytics

This section connects online browsing activity to actual sales conversion, highlighting traffic channels and drop-off points.

| Metric / Dimension | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Top Product Categories - Cart vs Conversion | `product_viewed.category<br>``sessions.count_cart_or_later<br>``sessions.cart_to_checkout_conversion<br>``sessions.overall_conversion<br>` | Add-to-Cart counts compared against Cart-to-Checkout conversion rates per category. | Spots funnel leaks. Shows categories with high intent but low checkout conversion due to pricing or sizing issues. |
| Brand Traffic by Source & OS | `users.traffic_source<br>``events.os<br>``events.count<br>` | Web sessions grouped by acquisition channel (Search, Display, Email, Organic) and client OS. | Shows which marketing channels drive traffic and helps optimize ad spend by device. |
| Sessions by Hour & Order Tier | `user_order_facts.lifetime_orders_tier<br>``sessions.count<br>``events.event_hour_of_day<br>` | Hourly site traffic broken down by buyer loyalty tier (first-time vs repeat buyers). | Helps marketing teams send emails and run flash sales when repeat buyers are actively browsing. |

#### Demo Script

"Web analytics here connects digital traffic to actual sales.

The Cart vs Conversion chart flags categories where shoppers add items to their cart but leave before checking out. That usually points to price friction or missing product details. The hourly activity breakdown also shows when your repeat buyers browse, so you can time email drops and sales for peak activity."

---

### Section 4: Top Customers

This section turns aggregate data into direct customer lists for VIP programs and ad retargeting.

| Metric / Dimension | LookML Field | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Top Purchasers of Brand | `users.name<br>``users.email<br>``users.state<br>``order_items.count<br>``order_items.total_sale_price<br>` | Ranked list of individual customers with the highest order count and revenue for your brand. | Gives you a direct list of VIP buyers for loyalty perks, early access drops, and direct outreach. |
| Top Visitors and Transaction History | `users.name<br>``users.email<br>``users.state<br>``users.traffic_source<br>``sessions.count<br>` | List of shoppers with high browsing sessions on your brand's items. | Identifies active window shoppers who browse frequently so you can target them with special offers or ads. |

#### Demo Script

"The Top Customers section gives you actionable lists.

You get a list of your highest-spending buyers for VIP rewards. Right next to it, the Top Visitors table shows frequent browsers who haven't bought yet. You can export these lists straight from Looker to run targeted ad campaigns or offer specific discounts."

---

## LookML Field Reference Table

| Dashboard Title | Model / Explore | Dimensions | Measures | What It Shows |
| --- | --- | --- | --- | --- |
| Total Customers | `embed_demo` / `order_items<br>` | None | `users.count<br>` | Total count of unique buyers for this brand. |
| Average Order Value | `embed_demo` / `order_items<br>` | None | `order_items.average_sale_price<br>` | Average item sale price for this brand. |
| Total Orders | `embed_demo` / `order_items<br>` | None | `order_items.order_count<br>` | Total order volume containing items from this brand. |
| Sales & Sale Price Trend | `embed_demo` / `order_items<br>` | `order_items.created_date<br>` | `order_items.total_sale_price`, `order_items.average_sale_price<br>` | Daily revenue and unit price trends. |
| Most Popular Categories | `embed_demo` / `order_items<br>` | `products.category`, `products.department<br>` | `order_items.total_sale_price<br>` | Revenue by category and department. |
| Brand Share of Wallet | `embed_demo` / `orders_with_share_of_wallet_application<br>` | `order_items.months_since_signup<br>` | `order_items_share_of_wallet.brand_share_of_wallet_within_company`, `order_items_share_of_wallet.total_sale_price_brand_v2<br>` | Share of total platform spend over 18 months of customer tenure. |
| Most Correlated Items | `embed_demo` / `affinity<br>` | `product_a.item_name`, `product_b.item_name<br>` | `affinity.avg_order_affinity`, `affinity.avg_user_affinity<br>` | Co-purchase strength for item pairs in orders and history. |
| Brand Affinity | `embed_demo` / `affinity<br>` | `product_a.brand`, `product_b.brand<br>` | `affinity.avg_order_affinity`, `affinity.avg_user_affinity`, `affinity.combined_affinity<br>` | Co-purchase overlap with other marketplace brands. |
| Cart vs Conversion | `embed_demo` / `events<br>` | `product_viewed.category<br>` | `sessions.count_cart_or_later`, `sessions.cart_to_checkout_conversion`, `sessions.overall_conversion<br>` | Add-to-cart rates versus checkout conversion by category. |
| Brand Traffic by Source & OS | `embed_demo` / `events<br>` | `users.traffic_source`, `events.os<br>` | `events.count<br>` | Event volume by traffic source and operating system. |
| Sessions by Hour & Order Tier | `embed_demo` / `events<br>` | `user_order_facts.lifetime_orders_tier`, `events.event_hour_of_day<br>` | `sessions.count<br>` | Hourly traffic volume segmented by buyer lifetime order tier. |
| Top Purchasers of Brand | `embed_demo` / `order_items<br>` | `users.name`, `users.email`, `users.state<br>` | `order_items.count`, `order_items.total_sale_price<br>` | Top individual spenders sorted by lifetime revenue. |
| Top Visitors & History | `embed_demo` / `events<br>` | `users.name`, `users.email`, `users.state`, `users.traffic_source<br>` | `sessions.count<br>` | Top site visitors sorted by session count. |


