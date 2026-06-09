---
name: embed-themes
description: This skill enables agents to assist users in programmatically creating, updating, and managing Looker themes using the Looker API. Use this when you need to automate visual styling, implement brand-specific themes, or manage instance-wide default themes.
---

# Looker Themes API

This skill enables agents to assist users in programmatically managing the visual appearance of Looker dashboards and reports using the **Theme** resource in the Looker API.

## Overview
Looker themes allow you to control the styling of embedded and internal Looker content, including colors, fonts, and layout options. Using the API, you can:
- **Create Themes**: Define new visual styles for specific dashboards or the entire instance.
- **Update Themes**: Modify existing themes to reflect brand changes.
- **Set Default Themes**: Programmatically change the global default theme.
- **Manage Color Collections**: Associate custom color palettes with themes.

## 1. Prerequisites
- **API Version**: Use Looker API 4.0 for the most up-to-date theme features.
- **Permissions**: Requires `admin` or `manage_themes` permissions.
- **Feature Flag**: Custom themes must be enabled on the Looker instance.

## 2. Implementation Pattern (Python SDK)

### Initializing the SDK
```python
import looker_sdk
from looker_sdk import models40 as models

sdk = looker_sdk.init40()
```

### Creating a New Theme
When creating a theme, you define a `WriteTheme` object containing `ThemeSettings`.

```python
new_theme = sdk.create_theme(
    body=models.WriteTheme(
        name="corporate_brand_v1",
        settings=models.ThemeSettings(
            background_color="#F4F7F9",
            base_font_size="14px",
            color_collection_id="my_custom_palette_id",
            font_family="Roboto, Helvetica, Arial, sans-serif",
            primary_button_color="#0052CC",
            show_filters_bar=True,
            show_title=True,
            tile_background_color="#FFFFFF",
            title_color="#172B4D",
            show_header=True
        )
    )
)
print(f"Created theme ID: {new_theme.id}")
```

### Updating an Existing Theme
You can perform partial updates by passing only the fields you wish to change.

```python
# Change to a dark mode background
sdk.update_theme(
    theme_id="123",
    body=models.WriteTheme(
        settings=models.ThemeSettings(
            background_color="#121212",
            tile_background_color="#1E1E1E",
            title_color="#FFFFFF"
        )
    )
)
```

### Setting the Global Default Theme
The `set_default_theme` method takes the theme **name**, not the ID.

```python
# The theme must be active and have no expiration date
sdk.set_default_theme(theme_name="corporate_brand_v1")
```

## 3. Theme Settings Reference

| Property | Type | Description |
| :--- | :--- | :--- |
| `background_color` | string | Main background color of the dashboard. |
| `tile_background_color` | string | Background color of individual tiles. |
| `title_color` | string | Color of the dashboard title text. |
| `font_family` | string | Primary font for text elements. |
| `color_collection_id` | string | ID of the color palette for visualizations. |
| `show_header` | boolean | Toggle the visibility of the dashboard header. |
| `show_title` | boolean | Toggle the visibility of the dashboard title. |
| `primary_button_color` | string | Color of primary buttons and accents. |
| `warn_button_color` | string | Color of warning/danger buttons. |

## 4. Applying Themes to Content

### Via Embed URL
Append the `theme` parameter to the Looker embed URL.
`https://your_company.looker.com/embed/dashboards/1?theme=corporate_brand_v1`

### Via Embed SDK
```javascript
LookerEmbedSDK.createDashboardWithId(1)
  .withParams({ theme: 'corporate_brand_v1' })
  .build()
  .connect()
```

## 5. Full Theme Payload Example

Here is a comprehensive JSON payload for creating a theme, including extended settings:

```json
{
  "name": "full_featured_theme",
  "settings": {
    "background_color": "#f8fafc",
    "base_font_size": "16px",
    "color_collection_id": "",
    "font_color": "#334155",
    "font_family": "'Inter', system-ui, sans-serif",
    "font_source": "",
    "info_button_color": "#6366f1",
    "primary_button_color": "#6366f1",
    "show_filters_bar": true,
    "show_title": true,
    "text_tile_text_color": "#334155",
    "tile_background_color": "#ffffff",
    "text_tile_background_color": "#ffffff",
    "tile_text_color": "#334155",
    "title_color": "#0f172a",
    "warn_button_color": "#ef4444",
    "tile_title_alignment": "left",
    "tile_shadow": true,
    "show_last_updated_indicator": true,
    "show_reload_data_icon": true,
    "show_dashboard_menu": true,
    "show_filters_toggle": true,
    "show_dashboard_header": true,
    "center_dashboard_title": false,
    "dashboard_title_font_size": "2.5rem",
    "box_shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "page_margin_top": "1.5rem",
    "page_margin_bottom": "1.5rem",
    "page_margin_sides": "1.5rem",
    "show_explore_header": true,
    "show_explore_title": true,
    "show_explore_last_run": true,
    "show_explore_timezone": true,
    "show_explore_run_stop_button": true,
    "show_explore_actions_button": true,
    "show_look_header": true,
    "show_look_title": true,
    "show_look_last_run": true,
    "show_look_timezone": true,
    "show_look_run_stop_button": true,
    "show_look_actions_button": true,
    "tile_title_font_size": "1.25rem",
    "column_gap_size": "1rem",
    "row_gap_size": "1rem",
    "border_radius": "0.5rem"
  }
}
```

## 6. Troubleshooting & Best Practices
- **Active Status**: Only "active" themes can be set as defaults or used in embedding.
- **Unique Names**: Theme names must be unique across the instance.
- **Color Collections**: Ensure the `color_collection_id` exists before associating it with a theme, otherwise it will fallback to the system default.
- **Expiration**: Themes with an `end_at` value will automatically deactivate. For permanent themes, ensure `end_at` is `None` or null.
- **API Cache**: When updating a theme, changes may take a few seconds to propagate to all cached dashboard views.
