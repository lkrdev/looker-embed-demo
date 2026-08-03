view: bought_together_recommendations {
  derived_table: {
    sql:
      SELECT
        user_id,
        target_brand,
        recommended_product_id,
        recommended_product_name,
        recommended_brand,
        SUM(co_purchase_strength) AS co_purchase_strength
      FROM GRAPH_TABLE(
        ${customer_360_graph.SQL_TABLE_NAME}
        -- Step 1: Find what the target user bought
        MATCH (target:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o1:OrderItem)-[:contains_product]->(shared_prod:Product)

        -- Step 2: Find other customers who bought that same product
        MATCH (other:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o2:OrderItem)-[:contains_product]->(shared_prod)
        WHERE other.id != target.id

        -- Step 3: Find what ELSE those other customers bought
        MATCH (other)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o3:OrderItem)-[:contains_product]->(rec_prod:Product)
        WHERE rec_prod.id != shared_prod.id

        RETURN
          target.id AS user_id,
          shared_prod.brand AS target_brand,
          rec_prod.id AS recommended_product_id,
          rec_prod.name AS recommended_product_name,
          rec_prod.brand AS recommended_brand,
          COUNT(DISTINCT other.id) AS co_purchase_strength
      )
      GROUP BY 1, 2, 3, 4, 5
      ;;
  }

  dimension: user_id {
    type: number
    sql: ${TABLE}.user_id ;;
    description: "Target Customer ID receiving product recommendations."
  }

  dimension: target_brand {
    type: string
    sql: ${TABLE}.target_brand ;;
    description: "Anchor brand item in shopper cart (cross-brand/competitor)."
  }

  dimension: recommended_product_id {
    type: number
    sql: ${TABLE}.recommended_product_id ;;
    description: "ID of the recommended product."
  }

  dimension: recommended_product_name {
    type: string
    sql: ${TABLE}.recommended_product_name ;;
    description: "Name of the recommended product."
  }

  dimension: recommended_brand {
    type: string
    sql: ${TABLE}.recommended_brand ;;
    description: "Brand of the recommended item (filtered to tenant brand via user attribute)."
  }

  measure: co_purchase_strength {
    type: sum
    sql: ${TABLE}.co_purchase_strength ;;
    description: "Number of other customers who bought the same cart item and this recommended product."
  }

  measure: count {
    type: count
    description: "Total recommendation connections."
  }
}
