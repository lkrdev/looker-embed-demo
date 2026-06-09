export type EmbedType = 'simple' | 'advanced'
export type ThemeType = 'light' | 'dark'

export interface PortalContextType {
  // Theme
  theme: ThemeType
  toggleTheme: () => void

  // Sidebar Layout
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void

  // Looker Config & SSO
  selectedType: EmbedType
  activeEndpoint: string
  lookerHost: string | null
  setEmbedType: (type: EmbedType) => void
  isLoadingConfig: boolean
}
