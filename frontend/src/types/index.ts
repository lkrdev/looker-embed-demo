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

  // Settings State
  isSettingsOpen: boolean
  setIsSettingsOpen: (isOpen: boolean) => void
  language: string
  setLanguage: (lang: string) => void
  company: string
  setCompany: (comp: string) => void
  sourceEnabled: boolean
  setSourceEnabled: (enabled: boolean) => void

  // Profile Modal State
  isProfileModalOpen: boolean
  setIsProfileModalOpen: (isOpen: boolean) => void

  // Cookieless session refresh trigger
  authTrigger: number
}

