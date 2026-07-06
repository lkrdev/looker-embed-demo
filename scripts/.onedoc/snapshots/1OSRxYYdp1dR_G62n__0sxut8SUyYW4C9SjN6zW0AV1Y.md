# Powered By Looker (PBL) Demo Script (2026 Edition)

## Introduction & Demo Overview

The Looker Data Platform allows teams to build and scale analytics features directly within their own portals. Powered By Looker (PBL) acts as an operating system for your data, treating it as a developer-first semantic API. This script demonstrates how Looker is a robust foundation designed with AI in mind from the ground up—not just a dashboard tool with AI tacked on.

When presenting this demo, ensure the audience walks away with these three primary takeaways:
1. **Easy to Implement, Accelerated by AI**: Embedding standard visualizations takes hours, and adding production-grade conversational AI interfaces takes minutes using the Embed SDK and pre-built components.
1. **A Complete Application Platform**: Looker goes far beyond standard iframes. Developers have full customization control, combining native dashboards and explores with direct API access, custom visuals, and interactive user tiering.
1. **Semantic Modeling is the Bedrock for AI**: Generative AI requires governed data structures. Looker's LookML layer is the essential prerequisite for grounding LLMs, ensuring AI queries are secure, accurate, and context-aware.

### Why Looker is Built for the AI Era

In an AI-first stack, querying databases directly via LLMs causes hallucinations, breaks security rules, and produces inconsistent answers. Looker's semantic layer (LookML) solves this by acting as the single source of truth. Generative AI agents, Conversational Analytics, and Model Context Protocol (MCP) tools query the governed LookML model, not the raw data. This allows you to deliver secure, conversational data experiences, as well as rich visualizations and dashboards designed by you and your customers, all built on a stable, verified foundation.

---

## 1. Route & Page Walkthrough

![Image](images/pbl_demo_script_2026/kix.mg209997vmim.png)

### ￼

### 1. Home / Landing Page (`/`)
* **Purpose**: Showcase top-level KPIs, API-driven metric cards, operational activity logs, and localized AI briefings.
* **Key Features**:
    * API-driven KPI cards (Total Revenue, Total Orders, Average Order Value).
    * **Strategic AI Insights Feed (BQML & Gemini integration)**: An insights feed (`ai_executive_briefing` LookML view) querying BigQuery ML. It runs Gemini (`gemini-2.5-pro`) directly in the database to generate strategic summaries grounded in the brand's actual metrics, translates them to the user's selected locale, and converts currencies (e.g. converting USD to € or ¥) dynamically.
    * Dev tools bar: Inspects the active SSO user object, user attributes, permissions, and session state.
* **Talk Track**: "When a user logs into this portal, they land on a fully custom interface. The metrics at the top are not hardcoded or loaded from a secondary cache—they are fetched in real-time using the Looker SDK API, pulling directly from Looker's centralized definitions. Below the KPIs, we see the AI Insights Panel. This isn't just calling a generic LLM wrapper; it calls a Looker view that uses BigQuery ML to run Gemini directly inside the database, ground the prompts with Looker performance metrics, translate the text into the user's active locale (e.g. Spanish, Japanese), and convert USD values to local currencies (EUR, JPY) based on active user attributes. If we toggle the brand or language in the settings, the feed instantly re-runs and translates itself."

### ￼

### 2. Dashboard Page (`/dashboard`)
* **Purpose**: Native embedded Looker dashboard (`/embed/dashboards/...`) providing governed visualizations.
* **Key Features**:
    * **Shared Preloaded Iframe Overlay**: Instead of reloading the iframe on route changes, the app loads a single persistent Looker iframe at the root layout (`GlobalLookerContainer`) and repositions it overlaying the route anchor. This eliminates warmboot loading delays when navigating between Looker views.
    * **Simple vs. Advanced Analytics (Access Filters vs. Share of Wallet)**: Demonstrates Looker's ability to mix row-level security models on a single dashboard.
        * *Simple Analytics* (Total Orders, AOV) use standard explores locked down by row-level access filters (so the Calvin Klein rep only queries Calvin Klein rows).
        * *Advanced Analytics* (Share of Wallet tile) queries an unfiltered explore (`orders_with_share_of_wallet_application`) to calculate the brand's share of company-wide sales, demonstrating advanced metric logic that safely bypasses row-level gates to calculate aggregates.
    * Dashboard filtering, cross-filtering, and visual drill-downs.
    * Looker Theme engine integration to match branding and dark/light modes.
    * Role-gated features (schedule and download permissions based on user tier).
