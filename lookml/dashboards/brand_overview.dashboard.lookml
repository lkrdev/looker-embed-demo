- dashboard: brand_overview
  title: Brand Overview
  description: High-level summary of brand revenue, orders, and customer KPIs
  layout: newspaper
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
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
    single_value_title: Revenue
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Total commercial sales revenue across all active channels
    fields: [order_items.total_sale_price]
    filters: {}
    sorts: [order_items.total_sale_price desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: Orders
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Total distinct order transactions placed by customers
    fields: [order_items.order_count]
    filters: {}
    sorts: [order_items.order_count desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: AOV
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Average basket spend per order transaction
    fields: [order_items.average_sale_price]
    filters: {}
    sorts: [order_items.average_sale_price desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: Units
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Total count of individual item units purchased
    fields: [order_items.count]
    filters: {}
    sorts: [order_items.count desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 3
    tab_name: Sales Pulse
  - type: filter
    name: Product Category
    row: 3
    col: 0
    width: 12
    height: 2
    tab_name: Sales Pulse
  - type: filter
    name: Department
    row: 3
    col: 12
    width: 12
    height: 2
    tab_name: Sales Pulse
  - title: Monthly Revenue & AOV Trajectory
    name: Monthly Revenue & AOV Trajectory
    model: embed_demo
    explore: order_items
    type: looker_line
    note_state: expanded
    note_display: hover
    note_text: Multi-series comparison of monthly total revenue vs. average order value trajectory
    fields: [order_items.created_month, order_items.total_sale_price, order_items.average_sale_price]
    sorts: [order_items.created_month]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    point_style: circle
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Total Revenue
      orientation: left
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Average Order Value
      orientation: right
      series:
      - id: order_items.average_sale_price
        name: Average Sale Price
        axisId: order_items.average_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    show_null_points: true
    interpolation: linear
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 5
    col: 0
    width: 14
    height: 9
    tab_name: Sales Pulse
  - title: Revenue Share by Department
    name: Revenue Share by Department
    model: embed_demo
    explore: order_items
    type: looker_pie
    note_state: expanded
    note_display: hover
    note_text: Proportional contribution of each product department to total revenue
    fields: [products.department, order_items.total_sale_price]
    sorts: [order_items.total_sale_price desc]
    limit: 500
    show_view_names: false
    show_value_labels: true
    legend_position: center
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 5
    col: 14
    width: 10
    height: 9
    tab_name: Sales Pulse
  - title: Top Categories by Revenue & Volume
    name: Top Categories by Revenue & Volume
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Vertical comparison of top 10 categories ranked by total revenue and unit count
    fields: [products.category, order_items.total_sale_price, order_items.count]
    sorts: [order_items.total_sale_price desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: true
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Total Revenue
      orientation: left
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Units Sold
      orientation: right
      series:
      - id: order_items.count
        name: Units Sold
        axisId: order_items.count
      showLabels: true
      showValues: true
      unpinAxis: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 14
    col: 0
    width: 12
    height: 9
    tab_name: Sales Pulse
  - title: Daily Revenue Velocity by Day of Week
    name: Daily Revenue Velocity by Day of Week
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Weekly revenue distribution and order count broken down by day of the week
    fields: [order_items.created_day_of_week, order_items.total_sale_price, order_items.order_count]
    sorts: [order_items.created_day_of_week]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: true
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Total Revenue
      orientation: left
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Orders Count
      orientation: right
      series:
      - id: order_items.order_count
        name: Order Count
        axisId: order_items.order_count
      showLabels: true
      showValues: true
      unpinAxis: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 14
    col: 12
    width: 12
    height: 9
    tab_name: Sales Pulse

  # ==========================================
  # TAB 2: CUSTOMERS
  # ==========================================
  - title: Total Active Customers
    name: Total Active Customers
    model: embed_demo
    explore: order_items
    type: single_value
    single_value_title: Active Customers
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Total distinct customer accounts registered or purchasing in this period
    fields: [users.count]
    filters: {}
    sorts: [users.count desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 0
    width: 6
    height: 3
    tab_name: Customers
  - title: Customer Average Spend
    name: Customer Average Spend
    model: embed_demo
    explore: order_items
    type: single_value
    single_value_title: Customer Spend (AOV)
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Average spend per customer order across active accounts
    fields: [order_items.average_sale_price]
    filters: {}
    sorts: [order_items.average_sale_price desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 6
    width: 6
    height: 3
    tab_name: Customers
  - title: Orders per Customer
    name: Orders per Customer
    model: embed_demo
    explore: order_items
    type: single_value
    single_value_title: Total Orders Placed
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Cumulative order transactions generated by customer cohorts
    fields: [order_items.order_count]
    filters: {}
    sorts: [order_items.order_count desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 12
    width: 6
    height: 3
    tab_name: Customers
  - title: New Customer Acquisitions
    name: New Customer Acquisitions
    model: embed_demo
    explore: order_items
    type: single_value
    single_value_title: Tracked Acquisitions
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Customers acquired through attributed digital marketing channels
    fields: [users.count]
    filters:
      users.traffic_source: "-NULL"
    sorts: [users.count desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 3
    tab_name: Customers
  - type: filter
    name: Country
    row: 3
    col: 0
    width: 12
    height: 2
    tab_name: Customers
  - type: filter
    name: Traffic Source
    row: 3
    col: 12
    width: 12
    height: 2
    tab_name: Customers
  - title: Acquisition Value vs Volume by Traffic Source
    name: Acquisition Value vs Volume by Traffic Source
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Evaluates customer acquisition volume against actual total revenue generated per traffic source
    fields: [users.traffic_source, users.count, order_items.total_sale_price]
    filters:
      users.traffic_source: "-NULL"
    sorts: [order_items.total_sale_price desc]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: true
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Users Acquired
      orientation: left
      series:
      - id: users.count
        name: Users Count
        axisId: users.count
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Total Revenue
      orientation: right
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 5
    col: 0
    width: 14
    height: 9
    tab_name: Customers
  - title: Customer Gender Composition
    name: Customer Gender Composition
    model: embed_demo
    explore: order_items
    type: looker_pie
    note_state: expanded
    note_display: hover
    note_text: Percentage and user volume composition across gender demographics
    fields: [users.gender, users.count]
    filters:
      users.gender: "-NULL"
    sorts: [users.count desc]
    limit: 500
    show_view_names: false
    show_value_labels: true
    legend_position: center
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 5
    col: 14
    width: 10
    height: 9
    tab_name: Customers
  - title: Top Geographic Footprint by State
    name: Top Geographic Footprint by State
    model: embed_demo
    explore: order_items
    type: looker_bar
    note_state: expanded
    note_display: hover
    note_text: Top 10 customer states ranked by registered user density
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
    y_axis_unpinned: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 14
    col: 0
    width: 12
    height: 9
    tab_name: Customers
  - title: Customer Signup Growth Over Time
    name: Customer Signup Growth Over Time
    model: embed_demo
    explore: order_items
    type: looker_line
    note_state: expanded
    note_display: hover
    note_text: Longitudinal analysis of monthly customer account signups over time
    fields: [users.created_month, users.count]
    sorts: [users.created_month]
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
    y_axis_unpinned: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 14
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
    single_value_title: Shipped
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items successfully shipped out to customers
    fields: [order_items.count_shipped]
    filters: {}
    sorts: [order_items.count_shipped desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: Processing
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items currently undergoing active warehouse fulfillment
    fields: [order_items.count_processing]
    filters: {}
    sorts: [order_items.count_processing desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: Returned
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items returned by customers following delivery
    fields: [order_items.count_returned]
    filters: {}
    sorts: [order_items.count_returned desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
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
    single_value_title: Cancelled
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items cancelled prior to shipment completion
    fields: [order_items.count_cancelled]
    filters: {}
    sorts: [order_items.count_cancelled desc]
    limit: 500
    font_size: medium
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 3
    tab_name: Orders & Logistics
  - type: filter
    name: Order Status
    row: 3
    col: 0
    width: 24
    height: 2
    tab_name: Orders & Logistics
  - title: Fulfillment Pipeline Status Breakdown
    name: Fulfillment Pipeline Status Breakdown
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Lifecycle status breakdown comparing order item count against associated sales value
    fields: [order_items.status, order_items.count, order_items.total_sale_price]
    sorts: [order_items.count desc]
    limit: 500
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: true
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Items Count
      orientation: left
      series:
      - id: order_items.count
        name: Order Items Count
        axisId: order_items.count
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Total Revenue
      orientation: right
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
    row: 5
    col: 0
    width: 12
    height: 9
    tab_name: Orders & Logistics
  - title: Fulfillment Load by Distribution Center
    name: Fulfillment Load by Distribution Center
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Regional distribution center volume ranking by item throughput and total value handled
    fields: [distribution_centers.name, order_items.count, order_items.total_sale_price]
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
    legend_position: center
    show_value_labels: true
    y_axis_combined: false
    y_axis_unpinned: true
    y_axes:
    - label: Items Handled
      orientation: left
      series:
      - id: order_items.count
        name: Order Items Count
        axisId: order_items.count
      showLabels: true
      showValues: true
      unpinAxis: true
    - label: Total Revenue
      orientation: right
      series:
      - id: order_items.total_sale_price
        name: Total Sale Price
        axisId: order_items.total_sale_price
      showLabels: true
      showValues: true
      unpinAxis: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 5
    col: 12
    width: 12
    height: 9
    tab_name: Orders & Logistics
  - title: Monthly Order Fulfillment Status Evolution
    name: Monthly Order Fulfillment Status Evolution
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Monthly stacked comparison of order statuses highlighting fulfillment reliability trends
    fields: [order_items.created_month, order_items.status, order_items.count]
    pivots: [order_items.status]
    sorts: [order_items.created_month]
    limit: 500
    stacking: normal
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: false
    y_axis_unpinned: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
    row: 14
    col: 0
    width: 14
    height: 9
    tab_name: Orders & Logistics
  - title: Return & Cancellation Hotspots by Category
    name: Return & Cancellation Hotspots by Category
    model: embed_demo
    explore: order_items
    type: looker_column
    note_state: expanded
    note_display: hover
    note_text: Identifies reverse-logistics and cancellation bottlenecks across top product categories
    fields: [products.category, order_items.count_returned, order_items.count_cancelled]
    sorts: [order_items.count_returned desc]
    limit: 10
    x_axis_gridlines: false
    y_axis_gridlines: true
    show_view_names: false
    show_y_axis_labels: true
    show_y_axis_ticks: true
    show_x_axis_label: true
    show_x_axis_ticks: true
    legend_position: center
    show_value_labels: true
    y_axis_unpinned: true
    defaults_version: 1
    advanced_vis_config: |-
      {
        "chart": {
          "borderRadius": 12
        },
        "plotOptions": {
          "series": {
            "borderRadius": 8
          },
          "column": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "bar": {
            "borderRadius": 8,
            "borderWidth": 0
          },
          "pie": {
            "borderRadius": 8,
            "innerSize": "75%",
            "borderWidth": 0
          }
        },
        "tooltip": {
          "borderRadius": 12,
          "shadow": true
        },
        "series": []
      }
    listen:
      Date Range: order_items.created_date
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 14
    col: 14
    width: 10
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
  - name: Traffic Source
    title: Traffic Source
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: checkboxes
      display: popover
    model: embed_demo
    explore: order_items
    field: users.traffic_source
  - name: Order Status
    title: Order Status
    type: field_filter
    default_value: ''
    allow_multiple_values: true
    required: false
    ui_config:
      type: checkboxes
      display: popover
    model: embed_demo
    explore: order_items
    field: order_items.status
