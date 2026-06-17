# Fetch `meep_test` Model Explores

This script should only be run with the `@mcp:lkr_dev_cli_codemode:run_python_code` MCP tool.

It fetches the `meep_test` LookML model and fully populates all of its explores, using an advanced recursive Python formatter (`ts_stringify`) to resolve Looker Python SDK serialization Gotchas (such as `None` vs `undefined`, Python keyword attribute renaming `from_` -> `from`, and direct mapping to Looker SDK TypeScript Enum references). This allows the final output to perfectly satisfy the standard Looker SDK `ILookmlModelExplore[]` interface without any custom TS override wrappers.

```python
def ts_stringify(obj, indent=2, parent_key=None):
    ind = " " * indent
    if isinstance(obj, dict):
        lines = ["{"]
        for k, v in obj.items():
            if k == '__objclass__':
                continue
            if v is None:
                continue
            
            key = "from" if k == "from_" else k
            
            if key == "user_attribute_filter_types" and isinstance(v, list):
                items = []
                for item in v:
                    val = item.get('_value_', item) if isinstance(item, dict) else item
                    items.append(f"UserAttributeFilterTypes.{val}")
                lines.append(f"{ind}{key}: [{', '.join(items)}],")
                continue
                
            if key == "align":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Align.{val},")
                continue
            if key == "category":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Category.{val},")
                continue
            if key == "week_start_day":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: WeekStartDay.{val},")
                continue
            if key == "fill_style":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: FillStyle.{val},")
                continue
            if key == "format" and parent_key == "map_layer":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Format.{val},")
                continue
            if key == "period" and parent_key == "period_over_period_params":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Period.{val},")
                continue
            if key == "kind" and parent_key == "period_over_period_params":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Kind.{val},")
                continue
            if key == "name" and parent_key == "time_interval":
                val = v.get('_name_', v.get('_value_', v)) if isinstance(v, dict) else v
                lines.append(f"{ind}{key}: Name.{val},")
                continue
            
            val_str = ts_stringify(v, indent + 2, key)
            lines.append(f"{ind}{key}: {val_str},")
        lines.append(" " * (indent - 2) + "}")
        return "\n".join(lines)
    elif isinstance(obj, list):
        if not obj:
            return "[]"
        lines = ["["]
        for item in obj:
            lines.append(f"{ind}{ts_stringify(item, indent + 2, parent_key)},")
        lines.append(" " * (indent - 2) + "]")
        return "\n".join(lines)
    elif isinstance(obj, bool):
        return "true" if obj else "false"
    elif isinstance(obj, (int, float)):
        return str(obj)
    elif obj is None:
        return "null"
    elif isinstance(obj, str):
        import json
        return json.dumps(obj)
    return str(obj)

model = lookml_model('meep_test')
explores = []
for exp in model.get('explores', []):
    full_exp = lookml_model_explore('meep_test', exp['name'])
    explores.append(full_exp)

ts_array = ts_stringify(explores, 2)

imports = "import type { ILookmlModelExplore } from \"@looker/sdk/lib/4.0/models\";\nimport { Align, Category, FillStyle, WeekStartDay, UserAttributeFilterTypes, Name } from \"@looker/sdk/lib/4.0/models\";\n\n"

ts_content = imports + "const mockExplores: ILookmlModelExplore[] = " + ts_array + ";\n\nexport default mockExplores;\n"

return ts_content
```
