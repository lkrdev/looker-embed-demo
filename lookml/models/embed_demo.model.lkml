connection: "looker-private-demo"

# include all the views
include: "/views/**/*.view.lkml"
include: "/dashboards/**/*.dashboard.lookml"

datagroup: embed_demo_default_datagroup {
  sql_trigger: SELECT CURRENT_DATE() ;;
  max_cache_age: "24 hours"
}

persist_with: embed_demo_default_datagroup

explore: order_items {
  access_filter: {
    field: products.brand
    user_attribute: brand
  }

  join: users {
    relationship: many_to_one
    sql_on: ${order_items.user_id} = ${users.id} ;;
  }

  join: inventory_items {
    relationship: many_to_one
    sql_on: ${order_items.inventory_item_id} = ${inventory_items.id} ;;
  }

  join: products {
    relationship: many_to_one
    sql_on: ${inventory_items.product_id} = ${products.id} ;;
  }

  join: distribution_centers {
    relationship: many_to_one
    sql_on: ${inventory_items.product_distribution_center_id} = ${distribution_centers.id} ;;
  }
}

explore: events {
  join: users {
    relationship: many_to_one
    sql_on: ${events.user_id} = ${users.id} ;;
  }

  join: sessions {
    relationship: many_to_one
    sql_on: ${events.session_id} = ${sessions.session_id} ;;
  }

  join: product_viewed {
    from: products
    relationship: many_to_one
    sql_on: ${events.product_id} = ${product_viewed.id} ;;
  }

  join: user_order_facts {
    relationship: many_to_one
    sql_on: ${events.user_id} = ${user_order_facts.user_id} ;;
  }
}

explore: affinity {
  join: product_a {
    from: products
    relationship: many_to_one
    sql_on: ${affinity.product_a_id} = SAFE_CAST(${product_a.id} AS STRING) ;;
  }

  join: product_b {
    from: products
    relationship: many_to_one
    sql_on: ${affinity.product_b_id} = SAFE_CAST(${product_b.id} AS STRING) ;;
  }
}

explore: orders_with_share_of_wallet_application {
  from: order_items
  view_name: order_items

  join: users {
    relationship: many_to_one
    sql_on: ${order_items.user_id} = ${users.id} ;;
  }

  join: inventory_items {
    relationship: many_to_one
    sql_on: ${order_items.inventory_item_id} = ${inventory_items.id} ;;
  }

  join: products {
    relationship: many_to_one
    sql_on: ${inventory_items.product_id} = ${products.id} ;;
  }

  join: order_items_share_of_wallet {
    from: order_items_share_of_wallet
    relationship: one_to_one
    sql_on: ${order_items.id} = ${order_items_share_of_wallet.id} ;;
  }
}


# Dedicated Base Explore for Native Derived Tables (NDTs) without access filters
explore: order_items_base {
  hidden: yes
  from: order_items
  view_name: order_items

  join: users {
    relationship: many_to_one
    sql_on: ${order_items.user_id} = ${users.id} ;;
  }
}