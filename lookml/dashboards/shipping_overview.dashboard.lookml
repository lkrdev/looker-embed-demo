---
- dashboard: shipping_logistics__operations_overview
  title: Shipping Logistics & Operations Overview
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  description: "Shipping and logistics overview for an ecommerce store - showing things like how many orders are processing, and where things are shipping"
  preferred_slug: 0RgK4YHEd8qIMCzDdPtmgs
  layout: newspaper
  tabs:
  - name: Operations Pulse
    label: Operations Pulse
  - name: Processing Alerts
    label: Processing Alerts
  - name: Shipping Geography
    label: Shipping Geography
  elements:
  - name: "Operations Overview"
    type: text
    title_text: "<span class='fa fa-tachometer'> Operations Overview</span>"
    subtitle_text: How are we doing from a logistics standpoint?
    body_text: ''
    row: 0
    col: 0
    width: 24
    height: 2
    tab_name: Operations Pulse
  - title: "# Orders Processing"
    name: "# Orders Processing"
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_week, order_items.order_count]
    sorts: [order_items.created_week desc]
    limit: 500
    filters:
      order_items.status: Processing
      order_items.created_week: 12 weeks
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: ${order_items.order_count}
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: offset(${order_items.order_count}, 1)
      value_format: "#,##0"
    hidden_fields: [order_items.created_week, order_items.order_count]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Orders Processing
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: vs previous week
    note_state: collapsed
    note_display: hover
    note_text: Current orders in processing state
    font_size: medium
    listen:
      Distribution Center: distribution_centers.name
    row: 2
    col: 0
    width: 8
    height: 4
    tab_name: Operations Pulse
  - title: Total Amount Processing
    name: Total Amount Processing
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_week, order_items.total_sale_price]
    sorts: [order_items.created_week desc]
    limit: 500
    filters:
      order_items.status: Processing
      order_items.created_week: 12 weeks
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: ${order_items.total_sale_price}
      value_format: "$#,##0.00"
    - table_calculation: prior_period
      label: Prior Period
      expression: offset(${order_items.total_sale_price}, 1)
      value_format: "$#,##0.00"
    hidden_fields: [order_items.created_week, order_items.total_sale_price]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Value Processing
    show_comparison: true
    comparison_type: percentage
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: of previous week
    note_state: collapsed
    note_display: hover
    note_text: Total dollar value of orders in processing state
    font_size: medium
    listen:
      Distribution Center: distribution_centers.name
    row: 2
    col: 8
    width: 8
    height: 4
    tab_name: Operations Pulse
  - title: "# Orders Shipped"
    name: "# Orders Shipped"
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_week, order_items.order_count]
    sorts: [order_items.created_week desc]
    limit: 500
    filters:
      order_items.status: Shipped
      order_items.created_week: 12 weeks
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: ${order_items.order_count}
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: offset(${order_items.order_count}, 1)
      value_format: "#,##0"
    hidden_fields: [order_items.created_week, order_items.order_count]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Orders Shipped
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: vs previous week
    note_state: collapsed
    note_display: hover
    note_text: Total orders shipped to customers
    font_size: medium
    listen:
      Distribution Center: distribution_centers.name
    row: 2
    col: 16
    width: 8
    height: 4
    tab_name: Operations Pulse
  - title: Order Shipment Status
    name: Order Shipment Status
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [order_items.created_date, order_items.status, order_items.order_count]
    pivots: [order_items.status]
    filters:
      order_items.status: Complete,Shipped,Processing
    sorts: [order_items.created_date desc, order_items.status]
    limit: 500
    column_limit: 50
    query_timezone: America/Los_Angeles
    show_view_names: false
    colors: ["#1A73E8", "#34A853", "#FBBC04"]
    stacking: normal
    show_value_labels: false
    label_density: 25
    legend_position: center
    x_axis_gridlines: false
    y_axis_gridlines: true
    y_axis_combined: true
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: false
    show_x_axis_ticks: true
    x_axis_scale: auto
    y_axis_scale_mode: linear
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        }
      }
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 6
    col: 0
    width: 14
    height: 10
    tab_name: Operations Pulse
  - title: Inventory Aging Report
    name: Inventory Aging Report
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [inventory_items.days_in_inventory_tier, inventory_items.count]
    filters:
      inventory_items.is_sold: 'No'
    sorts: [inventory_items.days_in_inventory_tier]
    limit: 500
    column_limit: 50
    query_timezone: America/Los_Angeles
    show_view_names: false
    colors: ["#4285F4"]
    stacking: normal
    show_value_labels: true
    label_density: 25
    legend_position: center
    x_axis_gridlines: false
    y_axis_gridlines: true
    y_axis_combined: true
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    x_axis_scale: auto
    y_axis_scale_mode: linear
    note_state: collapsed
    note_display: below
    note_text: Unsold inventory only
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        }
      }
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 6
    col: 14
    width: 10
    height: 10
    tab_name: Operations Pulse
  - name: "Orders Still Processing"
    type: text
    title_text: "<span class='fa fa-bell-o'> Orders Still Processing</span>"
    subtitle_text: What orders should have been shipped but are still processing?
    body_text: "**Recommended Action:** Send order ID over Slack to follow up on the order status, then email the customer to let them know that there is a delay."
    row: 0
    col: 0
    width: 24
    height: 3
    tab_name: Processing Alerts
  - title: Open Orders >3 Days Old
    name: Open Orders >3 Days Old
    model: embed_demo
    explore: order_items
    type: looker_grid
    fields: [order_items.order_id, users.email, order_items.created_date, order_items.status,
      products.item_name, order_items.days_to_process]
    filters:
      order_items.created_date: before 3 days ago
      order_items.status: Processing
    sorts: [order_items.days_to_process desc]
    limit: 25
    column_limit: 50
    query_timezone: America/Los_Angeles
    show_view_names: false
    show_row_numbers: true
    truncate_text: true
    hide_totals: false
    hide_row_totals: false
    size_to_fit: true
    table_theme: transparent
    limit_displayed_rows: false
    enable_conditional_formatting: true
    header_text_alignment: left
    header_font_size: '12'
    rows_font_size: '12'
    conditional_formatting: [{type: along a scale..., value: !!null '', background_color: "#2196F3",
        font_color: !!null '', color_application: {collection_id: f14810d2-98d7-42df-82d0-bc185a074e42,
          palette_id: 90a81bec-f33f-43c9-a36a-0ea5f037dfa0, options: {steps: 5, reverse: true}},
        bold: false, italic: false, strikethrough: false, fields: [order_items.days_to_process]}]
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 3
    col: 0
    width: 14
    height: 11
    tab_name: Processing Alerts
  - title: Open Orders - Where do we need to ship?
    name: Open Orders - Where do we need to ship?
    model: embed_demo
    explore: order_items
    type: looker_map
    fields: [distribution_centers.location, users.approx_location, order_items.average_days_to_process]
    filters:
      order_items.status: '"Processing"'
      order_items.order_count: ">0"
    sorts: [order_items.average_days_to_process desc]
    limit: 500
    map_plot_mode: lines
    heatmap_gridlines: true
    map_tile_provider: positron
    map_position: custom
    map_scale_indicator: 'off'
    map_pannable: true
    map_zoomable: true
    map_marker_type: circle
    map_marker_icon_name: default
    map_marker_radius_mode: proportional_value
    map_marker_units: meters
    map_marker_proportional_scale_type: linear
    map_marker_color_mode: fixed
    show_view_names: true
    show_legend: true
    quantize_map_value_colors: false
    map_latitude: 36.31512514748051
    map_longitude: -92.10937499999999
    map_zoom: 3
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 3
    col: 14
    width: 10
    height: 11
    tab_name: Processing Alerts
  - name: "Shipping by Location"
    type: text
    title_text: "<span class='fa fa-paper-plane'> Shipping by Location</span>"
    subtitle_text: Where can we improve our shipping time?
    row: 0
    col: 0
    width: 24
    height: 2
    tab_name: Shipping Geography
  - title: Most Common Shipping Locations
    name: Most Common Shipping Locations
    model: embed_demo
    explore: order_items
    type: looker_map
    fields: [distribution_centers.location, users.approx_location, order_items.order_count]
    filters:
      order_items.order_count: ">30"
    sorts: [order_items.created_date, order_items.order_id, order_items.order_count desc]
    limit: 1000
    map_plot_mode: lines
    heatmap_gridlines: true
    map_tile_provider: positron
    map_position: custom
    map_scale_indicator: 'off'
    map_pannable: true
    map_zoomable: true
    map_marker_type: circle
    map_marker_icon_name: default
    map_marker_radius_mode: proportional_value
    map_marker_units: meters
    map_marker_proportional_scale_type: linear
    map_marker_color_mode: fixed
    show_view_names: true
    show_legend: true
    quantize_map_value_colors: false
    map_latitude: 43.58039085560786
    map_longitude: -61.52343749999999
    map_zoom: 3
    map_value_scale_clamp_max: 300
    map_value_scale_clamp_min: 30
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 2
    col: 0
    width: 12
    height: 12
    tab_name: Shipping Geography
  - title: Average Shipping Time to Users
    name: Average Shipping Time to Users
    model: embed_demo
    explore: order_items
    type: looker_map
    fields: [users.approx_location, order_items.average_shipping_time]
    filters:
      users.approx_location_bin_level: '7'
    sorts: [order_items.average_shipping_time desc]
    limit: 5000
    map_plot_mode: automagic_heatmap
    heatmap_gridlines: true
    map_tile_provider: positron
    map_position: custom
    map_scale_indicator: 'off'
    map_pannable: true
    map_zoomable: true
    map_marker_type: circle
    map_marker_icon_name: default
    map_marker_radius_mode: proportional_value
    map_marker_units: meters
    map_marker_proportional_scale_type: linear
    map_marker_color_mode: fixed
    show_view_names: true
    show_legend: true
    quantize_map_value_colors: false
    map_latitude: 36.527294814546245
    map_longitude: -92.19726562500001
    map_zoom: 3
    listen:
      Date Range: order_items.created_date
      Distribution Center: distribution_centers.name
    row: 2
    col: 12
    width: 12
    height: 12
    tab_name: Shipping Geography
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
  - name: Distribution Center
    title: Distribution Center
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: advanced
      display: popover
    model: embed_demo
    explore: order_items
    listens_to_filters: []
    field: distribution_centers.name
