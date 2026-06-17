# Test `json_bi` Response Format

This script runs sample inline queries on the `embed_demo2` model for `order_items` and `events` explores, returning the raw `json_bi` responses.

```python
query_1 = {
  "model": "embed_demo2",
  "view": "order_items",
  "fields": ["order_items.created_date", "users.city", "order_items.count"],
  "limit": 5
}

query_2 = {
  "model": "embed_demo2",
  "view": "events",
  "fields": ["events.event_date", "users.city", "events.count"],
  "limit": 5
}

res_1 = run_inline_query(result_format="json_bi", body=query_1)
res_2 = run_inline_query(result_format="json_bi", body=query_2)

import json
return {
  "query_1_result": res_1,
  "query_2_result": res_2
}
```
