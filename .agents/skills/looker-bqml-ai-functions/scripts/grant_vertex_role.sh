#!/usr/bin/env bash
# ==============================================================================
# Turnkey Helper Script: Grant Vertex AI User Role to BigQuery Connection SA
# ==============================================================================
# This script inspects a given BigQuery Cloud Resource Connection, extracts its
# automatically provisioned system service account, and binds the IAM role
# `roles/aiplatform.user` (Vertex AI User) to the host Google Cloud project.
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-}"
CONNECTION_ID="${2:-}"

if [ -z "$PROJECT_ID" ] || [ -z "$CONNECTION_ID" ]; then
  echo "❌ Error: Missing mandatory arguments."
  echo "Usage: ./grant_vertex_role.sh <PROJECT_ID> <REGION.CONNECTION_ID>"
  echo "Example: ./grant_vertex_role.sh looker-private-demo us.my-connection"
  exit 1
fi

echo "🔍 [1/3] Inspecting BigQuery connection '$CONNECTION_ID' in project '$PROJECT_ID'..."
SA_EMAIL=$(bq show --format=prettyjson --connection "$PROJECT_ID.$CONNECTION_ID" | jq -r '.cloudResource.serviceAccountId')

if [ -z "$SA_EMAIL" ] || [ "$SA_EMAIL" == "null" ]; then
  echo "❌ Error: Could not extract Cloud Resource service account."
  echo "Please verify that the connection ID is correct and is configured as a Cloud Resource (remote model) connection."
  exit 1
fi

echo "✨ Found System Service Account: $SA_EMAIL"
echo "🔐 [2/3] Granting Vertex AI User IAM role (roles/aiplatform.user) on project '$PROJECT_ID'..."

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user" \
  --condition=None

echo "🎉 [3/3] Success! BigQuery connection '$CONNECTION_ID' is now fully authorized for generative AI queries (AI.*)."
