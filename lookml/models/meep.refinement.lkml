explore: +order_items {
  tags: [
    "meep-x:inventory_items",
    "meep-x:user_order_facts",
    "meep-l:users.count=Purchasing Users",
    "meep-l:products.count=Purchased Products Count"
  ]
}

explore: +events {
  tags: [
    "meep-x:inventory_items",
    "meep-x:user_order_facts",
    "meep-l:users.count=Website Visitor",
    "meep-l:product_viewed.count=Viewed Products Count"
  ]
}

explore: +affinity {
  tags: ["meep-x"]
}

explore: +orders_with_share_of_wallet_application {
  tags: ["meep-x"]
}

# View refinements for MEEP field-level exclusions
view: +users {
  dimension: id { tags: ["meep-x"] }
  dimension: latitude { tags: ["meep-x"] }
  dimension: longitude { tags: ["meep-x"] }
  dimension: first_name { tags: ["meep-x"] }
  dimension: last_name { tags: ["meep-x"] }
  measure: count { tags: ["meep-x"] }
  dimension: city { tags: ["meep-gl:Demographics"] } # Demographics > City
  dimension: country { tags: ["meep-gl:Demographics"] } # Demographics > Country
  dimension: name { tags: ["meep-l:User Full Name"] } # User Full Name
  dimension: state { tags: ["meep-gl:Demographics"] } # Demographics > State
  dimension: zip { tags: ["meep-gl:Demographics"] } # Demographics > Zip
  dimension: age { tags: ["meep-gl:Demographics"] } # Demographics > Age
  dimension: gender { tags: ["meep-gl:Demographics"] } # Demographics > Gender
  dimension: email { tags: ["meep-x"] }
}

view: +order_items {
  dimension: id { tags: ["meep-x"] }
  dimension: order_id { tags: ["meep-x"] }
  dimension: user_id { tags: ["meep-x"] }
  dimension: inventory_item_id { tags: ["meep-x"] }
  dimension: sale_price { tags: ["meep-x"] }
}

view: +events {
  dimension: id { tags: ["meep-x"] }
  dimension: user_id { tags: ["meep-x"] }
  dimension: session_id { tags: ["meep-x"] }
  dimension: product_id { tags: ["meep-x"] }
  dimension: event_type { tags: ["meep-x"] }
  dimension: os { tags: ["meep-x"] }
  dimension: uri { tags: ["meep-x"] }
  dimension: sequence_number { tags: ["meep-x"] }
  dimension: latitude { tags: ["meep-x"] }
  dimension: longitude { tags: ["meep-x"] }
  dimension: city { tags: ["meep-gl:Demographics"] } # Demographics > City
  dimension: country { tags: ["meep-gl:Demographics"] } # Demographics > Country
  dimension: state { tags: ["meep-gl:Demographics"] } # Demographics > State
  dimension: zip { tags: ["meep-gl:Demographics"] } # Demographics > Zip
  dimension: ip_address { tags: ["meep-x"] }
  measure: count { tags: ["meep-ldt:events.event"] }
  measure: count_cart_or_later { tags: ["meep-ldt:events.event", "meep-l:Cart or Later Event Count"] }
  measure: count_checkout { tags: ["meep-ldt:events.event"] }
  measure: count_purchase { tags: ["meep-ldt:events.event"] }
  measure: session_start { tags: ["meep-ldt:events.event"] }
  measure: session_end { tags: ["meep-ldt:events.event"] }
}

view: +products {
  dimension: id { tags: ["meep-l:Product ID"] } # Product ID
  dimension: sku { tags: ["meep-l:SKU"] } # SKU
  dimension: distribution_center_id { tags: ["meep-l:Distribution Center ID"] } # Distribution Center ID
  dimension: retail_price { tags: ["meep-l:Retail Price"] } # Retail Price
  dimension: cost { tags: ["meep-l:Cost"] } # Cost
  dimension: name { tags: ["meep-l:Product Name"] } # Product Name
  measure: count { tags: ["meep-ldt:events.event"] }
  dimension: category { tags: ["meep-gl:Product Hierarchy"] } # Product Hierarchy > Category
  dimension: brand { tags: ["meep-gl:Product Hierarchy"] } # Product Hierarchy > Brand
  dimension: department { tags: ["meep-gl:Product Hierarchy"] } # Product Hierarchy > Department
}

view: +sessions {
  dimension: session_id { tags: ["meep-x"] }
  measure: count { tags: ["meep-ldt:events.event"] }
  measure: count_cart_or_later { tags: ["meep-ldt:events.event", "meep-l:Cart or Later Session Count"] }
  measure: cart_to_checkout_conversion { tags: ["meep-ldt:events.event"] }
  measure: overall_conversion { tags: ["meep-ldt:events.event"] }
}

view: +distribution_centers {
  dimension: id { tags: ["meep-x"] }
  dimension: latitude { tags: ["meep-x"] }
  dimension: longitude { tags: ["meep-x"] }
  measure: count { tags: ["meep-x"] }
  dimension: name { tags: ["meep-viewgroup"] } # Distribution Centers > Name
}
