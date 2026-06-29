view: order_items {
  sql_table_name: `bigquery-public-data.thelook_ecommerce.order_items` ;;
  drill_fields: [id, order_id, sale_price, status]

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }
  dimension_group: created {
    type: time
    timeframes: [raw, time, date, week, month, quarter, year]
    sql: ${TABLE}.created_at ;;
  }
  dimension_group: delivered {
    type: time
    timeframes: [raw, date, week, month, quarter, year]
    convert_tz: no
    datatype: date
    sql: ${TABLE}.delivered_at ;;
  }
  dimension: inventory_item_id {
    type: number
    sql: ${TABLE}.inventory_item_id ;;
  }
  dimension: order_id {
    type: number
    sql: ${TABLE}.order_id ;;
  }
  dimension_group: returned {
    type: time
    timeframes: [raw, time, date, week, month, quarter, year]
    sql: ${TABLE}.returned_at ;;
  }
  dimension: sale_price {
    type: number
    sql: 1.0 * ${TABLE}.sale_price * ${currency_conversion.conversion_rate} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
  }
  dimension_group: shipped {
    type: time
    timeframes: [raw, date, week, month, quarter, year]
    convert_tz: no
    datatype: date
    sql: ${TABLE}.shipped_at ;;
  }
  dimension: status {
    type: string
    description: "Status of the order item (Cancelled, Complete, Processing, Returned, or Shipped)."
    sql: ${TABLE}.status ;;
  }
  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }
  measure: count {
    type: count
    description: "Total count of order items."
  }
  measure: count_cancelled {
    type: count
    filters: [status: "Cancelled"]
    group_label: "Count (Filtered)"
    label: "Count Cancelled"
    description: "Count of order items with status Cancelled."
  }
  measure: count_complete {
    type: count
    filters: [status: "Complete"]
    group_label: "Count (Filtered)"
    label: "Count Complete"
    description: "Count of order items with status Complete."
  }
  measure: count_processing {
    type: count
    filters: [status: "Processing"]
    group_label: "Count (Filtered)"
    label: "Count Processing"
    description: "Count of order items with status Processing."
  }
  measure: count_returned {
    type: count
    filters: [status: "Returned"]
    group_label: "Count (Filtered)"
    label: "Count Returned"
    description: "Count of order items with status Returned."
  }
  measure: count_shipped {
    type: count
    filters: [status: "Shipped"]
    group_label: "Count (Filtered)"
    label: "Count Shipped"
    description: "Count of order items with status Shipped."
  }
  measure: total_sale_price {
    type: sum
    sql: ${sale_price} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
    label: "Total Sale Price"
    description: "Total sale price of all order items."
  }
  measure: total_sale_price_cancelled {
    type: sum
    sql: ${sale_price} ;;
    filters: [status: "Cancelled"]
    value_format_name: decimal_2
    html: @{currency_html} ;;
    group_label: "Total Sale Price (Filtered)"
    label: "Total Sale Price Cancelled"
    description: "Total sale price of order items with status Cancelled."
  }
  measure: total_sale_price_complete {
    type: sum
    sql: ${sale_price} ;;
    filters: [status: "Complete"]
    value_format_name: decimal_2
    html: @{currency_html} ;;
    group_label: "Total Sale Price (Filtered)"
    label: "Total Sale Price Complete"
    description: "Total sale price of order items with status Complete."
  }
  measure: total_sale_price_processing {
    type: sum
    sql: ${sale_price} ;;
    filters: [status: "Processing"]
    value_format_name: decimal_2
    html: @{currency_html} ;;
    group_label: "Total Sale Price (Filtered)"
    label: "Total Sale Price Processing"
    description: "Total sale price of order items with status Processing."
  }
  measure: total_sale_price_returned {
    type: sum
    sql: ${sale_price} ;;
    filters: [status: "Returned"]
    value_format_name: decimal_2
    html: @{currency_html} ;;
    group_label: "Total Sale Price (Filtered)"
    label: "Total Sale Price Returned"
    description: "Total sale price of order items with status Returned."
  }
  measure: total_sale_price_shipped {
    type: sum
    sql: ${sale_price} ;;
    filters: [status: "Shipped"]
    value_format_name: decimal_2
    html: @{currency_html} ;;
    group_label: "Total Sale Price (Filtered)"
    label: "Total Sale Price Shipped"
    description: "Total sale price of order items with status Shipped."
  }
  measure: order_count {
    type: count_distinct
    sql: ${order_id} ;;
    description: "Distinct count of orders."
  }
  measure: average_sale_price {
    type: average
    sql: ${sale_price} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
    description: "Average sale price of order items."
  }
  dimension_group: since_signup {
    type: duration
    intervals: [month]
    sql_start: ${users.created_raw} ;;
    sql_end: ${created_raw} ;;
  }
}
