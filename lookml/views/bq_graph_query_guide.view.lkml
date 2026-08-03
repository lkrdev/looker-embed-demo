view: bq_graph_query_guide {
  derived_table: {
    sql:
      SELECT
        'derived_analytic_model' AS feature,
        'Looker-managed BigQuery Property Graph definition via DDL in LookML view.' AS description,
        'https://docs.cloud.google.com/looker/docs/reference/param-view-derived-analytic-model' AS documentation_url
      UNION ALL
      SELECT
        'sql_analytic_model_name',
        'LookML parameter pointing to pre-existing database Property Graph created outside Looker.',
        'https://docs.cloud.google.com/looker/docs/reference/param-view-sql-analytic-model-name'
      UNION ALL
      SELECT
        'GRAPH_TABLE MATCH',
        'SQL function executing GQL pattern matching traversals over BigQuery Property Graphs.',
        'https://cloud.google.com/bigquery/docs/graph-overview'
      ;;
  }

  dimension: feature {
    type: string
    sql: ${TABLE}.feature ;;
  }

  dimension: description {
    type: string
    sql: ${TABLE}.description ;;
  }

  dimension: documentation_url {
    type: string
    sql: ${TABLE}.documentation_url ;;
  }
}
