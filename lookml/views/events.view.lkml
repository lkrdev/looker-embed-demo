view: events {
  sql_table_name: `bigquery-public-data.thelook_ecommerce.events` ;;
  drill_fields: [id]

  dimension: id {
    primary_key: yes
    type: number
    sql: ${TABLE}.id ;;
  }
  dimension: browser {
    type: string
    sql: ${TABLE}.browser ;;
  }
  dimension: city {
    type: string
    sql: ${TABLE}.city ;;
  }
  dimension: country {
    type: string
    map_layer_name: countries
    sql: ${TABLE}.country ;;
  }
  dimension_group: created {
    type: time
    timeframes: [raw, time, date, week, month, quarter, year]
    sql: ${TABLE}.created_at ;;
  }
  dimension: event_type {
    type: string
    sql: ${TABLE}.event_type ;;
  }
  dimension: ip_address {
    type: string
    sql: ${TABLE}.ip_address ;;
  }
  dimension: latitude {
    type: number
    sql: ${TABLE}.latitude ;;
  }
  dimension: longitude {
    type: number
    sql: ${TABLE}.longitude ;;
  }
  dimension: os {
    type: string
    sql: ${TABLE}.os ;;
  }
  dimension: sequence_number {
    type: number
    sql: ${TABLE}.sequence_number ;;
  }
  dimension: session_id {
    type: string
    sql: ${TABLE}.session_id ;;
  }
  dimension: state {
    type: string
    sql: ${TABLE}.state ;;
  }
  dimension: traffic_source {
    type: string
    sql: ${TABLE}.traffic_source ;;
  }
  dimension: uri {
    type: string
    sql: ${TABLE}.uri ;;
  }
  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
  }
  dimension: zip {
    type: zipcode
    sql: ${TABLE}.zip ;;
  }
  measure: count {
    type: count
    drill_fields: [id]
  }

  measure: session_start {
    type: min
    sql: ${created_raw} ;;
  }

  measure: session_end {
    type: max
    sql: ${created_raw} ;;
  }

  measure: count_cart_or_later {
    type: count
    filters: [event_type: "Cart"]
  }

  measure: count_checkout {
    type: count
    filters: [event_type: "Checkout"]
  }

  measure: count_purchase {
    type: count
    filters: [event_type: "Purchase"]
  }
  dimension_group: event {
    type: time
    timeframes: [raw, time, date, week, month, quarter, year, hour_of_day]
    sql: ${TABLE}.created_at ;;
  }
  dimension: product_id {
    type: number
    sql: SAFE_CAST(REGEXP_EXTRACT(${uri}, r'/products/([0-9]+)') AS INT64) ;;
  }
}
