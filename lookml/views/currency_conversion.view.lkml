view: currency_conversion {
  derived_table: {
    sql:
      SELECT 'en' AS locale, 1.0 AS conversion_rate, '$' AS currency_symbol, 'USD' AS currency_code
      UNION ALL
      SELECT 'es_ES' AS locale, 0.92 AS conversion_rate, '€' AS currency_symbol, 'EUR' AS currency_code
      UNION ALL
      SELECT 'fr_FR' AS locale, 0.92 AS conversion_rate, '€' AS currency_symbol, 'EUR' AS currency_code
      UNION ALL
      SELECT 'de_DE' AS locale, 0.92 AS conversion_rate, '€' AS currency_symbol, 'EUR' AS currency_code
      UNION ALL
      SELECT 'ja_JP' AS locale, 155.0 AS conversion_rate, '¥' AS currency_symbol, 'JPY' AS currency_code
    ;;
  }

  dimension: locale {
    primary_key: yes
    hidden: yes
    type: string
    sql: ${TABLE}.locale ;;
  }

  dimension: conversion_rate {
    hidden: yes
    type: number
    sql: ${TABLE}.conversion_rate ;;
  }

  dimension: currency_symbol {
    hidden: yes
    type: string
    sql: ${TABLE}.currency_symbol ;;
  }

  dimension: currency_code {
    hidden: yes
    type: string
    sql: ${TABLE}.currency_code ;;
  }
}
