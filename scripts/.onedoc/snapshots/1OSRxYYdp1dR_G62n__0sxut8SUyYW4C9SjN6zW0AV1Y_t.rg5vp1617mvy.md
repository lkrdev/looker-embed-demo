# BigQuery Property Graph Analytics Demo Script & Guide

BigQuery Property Graph Analytics brings native GQL graph querying directly into the Looker `embed_demo` model. By combining BigQuery's `PROPERTY GRAPH` and `GRAPH_TABLE` capabilities with Looker's semantic LookML layer, business users and brand managers can analyze complex relationship networks—such as inbound customer acquisition, outbound merchandising affinity, lookalike marketing audiences, and omnichannel store journeys—without writing recursive SQL self-joins.

This guide walks through how BigQuery Graph is modeled in LookML (`derived_analytic_model`) and the distinct business value proposition of the 4 specialized e-commerce graph Explores during a live technical or customer demo.

---

## 🏗️ BigQuery Graph Architecture in Looker

* **DDL-Managed Property Graph (`customer_360_graph.view.lkml`)**: Defines the underlying BigQuery `PROPERTY GRAPH` directly inside LookML using the `derived_analytic_model` parameter. Looker automatically manages DDL execution for Node tables (`User`, `OrderNode`, `OrderItem`, `Product`, `DistributionCenter`, `Event`) and Edge tables (`placed_order`, `belongs_to_order`, `contains_product`, `product_stocked_at`, `visited`).
* **High-Performance `GRAPH_TABLE` Derived Tables**: Replaces slow, complex multi-join SQL queries with clean, single-pass `MATCH` graph traversal patterns.
* **Multi-Tenant Row-Level Security (`access_filter`)**: All 4 Graph Explores feature strict Looker user attribute scoping (`user_attribute: brand`), ensuring brand managers (e.g., Calvin Klein or Levi's) only view graph relationships relevant to their assigned portfolio.

---

## 📊 E-Commerce Graph Use Cases & Strategic Value Propositions

### Section 1: "Bought Together" Product Recommendations (Inbound Customer Acquisition)

* **Strategy**: **Inbound Conquesting & Cross-Sell Placement**
* **Value Proposition**: Identifies which of **YOUR brand's items** should be recommended to customers currently buying **ANY** brand across the marketplace.
* **Business Question**: *"When shoppers add items from competitor or partner brands (e.g. Nike, Levi's) to their cart, which of MY Calvin Klein products should be suggested as an add-on?"*

| Looker Explore | LookML View | Graph Query Mechanism | Multi-Tenant Security |
| --- | --- | --- | --- |
| `bought_together_recommendations` | `bought_together_recommendations.view.lkml` | `MATCH (target:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o1:OrderItem)-[:contains_product]->(shared_prod:Product)`<br>`MATCH (other:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o2:OrderItem)-[:contains_product]->(shared_prod)`<br>`MATCH (other)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o3:OrderItem)-[:contains_product]->(rec_prod:Product)` | `access_filter: { field: recommended_brand, user_attribute: brand }` |

#### Demo Script
> *"In multi-tenant e-commerce, brand managers want to acquire customers who are shopping elsewhere in the store. In the `bought_together_recommendations` Explore, Looker uses BigQuery Graph `MATCH` traversals to analyze cross-brand shopping baskets. By scoping the access filter to `recommended_brand`, brand managers can immediately see which of their own products have the strongest co-purchase correlation with items from other brands, turning rival brand carts into inbound sales opportunities."*

---

### Section 2: Product Jaccard Similarity Affinity (Outbound PDP & Complete-the-Look)

* **Strategy**: **Outbound Merchandising & Basket Value Maximization**
* **Value Proposition**: Normalizes co-purchase counts using Jaccard Similarity (Intersection over Union) to eliminate popularity bias (e.g., plain socks or white tees) and surface true, high-intent product pairings for Product Detail Pages (PDPs).
* **Business Question**: *"For each of MY brand's products, what complementary items across the store share the strongest statistical affinity to feature on my product page?"*

| Looker Explore | LookML View | Graph Query Mechanism | Multi-Tenant Security |
| --- | --- | --- | --- |
| `product_jaccard_affinity` | `product_jaccard_affinity.view.lkml` | `MATCH (c:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o1:OrderItem)-[:contains_product]->(p1:Product)`<br>`MATCH (c)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o2:OrderItem)-[:contains_product]->(p2:Product)`<br>Calculates `SAFE_DIVIDE(raw_count, p1_count + p2_count - raw_count)` and ranks via `QUALIFY ROW_NUMBER()`. | `access_filter: { field: original_brand, user_attribute: brand }` |

#### Demo Script
> *"If you rely solely on raw order counts, basic commodity items like plain socks show up on every single recommendation widget. By materializing co-purchase edges and calculating Jaccard Similarity directly on the BigQuery Property Graph, our `product_jaccard_affinity` Explore surfaces true item-to-item affinity. Scoped to `original_brand`, e-commerce managers can select any product in their catalog and discover the top complementary items to feature in 'Complete the Look' PDP widgets."*

---

### Section 3: Lookalike Audience Targeting for Brands (Audience Expansion)

* **Strategy**: **Targeted Prospect Acquisition & Media Spend Optimization**
* **Value Proposition**: Identifies prospective customers who exhibit the exact multi-category buying behaviors of a brand's loyal customers, but have not yet purchased from that target brand.
* **Business Question**: *"Which prospective shoppers share category buying habits with my loyal brand buyers, but haven't purchased from my brand yet?"*

| Looker Explore | LookML View | Graph Query Mechanism | Multi-Tenant Security |
| --- | --- | --- | --- |
| `brand_lookalike_audiences` | `brand_lookalike_audiences.view.lkml` | `MATCH (loyal:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(brand_prod:Product)`<br>`MATCH (lookalike:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(other_prod)`<br>`EXCEPT DISTINCT` | `access_filter: { field: target_brand, user_attribute: brand }` |

#### Demo Script
> *"For marketing leaders, high ROAS comes from finding lookalike audiences. In the `brand_lookalike_audiences` Explore, we reverse graph paths. BigQuery Graph identifies your most loyal brand buyers, maps the peripheral categories they shop in, and surfaces new customers who share those exact purchasing patterns but haven't bought your brand yet. Looker automatically filters this Explore so each brand manager only receives prospect lists for their own line."*

---

### Section 4: Omnichannel Customer 360 Journey Mapping (Foot Traffic Attribution)

* **Strategy**: **Cross-Channel Foot Traffic Conversion & Store Attribution**
* **Value Proposition**: Connects online web purchases in specific product categories to physical retail store visit events.
* **Business Question**: *"Which online product category purchases drive customer foot traffic into specific physical retail store locations for my brand?"*

| Looker Explore | LookML View | Graph Query Mechanism | Multi-Tenant Security |
| --- | --- | --- | --- |
| `omnichannel_customer_journey` | `omnichannel_customer_journey.view.lkml` | `MATCH (c:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o:OrderItem)-[:contains_product]->(p:Product)`<br>`MATCH (c)-[v:visited]->(e:Event)` | `access_filter: { field: product_brand, user_attribute: brand }` |

#### Demo Script
> *"Omnichannel retailers struggle to measure how online digital buying triggers in-store visits. The `omnichannel_customer_journey` Explore bridges this gap by linking online order item nodes to physical store visit edges. Retail executives can immediately see which online product categories drive customer foot traffic into specific physical store locations, seamlessly filtered to their assigned brand."*

---

## 🛠️ Summary of LookML Graph Artifacts

| Component | Target File | Security Filter (`access_filter`) | Value Proposition |
| --- | --- | --- | --- |
| Property Graph View | `lookml/views/customer_360_graph.view.lkml` | Derived Analytic Model DDL | Native BigQuery DDL Property Graph definition |
| Bought Together View | `lookml/views/bought_together_recommendations.view.lkml` | `field: recommended_brand, user_attribute: brand` | Inbound Customer Acquisition & Conquesting |
| Jaccard Affinity View | `lookml/views/product_jaccard_affinity.view.lkml` | `field: original_brand, user_attribute: brand` | Outbound Merchandising & PDP Complete-the-Look |
| Lookalike Audience View | `lookml/views/brand_lookalike_audiences.view.lkml` | `field: target_brand, user_attribute: brand` | Prospect Audience Expansion & Targeted Campaigns |
| Omnichannel Journey View | `lookml/views/omnichannel_customer_journey.view.lkml` | `field: product_brand, user_attribute: brand` | Cross-Channel Store Foot Traffic Attribution |
| Documentation View | `lookml/views/bq_graph_query_guide.view.lkml` | Reference Guide View | Developer & Business Analyst Documentation |
| Model Explores | `lookml/models/embed_demo.model.lkml` | Registered under "BigQuery Graph Analytics" | User-facing Explores for dashboarding & ad-hoc analytics |
