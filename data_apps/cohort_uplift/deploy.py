# Idempotent Looker Data App publisher for `lkr code-mode sandbox`.
# Usage:
#   lkr --oauth-account=dev-googledemo2 code-mode sandbox \
#     --file=data_apps/cohort_uplift/deploy.py \
#     -v parent_folder_id=12542 \
#     -v app_code="$(cat data_apps/cohort_uplift/app.js)"

import json

# ponytail: Monty sandbox omits `globals()`, so `try/except NameError` is required for optional `-v` inputs.
try:
    _parent_id = str(parent_folder_id).strip()
except NameError:
    _parent_id = "12542"
try:
    _sub_name = str(subfolder_name).strip()
except NameError:
    _sub_name = "Data Apps"
try:
    _raw_title = str(title).strip()
except NameError:
    _raw_title = "Repeat & Cross-Category Customer Spend Uplift"

# ponytail: ExtensionFrame2 injects title into a single-quoted JS string literal; avoid ASCII apostrophes.
_title = _raw_title.replace("'", "\u2019")

# 1. Find or create the "Data Apps" child subfolder inside parent_folder_id.
children = folder_children(folder_id=_parent_id, fields="id,name,content_metadata_id") or []
matches = [c for c in children if str(c.get("name") or "").strip().lower() == _sub_name.lower()]
if matches:
    sub = matches[0]
else:
    sub = create_folder(body={"name": _sub_name, "parent_id": _parent_id})

sub_id = str(sub["id"])
sub_cm_id = str(sub.get("content_metadata_id") or folder(sub_id).get("content_metadata_id"))
sub_cm = content_metadata(sub_cm_id)
if not sub_cm.get("inherits"):
    sub_cm = update_content_metadata(sub_cm_id, body={"inherits": True})

parent_cm_id = str(folder(_parent_id).get("content_metadata_id"))
parent_acl = all_content_metadata_accesses(content_metadata_id=parent_cm_id) or []

# 2. Register canonical queries in rich_content_json so viewer-only embed users can execute them.
query_specs = [
    {
        "widget_id": "population_totals",
        "title": "Population Totals",
        "model": "embed_demo",
        "view": "orders_with_share_of_wallet_application",
        "fields": [
            "users.count",
            "order_items.order_count",
            "order_items.count",
            "order_items.total_sale_price",
            "order_items.average_sale_price",
        ],
        "limit": "5",
    },
    {
        "widget_id": "brand_breakdown",
        "title": "Brand Breakdown",
        "model": "embed_demo",
        "view": "order_items",
        "fields": [
            "products.brand",
            "users.count",
            "order_items.order_count",
            "order_items.total_sale_price",
            "order_items.average_sale_price",
        ],
        "sorts": ["order_items.total_sale_price desc"],
        "limit": "10",
    },
    {
        "widget_id": "customer_cohort",
        "title": "Customer Cohort Sample",
        "model": "embed_demo",
        "view": "orders_with_share_of_wallet_application",
        "fields": [
            "users.id",
            "users.created_date",
            "order_items.order_count",
            "order_items.count",
            "order_items.count_complete",
            "order_items.total_sale_price",
            "products.count",
        ],
        "filters": {"users.created_date": "before 6 months ago"},
        "sorts": ["users.id asc"],
        "limit": "1800",
    },
    {
        "widget_id": "event_time_study",
        "title": "Monthly Event-Time Spend",
        "model": "embed_demo",
        "view": "orders_with_share_of_wallet_application",
        "fields": [
            "order_items.user_id",
            "order_items.created_month",
            "order_items.order_count",
            "order_items.count",
            "order_items.total_sale_price",
        ],
        "filters": {
            "order_items.created_date": "36 months",
            "order_items.user_id": "<=12000",
        },
        "sorts": ["order_items.user_id asc", "order_items.created_month asc"],
        "limit": "4000",
    },
]

