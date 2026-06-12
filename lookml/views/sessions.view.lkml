view: sessions {
  derived_table: {
    explore_source: events {
      column: session_id {
        field: events.session_id
      }
      column: session_start {
        field: events.session_start
      }
      column: session_end {
        field: events.session_end
      }
      column: number_of_events {
        field: events.count
      }
      column: count_cart_or_later {
        field: events.count_cart_or_later
      }
      column: count_checkout {
        field: events.count_checkout
      }
      column: count_purchase {
        field: events.count_purchase
      }
    }
  }

  dimension: session_id {
    primary_key: yes
    type: string
    sql: ${TABLE}.session_id ;;
  }

  measure: count {
    type: count
  }

  measure: count_cart_or_later {
    type: sum
    sql: ${TABLE}.count_cart_or_later ;;
  }

  measure: cart_to_checkout_conversion {
    type: average
    sql: SAFE_DIVIDE(${TABLE}.count_checkout, ${TABLE}.count_cart_or_later) ;;
    value_format_name: percent_2
  }

  measure: overall_conversion {
    type: average
    sql: SAFE_DIVIDE(${TABLE}.count_purchase, 1) ;;
    value_format_name: percent_2
  }
}
