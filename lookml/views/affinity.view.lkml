view: affinity {
  derived_table: {
    datagroup_trigger: embed_demo_default_datagroup
    cluster_keys: ["product_a_id", "product_b_id"]
    sql: 
      SELECT
        p1.product_id AS product_a_id,
        p2.product_id AS product_b_id,
        COUNT(DISTINCT p1.order_id) AS combined_affinity,
        COUNT(DISTINCT p1.user_id) AS avg_user_affinity,
        AVG(p1.sale_price + p2.sale_price) AS avg_order_affinity
      FROM (
        SELECT oi.order_id, oi.user_id, ii.product_id, SUM(oi.sale_price) AS sale_price
        FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
        JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii ON oi.inventory_item_id = ii.id
        GROUP BY 1, 2, 3
      ) AS p1
      JOIN (
        SELECT oi.order_id, ii.product_id, SUM(oi.sale_price) AS sale_price
        FROM `bigquery-public-data.thelook_ecommerce.order_items` AS oi
        JOIN `bigquery-public-data.thelook_ecommerce.inventory_items` AS ii ON oi.inventory_item_id = ii.id
        GROUP BY 1, 2
      ) AS p2
      ON p1.order_id = p2.order_id
      AND p1.product_id <> p2.product_id
      GROUP BY 1, 2
    ;;
  }

  dimension: product_a_id {
    type: string
    sql: SAFE_CAST(${TABLE}.product_a_id AS STRING) ;;
  }

  dimension: product_b_id {
    type: string
    sql: SAFE_CAST(${TABLE}.product_b_id AS STRING) ;;
  }

  measure: combined_affinity {
    type: sum
    sql: ${TABLE}.combined_affinity ;;
  }

  measure: avg_user_affinity {
    type: average
    sql: ${TABLE}.avg_user_affinity ;;
  }

  measure: avg_order_affinity {
    type: average
    sql: ${TABLE}.avg_order_affinity ;;
    value_format_name: usd
  }
}