* **Talk Track**: "This page embeds a Looker dashboard using a secure iframe. When I log in, Looker reads my user attributes and filters the data automatically. If my account is Calvin Klein, I only see Calvin Klein data—no database logic or custom SQL views are required on our backend. The layout automatically adopts the portal's visual themes with a unique Looker Embed theme for each client, and users can filter or drill into the charts directly. Notice how navigation is instant: because of our preloaded iframe container, switching between tabs doesn't trigger iframe reload times. Also, notice the 'Brand Share of Wallet' tile: calculating share of wallet requires dividing Calvin Klein's sales by the total company sales across all brands. If Looker blocked other brands at the database level, the denominator would be wrong. Looker handles this by letting us mix standard row-filtered explores with unfiltered explores specifically to calculate complex cross-tenant ratios securely."

### ￼

### 3. Conversational Analytics (`/conversational-analytics`)
* **Purpose**: Embedded AI chat interface for natural language query exploration (`/embed/conversations?...`).
* **Underlying Architecture**: Translates plain-text user inputs into governed Looker queries without raw database access.
* **Key Features**:
    * Natural language query interface powered by Gemini.
    * Role-gated access for the `gemini` and `advanced` tiers.
* **Talk Track**: "Instead of forcing users to build custom filters or search through menus, Conversational Analytics puts natural language AI directly in the UI. Users ask questions like 'What were our top 3 brands in Q2?' and get instant visual answers. This opens up data exploration to non-technical users, driving product adoption while reducing dashboard clutter."

### ￼

### 4. Report Viewer (`/report-viewer`)
* **Purpose**: Curated folder list of saved reports and dashboards.
* **Key Features**:
    * Reusable report selector loading selected content on demand.
    * Access control mapped directly to Looker's user space permissions.
    * Ability to create a new report and load from your personal folder (by clicking “Create New Report” -> “Refresh Folders”)
* **Talk Track**: "Report Viewer offers a clean folder catalog for saved content. Clicking any report refreshes the viewer pane on the fly. This setup allows analysts to deploy new dashboards to user folders instantly, requiring zero additional development or redeployments."

### ￼

### 5. Agents Tab (`/agents`)
* **Purpose**: Custom UI/UX integration using Looker’s Conversational Analytics API (MCP coming soon)
    * **Key Features**:
    * Ability to chat with the Embed Demo’s CA Agent through a custom interface
    * Showcases the CA Agent’s ability to be headless and integrated into any App or Agentic Framework
    * Localization of agent
    * Coming soon: Visualization support, MCP support.
* **Talk Track**: “Agents tab provides a custom portal for interacting with CA Agents. Because we are calling Looker API’s the context of the user is passed through the conversation. We can visualize the agent's reasoning steps along the way.”

### ￼

### 6. Query Explorer (`/explore`)
* **Purpose**: Native ad-hoc data exploration environment (`/embed/explore/...`).
* **Key Features**:
    * Out-of-the-box self-service builder requiring no custom frontend development.
    * Visual query interface and field picker.
    * Exclusive to the `advanced` tier.
* **Talk Track**: "For power users, Query Explorer embeds Looker's native drag-and-drop explore panel. Advanced users can select fields, pivot dimensions, run calculations, and format charts directly. This gives clients full self-service access without developer involvement."

### ￼

### 7. Report Builder (`/report-builder`)
* **Purpose**: Saved report creator and dashboard library management.
* **Key Features**:
    * Interface to save, edit, and categorize custom Looks and user dashboards.
    * Self-service report workflows for premium accounts.
