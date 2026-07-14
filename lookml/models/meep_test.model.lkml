connection: "looker-private-demo"

view: order_items {
  dimension: is_cancelled { type: yesno tags: ["meep-x"] }
  dimension_group: created {type: time tags: ["meep-ddt"]}
  dimension_group: cancelled {type: time }
  dimension_group: returned {type: time timeframes: [raw, date, year]}
  measure: count {}
  measure: cancelled_count { tags: ["meep-ldt:order_items.cancelled"] filters: [is_cancelled: "Yes"]}
}

view: events {
  dimension_group: event {type: time}
  measure: count {tags: ["meep-ldt:events.event"]}
}

view: distribution_center {
  dimension: city { group_label: "Distibution Location" }
  dimension: name { group_label: "Distibution Location" }
}

view: users {
  dimension: email { description: "Your users email" }
  dimension: zip_code { type: zipcode tags: ["meep-viewgroup", "meep-bf"] }
  dimension: city { tags: ["meep-viewgroup"]}
  dimension: state { tags: ["meep-viewgroup"]}
  measure: count { type: count }
}

view: tickets {
  # --- Regular Label Cases ---
  dimension: id { type: number }
  dimension: status { type: string label: "Ticket Status" }
  dimension: priority { type: string label: "Priority" }
  dimension: tag_meep_l { type: string label: "Custom Tag L" tags: ["meep-l"] }
  dimension: tag_meep_l_val { type: string tags: ["meep-l:Overridden Label"] }
  dimension: tag_explore_override { type: string tags: ["meep-l:Field Tag Value"] }

  # --- Group Label Cases ---
  dimension: no_group { type: string }
  dimension: group_native { type: string group_label: "Native Group" }
  dimension: group_meep_gl { type: string group_label: "Native Group" tags: ["meep-gl:MEEP Group"] }
  dimension: group_meep_vg { type: string view_label: "Ticket View Label" tags: ["meep-viewgroup"] }
  dimension: group_meep_vg_fallback { type: string tags: ["meep-viewgroup"] }
}

explore: order_items {
  tags: ["meep-x:hide_view", "meep-l:users.count=Purchasing Users"]
  join: users {
    relationship: one_to_one
    sql_on: 1=2 ;;
  }
  join: distribution_center { sql_on: 1=2 ;; }
  join: hide_view { sql_on: 1=2 ;; }
}

explore: events {
  tags: ["meep-l:users.count=Event Active Users"]
  join: users {
    relationship: one_to_one
    sql_on: 1=2 ;;
  }
}

explore: tickets {
  tags: [
    "meep-l:users.count=Ticket Purchasers",
    "meep-l:tickets.tag_explore_override=Explore Override Value"
  ]
  join: users {
    relationship: one_to_one
    sql_on: 1=2 ;;
  }
}

explore: order_items_hide_me {
  tags: ["meep-x"]
  from: order_items
  view_name: order_items
}

explore: order_items_already_hidden {
  hidden: yes
  from: order_items
  view_name: order_items
}

explore: users {}

explore: distribution_centers {
  from: distribution_center
  view_name: distribution_center
  tags: ["meep-bf:distribution_center"]
}

view: hide_view {
  dimension: email {}
}

view: dt_view {
  dimension_group: timeline {
    type: time
    timeframes: [raw, date, year]
    tags: ["meep-bdt"]
  }
}

explore: dt_explore {
  from: dt_view
  view_name: dt_view
}