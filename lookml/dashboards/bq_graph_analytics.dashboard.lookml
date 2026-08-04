- dashboard: bigquery_property_graph_analytics
  title: BQ Graph Analytics: Customer Intelligence & Recommendation System
  preferred_viewer: dashboards-next
  style: modern
  crossfilter_enabled: true
  description: Multi-tenant e-commerce graph analytics visualizing collaborative recommendations,
    Jaccard affinity, lookalike expansion, and omnichannel customer journeys.
  preferred_slug: BbV25t2nxf4U2rBafhGLDQ
  theme_name: ''
  layout_granularity: granular
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
  - name: "🛍️ Inbound Customer Acquisition & Conquesting"
    type: text
    title_text: "🛍️ Inbound Customer Acquisition & Conquesting"
    subtitle_text: Target shoppers who are purchasing competitor or partner brands
      across the marketplace.
    body_text: "**Strategy Focus:** Inbound Acquisition. By analyzing co-purchase\
      \ networks on the BigQuery Property Graph, this tab surfaces top products in\
      \ your catalog (`recommended_brand`) to suggest as high-converting add-ons when\
      \ customers put other brands (`target_brand`) in their cart."
    row: 0
    col: 0
    width: 72
    height: 6
    tab_name: Inbound Acquisition
  - type: filter
    name: Target Cart Brand
    row: 6
    col: 0
    width: 72
    height: 4
    tab_name: Inbound Acquisition
  - title: Total Recommendation Connections
    name: Total Recommendation Connections
    model: embed_demo
    explore: bought_together_recommendations
    type: single_value
    fields: [bought_together_recommendations.count]
    note_state: expanded
    note_display: hover
    note_text: Total distinct co-purchase recommendation paths linking cross-brand
      cart items to your brand.
    listen:
      Target Cart Brand: bought_together_recommendations.target_brand
    row: 10
    col: 0
    width: 22
    height: 8
    tab_name: Inbound Acquisition
  - title: Max Co-Purchase Strength
    name: Max Co-Purchase Strength
    model: embed_demo
    explore: bought_together_recommendations
    type: single_value
    fields: [bought_together_recommendations.co_purchase_strength]
    note_state: expanded
    note_display: hover
    note_text: Highest number of shared buyers between a cross-brand cart item and
      your top recommended product.
    listen:
      Target Cart Brand: bought_together_recommendations.target_brand
    row: 18
    col: 0
    width: 22
    height: 8
    tab_name: Inbound Acquisition
  - title: Inbound Co-Purchase Share by Product
    name: Inbound Co-Purchase Share by Product
    model: embed_demo
    explore: bought_together_recommendations
    type: looker_pie
    fields: [bought_together_recommendations.recommended_product_name, bought_together_recommendations.co_purchase_strength]
    sorts: [bought_together_recommendations.co_purchase_strength desc]
    limit: 6
    column_limit: 50
    value_labels: legend
    label_type: labPer
    series_labels:
      ck one Men's Micro Low Rise Trunk: ''
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "pie": {
            "innerSize": "75%",
            "borderWidth": 0,
            "borderRadius": 6,
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        }
      }
    note_state: expanded
    note_display: hover
    note_text: Donut chart displaying relative co-purchase strength share across your
      top recommended products.
    defaults_version: 1
    listen:
      Target Cart Brand: bought_together_recommendations.target_brand
    row: 26
    col: 0
    width: 22
    height: 23
    tab_name: Inbound Acquisition
  - title: Top Inbound Recommended Products
    name: Top Inbound Recommended Products
    model: embed_demo
    explore: bought_together_recommendations
    type: looker_bar
    fields: [bought_together_recommendations.recommended_product_name, bought_together_recommendations.co_purchase_strength]
    sorts: [bought_together_recommendations.co_purchase_strength desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    show_x_axis_ticks: true
    y_axis_scale_mode: linear
    x_axis_reversed: false
    y_axis_reversed: false
    plot_size_by_field: false
    trellis: ''
    stacking: ''
    limit_displayed_rows: false
    legend_position: center
    point_style: none
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note_state: expanded
    note_display: hover
    note_text: Ranks your brand's products by total co-purchase volume across cross-brand
      shopping carts.
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": { "borderRadius": 12 },
        "plotOptions": {
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0,
            "color": {
              "linearGradient": { "x1": 0, "y1": 0, "x2": 1, "y2": 0 },
              "stops": [
                [0, "rgba(99, 102, 241, 0.2)"],
                [1, "rgba(99, 102, 241, 0.95)"]
              ]
            }
          }
        },
        "tooltip": { "borderRadius": 12, "shadow": true }
      }
    listen:
      Target Cart Brand: bought_together_recommendations.target_brand
    row: 10
    col: 22
    width: 49
    height: 16
    tab_name: Inbound Acquisition
  - title: Cross-Brand Co-Purchase Matrix
    name: Cross-Brand Co-Purchase Matrix
    model: embed_demo
    explore: bought_together_recommendations
    type: looker_grid
    fields: [bought_together_recommendations.target_brand, bought_together_recommendations.recommended_product_name,
      bought_together_recommendations.co_purchase_strength]
    sorts: [bought_together_recommendations.co_purchase_strength desc]
    limit: 100
    column_limit: 50
    show_view_names: false
    show_row_numbers: true
    transpose: false
    truncate_text: true
    hide_totals: false
    hide_row_totals: false
    size_to_fit: true
    table_theme: white
    limit_displayed_rows: false
    enable_conditional_formatting: false
    header_text_alignment: left
    header_font_size: '12'
    rows_font_size: '12'
    conditional_formatting_include_totals: false
    conditional_formatting_include_nulls: false
    show_sql_query_menu_options: false
    show_totals: true
    show_row_totals: true
    truncate_header: false
    minimum_column_width: 75
    table_show_footer: false
    table_enable_pagination: true
    table_page_size_options: 20, 50, 100
    table_column_hover_highlight_enable: false
    table_show_headers: true
    header_font_bold: false
    header_font_italic: false
    cell_font_weight: ''
    cell_font_style: ''
    cell_text_alignment: ''
    table_custom_border_enable: false
    table_custom_border_width:
    table_custom_border_style: solid
    note_state: expanded
    note_display: hover
    note_text: Detailed breakdown mapping specific anchor cart brands to your recommended
      products.
    defaults_version: 1
    listen:
      Target Cart Brand: bought_together_recommendations.target_brand
    row: 26
    col: 22
    width: 49
    height: 23
    tab_name: Inbound Acquisition
  - name: "📊 Product Jaccard Similarity (Outbound PDP Merchandising)"
    type: text
    title_text: "📊 Product Jaccard Similarity (Outbound PDP Merchandising)"
    subtitle_text: Uncover true behavioral co-purchase affinity for Product Detail
      Pages (PDPs).
    body_text: "**Strategy Focus:** Outbound Merchandising & Basket Value. By calculating\
      \ Jaccard Similarity (Intersection over Union), this tab eliminates popularity\
      \ bias (avoiding generic socks/tees) and highlights true high-intent pairings\
      \ for your products (`original_brand`)."
    row: 0
    col: 0
    width: 72
    height: 6
    tab_name: Product Affinity
  - title: Average Jaccard Affinity Score
    name: Average Jaccard Affinity Score
    model: embed_demo
    explore: product_jaccard_affinity
    type: single_value
    fields: [product_jaccard_affinity.average_affinity]
    note_state: expanded
    note_display: hover
    note_text: Average normalized Jaccard Similarity percentage across high-affinity
      product pairs.
    listen: {}
    row: 6
    col: 0
    width: 25
    height: 8
    tab_name: Product Affinity
  - title: Total High-Affinity Product Pairs
    name: Total High-Affinity Product Pairs
    model: embed_demo
    explore: product_jaccard_affinity
    type: single_value
    fields: [product_jaccard_affinity.raw_count]
    note_state: expanded
    note_display: hover
    note_text: Total co-purchases recorded across statistically significant product
      pairings.
    listen: {}
    row: 14
    col: 0
    width: 25
    height: 8
    tab_name: Product Affinity
  - title: Dual-Axis Jaccard Affinity % vs Order Volume
    name: Dual-Axis Jaccard Affinity % vs Order Volume
    model: embed_demo
    explore: product_jaccard_affinity
    type: looker_column
    fields: [product_jaccard_affinity.original_product_name, product_jaccard_affinity.affinity_score,
      product_jaccard_affinity.raw_count]
    sorts: [product_jaccard_affinity.affinity_score desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    show_x_axis_ticks: true
    y_axis_scale_mode: linear
    x_axis_reversed: false
    y_axis_reversed: false
    plot_size_by_field: false
    trellis: ''
    stacking: ''
    limit_displayed_rows: false
    legend_position: center
    point_style: none
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note_state: expanded
    note_display: hover
    note_text: Spline line plots normalized Jaccard Affinity score (%) against rounded
      columns showing raw order counts.
    defaults_version: 1
    y_axis_unpinned: true
    y_axes: [{label: Affinity Score %, orientation: left, series: [{id: product_jaccard_affinity.affinity_score,
            name: Affinity Score, axisId: product_jaccard_affinity.affinity_score}],
        showLabels: true, showValues: true, unpinAxis: true}, {label: Total Order
          Count, orientation: right, series: [{id: product_jaccard_affinity.raw_count,
            name: Order Count, axisId: product_jaccard_affinity.raw_count}], showLabels: true,
        showValues: true, unpinAxis: true}]
    advanced_vis_config: |-
      {
        "chart": { "borderRadius": 12 },
        "series": [
          {
            "name": "Affinity Score",
            "type": "spline",
            "lineWidth": 3,
            "marker": { "enabled": true, "radius": 5 }
          },
          {
            "name": "Order Count",
            "type": "column",
            "borderRadius": 8,
            "borderWidth": 0
          }
        ],
        "tooltip": { "borderRadius": 12, "shadow": true }
      }
    listen: {}
    row: 6
    col: 25
    width: 47
    height: 16
    tab_name: Product Affinity
  - title: Product Affinity Pairings Table
    name: Product Affinity Pairings Table
    model: embed_demo
    explore: product_jaccard_affinity
    type: looker_grid
    fields: [product_jaccard_affinity.original_product_name, product_jaccard_affinity.recommended_product_name,
      product_jaccard_affinity.recommended_brand, product_jaccard_affinity.affinity_score,
      product_jaccard_affinity.raw_count]
    sorts: [product_jaccard_affinity.affinity_score desc, product_jaccard_affinity.raw_count
        desc]
    limit: 20
    column_limit: 50
    show_view_names: false
    show_row_numbers: false
    transpose: false
    truncate_text: true
    hide_totals: false
    hide_row_totals: false
    size_to_fit: true
    table_theme: transparent
    limit_displayed_rows: false
    enable_conditional_formatting: false
    header_text_alignment: left
    header_font_size: '12'
    rows_font_size: '12'
    conditional_formatting_include_totals: false
    conditional_formatting_include_nulls: false
    modern2026: false
    show_sql_query_menu_options: false
    show_totals: true
    show_row_totals: true
    truncate_header: false
    minimum_column_width: 75
    table_show_footer: true
    table_enable_pagination: false
    table_page_size_options: 20, 50, 100
    table_column_hover_highlight_enable: true
    table_show_headers: true
    header_font_bold: false
    header_font_italic: false
    cell_font_weight: ''
    cell_font_style: ''
    cell_text_alignment: ''
    table_custom_border_enable: true
    table_custom_border_width: 2
    table_custom_border_style: dashed
    note_state: expanded
    note_display: hover
    note_text: Complete pairing matrix showing original anchor product, recommended
      pairing, Jaccard score %, and order count.
    defaults_version: 1
    row_groups:
      enabled: true
      row_grouping_fields:
      - product_jaccard_affinity.recommended_brand
      default_display_level: top_expanded
      group_column_header: ''
      configurable_subtotals: false
    listen: {}
    row: 22
    col: 0
    width: 72
    height: 21
    tab_name: Product Affinity
  - name: "🎯 Brand Lookalike Audience Expansion"
    type: text
    title_text: "🎯 Brand Lookalike Audience Expansion"
    subtitle_text: Target prospective buyers who share shopping habits with your loyal
      brand buyers.
    body_text: "**Strategy Focus:** Media Spend Optimization & Prospecting. Reverses\
      \ graph paths to find customers who buy in the same peripheral categories as\
      \ your loyal customers, but have not yet purchased from your brand (`target_brand`)."
    row: 0
    col: 0
    width: 72
    height: 6
    tab_name: Audience Expansion
  - type: filter
    name: Lookalike Target Brand
    row: 6
    col: 0
    width: 72
    height: 4
    tab_name: Audience Expansion
  - title: Target Prospect Audience Size
    name: Target Prospect Audience Size
    model: embed_demo
    explore: brand_lookalike_audiences
    type: single_value
    fields: [brand_lookalike_audiences.target_audience_size]
    note_state: expanded
    note_display: hover
    note_text: Total count of unique high-intent prospective customers identified
      for campaign targeting.
    listen:
      Lookalike Target Brand: brand_lookalike_audiences.target_brand
    row: 10
    col: 0
    width: 15
    height: 7
    tab_name: Audience Expansion
  - title: Max Category Overlap
    name: Max Category Overlap
    model: embed_demo
    explore: brand_lookalike_audiences
    type: single_value
    fields: [brand_lookalike_audiences.shared_category_count]
    note_state: expanded
    note_display: hover
    note_text: Maximum number of overlapping product categories shared between prospects
      and loyal brand buyers.
    listen:
      Lookalike Target Brand: brand_lookalike_audiences.target_brand
    row: 10
    col: 15
    width: 16
    height: 7
    tab_name: Audience Expansion
  - title: Lookalike Prospect Category Overlap Shading
    name: Lookalike Prospect Category Overlap Shading
    model: embed_demo
    explore: brand_lookalike_audiences
    type: looker_pie
    fields: [brand_lookalike_audiences.email, brand_lookalike_audiences.shared_category_count]
    sorts: [brand_lookalike_audiences.shared_category_count desc]
    limit: 12
    column_limit: 50
    value_labels: legend
    label_type: labPer
    hidden_fields: []
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    show_x_axis_ticks: true
    y_axis_scale_mode: linear
    x_axis_reversed: false
    y_axis_reversed: false
    plot_size_by_field: false
    x_axis_zoom: true
    y_axis_zoom: true
    trellis: ''
    stacking: ''
    limit_displayed_rows: false
    legend_position: center
    point_style: none
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    show_null_points: true
    interpolation: linear
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "pie": {
            "innerSize": "75%",
            "borderWidth": 0,
            "borderRadius": 6,
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        }
      }
    note_state: expanded
    note_display: hover
    note_text: Areaspline chart displaying prospect overlap counts with smooth gradient
      shading under the curve.
    defaults_version: 1
    listen:
      Lookalike Target Brand: brand_lookalike_audiences.target_brand
    row: 17
    col: 0
    width: 31
    height: 15
    tab_name: Audience Expansion
  - title: High-Intent Target Prospect List
    name: High-Intent Target Prospect List
    model: embed_demo
    explore: brand_lookalike_audiences
    type: looker_grid
    fields: [brand_lookalike_audiences.lookalike_customer_id, brand_lookalike_audiences.email,
      brand_lookalike_audiences.shared_category_count]
    sorts: [brand_lookalike_audiences.shared_category_count desc]
    limit: 25
    note_state: expanded
    note_display: hover
    note_text: Actionable prospect export table with Customer ID, email address, and
      category overlap score.
    listen:
      Lookalike Target Brand: brand_lookalike_audiences.target_brand
    row: 10
    col: 32
    width: 40
    height: 22
    tab_name: Audience Expansion
  - name: "🏬 Omnichannel Customer 360 Journey Mapping"
    type: text
    title_text: "🏬 Omnichannel Customer 360 Journey Mapping"
    subtitle_text: Attribute physical retail store visits to online product category
      purchases.
    body_text: "**Strategy Focus:** Cross-Channel Foot Traffic Conversion. Connects\
      \ online order item nodes (`contains_product`) to physical store visit edges\
      \ (`visited`), showing which online product categories drive store foot traffic."
    row: 0
    col: 0
    width: 72
    height: 6
    tab_name: Omnichannel Journey
  - type: filter
    name: Online Trigger Category
    row: 6
    col: 0
    width: 36
    height: 4
    tab_name: Omnichannel Journey
  - type: filter
    name: Retail Store Location
    row: 6
    col: 36
    width: 36
    height: 4
    tab_name: Omnichannel Journey
  - title: Total Cross-Channel Converted Users
    name: Total Cross-Channel Converted Users
    model: embed_demo
    explore: omnichannel_customer_journey
    type: single_value
    fields: [omnichannel_customer_journey.cross_channel_users]
    note_state: expanded
    note_display: hover
    note_text: Total distinct customers who purchased online in your brand's category
      and visited a physical store.
    listen:
      Online Trigger Category: omnichannel_customer_journey.trigger_category
      Retail Store Location: omnichannel_customer_journey.visited_location
    row: 10
    col: 0
    width: 22
    height: 7
    tab_name: Omnichannel Journey
  - title: Total Store Visit Interactions
    name: Total Store Visit Interactions
    model: embed_demo
    explore: omnichannel_customer_journey
    type: single_value
    fields: [omnichannel_customer_journey.total_cross_channel_interactions]
    note_state: expanded
    note_display: hover
    note_text: Total recorded store visit events linked to online category purchases.
    listen:
      Online Trigger Category: omnichannel_customer_journey.trigger_category
      Retail Store Location: omnichannel_customer_journey.visited_location
    row: 17
    col: 0
    width: 22
    height: 6
    tab_name: Omnichannel Journey
  - title: Retail Store Foot Traffic by US State
    name: Retail Store Foot Traffic by US State
    model: embed_demo
    explore: omnichannel_customer_journey
    type: looker_google_map
    fields: [omnichannel_customer_journey.visited_state, omnichannel_customer_journey.cross_channel_users]
    sorts: [omnichannel_customer_journey.cross_channel_users desc]
    limit: 1500
    column_limit: 50
    hidden_fields: []
    hidden_points_if_no: []
    series_labels: {}
    show_view_names: true
    global_tooltip_options:
      custom_tooltips_enabled: true
      style:
        font_size: 12
        font_family: Roboto, 'Noto Sans', 'Noto Sans JP', 'Noto Sans CJK KR', 'Noto
          Sans Arabic UI', 'Noto Sans Devanagari UI', 'Noto Sans Hebrew', 'Noto Sans
          Thai UI', Helvetica, Arial, sans-serif
        font_color: "#FFFFFF"
        background_color: "#262D33"
        border_radius: 4
        border_color: transparent
        box_shadow: none
        align: left
      template: |2-

              <div style="padding: 5px 0;">
                <div>Visited State</div>
                <div style="font-weight: bold;">{{ omnichannel_customer_journey.visited_state }}</div>
              </div>
              <div style="padding: 5px 0;">
                <div>Cross Channel Users</div>
                <div style="font-weight: bold;">{{ omnichannel_customer_journey.cross_channel_users }}</div>
              </div>
    map_plot_mode: points
    elevation_scale: 1000
    hexagon_radius: 2000
    heatmap_intensity: 1
    heatmap_threshold: 0.05
    heatmap_gridlines: true
    heatmap_gridlines_empty: false
    heatmap_opacity: 0.2
    show_region_field: true
    draw_map_labels_above_data: true
    map_tile_provider: traffic_day
    map_position: custom
    map_latitude: 39
    map_longitude: -100
    map_zoom: 4
    map_pannable: true
    map_zoomable: true
    map_transit_layer: true
    map_bicycling_layer: false
    map_traffic_layer: false
    map_marker_type: circle
    map_marker_icon_name: default
    map_marker_radius_mode: proportional_value
    map_marker_units: meters
    map_marker_proportional_scale_type: linear
    map_marker_color_mode: fixed
    map_always_display_coordinates: false
    show_legend: true
    map_dual_axis: false
    map_dual_axis_opacity: 0.5
    quantize_map_value_colors: false
    reverse_map_value_colors: false
    note_state: expanded
    note_display: hover
    note_text: Choropleth map displaying cross-channel retail store visitors by US
      State.
    map_position_mode: auto
    defaults_version: 0
    enable_custom_tooltip: true
    listen:
      Online Trigger Category: omnichannel_customer_journey.trigger_category
      Retail Store Location: omnichannel_customer_journey.visited_location
    row: 10
    col: 22
    width: 50
    height: 31
    tab_name: Omnichannel Journey
  - title: Online Category Purchases Driving Retail Store Visits
    name: Online Category Purchases Driving Retail Store Visits
    model: embed_demo
    explore: omnichannel_customer_journey
    type: looker_column
    fields: [omnichannel_customer_journey.trigger_category, omnichannel_customer_journey.cross_channel_users]
    sorts: [omnichannel_customer_journey.cross_channel_users desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    show_x_axis_ticks: true
    y_axis_scale_mode: linear
    x_axis_reversed: false
    y_axis_reversed: false
    plot_size_by_field: false
    trellis: ''
    stacking: ''
    limit_displayed_rows: false
    legend_position: center
    point_style: none
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note_state: expanded
    note_display: hover
    note_text: Ranks online product categories by volume of cross-channel store visitors
      generated.
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": { "borderRadius": 12 },
        "plotOptions": {
          "column": { "borderRadius": 8, "borderWidth": 0 }
        },
        "tooltip": { "borderRadius": 12, "shadow": true }
      }
    listen:
      Online Trigger Category: omnichannel_customer_journey.trigger_category
      Retail Store Location: omnichannel_customer_journey.visited_location
    row: 23
    col: 0
    width: 22
    height: 18
    tab_name: Omnichannel Journey
  - title: Omnichannel Footprint Matrix
    name: Omnichannel Footprint Matrix
    model: embed_demo
    explore: omnichannel_customer_journey
    type: looker_grid
    fields: [omnichannel_customer_journey.trigger_category, omnichannel_customer_journey.visited_location,
      omnichannel_customer_journey.cross_channel_users]
    sorts: [omnichannel_customer_journey.cross_channel_users desc]
    limit: 20
    note_state: expanded
    note_display: hover
    note_text: Breakdown linking online trigger category to specific physical retail
      store visit locations.
    listen:
      Online Trigger Category: omnichannel_customer_journey.trigger_category
      Retail Store Location: omnichannel_customer_journey.visited_location
    row: 41
    col: 0
    width: 72
    height: 16
    tab_name: Omnichannel Journey
  filters:
  - name: Target Cart Brand
    title: Target Cart Brand (Competitor Cart Item)
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
    model: embed_demo
    explore: bought_together_recommendations
    listens_to_filters: []
    field: bought_together_recommendations.target_brand
  - name: Lookalike Target Brand
    title: Lookalike Target Brand
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
    model: embed_demo
    explore: brand_lookalike_audiences
    listens_to_filters: []
    field: brand_lookalike_audiences.target_brand
  - name: Online Trigger Category
    title: Online Trigger Category
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
    model: embed_demo
    explore: omnichannel_customer_journey
    listens_to_filters: []
    field: omnichannel_customer_journey.trigger_category
  - name: Retail Store Location
    title: Retail Store Location
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
    model: embed_demo
    explore: omnichannel_customer_journey
    listens_to_filters: []
    field: omnichannel_customer_journey.visited_location