---
name: customize-frontend-looker-config
description: Guidelines and instructions for configuring Looker environment variables (.env), embed target IDs/routes (constants.ts), role permissions, and interacting with Looker MCP tools to fetch available dashboards, models, and explores.
---

# Looker Embed Portal - Customizing Looker Variables & Configuration

This skill provides instructions for configuring Looker instance targets, embedding defaults, conversational analytics agent IDs, and role permissions across [.env](file:///usr/local/google/home/maluka/looker-embed-demo/.env) and [constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts).

---

## 1. Environment Variable Configuration ([.env](file:///usr/local/google/home/maluka/looker-embed-demo/.env))

Frontend embed customizations and backend instance endpoints are controlled via environment variables in `.env`.

### Key Variables
- `LOOKER_INSTANCE_URL`: Looker backend API URL (e.g. `https://googledemo2.cloud.looker.com`).
- `VITE_LOOKER_INSTANCE_URL`: Frontend reference to Looker instance URL.
- `LOOKER_EMBED_DOMAIN`: Host application domain (e.g. `http://localhost:3000`) used for CORS and embed origin authorization.
- `VITE_DASHBOARD_ID`: Default Dashboard ID embedded on `/dashboard` (e.g. `embed_demo::brand_overview` or numeric ID `123`).
- `VITE_THEME`: Looker theme applied to embedded content (e.g. `Embed_Demo_Light`).
- `VITE_EXPLORE_PATH`: Model and Explore view path embedded on `/explore` (e.g. `embed_demo/order_items`).
- `VITE_CHAT_AGENT_ID`: Looker Conversational Analytics Agent ID embedded on `/conversational-analytics`.
- `VITE_LOOKER_FOLDER_ID`: Looker Folder ID for browsing saved reports (e.g. `12`).

---

## 2. Interactive Looker MCP Discovery (CRITICAL)

When updating `VITE_DASHBOARD_ID`, `VITE_EXPLORE_PATH`, or LookML model references, **never guess IDs or paths**.
If specific IDs or paths were not provided by the user:

1. **Fetch Dashboards**: Use Looker MCP tool `mcp_looker_get_dashboards` or `mcp_looker_search_dashboards` to list available dashboards on the active Looker instance.
2. **Fetch Models & Explores**: Use `mcp_looker_get_models` and `mcp_looker_get_explores` to list valid models and explore definitions.
3. **Prompt User**: Present the fetched list to the user and ask them to select their desired dashboard, model, or explore before modifying `.env` or `constants.ts`.

---

## 3. Frontend Constants & RBAC ([constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts))

[constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts) consolidates navigation items, Looker target routes, user profile defaults, and role-based access control (RBAC) permissions.

### A. Navigation & Tabs (`PORTAL_NAV_ITEMS`)
To show, hide, or reorder tabs in the sidebar navigation, update `PORTAL_NAV_ITEMS`:
```typescript
export const PORTAL_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", iconName: "Home", exact: true },
  { to: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  { to: "/conversational-analytics", label: "Conversational Analytics", iconName: "MessageSquare" },
  { to: "/agents", label: "Agents", iconName: "Sparkles" },
  { to: "/explore", label: "Query Explorer", iconName: "Compass" },
  { to: "/report-builder", label: "Report Builder", iconName: "FileSpreadsheet" },
];
```

### B. Role Permissions (`ROLE_PERMISSIONS`)
To adjust what capabilities are granted to `viewer` (Simple User) vs `explorer` (Advanced User) profiles:
```typescript
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  viewer: [
    "access_data",
    "see_looks",
    "see_user_dashboards",
    "see_lookml_dashboards",
    "gemini_in_looker",
    "chat_with_agent",
    "chat_with_explore",
  ],
  explorer: [
    // Inherits viewer permissions plus content saving and exploration
    "access_data",
    "see_looks",
    "see_user_dashboards",
    "save_content",
    "see_lookml_dashboards",
    "explore",
    "embed_browse_spaces",
    "gemini_in_looker",
    "chat_with_agent",
    "chat_with_explore",
    "save_agents",
    "admin_agents",
  ],
};
```

### C. Default User Profile Settings
Customize demo user profile defaults on lines 109–128:
- `DEFAULT_USER_NAME = "Demo User"`
- `DEFAULT_BRAND = "Levi's"`
- `BRAND_OPTIONS = ["Levi's", "Calvin Klein", "Allegra K"]`
- `DEFAULT_LANGUAGE = "English"`

### D. Embed User Group IDs & Folder Access (`DEFAULT_LOOKER_GROUP_IDS`)
All embed users (`simple`, `gemini`, and `advanced` alike) are assigned to a shared Looker group via `group_ids` (defaulting to `["8"]` in `getRoleUserObject` in [constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts) and `DEFAULT_LOOKER_GROUP_IDS` in [backend/app/models.py](file:///usr/local/google/home/maluka/looker-embed-demo/backend/app/models.py)).

This group is used to grant shared content access to the main content folder in Looker (such as the Shared or Embed Demo folder). When deploying or onboarding the demo to a new Looker environment:
1. Ensure the shared content group (e.g., `"Embed Demo Users"`) is created in the target Looker instance.
2. Replace the default group ID (`"8"`) in `backend/app/models.py`, `frontend/src/config/constants.ts`, and `frontend/src/components/dialogs/UserDetailsDialog.tsx` with the new group ID for that environment.

---

## 4. Verification Step

After modifying `.env` or `constants.ts`:
1. Ensure all TypeScript types remain valid.
2. Run `pnpm run build` in `frontend/` to verify zero compilation or bundling errors.
