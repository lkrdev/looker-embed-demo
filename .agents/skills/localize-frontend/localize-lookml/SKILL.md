---
name: localize-lookml
description: Detailed guidelines and mandatory workflows for localizing LookML models, views, explores, and dashboards, including string catalog creation and deployment via lkr-dev-cli.
---

# LookML Localization Workflow

This skill defines the rigorous process required to localize Looker metadata (labels, descriptions, notes, and comparisons) across models, Explores, views, and LookML dashboards.

## 1. Project Manifest Configuration (`manifest.lkml`)

To enable model localization, the LookML project must contain a `manifest.lkml` file at the root of the `lookml/` directory specifying the default locale and localization strictness:

```lookml
project_name: "embed_demo"

localization_settings: {
  default_locale: en
  localization_level: permissive
}
```

- **`default_locale`**: Must match the primary `.strings.json` catalog (e.g., `en`). Any string not defined in the default locale file will remain unlocalized.
- **`localization_level`**: Set to `permissive` during development to allow elements without explicit labels or missing translation entries without throwing LookML compiler blockers. Set to `strict` in CI/enforcement environments.

## 2. Centralized Manifest Constants (`@{target_locales}` & `@{currency_html}`)

To ensure multi-locale loops and currency styling remain synchronized across all LookML models and derived tables, the `manifest.lkml` file defines centralized constants:

```lookml
constant: target_locales {
  value: "en|es_ES|fr_FR|de_DE|ja_JP"
}

constant: currency_html {
  value: "..." # Liquid block formatting symbol by _user_attributes['locale']
}
```

- **`@{target_locales}`**: Must be referenced whenever updating or iterating over supported locales for AI-generated translations (e.g., in BigQuery ML `AI.GENERATE` loops inside native derived tables like `ai_executive_briefing.view.lkml`). This prevents hardcoding language codes and ensures all target locales get translated and formatted consistently.
- **`@{currency_html}`**: Must be applied to financial measure definitions (`html: @{currency_html} ;;`) to dynamically style currency symbols (`$`, `€`, `¥`) based on the session's user attribute.
- **Bridging iFrame and API Calls**: Note that currency translation and formatting ties together both **iframe embedded visualizations** (where Looker renders the currency using `html: @{currency_html} ;;` based on session user attributes) and **direct Looker SDK API calls / data queries** (where BQML AI generation or FX conversion tables use `@{target_locales}` to convert underlying numerical figures and currency symbols in JSON/JSON Detail responses).

## 3. Creating Locale Strings Files (`lookml/locale/*.strings.json`)

Locale definition files map LookML labels and strings (the keys) to their localized UI display values (the values).
- Files must be placed in `lookml/locale/`.
- Each locale requires a dedicated file named after the locale code (e.g., `en.strings.json`, `es_ES.strings.json`, `fr_FR.strings.json`, `de_DE.strings.json`).

Example structure (`es_ES.strings.json`):
```json
{
  "Brand Overview": "Resumen de la Marca",
  "Total Revenue": "Ingresos Totales",
  "High-level summary of brand revenue, orders, and customer KPIs": "Resumen de alto nivel de los ingresos de la marca, pedidos y KPI de clientes"
}
```

## 4. Localizing LookML Dashboards

LookML dashboards support localization across several specific element parameters. To ensure these parameters translate correctly, they must be formatted using structured syntax:

### Supported Parameters & Syntax
1. **`title`**: Dashboard or tile title.
2. **`description`**: Dashboard-level subtitle or description.
3. **`note` / `text`**: Subparameter of the `note` block on tiles. Do NOT use flat `note_text` if localization is required; use the structured block:
   ```lookml
   note:
     state: expanded
     display: hover
     text: "Total commercial sales revenue across all active channels"
   ```
4. **`comparison_label`**: Used on single value KPI tiles to describe relative comparisons.
   ```lookml
   comparison_label: "vs Prior Period"
   ```
5. **`single_value_title`**: Explicit title override on single value visualizations.
   ```lookml
   single_value_title: "Revenue"
   ```

Every string defined across these parameters must have an exact matching key entry in `en.strings.json` and all corresponding foreign locale JSON files.

## 5. Deployment via `lkr-dev-cli`

Never use Python SDK scripts or code mode to deploy LookML files. Always deploy localized LookML files using the authenticated CLI tool:

```bash
# 1. Determine OAuth Account
uvx --from lkr-dev-cli lkr auth list

# 2. Push LookML Project (Preferred: single file push for locale files, e.g. -f locale/es_ES.strings.json)
# Note: For project embed-demo, ask the user for confirmation before appending --deploy!
uvx --from lkr-dev-cli lkr --oauth-account=<oauth_account_name> tools lookml push lookml --project=<looker_project_name> --file=locale/es_ES.strings.json
```
