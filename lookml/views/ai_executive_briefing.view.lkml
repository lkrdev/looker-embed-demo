view: ai_executive_briefing {
  derived_table: {
    datagroup_trigger: embed_demo_weekly_datagroup
    increment_key: "briefing_date"
    increment_offset: 0
    partition_keys: ["briefing_date"]
    cluster_keys: ["brand"]
    sql: WITH 
      {% assign target_brands = "Levi's|Calvin Klein|Allegra K|Patagonia" | split: "|" %}
      
      -- ==========================================
      -- 1. DYNAMIC LIQUID CTE COMPILATION
      -- ==========================================
      {% for b in target_brands %}
        {% assign brand_slug = b | replace: "'", "" | replace: " ", "_" | downcase %}
        
        -- {{ b }} Performance Context & AI Generation
        {{ brand_slug }}_context AS (
          SELECT """{{ b }}""" AS brand,
            CONCAT(
              'You are an executive AI strategic analyst for an elite retail e-commerce business. Analyze the performance metrics for brand "', 
              """{{ b }}""", 
              '" and generate exactly 3 premium strategic executive insights.\n\n',
              'Rules for values:\n',
              '- "id": A short unique slug (e.g., "demand-surge", "margin-yield")\n',
              '- "title": An engaging, professional title\n',
              '- "iconName": Must be exactly one of: "Lightbulb", "TrendingUp", or "Target"\n',
              '- "variant": Must be exactly one of: "warning", "success", or "accent"\n',
              '- "description": A highly insightful, actionable executive recommendation tailored tailored specifically to ',
              """{{ b }}""",
              ' based on their metrics.\n\n',
              'Recent 12-Month Monthly Sales:\n', (
                SELECT STRING_AGG(CONCAT(month, ': ', total_orders, ' orders, Revenue: $', total_revenue), '\n' ORDER BY month)
                FROM (
                  SELECT 
                    FORMAT_TIMESTAMP('%Y-%m', oi.created_at) AS month,
                    COUNT(DISTINCT oi.order_id) AS total_orders,
                    ROUND(SUM(oi.sale_price), 2) AS total_revenue
                  FROM `thelook.order_items` oi 
                  JOIN `thelook.inventory_items` ii ON oi.inventory_item_id = ii.id 
                  JOIN `thelook.products` p ON ii.product_id = p.id
                  WHERE p.brand = """{{ b }}""" 
                    AND oi.created_at >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH))
                  GROUP BY 1
                )
              ),
              '\n\nTop 10 Performing Products (Last 90 Days):\n', (
                SELECT STRING_AGG(CONCAT('Product: ', product_name, ' (Category: ', category, ') | Sold: ', units, ' | Revenue: $', revenue), '\n')
                FROM (
                  SELECT p.name AS product_name, p.category, COUNT(oi.id) AS units, ROUND(SUM(oi.sale_price), 2) AS revenue
                  FROM `thelook.order_items` oi JOIN `thelook.inventory_items` ii ON oi.inventory_item_id = ii.id JOIN `thelook.products` p ON ii.product_id = p.id
                  WHERE p.brand = """{{ b }}""" AND oi.created_at >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY))
                  GROUP BY 1, 2 ORDER BY revenue DESC LIMIT 10
                )
              )
            ) AS prompt
        ),
        {{ brand_slug }}_ai AS (
          SELECT 
            brand, 
            AI.GENERATE(
              prompt,
              endpoint => 'gemini-2.5-pro',
              output_schema => '''
                insights ARRAY<STRUCT<
                  id STRING,
                  title STRING,
                  iconName STRING,
                  variant STRING,
                  description STRING
                >>
              '''
            ) AS ai_result 
          FROM {{ brand_slug }}_context
        ),
        {{ brand_slug }}_unnested AS (
          SELECT 
            brand,
            insight.id AS insight_id,
            insight.title AS insight_title,
            insight.iconName AS insight_icon,
            insight.variant AS insight_variant,
            insight.description AS insight_description
          FROM {{ brand_slug }}_ai,
          UNNEST(ai_result.insights) AS insight
        ){% if forloop.last == false %},{% endif %}
      {% endfor %},

      -- ==========================================
      -- 2. DYNAMIC LIQUID UNION ALL
      -- ==========================================
      final_union AS (
        {% for b in target_brands %}
          {% assign brand_slug = b | replace: "'", "" | replace: " ", "_" | downcase %}
          SELECT * FROM {{ brand_slug }}_unnested
          {% if forloop.last == false %}UNION ALL{% endif %}
        {% endfor %}
      )

      -- ==========================================
      -- 3. INCREMENTAL APPEND LOGIC
      -- ==========================================
      SELECT 
        DATE_TRUNC(DATE(MAX(oi.created_at)), WEEK) AS briefing_date,
        u.brand,
        u.insight_id,
        u.insight_title,
        u.insight_icon,
        u.insight_variant,
        u.insight_description
      FROM `thelook.order_items` oi
      CROSS JOIN final_union u
      WHERE {% incrementcondition %} oi.created_at {% endincrementcondition %}
      GROUP BY 2, 3, 4, 5, 6, 7 ;;
  }

  dimension: composite_key {
    primary_key: yes
    hidden: yes
    type: string
    sql: CONCAT(${briefing_date}, '_', ${brand}, '_', ${insight_id}) ;;
  }

  dimension: briefing_date {
    type: date
    description: "The partition timestamp of when the AI strategic briefing was generated."
    sql: ${TABLE}.briefing_date ;;
  }

  dimension: brand {
    type: string
    description: "The interactive e-commerce brand compiled via Liquid."
    sql: ${TABLE}.brand ;;
  }

  dimension: insight_id {
    type: string
    description: "Unique string slug identifier for the AI strategic insight."
    sql: ${TABLE}.insight_id ;;
  }

  dimension: insight_title {
    type: string
    description: "Engaging executive title generated by Google Gemini."
    sql: ${TABLE}.insight_title ;;
  }

  dimension: insight_icon {
    type: string
    description: "Lucide icon mapping token (Lightbulb, TrendingUp, Target)."
    sql: ${TABLE}.insight_icon ;;
  }

  dimension: insight_variant {
    type: string
    description: "Design aesthetic color token (warning, success, accent)."
    sql: ${TABLE}.insight_variant ;;
  }

  dimension: insight_description {
    type: string
    description: "In-depth, highly strategic recommendation generated by Gemini."
    sql: ${TABLE}.insight_description ;;
  }
}
