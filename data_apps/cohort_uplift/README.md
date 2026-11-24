# Repeat & Cross-Category Customer Spend Uplift (`cohort_uplift`)

14-step editorial scrollytelling cohort study built on the [Looker Data Apps Toolkit (`1.3.0`)](https://www.gstatic.com/looker-data-apps/versions/1.3.0/data-app.js) and the **`embed_demo`** LookML model (`orders_with_share_of_wallet_application` and `order_items`), registered as `application: cohort_uplift` in [`../../lookml/manifest.lkml`](../../lookml/manifest.lkml).

See [`../README.md`](../README.md) for the shared Data Apps architecture, `window.top` ↔ `event.source` theme synchronization protocol, Viewer-tier `rich_content_json` query registration rules, and how to add new Data Apps.

## Deploying Across Environments

1. **Sync LookML bundle** (`data_apps/cohort_uplift/app.js` → `lookml/data_apps/cohort_uplift.js`):

```bash
uv run --script data_apps/sync_lookml_bundles.py
```

2. **Push & deploy `manifest.lkml` and `data_apps/cohort_uplift.js`** (`repo-lookml` workflow; confirm before `--deploy` on `embed-demo`):

```bash
lkr --oauth-account=<target-account> tools lookml push lookml --project=<project-id> --file=manifest.lkml --reset
lkr --oauth-account=<target-account> tools lookml push lookml --project=<project-id> --file=data_apps/cohort_uplift.js --no-reset --deploy
```

3. **Upsert `"Data Apps"` subfolder & dashboard** (`#177` / `K4HQpuwgccbcTrVvB8Z37l` on `dev-googledemo2`):

```bash
lkr --oauth-account=dev-googledemo2 code-mode sandbox \
  --file=data_apps/cohort_uplift/deploy.py \
  -v parent_folder_id=12542
```
