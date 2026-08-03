view: brand_lookalike_audiences {
  derived_table: {
    sql:
      SELECT
        target_brand,
        lookalike_customer_id,
        email,
        COUNT(DISTINCT shared_category) AS shared_category_count
      FROM (
        -- Step A: Lookalike customers buying shared categories
        SELECT
          target_brand,
          lookalike_customer_id,
          email,
          shared_category
        FROM GRAPH_TABLE(
          ${customer_360_graph.SQL_TABLE_NAME}
          MATCH (loyal:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(brand_prod:Product)
          MATCH (loyal)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(other_prod:Product)
          MATCH (lookalike:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(other_prod)
          WHERE loyal.id != lookalike.id
          RETURN
            brand_prod.brand AS target_brand,
            lookalike.id AS lookalike_customer_id,
            lookalike.email AS email,
            other_prod.category AS shared_category
        )
        EXCEPT DISTINCT
        -- Step B: Customers who HAVE already bought from the target brand
        SELECT
          target_brand,
          lookalike_customer_id,
          email,
          shared_category
        FROM GRAPH_TABLE(
          ${customer_360_graph.SQL_TABLE_NAME}
          MATCH (lookalike:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(brand_prod:Product)
          MATCH (loyal:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(brand_prod)
          MATCH (loyal)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(:OrderItem)-[:contains_product]->(other_prod:Product)
          RETURN
            brand_prod.brand AS target_brand,
            lookalike.id AS lookalike_customer_id,
            lookalike.email AS email,
            other_prod.category AS shared_category
        )
      )
      GROUP BY 1, 2, 3
      HAVING shared_category_count >= 2
      ;;
  }

  dimension: target_brand {
    type: string
    sql: ${TABLE}.target_brand ;;
    description: "Brand seeking to expand audience with lookalikes."
  }

  dimension: lookalike_customer_id {
    type: number
    sql: ${TABLE}.lookalike_customer_id ;;
    description: "ID of customer exhibiting similar cross-category purchase behaviors."
  }

  dimension: email {
    type: string
    sql: ${TABLE}.email ;;
    description: "Target email for lookalike marketing campaigns."
  }

  measure: shared_category_count {
    type: max
    sql: ${TABLE}.shared_category_count ;;
    description: "Number of overlapping product categories shared with loyal brand buyers."
  }

  measure: target_audience_size {
    type: count_distinct
    sql: ${lookalike_customer_id} ;;
    description: "Total size of target lookalike customer audience."
  }
}
