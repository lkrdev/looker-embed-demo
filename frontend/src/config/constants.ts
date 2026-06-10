import type { EmbedType } from '../types'

/**
 * Portal application configuration constants.
 * Hardcoded variables are consolidated here to allow environment-specific overrides.
 */

// Base URL of the backend API
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

// Looker Instance URL for frontend use
export const LOOKER_INSTANCE_URL = (import.meta.env.VITE_LOOKER_INSTANCE_URL as string) || 'https://looker.lukapuka.co'

// Parse host from Looker Instance URL
const getHostName = (url: string): string => {
  try {
    return new URL(url).host
  } catch (e) {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

export const LOOKER_HOST = getHostName(LOOKER_INSTANCE_URL)


// Looker Conversational Analytics Agent ID used for embedding the chat interface
export const CHAT_AGENT_ID = (import.meta.env.VITE_CHAT_AGENT_ID as string) || '43d365a4dc6647b29d0eb1b07868470f'

// Customizations loaded from environment variables
export const DASHBOARD_ID = (import.meta.env.VITE_DASHBOARD_ID as string) || '1'
export const EMBD_THEME = (import.meta.env.VITE_THEME as string) || 'Light_Mode'
export const EXPLORE_PATH = (import.meta.env.VITE_EXPLORE_PATH as string) || 'thelook/orders'

// Static mappings for Looker Embed SDK targets
export const LOOKER_EMBED_PATHS = {
  dashboard: `/embed/dashboards/${DASHBOARD_ID}`,
  conversationalAnalytics: `/embed/conversations?ds.agent=${CHAT_AGENT_ID}&theme=${EMBD_THEME}`,
  explore: `/embed/explore/${EXPLORE_PATH}`,
  reportBuilder: '/embed/report-builder',
  agents: '/embed/agents',
} as const

/**
 * Returns the Looker iframe path corresponding to the frontend portal route.
 * Falls back to conversational analytics if the path is unknown.
 */
export const getLookerPath = (path: string): string => {
  switch (path) {
    case '/dashboard':
      return LOOKER_EMBED_PATHS.dashboard
    case '/conversational-analytics':
      return LOOKER_EMBED_PATHS.conversationalAnalytics
    case '/explore':
      return LOOKER_EMBED_PATHS.explore
    case '/report-builder':
      return LOOKER_EMBED_PATHS.reportBuilder
    case '/agents':
      return LOOKER_EMBED_PATHS.agents
    default:
      // Fallback path
      return LOOKER_EMBED_PATHS.conversationalAnalytics
  }
}

// User Profile Configuration
export const DEFAULT_USER_NAME = 'Demo User'

export const USER_ROLE_MAPPINGS: Record<EmbedType, string> = {
  simple: 'Simple User',
  advanced: 'Advanced User',
}
