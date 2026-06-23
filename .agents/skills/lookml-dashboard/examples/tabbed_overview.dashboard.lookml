- dashboard: brand_overview
  title: Brand Overview
  layout: newspaper
  preferred_viewer: dashboards-next
  embed_style:
    background_color: "#f0f4f9"
    show_title: false
    title_color: "#1f1f1f"
    show_filters_bar: true
    tile_text_color: "#1f1f1f"
    text_tile_text_color: "#1f1f1f"
    tile_separator_color: "#e0e2e6"
    tile_border_radius: 12
    show_tile_shadow: true
  tabs:
  - name: Sales Pulse
    label: Sales Pulse
  - name: Customers
    label: Customers
  - name: Orders & Logistics
    label: Orders & Logistics
  elements:
  # ==========================================
  # TAB 1: SALES PULSE
  # ==========================================
  - title: Total Revenue
    name: Total Revenue
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.total_sale_price]
    filters: {}
    sorts: [order_items.total_sale_price desc]
    limit: 500
    font_size: medium
    text_color: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 0
    width: 6
    height: 3
    tab_name: Sales Pulse
  - title: Total Orders
    name: Total Orders
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.order_count]
    filters: {}
    sorts: [order_items.order_count desc]
    limit: 500
    font_size: medium
    text_color: '#a142f4'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 6
    width: 6
    height: 3
    tab_name: Sales Pulse
  - title: Average Order Value
    name: Average Order Value
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.average_sale_price]
    filters: {}
    sorts: [order_items.average_sale_price desc]
    limit: 500
    font_size: medium
    text_color: '#1e8e3e'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 12
    width: 6
    height: 3
    tab_name: Sales Pulse
  - title: Units Sold
    name: Units Sold
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count]
    filters: {}
    sorts: [order_items.count desc]
    limit: 500
    font_size: medium
    text_color: '#e37400'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 18
    width: 6
    height: 3
    tab_name: Sales Pulse
  - title: Monthly Revenue Trend
    name: Monthly Revenue Trend
    model: embed_demo
    explore: order_items
    type: looker_line
    fields: [order_items.created_month, order_items.total_sale_price]
    sorts: [order_items.created_month]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    point_style: circle
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    show_null_points: true
    interpolation: linear
    series_colors:
      order_items.total_sale_price: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 3
    col: 0
    width: 12
    height: 9
    tab_name: Sales Pulse
  - title: Revenue by Category
    name: Revenue by Category
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [products.category, order_items.total_sale_price]
    sorts: [order_items.total_sale_price desc]
    limit: 15
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    show_value_labels: true
    series_colors:
      order_items.total_sale_price: '#a142f4'
    listen:
      Date Range: order_items.created_date
    row: 3
    col: 12
    width: 12
    height: 9
    tab_name: Sales Pulse

  # ==========================================
  # TAB 2: CUSTOMERS
  # ==========================================
  - title: Total Customers
    name: Total Customers
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [users.count]
    filters: {}
    sorts: [users.count desc]
    limit: 500
    font_size: medium
    text_color: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 0
    width: 8
    height: 3
    tab_name: Customers
  - title: Customer Acquisition by Traffic Source
    name: Customer Acquisition by Traffic Source
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [users.traffic_source, users.count]
    filters:
      users.traffic_source: "-NULL"
    sorts: [users.count desc]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    show_value_labels: true
    series_colors:
      users.count: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 8
    width: 16
    height: 8
    tab_name: Customers
  - title: Top 10 States by Customer Count
    name: Top 10 States by Customer Count
    model: embed_demo
    explore: order_items
    type: looker_bar
    fields: [users.state, users.count]
    filters:
      users.state: "-NULL"
    sorts: [users.count desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    show_value_labels: true
    series_colors:
      users.count: '#1e8e3e'
    listen:
      Date Range: order_items.created_date
    row: 8
    col: 0
    width: 12
    height: 9
    tab_name: Customers
  - title: Gender Breakdown
    name: Gender Breakdown
    model: embed_demo
    explore: order_items
    type: looker_pie
    fields: [users.gender, users.count]
    filters:
      users.gender: "-NULL"
    sorts: [users.count desc]
    limit: 500
    show_view_names: false
    show_value_labels: true
    series_colors:
      M: '#0b57d0'
      F: '#a142f4'
      Other: '#e37400'
    listen:
      Date Range: order_items.created_date
    row: 8
    col: 12
    width: 12
    height: 9
    tab_name: Customers

  # ==========================================
  # TAB 3: ORDERS & LOGISTICS
  # ==========================================
  - title: Shipped Orders
    name: Shipped Orders
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count_shipped]
    filters: {}
    sorts: [order_items.count_shipped desc]
    limit: 500
    font_size: medium
    text_color: '#1e8e3e'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 0
    width: 6
    height: 3
    tab_name: Orders & Logistics
  - title: Processing Orders
    name: Processing Orders
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count_processing]
    filters: {}
    sorts: [order_items.count_processing desc]
    limit: 500
    font_size: medium
    text_color: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 6
    width: 6
    height: 3
    tab_name: Orders & Logistics
  - title: Returned Orders
    name: Returned Orders
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count_returned]
    filters: {}
    sorts: [order_items.count_returned desc]
    limit: 500
    font_size: medium
    text_color: '#e37400'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 12
    width: 6
    height: 3
    tab_name: Orders & Logistics
  - title: Cancelled Orders
    name: Cancelled Orders
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count_cancelled]
    filters: {}
    sorts: [order_items.count_cancelled desc]
    limit: 500
    font_size: medium
    text_color: '#d93025'
    listen:
      Date Range: order_items.created_date
    row: 0
    col: 18
    width: 6
    height: 3
    tab_name: Orders & Logistics
  - title: Orders Breakdown by Status
    name: Orders Breakdown by Status
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [order_items.status, order_items.count]
    sorts: [order_items.count desc]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    show_value_labels: true
    series_colors:
      order_items.count: '#0b57d0'
    listen:
      Date Range: order_items.created_date
    row: 3
    col: 0
    width: 12
    height: 9
    tab_name: Orders & Logistics
  - title: Fulfillment Volume by Distribution Center
    name: Fulfillment Volume by Distribution Center
    model: embed_demo
    explore: order_items
    type: looker_bar
    fields: [distribution_centers.name, order_items.count]
    filters:
      distribution_centers.name: "-NULL"
    sorts: [order_items.count desc]
    limit: 15
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: none
    show_value_labels: true
    series_colors:
      order_items.count: '#a142f4'
    listen:
      Date Range: order_items.created_date
    row: 3
    col: 12
    width: 12
    height: 9
    tab_name: Orders & Logistics

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
