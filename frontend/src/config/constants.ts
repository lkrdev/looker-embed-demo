import type { EmbedType, NavItem } from "../types";

/**
 * Portal application configuration constants.
 * Hardcoded variables are consolidated here to allow environment-specific overrides.
 */

declare global {
  interface Window {
    vite?: Record<string, any>;
  }
}

// Base URL of the backend API
export const API_BASE_URL =
  (window.vite?.api_base_url as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  "";

// Looker Instance URL for frontend use
export const LOOKER_INSTANCE_URL =
  (window.vite?.looker_instance_url as string) ||
  (import.meta.env.VITE_LOOKER_INSTANCE_URL as string) ||
  "";

// Parse host from Looker Instance URL
const getHostName = (url: string): string => {
  try {
    return new URL(url).host;
  } catch (e) {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
};

export const LOOKER_HOST = getHostName(LOOKER_INSTANCE_URL);

// Looker Conversational Analytics Agent ID used for embedding the chat interface
export const CHAT_AGENT_ID =
  (window.vite?.chat_agent_id as string) ||
  (import.meta.env.VITE_CHAT_AGENT_ID as string) ||
  "";

// Customizations loaded from environment variables
export const DASHBOARD_ID =
  (window.vite?.dashboard_id as string) ||
  (import.meta.env.VITE_DASHBOARD_ID as string) ||
  "embed_demo::brand_overview";
export const EMBD_THEME =
  (window.vite?.theme as string) ||
  (import.meta.env.VITE_THEME as string) ||
  "Light_Mode";
export const EXPLORE_PATH =
  (window.vite?.explore_path as string) ||
  (import.meta.env.VITE_EXPLORE_PATH as string) ||
  "embed_demo/order_items";
export const LOOKER_FOLDER_ID =
  (window.vite?.looker_folder_id as string) ||
  (import.meta.env.VITE_LOOKER_FOLDER_ID as string) ||
  "12";

// eCommerce Home Page KPI Query IDs
export const KPI_TOTAL_REVENUE_QUERY_ID = "YghSR43rKKcYDYCRWycbxMCWGzWKRfwq";
export const KPI_TOTAL_ORDERS_QUERY_ID = "SdvjNhGRHfphVc5G8nD425qq8Cg8RVcQ";
export const KPI_AVERAGE_ORDER_VALUE_QUERY_ID =
  "HhGN8kYyvNzFkRmXnjCS3rxKKhFhqqfP";

// Static mappings for Looker Embed SDK targets
export const LOOKER_EMBED_PATHS = {
  dashboard: `/embed/dashboards/${DASHBOARD_ID}?theme=${EMBD_THEME}`,
  conversationalAnalytics: `/embed/conversations?ds.agent=${CHAT_AGENT_ID}&theme=${EMBD_THEME}`,
  explore: `/embed/explore/${EXPLORE_PATH}?theme=${EMBD_THEME}`,
  reportBuilder: "/embed/report-builder?theme=${EMBD_THEME}",
  agents: "/embed/agents?theme=${EMBD_THEME}",
  reportViewer: "",
} as const;

/**
 * Returns the Looker iframe path corresponding to the frontend portal route.
 * Falls back to conversational analytics if the path is unknown.
 */
export const getLookerPath = (path: string): string => {
  switch (path) {
    case "/dashboard":
      return LOOKER_EMBED_PATHS.dashboard;
    case "/conversational-analytics":
      return LOOKER_EMBED_PATHS.conversationalAnalytics;
    case "/explore":
      return LOOKER_EMBED_PATHS.explore;
    case "/report-builder":
      return LOOKER_EMBED_PATHS.reportBuilder;
    case "/agents":
      return LOOKER_EMBED_PATHS.agents;
    case "/report-viewer":
      return LOOKER_EMBED_PATHS.reportViewer;
    default:
      // Fallback path
      return LOOKER_EMBED_PATHS.conversationalAnalytics;
  }
};

// User Profile Configuration
export const DEFAULT_USER_NAME = "Demo User";

export const USER_ROLE_MAPPINGS: Record<EmbedType, string> = {
  simple: "Simple User",
  advanced: "Advanced User",
};

export const DEFAULT_LANGUAGE = "English";
export const DEFAULT_BRAND = "Levi's";
export const DEFAULT_EMBED_TYPE: EmbedType = "simple";

export const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German"];
export const BRAND_OPTIONS = ["Levi's", "Calvin Klein", "Allegra K"];

export const ROLE_ID_MAPPINGS: Record<EmbedType, string> = {
  simple: "viewer",
  advanced: "explorer",
};

export const LANGUAGE_LOCALE_MAPPINGS: Record<string, string> = {
  English: "en",
  Spanish: "es_ES",
  French: "fr_FR",
  German: "de_DE",
};

export const LOOKER_ROUTES = [
  "/dashboard",
  "/explore",
  "/conversational-analytics",
  "/report-builder",
  "/agents",
];
export const GATED_ROUTES = [
  "/conversational-analytics",
  "/agents",
  "/report-builder",
];

export const ROUTE_BREADCRUMB_MAPPINGS: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/conversational-analytics": "Conversational Analytics",
  "/agents": "Agents",
  "/explore": "Query Explorer",
  "/report-builder": "Report Builder",
  "/report-viewer": "Report Viewer",
};

export const PORTAL_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", iconName: "Home", exact: true },
  { to: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard" },
  {
    to: "/conversational-analytics",
    label: "Conversational Analytics",
    iconName: "MessageSquare",
  },
  { to: "/report-viewer", label: "Report Viewer", iconName: "FileText" },
  { to: "/agents", label: "Agents", iconName: "Sparkles" },
  { to: "/explore", label: "Query Explorer", iconName: "Compass" },
  {
    to: "/report-builder",
    label: "Report Builder",
    iconName: "FileSpreadsheet",
  },
];
