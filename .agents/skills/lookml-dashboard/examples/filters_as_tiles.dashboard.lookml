# Example demonstrating filters placed directly on the LookML dashboard grid as elements:
# - crossfilter_enabled: true for interactive filtering across charts
# - Global date range filter in the dashboard filter bar
# - In-tab interactive filter controls (type: filter) placed directly on specific tab layouts

- dashboard: filters_as_tiles_example
  title: Filters As Tiles Example
  layout: newspaper
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  tabs:
  - name: Sales Pulse
    label: Sales Pulse
  - name: Customers
    label: Customers
  elements:
  # ==========================================
  # TAB 1: SALES PULSE
  # ==========================================
  # Interactive Filter Control Placed on Dashboard Grid
  - type: filter
    name: Product Category
    row: 0
    col: 0
    width: 12
    height: 2
    tab_name: Sales Pulse
  - type: filter
    name: Department
    row: 0
    col: 12
    width: 12
    height: 2
    tab_name: Sales Pulse

  - title: Revenue by Category
    name: Revenue by Category
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [products.category, order_items.total_sale_price]
    sorts: [order_items.total_sale_price desc]
    limit: 15
    legend_position: center
    show_value_labels: true
    listen:
      Date Range: order_items.created_date
      Product Category: products.category
      Department: products.department
      Country: users.country
    row: 2
    col: 0
    width: 24
    height: 9
    tab_name: Sales Pulse

  # ==========================================
  # TAB 2: CUSTOMERS
  # ==========================================
  # Interactive Filter Control Placed on Customers Tab Grid
  - type: filter
    name: Country
    row: 0
    col: 0
    width: 24
    height: 2
    tab_name: Customers

  - title: Top Geographic Footprint by State
    name: Top Geographic Footprint by State
    model: embed_demo
    explore: order_items
    type: looker_bar
    fields: [users.state, users.count]
    filters:
      users.state: "-NULL"
    sorts: [users.count desc]
    limit: 10
    legend_position: none
    show_value_labels: true
    listen:
      Date Range: order_items.created_date
      Product Category: products.category
      Department: products.department
      Country: users.country
    row: 2
    col: 0
    width: 24
    height: 9
    tab_name: Customers

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
  - name: Product Category
    title: Product Category
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: checkboxes
      display: popover
    model: embed_demo
    explore: order_items
    field: products.category
  - name: Department
    title: Department
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: checkboxes
      display: popover
    model: embed_demo
    explore: order_items
    field: products.department
  - name: Country
    title: Country
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: checkboxes
      display: popover
    model: embed_demo
    explore: order_items
    field: users.country
