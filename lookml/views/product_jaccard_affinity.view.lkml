view: product_jaccard_affinity {
  derived_table: {
    sql:
      SELECT
        original_product_id,
        original_product_name,
        original_brand,
        recommended_product_id,
        recommended_product_name,
        recommended_brand,
        raw_count,
        SAFE_DIVIDE(raw_count, NULLIF((p1_count + p2_count - raw_count), 0)) AS affinity_score
      FROM (
        SELECT
          original_product_id,
          original_product_name,
          original_brand,
          recommended_product_id,
          recommended_product_name,
          recommended_brand,
          raw_count,
          MAX(raw_count) OVER(PARTITION BY original_product_id) AS p1_count,
          MAX(raw_count) OVER(PARTITION BY recommended_product_id) AS p2_count
        FROM (
          SELECT
            original_product_id,
            original_product_name,
            original_brand,
            recommended_product_id,
            recommended_product_name,
            recommended_brand,
            SUM(raw_count) AS raw_count
          FROM GRAPH_TABLE(
            ${customer_360_graph.SQL_TABLE_NAME}
            MATCH (c:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o1:OrderItem)-[:contains_product]->(p1:Product)
            MATCH (c)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o2:OrderItem)-[:contains_product]->(p2:Product)
            WHERE p1.id != p2.id
            RETURN
              p1.id AS original_product_id,
              p1.name AS original_product_name,
              p1.brand AS original_brand,
              p2.id AS recommended_product_id,
              p2.name AS recommended_product_name,
              p2.brand AS recommended_brand,
              COUNT(DISTINCT c.id) AS raw_count
          )
          GROUP BY 1, 2, 3, 4, 5, 6
        )
      )
      QUALIFY ROW_NUMBER() OVER(PARTITION BY original_product_name ORDER BY raw_count DESC) <= 5
      ;;
  }

  dimension: original_product_id {
    type: number
    sql: ${TABLE}.original_product_id ;;
  }

  dimension: original_product_name {
    type: string
    sql: ${TABLE}.original_product_name ;;
    description: "Anchor product for affinity comparison."
  }

  dimension: original_brand {
    type: string
    sql: ${TABLE}.original_brand ;;
    description: "Brand of the anchor product."
  }

  dimension: recommended_product_id {
    type: number
    sql: ${TABLE}.recommended_product_id ;;
  }

  dimension: recommended_product_name {
    type: string
    sql: ${TABLE}.recommended_product_name ;;
    description: "Co-purchased product recommended based on Jaccard score."
  }

  dimension: recommended_brand {
    type: string
    sql: ${TABLE}.recommended_brand ;;
    description: "Brand of the recommended product."
  }

  dimension: affinity_score {
    type: number
    sql: ${TABLE}.affinity_score ;;
    value_format_name: percent_2
    description: "Jaccard Similarity score (Intersection over Union) normalizing for item popularity bias."
  }

  measure: raw_count {
    type: sum
    sql: ${TABLE}.raw_count ;;
    description: "Raw co-purchase order count."
  }

  measure: average_affinity {
    type: average
    sql: ${affinity_score} ;;
    value_format_name: percent_2
    description: "Average Jaccard affinity score across recommended product pairs."
  }
}
