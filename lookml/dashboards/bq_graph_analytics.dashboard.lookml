- dashboard: bq_graph_analytics
  title: BigQuery Property Graph Analytics
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  description: Multi-tenant e-commerce graph analytics visualizing collaborative recommendations, Jaccard affinity, lookalike expansion, and omnichannel customer journeys.
  layout: newspaper
  tabs:
  - name: Inbound Acquisition
    label: Inbound Acquisition
  - name: Product Affinity
    label: Product Affinity
  - name: Audience Expansion
    label: Audience Expansion
  - name: Omnichannel Journey
    label: Omnichannel Journey

  elements:
  # ====================================================================
  # TAB 1: INBOUND ACQUISITION
  # ====================================================================
  - name: Inbound Acquisition Header
    type: text
    tab_name: Inbound Acquisition
    title_text: "🛍️ Inbound Customer Acquisition & Conquesting"
    subtitle_text: "Target shoppers who are purchasing competitor or partner brands across the marketplace."
    body_text: "**Strategy Focus:** Inbound Acquisition. By analyzing co-purchase networks on the BigQuery Property Graph, this tab surfaces top products in your catalog (`recommended_brand`) to suggest as high-converting add-ons when customers put other brands (`target_brand`) in their cart."
    row: 0
    col: 0
    width: 24
    height: 3

  - title: Total Recommendation Connections
    name: Total Recommendation Connections
    model: embed_demo
    explore: bought_together_recommendations
    tab_name: Inbound Acquisition
    type: single_value
    fields: [bought_together_recommendations.count]
    note_state: expanded
    note_display: hover
    note_text: "Total distinct co-purchase recommendation paths linking cross-brand cart items to your brand."
    row: 3
    col: 0
    width: 12
    height: 4

  - title: Max Co-Purchase Strength
    name: Max Co-Purchase Strength
    model: embed_demo
    explore: bought_together_recommendations
    tab_name: Inbound Acquisition
    type: single_value
    fields: [bought_together_recommendations.co_purchase_strength]
    note_state: expanded
    note_display: hover
    note_text: "Highest number of shared buyers between a cross-brand cart item and your top recommended product."
    row: 3
    col: 12
    width: 12
    height: 4

  - title: Top Inbound Recommended Products
    name: Top Inbound Recommended Products
    model: embed_demo
    explore: bought_together_recommendations
    tab_name: Inbound Acquisition
    type: looker_bar
    fields: [bought_together_recommendations.recommended_product_name, bought_together_recommendations.co_purchase_strength]
    sorts: [bought_together_recommendations.co_purchase_strength desc]
    limit: 10
    note_state: expanded
    note_display: hover
    note_text: "Ranks your brand's products by total co-purchase volume across cross-brand shopping carts."
    row: 7
    col: 0
    width: 12
    height: 8
    defaults_version: 1
    advanced_vis_config: |-
      {
        "plotOptions": {
          "bar": { "borderRadius": 8, "borderWidth": 0 }
        }
      }

  - title: Cross-Brand Co-Purchase Matrix
    name: Cross-Brand Co-Purchase Matrix
    model: embed_demo
    explore: bought_together_recommendations
    tab_name: Inbound Acquisition
    type: looker_grid
    fields: [bought_together_recommendations.target_brand, bought_together_recommendations.recommended_product_name, bought_together_recommendations.co_purchase_strength]
    sorts: [bought_together_recommendations.co_purchase_strength desc]
    limit: 20
    note_state: expanded
    note_display: hover
    note_text: "Detailed breakdown mapping specific anchor cart brands to your recommended products."
    row: 7
    col: 12
    width: 12
    height: 8

  # ====================================================================
  # TAB 2: PRODUCT AFFINITY
  # ====================================================================
  - name: Product Affinity Header
    type: text
    tab_name: Product Affinity
    title_text: "📊 Product Jaccard Similarity (Outbound PDP Merchandising)"
    subtitle_text: "Uncover true behavioral co-purchase affinity for Product Detail Pages (PDPs)."
    body_text: "**Strategy Focus:** Outbound Merchandising & Basket Value. By calculating Jaccard Similarity (Intersection over Union), this tab eliminates popularity bias (avoiding generic socks/tees) and highlights true high-intent pairings for your products (`original_brand`)."
    row: 0
    col: 0
    width: 24
    height: 3

  - title: Average Jaccard Affinity Score
    name: Average Jaccard Affinity Score
    model: embed_demo
    explore: product_jaccard_affinity
    tab_name: Product Affinity
    type: single_value
    fields: [product_jaccard_affinity.average_affinity]
    note_state: expanded
    note_display: hover
    note_text: "Average normalized Jaccard Similarity percentage across high-affinity product pairs."
    row: 3
    col: 0
    width: 12
    height: 4

  - title: Total High-Affinity Product Pairs
    name: Total High-Affinity Product Pairs
    model: embed_demo
    explore: product_jaccard_affinity
    tab_name: Product Affinity
    type: single_value
    fields: [product_jaccard_affinity.raw_count]
    note_state: expanded
    note_display: hover
    note_text: "Total co-purchases recorded across statistically significant product pairings."
    row: 3
    col: 12
    width: 12
    height: 4

  - title: Top Product Pairings by Jaccard Similarity
    name: Top Product Pairings by Jaccard Similarity
    model: embed_demo
    explore: product_jaccard_affinity
    tab_name: Product Affinity
    type: looker_column
    fields: [product_jaccard_affinity.original_product_name, product_jaccard_affinity.affinity_score]
    sorts: [product_jaccard_affinity.affinity_score desc]
    limit: 10
    note_state: expanded
    note_display: hover
    note_text: "Ranks top anchor products by their strongest normalized co-purchase affinity score."
    row: 7
    col: 0
    width: 12
    height: 8
    defaults_version: 1
    advanced_vis_config: |-
      {
        "plotOptions": {
          "column": { "borderRadius": 8, "borderWidth": 0 }
        }
      }

  - title: Product Affinity Pairings Table
    name: Product Affinity Pairings Table
    model: embed_demo
    explore: product_jaccard_affinity
    tab_name: Product Affinity
    type: looker_grid
    fields: [product_jaccard_affinity.original_product_name, product_jaccard_affinity.recommended_product_name, product_jaccard_affinity.recommended_brand, product_jaccard_affinity.affinity_score, product_jaccard_affinity.raw_count]
    sorts: [product_jaccard_affinity.affinity_score desc]
    limit: 20
    note_state: expanded
    note_display: hover
    note_text: "Complete pairing matrix showing original anchor product, recommended pairing, Jaccard score %, and order count."
    row: 7
    col: 12
    width: 12
    height: 8

  # ====================================================================
  # TAB 3: AUDIENCE EXPANSION
  # ====================================================================
  - name: Audience Expansion Header
    type: text
    tab_name: Audience Expansion
    title_text: "🎯 Brand Lookalike Audience Expansion"
    subtitle_text: "Target prospective buyers who share shopping habits with your loyal brand buyers."
    body_text: "**Strategy Focus:** Media Spend Optimization & Prospecting. Reverses graph paths to find customers who buy in the same peripheral categories as your loyal customers, but have not yet purchased from your brand (`target_brand`)."
    row: 0
    col: 0
    width: 24
    height: 3

  - title: Target Prospect Audience Size
    name: Target Prospect Audience Size
    model: embed_demo
    explore: brand_lookalike_audiences
    tab_name: Audience Expansion
    type: single_value
    fields: [brand_lookalike_audiences.target_audience_size]
    note_state: expanded
    note_display: hover
    note_text: "Total count of unique high-intent prospective customers identified for campaign targeting."
    row: 3
    col: 0
    width: 12
    height: 4

  - title: Max Category Overlap
    name: Max Category Overlap
    model: embed_demo
    explore: brand_lookalike_audiences
    tab_name: Audience Expansion
    type: single_value
    fields: [brand_lookalike_audiences.shared_category_count]
    note_state: expanded
    note_display: hover
    note_text: "Maximum number of overlapping product categories shared between prospects and loyal brand buyers."
    row: 3
    col: 12
    width: 12
    height: 4

  - title: Lookalike Prospect Audience Distribution
    name: Lookalike Prospect Audience Distribution
    model: embed_demo
    explore: brand_lookalike_audiences
    tab_name: Audience Expansion
    type: looker_bar
    fields: [brand_lookalike_audiences.email, brand_lookalike_audiences.shared_category_count]
    sorts: [brand_lookalike_audiences.shared_category_count desc]
    limit: 10
    note_state: expanded
    note_display: hover
    note_text: "Displays top prospect accounts ranked by shared category overlap count."
    row: 7
    col: 0
    width: 12
    height: 8
    defaults_version: 1
    advanced_vis_config: |-
      {
        "plotOptions": {
          "bar": { "borderRadius": 8, "borderWidth": 0 }
        }
      }

  - title: High-Intent Target Prospect List
    name: High-Intent Target Prospect List
    model: embed_demo
    explore: brand_lookalike_audiences
    tab_name: Audience Expansion
    type: looker_grid
    fields: [brand_lookalike_audiences.lookalike_customer_id, brand_lookalike_audiences.email, brand_lookalike_audiences.shared_category_count]
    sorts: [brand_lookalike_audiences.shared_category_count desc]
    limit: 25
    note_state: expanded
    note_display: hover
    note_text: "Actionable prospect export table with Customer ID, email address, and category overlap score."
    row: 7
    col: 12
    width: 12
    height: 8

  # ====================================================================
  # TAB 4: OMNICHANNEL JOURNEY
  # ====================================================================
  - name: Omnichannel Journey Header
    type: text
    tab_name: Omnichannel Journey
    title_text: "🏬 Omnichannel Customer 360 Journey Mapping"
    subtitle_text: "Attribute physical retail store visits to online product category purchases."
    body_text: "**Strategy Focus:** Cross-Channel Foot Traffic Conversion. Connects online order item nodes (`contains_product`) to physical store visit edges (`visited`), showing which online product categories drive store foot traffic."
    row: 0
    col: 0
    width: 24
    height: 3

  - title: Total Cross-Channel Converted Users
    name: Total Cross-Channel Converted Users
    model: embed_demo
    explore: omnichannel_customer_journey
    tab_name: Omnichannel Journey
    type: single_value
    fields: [omnichannel_customer_journey.cross_channel_users]
    note_state: expanded
    note_display: hover
    note_text: "Total distinct customers who purchased online in your brand's category and visited a physical store."
    row: 3
    col: 0
    width: 12
    height: 4

  - title: Total Store Visit Interactions
    name: Total Store Visit Interactions
    model: embed_demo
    explore: omnichannel_customer_journey
    tab_name: Omnichannel Journey
    type: single_value
    fields: [omnichannel_customer_journey.total_cross_channel_interactions]
    note_state: expanded
    note_display: hover
    note_text: "Total recorded store visit events linked to online category purchases."
    row: 3
    col: 12
    width: 12
    height: 4

  - title: Online Category Purchases Driving Retail Store Visits
    name: Online Category Purchases Driving Retail Store Visits
    model: embed_demo
    explore: omnichannel_customer_journey
    tab_name: Omnichannel Journey
    type: looker_column
    fields: [omnichannel_customer_journey.trigger_category, omnichannel_customer_journey.cross_channel_users]
    sorts: [omnichannel_customer_journey.cross_channel_users desc]
    limit: 10
    note_state: expanded
    note_display: hover
    note_text: "Ranks online product categories by volume of cross-channel store visitors generated."
    row: 7
    col: 0
    width: 12
    height: 8
    defaults_version: 1
    advanced_vis_config: |-
      {
        "plotOptions": {
          "column": { "borderRadius": 8, "borderWidth": 0 }
        }
      }

  - title: Omnichannel Footprint Matrix
    name: Omnichannel Footprint Matrix
    model: embed_demo
    explore: omnichannel_customer_journey
    tab_name: Omnichannel Journey
    type: looker_grid
    fields: [omnichannel_customer_journey.trigger_category, omnichannel_customer_journey.visited_location, omnichannel_customer_journey.cross_channel_users]
    sorts: [omnichannel_customer_journey.cross_channel_users desc]
    limit: 20
    note_state: expanded
    note_display: hover
    note_text: "Breakdown linking online trigger category to specific physical retail store visit locations."
    row: 7
    col: 12
    width: 12
    height: 8