* **Talk Track**: "Report Builder is where premium users save their work. It collapses complex data structures—like multiple explores, facts, and dimensions—into an interface where users build reports from scratch, save them, and organize their personal folders."

---

## 2. Monetization & Security Strategy

### Tiered User Types & Monetization Framework

Looker embedding maps permissions to user roles to enable data monetization:
1. **Simple User (Basic Tier - Viewer)**:
1. 
* **Target Audience**: Standard portal users.
* **Permissions**: `access_data`, `see_looks`, `see_user_dashboards`, `see_lookml_dashboards`.
* **Accessible Routes**: `/`, `/dashboard`, `/report-viewer`.
* **Monetization Value**: Bundled in base product pricing; provides standard operational reporting.
1. 
1. **Gemini User (AI Tier - Conversational Analyst)**:
1. 
* **Target Audience**: Mid-tier users wanting natural language questions without manual reporting tasks.
* **Permissions**: Simple tier + `gemini_in_looker`, `chat_with_agent`, `chat_with_explore`.
* **Accessible Routes**: Simple tier + `/conversational-analytics`, `/agents`.
* **Monetization Value**: Premium add-on; monetizes conversational AI querying and multi-agent assistance.
1. 
1. **Advanced User (Premium Tier - Explorer & Creator)**:
1. 
* **Target Audience**: Power users, analysts, and operations leads.
* **Permissions**: Gemini tier + `explore`, `save_content`, `embed_browse_spaces`, `save_agents`, `admin_agents`.
* **Accessible Routes**: Unlocks `/explore` and `/report-builder`.
* **Monetization Value**: Top-tier access; monetizes ad-hoc query building, scheduling, and custom dashboard saving.

### Monetization Demo Talk Track

"Data monetization is about aligning analytical capabilities with user maturity. Basic users get standard dashboards. Upgrading to the Gemini tier gives them conversational AI to query datasets in plain English. Finally, power users on the Advanced tier get full self-service tools to explore data, build reports, and set custom schedules—turning raw data into a premium service."

### Security Architecture
* **Tenant Isolation**: User attributes (like `brand = "Levi's"`) dynamically filter LookML queries, securing data at the database query level.
* **Cookieless Embed Authentication**: The portal exchanges short-lived session tokens (`/api/auth/tokens`) to authenticate the embedded iframe, keeping API keys on the server.

### Developer Tools & Source Highlighting
* **Source / Method Highlighter**: A developer tool toggle in the Settings dialog that wraps portal elements in visual outlines (`IFrame` in blue, `API` in green). This lets you visually demonstrate how Looker acts as a hybrid data engine—supplying direct iframe embeds for standard dashboards alongside custom API calls to drive bespoke metrics cards.
* **SSO Payload Flyout**: When switching user roles in settings, the UI displays the exact JWT SSO embed user payload generated by the backend, demonstrating authorization transparency.

---

## Conclusion & Demo Wrap-Up

Wrap up the demonstration by ensuring the audience walks away with the clear understanding that Looker is a robust, developer-first platform designed with AI in mind:
1. **Easy to Implement, Accelerated by AI**: Basic embedding is a day-one feature. Adding conversational interfaces and multi-agent assistant hubs takes minutes rather than months, leveraging the Embed SDK and pre-built components to ship AI features immediately.
1. **Deep Customization (Inside & Outside the IFrame)**: Looker provides complete design and structural flexibility. You can drop in native dashboards, expose out-of-the-box self-service explores for premium tiers, or call the Looker SDK API directly to build entirely bespoke visual features and data layouts.
1. **Semantic Modeling is the Bedrock for AI**: Generative AI is only as good as the metrics it references. By defining data schemas once in LookML, you guarantee that LLMs, chat interfaces, and agents query a single source of truth that enforces database governance and row-level access dynamically. LookML is the translation layer and security gateway that makes enterprise AI reliable.


