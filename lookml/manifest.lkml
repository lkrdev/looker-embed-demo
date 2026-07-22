project_name: "embed_demo"

localization_settings: {
  default_locale: en
  localization_level: permissive
}

constant: target_brands {
  value: "Levi's|Calvin Klein|Allegra K|Columbia"
}

constant: target_locales {
  value: "en|es_ES|fr_FR|de_DE|ja_JP"
}

constant: currency_html {
  value: "
    {% assign locale_val = _user_attributes['locale'] %}
    {% if locale_val == 'es_ES' or locale_val == 'fr_FR' or locale_val == 'de_DE' %}
      {% assign currency_symbol = '€' %}
    {% elsif locale_val == 'ja_JP' %}
      {% assign currency_symbol = '¥' %}
    {% else %}
      {% assign currency_symbol = '$' %}
    {% endif %}

    {% if value < 0 %}
      {% assign abs_val = rendered_value | replace: '-', '' %}
      {% assign currency_value = '-' | append: currency_symbol | append: abs_val %}
    {% else %}
      {% assign currency_value = currency_symbol | append: rendered_value %}
    {% endif %}

    {{ currency_value }}
  "
}
