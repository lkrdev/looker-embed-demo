- dashboard: brand_overview
  title: Brand Overview
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  description: High-level summary of brand revenue, orders, and customer KPIs
  layout: newspaper
  tabs:
  - name: Sales Pulse
    label: Sales Pulse
  - name: Customers
    label: Customers
  - name: Orders & Logistics
    label: Orders & Logistics
  elements:
  - title: Revenue
    name: Total Revenue
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.total_sale_price]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.total_sale_price}, 0, 180))
      value_format: "$#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.total_sale_price}, 180, 180))
      value_format: "$#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.total_sale_price, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Revenue
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Total commercial sales revenue across all active channels"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 0
    width: 6
    height: 4
    tab_name: Sales Pulse
  - title: Orders
    name: Total Orders
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.order_count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.order_count}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.order_count}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.order_count, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Orders
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Total distinct order transactions placed by customers"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 6
    width: 6
    height: 4
    tab_name: Sales Pulse
  - title: Average Order Value
    name: Average Order Value
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.total_sale_price, order_items.order_count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_revenue
      label: Current Revenue
      expression: sum(offset_list(${order_items.total_sale_price}, 0, 180))
    - table_calculation: current_orders
      label: Current Orders
      expression: sum(offset_list(${order_items.order_count}, 0, 180))
    - table_calculation: current_aov
      label: Current AOV
      expression: "${current_revenue} / ${current_orders}"
      value_format: "$#,##0.00"
    - table_calculation: prior_revenue
      label: Prior Revenue
      expression: sum(offset_list(${order_items.total_sale_price}, 180, 180))
    - table_calculation: prior_orders
      label: Prior Orders
      expression: sum(offset_list(${order_items.order_count}, 180, 180))
    - table_calculation: prior_aov
      label: Prior AOV
      expression: "${prior_revenue} / ${prior_orders}"
      value_format: "$#,##0.00"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_aov} - ${prior_aov}) / ${prior_aov}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.total_sale_price, order_items.order_count, current_revenue, current_orders, prior_revenue, prior_orders, prior_aov]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Average Order Value
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Average basket spend per order transaction"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 12
    width: 6
    height: 4
    tab_name: Sales Pulse
  - title: Units Sold
    name: Units Sold
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.count}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.count}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.count, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Units Sold
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Total count of individual item units purchased"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 4
    tab_name: Sales Pulse


  - title: Monthly Revenue & AOV Trajectory
    name: Monthly Revenue & AOV Trajectory
    model: embed_demo
    explore: order_items
    type: looker_line
    fields: [order_items.created_month, order_items.total_sale_price, order_items.average_sale_price]
    sorts: [order_items.created_month]
    limit: 500
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
    point_style: circle
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    show_null_points: true
    interpolation: linear
    note:
      state: expanded
      display: hover
      text: "Multi-series comparison of monthly total revenue vs. average order value trajectory"
    y_axis_unpinned: true
    y_axes: [{label: Total Revenue, orientation: left, series: [{id: order_items.total_sale_price,
            name: Total Sale Price, axisId: order_items.total_sale_price}], showLabels: true,
        showValues: true, unpinAxis: true}, {label: Average Order Value, orientation: right,
        series: [{id: order_items.average_sale_price, name: Average Sale Price, axisId: order_items.average_sale_price}],
        showLabels: true, showValues: true, unpinAxis: true}]
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
  - title: Revenue Share by Country
    name: Revenue Share by Country
    model: embed_demo
    explore: order_items
    type: looker_pie
    fields: [users.country, order_items.total_sale_price]
    sorts: [order_items.total_sale_price desc]
    limit: 500
    value_labels: legend
    label_type: labPer
    note:
      state: expanded
      display: hover
      text: "Proportional contribution of each country to total revenue"
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
    fields: [products.category, order_items.total_sale_price, order_items.count]
    sorts: [order_items.total_sale_price desc]
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
    show_value_labels: true
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note:
      state: expanded
      display: hover
      text: "Vertical comparison of top 10 categories ranked by total revenue and unit count"
    y_axis_unpinned: true
    y_axes: [{label: Total Revenue, orientation: left, series: [{id: order_items.total_sale_price,
            name: Total Sale Price, axisId: order_items.total_sale_price}], showLabels: true,
        showValues: true, unpinAxis: true}, {label: Units Sold, orientation: right,
        series: [{id: order_items.count, name: Units Sold, axisId: order_items.count}],
        showLabels: true, showValues: true, unpinAxis: true}]
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
    fields: [order_items.created_day_of_week, order_items.created_day_of_week_index,
      order_items.total_sale_price, order_items.order_count]
    sorts: [order_items.created_day_of_week_index]
    limit: 500
    hidden_fields: [order_items.created_day_of_week_index]
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
    show_value_labels: true
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note:
      state: expanded
      display: hover
      text: "Weekly revenue distribution and order count broken down by day of the week"
    y_axis_unpinned: true
    y_axes: [{label: Total Revenue, orientation: left, series: [{id: order_items.total_sale_price,
            name: Total Sale Price, axisId: order_items.total_sale_price}], showLabels: true,
        showValues: true, unpinAxis: true}, {label: Orders Count, orientation: right,
        series: [{id: order_items.order_count, name: Order Count, axisId: order_items.order_count}],
        showLabels: true, showValues: true, unpinAxis: true}]
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
  - title: Total Active Customers
    name: Total Active Customers
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, users.count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${users.count}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${users.count}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, users.count, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Active Customers
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Total distinct customer accounts registered or purchasing in this period"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 0
    width: 6
    height: 4
    tab_name: Customers
  - title: Customer Average Spend
    name: Customer Average Spend
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.total_sale_price, order_items.count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_revenue
      label: Current Revenue
      expression: sum(offset_list(${order_items.total_sale_price}, 0, 180))
    - table_calculation: current_items
      label: Current Items
      expression: sum(offset_list(${order_items.count}, 0, 180))
    - table_calculation: current_spend
      label: Current Spend
      expression: "${current_revenue} / ${current_items}"
      value_format: "$#,##0.00"
    - table_calculation: prior_revenue
      label: Prior Revenue
      expression: sum(offset_list(${order_items.total_sale_price}, 180, 180))
    - table_calculation: prior_items
      label: Prior Items
      expression: sum(offset_list(${order_items.count}, 180, 180))
    - table_calculation: prior_spend
      label: Prior Spend
      expression: "${prior_revenue} / ${prior_items}"
      value_format: "$#,##0.00"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_spend} - ${prior_spend}) / ${prior_spend}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.total_sale_price, order_items.count, current_revenue, current_items, prior_revenue, prior_items, prior_spend]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Customer Spend (AOV)
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Average spend per customer order across active accounts"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 6
    width: 6
    height: 4
    tab_name: Customers
  - title: Orders per Customer
    name: Orders per Customer
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.order_count]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.order_count}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.order_count}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.order_count, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Total Orders Placed
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Cumulative order transactions generated by customer cohorts"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 12
    width: 6
    height: 4
    tab_name: Customers
  - title: New Customer Acquisitions
    name: New Customer Acquisitions
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, users.count]
    filters:
      users.traffic_source: "-NULL"
      order_items.created_date: 360 days
    sorts: [order_items.created_date desc]
    limit: 360
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${users.count}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${users.count}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, users.count, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Tracked Acquisitions
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Customers acquired through attributed digital marketing channels"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 4
    tab_name: Customers


  - title: Return Rate and Customer Count over Time
    name: Return Rate and Customer Count over Time
    model: embed_demo
    explore: order_items
    type: looker_line
    fields: [order_items.created_month, order_items.order_count_returned, order_items.order_count_complete,
      users.count]
    dynamic_fields:
    - table_calculation: return_rate
      label: Return Rate
      expression: "${order_items.order_count_returned} / (${order_items.order_count_complete} + ${order_items.order_count_returned})"
      value_format: '0.0%'
    sorts: [order_items.created_month]
    limit: 500
    hidden_fields: [order_items.order_count_returned, order_items.order_count_complete]
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
    point_style: circle
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    show_null_points: true
    interpolation: linear
    note:
      state: expanded
      display: hover
      text: "Return rate and distinct customer count trended over time"
    y_axis_unpinned: true
    y_axes: [{label: Customer Count, orientation: left, series: [{id: users.count,
            name: Users Count, axisId: users.count}], showLabels: true, showValues: true,
        unpinAxis: true}, {label: Return Rate, orientation: right, series: [{id: return_rate,
            name: Return Rate, axisId: return_rate}], showLabels: true, showValues: true,
        unpinAxis: true}]
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
  - title: Customer Traffic Source Composition
    name: Customer Traffic Source Composition
    model: embed_demo
    explore: order_items
    type: looker_pie
    fields: [users.traffic_source, users.count]
    filters:
      users.traffic_source: "-NULL"
    sorts: [users.count desc]
    limit: 500
    value_labels: legend
    label_type: labPer
    note:
      state: expanded
      display: hover
      text: "Percentage and user volume composition across traffic sources"
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
  - title: Top Geographic Footprint by Location
    name: Top Geographic Footprint by Location
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
    y_axis_tick_density: default
    y_axis_tick_density_custom: 5
    show_x_axis_label: true
    x_axis_label: Location
    show_x_axis_ticks: true
    y_axis_scale_mode: linear
    x_axis_reversed: false
    y_axis_reversed: false
    plot_size_by_field: false
    trellis: ''
    stacking: ''
    limit_displayed_rows: false
    legend_position: none
    point_style: none
    show_value_labels: true
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note:
      state: expanded
      display: hover
      text: "Top 10 customer states ranked by registered user density"
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
    fields: [users.created_month, users.count]
    sorts: [users.created_month]
    limit: 500
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
    legend_position: none
    point_style: circle
    show_value_labels: false
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: true
    show_null_points: true
    interpolation: linear
    note:
      state: expanded
      display: hover
      text: "Longitudinal analysis of monthly customer account signups over time"
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
  - title: Shipped Orders
    name: Shipped Orders
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.count_shipped]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.count_shipped}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.count_shipped}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.count_shipped, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Shipped
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Order items successfully shipped out to customers"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 0
    width: 6
    height: 4
    tab_name: Orders & Logistics
  - title: Processing Orders
    name: Processing Orders
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.count_processing]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.count_processing}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.count_processing}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.count_processing, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Processing
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: false
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Order items currently undergoing active warehouse fulfillment"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 6
    width: 6
    height: 4
    tab_name: Orders & Logistics
  - title: Returned Orders
    name: Returned Orders
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.count_returned]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.count_returned}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.count_returned}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.count_returned, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Returned
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: true
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Order items returned by customers following delivery"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 12
    width: 6
    height: 4
    tab_name: Orders & Logistics
  - title: Cancelled Orders
    name: Cancelled Orders
    title_hidden: true
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.created_date, order_items.count_cancelled]
    sorts: [order_items.created_date desc]
    limit: 360
    filters:
      order_items.created_date: 360 days
    dynamic_fields:
    - table_calculation: current_period
      label: Current Period
      expression: sum(offset_list(${order_items.count_cancelled}, 0, 180))
      value_format: "#,##0"
    - table_calculation: prior_period
      label: Prior Period
      expression: sum(offset_list(${order_items.count_cancelled}, 180, 180))
      value_format: "#,##0"
    - table_calculation: pp_change
      label: P/P Change
      expression: "(${current_period} - ${prior_period}) / ${prior_period}"
      value_format: '0.0%'
    hidden_fields: [order_items.created_date, order_items.count_cancelled, prior_period]
    limit_displayed_rows: true
    limit_displayed_rows_values:
      show_hide: show
      first_last: first
      num_rows: '1'
    show_single_value_title: true
    single_value_title: Cancelled
    show_comparison: true
    comparison_type: change
    comparison_reverse_colors: true
    show_comparison_label: true
    comparison_label: "P/P Change"
    note:
      state: expanded
      display: hover
      text: "Order items cancelled prior to shipment completion"
    font_size: medium
    listen:
      Country: users.country
      Product Category: products.category
      Department: products.department
      Traffic Source: users.traffic_source
      Order Status: order_items.status
    row: 0
    col: 18
    width: 6
    height: 4
    tab_name: Orders & Logistics
  - title: Fulfillment Pipeline Status Breakdown
    name: Fulfillment Pipeline Status Breakdown
    model: embed_demo
    explore: order_items
    type: looker_column
    fields: [order_items.status, order_items.count, order_items.total_sale_price]
    sorts: [order_items.count desc]
    limit: 500
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
    show_value_labels: true
    label_density: 25
    x_axis_scale: auto
    y_axis_combined: false
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note:
      state: expanded
      display: hover
      text: "Lifecycle status breakdown comparing order item count against associated sales value"
    y_axis_unpinned: true
    y_axes: [{label: Items Count, orientation: left, series: [{id: order_items.count,
            name: Order Items Count, axisId: order_items.count}], showLabels: true,
        showValues: true, unpinAxis: true}, {label: Total Revenue, orientation: right,
        series: [{id: order_items.total_sale_price, name: Total Sale Price, axisId: order_items.total_sale_price}],
        showLabels: true, showValues: true, unpinAxis: true}]
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
    type: looker_google_map
    fields: [distribution_centers.location, distribution_centers.name, order_items.total_sale_price]
    filters:
      distribution_centers.name: "-NULL"
    sorts: [order_items.total_sale_price desc]
    limit: 15
    map_plot_mode: points
    heatmap_gridlines: false
    heatmap_gridlines_empty: false
    heatmap_opacity: 0.5
    show_region_field: true
    draw_map_labels_above_data: true
    map_tile_provider: light
    map_position: custom
    map_latitude: 39.5
    map_longitude: -98.0
    map_zoom: 4
    map_scale_indicator: 'off'
    map_pannable: true
    map_zoomable: true
    map_marker_type: circle
    map_marker_icon_name: default
    map_marker_radius_mode: proportional_value
    map_marker_units: pixels
    map_marker_proportional_scale_type: linear
    map_marker_color_mode: fixed
    show_view_names: false
    show_legend: true
    quantize_map_value_colors: false
    reverse_map_value_colors: false
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
    type: looker_area
    fields: [order_items.created_month, order_items.status, order_items.count]
    pivots: [order_items.status]
    fill_fields: [order_items.created_month]
    filters:
      order_items.status: -NULL
    sorts: [order_items.created_month desc, order_items.status]
    limit: 500
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
    stacking: percent
    limit_displayed_rows: false
    legend_position: center
    point_style: none
    show_value_labels: false
    label_density: 25
    x_axis_scale: ordinal
    y_axis_combined: true
    show_null_points: true
    interpolation: linear
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note:
      state: expanded
      display: hover
      text: "Long-term operational throughput analysis by status composition percentage"
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
    tab_name: Orders & Logistics
  - title: Return & Cancellation Hotspots by Category
    name: Return & Cancellation Hotspots by Category
    model: embed_demo
    explore: order_items
    type: looker_grid
    fields: [products.category, order_items.count_returned, order_items.count_cancelled]
    filters:
      products.category: "-NULL"
    sorts: [order_items.count_returned desc]
    limit: 25
    show_view_names: false
    show_row_numbers: true
    transpose: false
    truncate_text: true
    hide_totals: false
    hide_row_totals: false
    size_to_fit: true
    table_theme: white
    limit_displayed_rows: false
    enable_conditional_formatting: true
    header_text_alignment: left
    header_font_size: '12'
    body_text_alignment: left
    body_font_size: '12'
    conditional_formatting_include_totals: false
    conditional_formatting_include_nulls: false
    show_sql_query_menu_button: false
    show_navigation_menu_buttons: false
    conditional_formatting: [{type: "along a scale...", value: !!null '', background_color: "#3EB0D5",
        color: "#000000", empty_color: '', ocr_style: ovr_value, thickness: 10, bars: [red],
        range: [0, 1000], palette: {name: Crimson, colors: ["#FFF5F5", "#FFE3E3",
            "#FFC9C9", "#FFA8A8", "#FF8787", "#FF6B6B", "#FA5252", "#F03E3E", "#E61C1C",
            "#C91A1A"]}, color_application: {collection_id: default, palette_id: default_emeraude_rdgy,
          options: {steps: 5, reverse: true}}, bold: false, italic: false, strikethrough: false,
        fields: [order_items.count_returned, order_items.count_cancelled]}]
    defaults_version: 1
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
    tab_name: Orders & Logistics
  filters:
  - name: Date Range
    title: Date Range
    type: date_filter
    default_value: 180 days
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
    listens_to_filters: []
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
    listens_to_filters: []
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
    listens_to_filters: []
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
    listens_to_filters: []
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
    listens_to_filters: []
    field: order_items.status