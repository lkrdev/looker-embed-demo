- dashboard: brand_overview_improved
  title: Brand Overview - Improved
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
    note_state: expanded
    note_display: hover
    note_text: Total commercial sales revenue across all active channels
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
    note_state: expanded
    note_display: hover
    note_text: Total distinct order transactions placed by customers
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
    note_state: expanded
    note_display: hover
    note_text: Average basket spend per order transaction
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
    note_state: expanded
    note_display: hover
    note_text: Total count of individual item units purchased
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
    note_state: expanded
    note_display: hover
    note_text: Multi-series comparison of monthly total revenue vs. average order
      value trajectory
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
    note_state: expanded
    note_display: hover
    note_text: Proportional contribution of each country to total revenue
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
    note_state: expanded
    note_display: hover
    note_text: Vertical comparison of top 10 categories ranked by total revenue and
      unit count
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
    fields: [order_items.created_date, order_items.total_sale_price, order_items.order_count,
      day_num, day_name]
    dynamic_fields: '[{"table_calculation":"day_num","label":"Day Number","expression":"mod(diff_days(date(2020,
      1, 5), ${order_items.created_date}), 7)","_kind_hint":"dimension","_type_hint":"number"},{"table_calculation":"day_name","label":"Day
      of Week","expression":"if(${day_num} = 0, \\"Sunday\\", if(${day_num} = 1, \\"Monday\\",
      if(${day_num} = 2, \\"Tuesday\\", if(${day_num} = 3, \\"Wednesday\\", if(${day_num}
      = 4, \\"Thursday\\", if(${day_num} = 5, \\"Friday\\", \\"Saturday\\"))))))","_kind_hint":"dimension","_type_hint":"string"}]'
    sorts: [day_num]
    limit: 500
    hidden_fields: [order_items.created_date, day_num]
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
    note_state: expanded
    note_display: hover
    note_text: Weekly revenue distribution and order count broken down by day of the
      week
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
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [users.count]
    sorts: [users.count desc]
    limit: 500
    single_value_title: Active Customers
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Total distinct customer accounts registered or purchasing in this period
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
    fields: [order_items.average_sale_price]
    sorts: [order_items.average_sale_price desc]
    limit: 500
    single_value_title: Customer Spend (AOV)
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Average spend per customer order across active accounts
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
    fields: [order_items.order_count]
    sorts: [order_items.order_count desc]
    limit: 500
    single_value_title: Total Orders Placed
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Cumulative order transactions generated by customer cohorts
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
    fields: [users.count]
    filters:
      users.traffic_source: "-NULL"
    sorts: [users.count desc]
    limit: 500
    single_value_title: Tracked Acquisitions
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Customers acquired through attributed digital marketing channels
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


  - title: Acquisition Value vs Volume by Traffic Source
    name: Acquisition Value vs Volume by Traffic Source
    model: embed_demo
    explore: order_items
    type: looker_column
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
    note_state: expanded
    note_display: hover
    note_text: Evaluates customer acquisition volume against actual total revenue
      generated per traffic source
    y_axis_unpinned: true
    y_axes: [{label: Users Acquired, orientation: left, series: [{id: users.count,
            name: Users Count, axisId: users.count}], showLabels: true, showValues: true,
        unpinAxis: true}, {label: Total Revenue, orientation: right, series: [{id: order_items.total_sale_price,
            name: Total Sale Price, axisId: order_items.total_sale_price}], showLabels: true,
        showValues: true, unpinAxis: true}]
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
    fields: [users.gender, users.count]
    filters:
      users.gender: "-NULL"
    sorts: [users.count desc]
    limit: 500
    value_labels: legend
    label_type: labPer
    note_state: expanded
    note_display: hover
    note_text: Percentage and user volume composition across gender demographics
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
    note_state: expanded
    note_display: hover
    note_text: Top 10 customer states ranked by registered user density
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
    note_state: expanded
    note_display: hover
    note_text: Longitudinal analysis of monthly customer account signups over time
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
    model: embed_demo
    explore: order_items
    type: single_value
    fields: [order_items.count_shipped]
    sorts: [order_items.count_shipped desc]
    limit: 500
    single_value_title: Shipped
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items successfully shipped out to customers
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
    fields: [order_items.count_processing]
    sorts: [order_items.count_processing desc]
    limit: 500
    single_value_title: Processing
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items currently undergoing active warehouse fulfillment
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
    fields: [order_items.count_returned]
    sorts: [order_items.count_returned desc]
    limit: 500
    single_value_title: Returned
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items returned by customers following delivery
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
    fields: [order_items.count_cancelled]
    sorts: [order_items.count_cancelled desc]
    limit: 500
    single_value_title: Cancelled
    comparison_label: vs Prior Period
    note_state: expanded
    note_display: hover
    note_text: Order items cancelled prior to shipment completion
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
    note_state: expanded
    note_display: hover
    note_text: Lifecycle status breakdown comparing order item count against associated
      sales value
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
    type: looker_column
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
    note_state: expanded
    note_display: hover
    note_text: Regional distribution center volume ranking by item throughput and
      total value handled
    y_axis_unpinned: true
    y_axes: [{label: Items Handled, orientation: left, series: [{id: order_items.count,
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
    fields: [order_items.created_month, order_items.status, order_items.count]
    pivots: [order_items.status]
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
    stacking: normal
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
    note_text: Monthly stacked comparison of order statuses highlighting fulfillment
      reliability trends
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
    fields: [products.category, order_items.count_returned, order_items.count_cancelled]
    sorts: [order_items.count_returned desc]
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
    y_axis_combined: true
    ordering: none
    show_null_labels: false
    show_totals_labels: false
    show_silhouette: false
    totals_color: "#808080"
    note_state: expanded
    note_display: hover
    note_text: Identifies reverse-logistics and cancellation bottlenecks across top
      product categories
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
