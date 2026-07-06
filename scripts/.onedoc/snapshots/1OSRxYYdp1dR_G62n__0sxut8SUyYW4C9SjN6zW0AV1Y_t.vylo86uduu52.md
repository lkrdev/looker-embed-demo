# Conversational Analytics Demo Script & Guide

The Conversational Analytics page (`/conversational-analytics`) transforms how business users interact with data by embedding Looker's natural language AI chat interface directly inside the application. Instead of requiring users to navigate complex dashboards, adjust filters, or understand database structures, this feature lets them ask questions in plain English and receive instant, dynamically generated visualizations.

Under the hood, Conversational Analytics does not use a generic text-generation LLM that guesses numbers. Instead, it leverages Google's Gemini AI to translate natural language prompts into structured LookML queries. The Looker semantic layer acts as an essential security and governance gateway, guaranteeing that every answer is mathematically accurate, scoped to the user's tenant permissions, and grounded in verified business logic.

This guide walks through how to present the Conversational Analytics embedded interface during a live customer or technical demo.

---

## Role-Gated Access & Tiering Controls
* **Tiered Permission Enforcement**: Conversational Analytics is exclusive to the **Gemini** and **Advanced** user tiers. If a basic **Simple** tier user attempts to access this route, the portal intercepts the navigation and renders an `<AccessDenied />` upgrade prompt.
* **Monetization Alignment**: Demonstrates how organizations can package AI capabilities as a premium upsell tier within their customer-facing SaaS applications.
* **Theme & Brand Synchronization**: The embedded AI interface dynamically inherits the active portal theme (`Embed_Demo_Light` or dark mode) and user attribute filters (`brand = "Levi's"`), ensuring a seamless white-label user experience.

---

## Page Features & Walkthrough

### Section 1: Natural Language Query Exploration

The embedded AI chat interface allows users to explore data ad-hoc through conversational dialogue, generating charts, data tables, and narrative explanations on demand.

| Feature / Capability | Looker Architecture | What It Shows | Why It Matters |
| --- | --- | --- | --- |
| Natural Language to LookML | Gemini + Looker Semantic Layer | Translates user questions (e.g., *"What were our top 5 selling jackets last month?"*) into governed LookML queries. | Bridges the gap between non-technical business users and complex data exploration without developer intervention. |
| Automatic Visualization Selection | Looker Charting Engine | Automatically renders the most appropriate chart type (bar chart, line trend, pie chart, or table) based on the query structure. | Eliminates manual chart formatting and configuration for end users, delivering presentation-ready answers instantly. |
| Multi-Turn Conversational Refinement | Session State & Context | Allows users to ask follow-up questions (e.g., *"Now filter that to California and show month over month growth"*) while retaining previous chat context. | Enables iterative, train-of-thought data investigation that mirrors real-world business analysis workflows. |
| Transparent SQL & LookML Verification | Query Inspector | Displays the underlying Looker Explore, selected dimensions, measures, and generated SQL upon request. | Builds enterprise trust by proving to technical evaluators that AI outputs are mathematically verifiable and governed. |

#### Demo Script

*"When we switch to the Conversational Analytics page, we unlock Looker's natural language exploration engine. For basic users, dashboards are great—but mid-tier and power users often have ad-hoc questions that aren't on a standard report.*

*"Watch how I can type a question in plain English: 'What were our top 3 revenue-generating categories over the last 90 days?' Notice that Looker doesn't just return a paragraph of text; it generates a live LookML query, applies our Calvin Klein brand security filter automatically, and renders an interactive column chart.*

*"If I want to dig deeper, I just type a follow-up: 'Break that down by customer state.' The AI retains our conversation context, updates the query, and maps the data instantly. This gives your clients a data analyst in their pocket, driving massive product adoption while eliminating ad-hoc ticket backlogs for your engineering team."*

---

![Image](images/conversational_analytics_demo_script/kix.pu769i2zkmdt.png)

### Section 2: Monetization & Upgrade Walkthrough

A key aspect of this demo is showing how embedded AI drives SaaS expansion revenue by tiering access to conversational capabilities.

| Demonstration Step | Portal Action | Observed Behavior | Talk Track Alignment |
| --- | --- | --- | --- |
| 1. Simulate Basic Tier | Open Settings Dialog -> Select **Simple (Viewer)** Tier -> Click Save | Navigation to `/conversational-analytics` is restricted; UI displays `<AccessDenied />` upgrade card. | *"In your base SaaS package, clients receive standard reporting. When they try to access AI features, they see a clean upgrade prompt."* |
| 2. Upgrade to AI Tier | Open Settings Dialog -> Select **Gemini (AI Analyst)** Tier -> Click Save | Route unlocks instantly; Looker AI chat iframe initializes with full conversational querying capabilities. | *"When a customer upgrades to your AI tier, our portal updates their JWT session token. Conversational Analytics activates immediately without redeploying code."* |
| 3. Execute Scoped Query | Ask: *"Show total sales by month"* | AI returns trend line scoped strictly to the user's assigned brand attribute. | *"Because LookML sits beneath the AI, row-level multi-tenant isolation is enforced automatically on every prompt."* |

---

## Technical Architecture & API Reference Table

| Component / Feature | Looker Embed SDK / Endpoint | Architecture & Data Flow | Why It Matters |
| --- | --- | --- | --- |
| Embedded AI Iframe | `/embed/conversations?ds.agent=${CHAT_AGENT_ID}&theme=${EMBD_THEME}<br>` | Loads Looker's conversational agent within `GlobalLookerContainer` using SSO Cookieless token exchange. | Provides a production-grade AI interface with zero custom frontend chat UI development required. |
| Route Access Guard | `isRouteGated('/conversational-analytics', role)<br>` | Application routing guard checks user role permissions (`gemini_in_looker`, `chat_with_agent`) before mounting. | Enforces application-level tiering and security before initiating Looker API sessions. |
| LookML Governance Layer | Looker Semantic Model (`embed_demo` / `order_items`) | Gemini evaluates user prompts against defined LookML dimensions, measures, and joins rather than raw database schemas. | Prevents LLM hallucination and database query syntax errors by restricting AI to verified business definitions. |
| Cookieless Token Exchange | Backend `/api/auth/tokens<br>` | Server exchanges secure credentials for short-lived Looker embed session tokens, passing user attributes (`brand`, `role`). | Ensures API secrets remain secure on the backend while dynamically scoping AI chat responses to the authenticated tenant. |


