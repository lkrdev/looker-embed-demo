---
name: localize-frontend
description: Parent orchestrator skill for coordinating full-stack internationalization and localization across LookML models/dashboards and the React frontend application.
---

# Localize Frontend Orchestrator

This skill serves as the central hub and orchestrator for all localization workflows in the Looker Embed Demo repository. It bridges the gap between data-tier localization in Looker/LookML and presentation-tier localization in the React single-page application.

## Sub-Skills & Workflows

When handling localization requests, determine which architectural layer is being modified and delegate to or follow the instructions in the appropriate subfolder:

### 1. LookML & Backend Localization (`localize-lookml/SKILL.md`)
Use this workflow when localizing Looker metadata, Explore fields, or LookML dashboards:
- Creating and configuring `manifest.lkml` with permissive/strict localization levels.
- Generating locale string definition files (`.strings.json`) in `lookml/locale/`.
- Structuring dashboard parameters (`title`, `description`, `note` with `text`, `comparison_label`, `single_value_title`).
- Pushing and deploying LookML changes to production via `lkr-dev-cli`.

### 2. Frontend Application Localization (`localize-app/SKILL.md`)
Use this workflow when localizing the React UI, navigation bars, breadcrumbs, or page text:
- Configuring React Lingui v6 (`@lingui/core`, `@lingui/react`, `@lingui/format-po`).
- Using message descriptors (`msg`) for static constants outside React components (`constants.ts`).
- Executing required build-time catalog commands (`pnpm extract` and `pnpm compile`).
- Connecting compiled message bundles (`messages.js`) dynamically via `PortalContext`.
