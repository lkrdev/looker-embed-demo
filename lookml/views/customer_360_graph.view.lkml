view: customer_360_graph {
  derived_analytic_model: {
    publish_as_db_analytic_model: yes

    sql:
      NODE TABLES (
        `bigquery-public-data.thelook_ecommerce.users` AS User
          KEY(id)
          PROPERTIES(id, email, first_name, last_name, gender, state, country),
        `bigquery-public-data.thelook_ecommerce.orders` AS OrderNode
          KEY(order_id)
          PROPERTIES(order_id, user_id, status, created_at),
        `bigquery-public-data.thelook_ecommerce.order_items` AS OrderItem
          KEY(id)
          PROPERTIES(id, order_id, user_id, product_id, status, sale_price),
        `bigquery-public-data.thelook_ecommerce.products` AS Product
          KEY(id)
          PROPERTIES(id, name, brand, category, department, retail_price, distribution_center_id),
        `bigquery-public-data.thelook_ecommerce.distribution_centers` AS DistributionCenter
          KEY(id)
          PROPERTIES(id, name, latitude, longitude),
        `bigquery-public-data.thelook_ecommerce.events` AS Event
          KEY(id)
          PROPERTIES(id, user_id, event_type, city, state)
      )
      EDGE TABLES (
        `bigquery-public-data.thelook_ecommerce.orders` AS placed_order
          KEY(order_id)
          SOURCE KEY(order_id) REFERENCES OrderNode(order_id)
          DESTINATION KEY(user_id) REFERENCES User(id)
          LABEL placed_order,
        `bigquery-public-data.thelook_ecommerce.order_items` AS belongs_to_order
          KEY(id)
          SOURCE KEY(id) REFERENCES OrderItem(id)
          DESTINATION KEY(order_id) REFERENCES OrderNode(order_id)
          LABEL belongs_to_order,
        `bigquery-public-data.thelook_ecommerce.order_items` AS contains_product
          KEY(id)
          SOURCE KEY(id) REFERENCES OrderItem(id)
          DESTINATION KEY(product_id) REFERENCES Product(id)
          LABEL contains_product,
        `bigquery-public-data.thelook_ecommerce.products` AS product_stocked_at
          KEY(id)
          SOURCE KEY(id) REFERENCES Product(id)
          DESTINATION KEY(distribution_center_id) REFERENCES DistributionCenter(id)
          LABEL product_stocked_at,
        `bigquery-public-data.thelook_ecommerce.events` AS visited
          KEY(id)
          SOURCE KEY(user_id) REFERENCES User(id)
          DESTINATION KEY(id) REFERENCES Event(id)
          LABEL visited
      ) ;;
  }

  dimension: user_id {
    type: number
    sql: User_id ;;
  }
}
