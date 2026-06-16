---
name: looker-bqml-ai-functions
description: Verifies and grants the mandatory Vertex AI User IAM role (roles/aiplatform.user) to the BigQuery Cloud Resource service account associated with Looker's database connection, enabling BigQuery ML generative AI functions (AI.*).
---

# Overview & Purpose

Whenever you install this repository or deploy AI-powered LookML derived tables (such as `ai_executive_briefing.view.lkml`), the underlying BigQuery database executes generative AI SQL functions like **`AI.GENERATE`** to invoke LLMs in Gemini Enterprise Agent Platform.

To execute these models successfully, the BigQuery Cloud Resource Connection used by Looker must be associated with a Google Cloud service account that has been granted the **Vertex AI User** role (`roles/aiplatform.user`). Without this role, BigQuery will reject the generative AI queries with an `Access Denied` or `403 Forbidden` IAM error.

This skill outlines the exact verification and execution workflow to ensure your BigQuery connection is properly authorized.

---

# Mandatory Execution Workflow

When a user clones this repository or encounters permissions errors with `AI.*` BigQuery functions, follow these structured steps to resolve the issue:

## 1. Determine the Target Environment
Ask the user or confirm via environment variables:
1. **Google Cloud Project ID** (e.g., `looker-private-demo` or your active GCP project).
2. **BigQuery Connection ID** (the location and ID of your suitable Looker BigQuery connection, e.g., `us.looker-private-demo-conn` or `us.my-connection`).

## 2. Offer Automated Execution (Recommended)
Proactively offer to run the included turnkey bash script to automatically retrieve the associated service account and apply the exact IAM policy binding:

```bash
./.agents/skills/looker-bqml-ai-functions/scripts/grant_vertex_role.sh <PROJECT_ID> <REGION.CONNECTION_ID>
```

### Example Execution:
```bash
./.agents/skills/looker-bqml-ai-functions/scripts/grant_vertex_role.sh looker-private-demo us.my-connection
```

*(Note: Never execute this command without USER approval. The script uses `bq` and `gcloud` directly in the active terminal.)*

---

# Manual Verification & Application Alternatives

If the developer prefers to apply the permissions manually or inspect the credentials via the console or SQL, provide them with the following standard procedures:

## Option A: Using Google Cloud CLI (`gcloud` + `bq`)
If you already know the exact service account email (or want to query it inline), run this single multi-line command in your terminal:

```bash
# 1. Retrieve the connection's service account ID
SA_EMAIL=$(bq show --format=prettyjson --connection <PROJECT_ID>.<REGION>.<CONNECTION_ID> | jq -r .cloudResource.serviceAccountId)

# 2. Bind the Vertex AI User role
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"
```

## Option B: Using BigQuery DCL (SQL)
In the Google Cloud BigQuery console, open a query tab and execute the standard SQL `GRANT` statement:

```googlesql
GRANT `roles/aiplatform.user`
ON PROJECT `your-gcp-project-id`
TO "connection:your-connection-name";
```

## Option C: Google Cloud IAM Console
1. Open the [BigQuery Explorer Console](https://console.cloud.google.com/bigquery).
2. Under your project, expand **Connections** and click your target Cloud Resource connection.
3. In the Connection Info pane, copy the **Service Account ID** (e.g., `connection-1234-9u...@gcp-sa-bigquery-condel.iam.gserviceaccount.com`).
4. Go to the [IAM & Admin Page](https://console.cloud.google.com/project/_/iam-admin).
5. Click **Grant access**, paste the Service Account ID into **New principals**, assign the **Vertex AI User** role, and click **Save**.

---

# Success Verification

Once the IAM role binding is successfully saved, you can verify it by executing a simple verification query in Looker SQL Runner or BigQuery:

```sql
SELECT AI.GENERATE('Confirm that you are fully authorized and operational.').result AS test_response;
```

If the query returns a valid text response from Gemini, the authentication setup is 100% complete and verified!
