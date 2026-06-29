include: "/views/order_items.view.lkml"

view: order_items_share_of_wallet {
  extends: [order_items]

  measure: total_sale_price_brand_v2 {
    type: sum
    sql: ${sale_price} ;;
    value_format_name: decimal_2
    html: @{currency_html} ;;
  }

  measure: brand_share_of_wallet_within_company {
    type: number
    sql: SAFE_DIVIDE(${total_sale_price_brand_v2}, ${total_sale_price}) ;;
    value_format_name: percent_2
  }

  dimension: brand {
    type: string
    sql: ${products.brand} ;;
  }
}