manifest_queries = []
for spec in query_specs:
    q_body = {
        "model": spec["model"],
        "view": spec["view"],
        "fields": spec["fields"],
        "limit": spec["limit"],
    }
    if spec.get("filters"):
        q_body["filters"] = spec["filters"]
    if spec.get("sorts"):
        q_body["sorts"] = spec["sorts"]
    created_q = create_query(body=q_body)
    qid = str(created_q.get("slug") or created_q.get("id") or "") if created_q else ""
    if qid:
        manifest_queries.append(
            {
                "widget_id": spec["widget_id"],
                "title": spec["title"],
                "model": spec["model"],
                "explore": spec["view"],
                "query_id": qid,
                "canonical_query": json.dumps(q_body, sort_keys=True),
            }
        )

rich_content_json = json.dumps(
    {
        "data_app_queries_version": 1,
        "data_app_queries": manifest_queries,
    }
)

# 3. Upsert the Data App UDD + inline extension bundle in the subfolder.
existing_dashes = folder_dashboards(folder_id=sub_id, fields="id,title") or []
matched_dashes = [d for d in existing_dashes if str(d.get("title") or "").strip() == _title]

if matched_dashes:
    dash_id = str(matched_dashes[0]["id"])
    update_dashboard(dash_id, body={"title": _title})
    action = "updated"
else:
    try:
        dash = post(
            "/dashboards",
            dict,
            body={
                "title": _title,
                "folder_id": sub_id,
                "appearance": {
                    "show_dashboard_header": False,
                    "page_side_margins": 0,
                    "tile_space_between": 0,
                    "tile_shadow": False,
                },
            },
        )
    except Exception:
        dash = create_dashboard(body={"title": _title, "folder_id": sub_id})
    dash_id = str(dash["id"])
    action = "created"

full_dash = dashboard(dash_id)
ext_elems = [
    e
    for e in (full_dash.get("dashboard_elements") or [])
    if e.get("type") == "extension" and str(e.get("extension_id") or "").startswith("db::")
]
if ext_elems:
    el_id = str(ext_elems[0]["id"])
    bare_id = str(ext_elems[0]["extension_id"])[4:]
    ext_resp = patch(
        "/data_app_extension/" + bare_id,
        dict,
        query_params={"dashboard_id": dash_id},
        body={"label": _title, "description": "Data App: " + _title, "code": app_code},
    )
    if isinstance(ext_resp, dict) and ext_resp.get("id"):
        bare_id = str(ext_resp["id"]).replace("db::", "")
    update_dashboard_element(
        el_id,
        body={
            "title": _title,
            "title_hidden": True,
            "extension_id": "db::" + bare_id,
            "rich_content_json": rich_content_json,
        },
    )
else:
    ext_resp = post(
        "/data_app_extension",
        dict,
        body={
            "name": "data-app-cohort-uplift-" + dash_id,
            "label": _title,
            "description": "Data App: " + _title,
            "code": app_code,
        },
    )
    bare_id = str(ext_resp["id"]).replace("db::", "")
    created_el = post(
        "/dashboard_elements",
        dict,
        body={
            "dashboard_id": dash_id,
            "type": "extension",
            "extension_id": "db::" + bare_id,
            "title": _title,
            "title_hidden": True,
            "rich_content_json": rich_content_json,
        },
    )
    el_id = str(created_el.get("id") or "")
    full_dash = dashboard(dash_id)
layouts = full_dash.get("dashboard_layouts") or []
active_layouts = [l for l in layouts if l.get("active")]
target_layout = active_layouts[0] if active_layouts else (layouts[0] if layouts else None)
if target_layout and target_layout.get("id") and target_layout.get("type") != "extension":
    patch(
        "/dashboard_layouts/" + str(target_layout["id"]),
        dict,
        body={"type": "extension"},
    )

return {
    "action": action,
    "dashboard_id": dash_id,
    "element_id": el_id,
    "extension_id": "db::" + bare_id,
    "parent_folder_id": _parent_id,
    "subfolder_id": sub_id,
    "subfolder_name": _sub_name,
    "inherits_acl": bool(sub_cm.get("inherits")),
    "inherited_group_ids": [str(a.get("group_id")) for a in parent_acl if a.get("group_id")],
    "registered_queries": len(manifest_queries),
}
