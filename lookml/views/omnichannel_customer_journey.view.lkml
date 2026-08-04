view: omnichannel_customer_journey {
  derived_table: {
    sql:
      SELECT
        product_brand,
        trigger_category,
        visited_location,
        visited_state,
        SUM(cross_channel_users) AS cross_channel_users
      FROM GRAPH_TABLE(
        ${customer_360_graph.SQL_TABLE_NAME}

        -- Traverse from online orders to user events / store location visits
        MATCH (c:User)<-[:placed_order]-(:OrderNode)<-[:belongs_to_order]-(o_online:OrderItem)-[:contains_product]->(p:Product)
        MATCH (c)-[v:visited]->(e:Event)

        RETURN
          p.brand AS product_brand,
          p.category AS trigger_category,
          CONCAT(e.city, ', ', e.state) AS visited_location,
          e.state AS visited_state,
          COUNT(DISTINCT c.id) AS cross_channel_users
      )
      GROUP BY 1, 2, 3, 4
      ;;
  }

  dimension: product_brand {
    type: string
    sql: ${TABLE}.product_brand ;;
    description: "Brand of the online product triggering store visit."
  }

  dimension: trigger_category {
    type: string
    sql: ${TABLE}.trigger_category ;;
    description: "Online product category triggering store visit."
  }

  dimension: visited_location {
    type: string
    sql: ${TABLE}.visited_location ;;
    description: "City and state location visited by online customer."
  }

  dimension: visited_state {
    type: string
    sql: ${TABLE}.visited_state ;;
    map_layer_name: us_states
    description: "US State of the retail store visited by online customer."
  }

  measure: cross_channel_users {
    type: sum
    sql: ${TABLE}.cross_channel_users ;;
    description: "Count of distinct customers who purchased online in this category and visited the store."
  }

  measure: total_cross_channel_interactions {
    type: count
    description: "Total cross-channel store visit interactions."
  }
}
