view: products {
  sql_table_name: `bigquery-public-data.thelook_ecommerce.products` ;;
  drill_fields: [id]

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }
  dimension: brand {
    type: string
    sql: ${TABLE}.brand ;;
  }
  dimension: category {
    type: string
    sql: ${TABLE}.category ;;
  }
  dimension: cost {
    type: number
    sql: 1.0 * ${TABLE}.cost * ${currency_conversion.conversion_rate} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
  }
  dimension: department {
    type: string
    sql: ${TABLE}.department ;;
  }
  dimension: distribution_center_id {
    type: number
    sql: ${TABLE}.distribution_center_id ;;
  }
  dimension: name {
    type: string
    sql: ${TABLE}.name ;;
  }
  dimension: item_name {
    type: string
    sql: ${name} ;;
  }
  dimension: retail_price {
    type: number
    sql: 1.0 * ${TABLE}.retail_price * ${currency_conversion.conversion_rate} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
  }
  dimension: sku {
    type: string
    sql: ${TABLE}.sku ;;
  }
  measure: count {
    type: count
    drill_fields: [id]
  }
}
