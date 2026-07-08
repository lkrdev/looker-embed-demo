# Example demonstrating advanced LookML dashboard visualization configuration:
# Reference documentation for chart config options: https://docs.cloud.google.com/looker/docs/chart-config-editor
# - Global theme inheritance (no hardcoded series_colors or embed_style)
# - Dual and unpinned Y-axes (y_axis_combined: false, y_axis_unpinned: true, and explicit y_axes block)
# - Highcharts JSON customization via advanced_vis_config (borderRadius, innerSize, tooltip styling)
# - Centered legend positioning (legend_position: center)
# - Clean element names without periods

- dashboard: advanced_vis_config_example
  title: Advanced Vis Config Example
  layout: newspaper
  preferred_viewer: dashboards-next
  crossfilter_enabled: true
  elements:
  # Multi-Metric Dual Y-Axis Column Chart
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
    row: 0
    col: 0
    width: 14
    height: 9

  # Donut Chart with Inner Size and No Slice Borders
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
    row: 0
    col: 14
    width: 10
    height: 9
