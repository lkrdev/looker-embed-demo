import React, { createContext, useContext, useState, useEffect } from 'react'
import type { EmbedType, ThemeType, PortalContextType } from '../types'
import { lookerBrowserSdk, syncLookerSession } from '../services'
import {
  API_BASE_URL,
  LOOKER_HOST,
  LOOKER_EMBED_PATHS,
  DEFAULT_EMBED_TYPE,
  DEFAULT_LANGUAGE,
  DEFAULT_BRAND,
} from '../config/constants'
import { useSharedLookerConnection, useEmbedSDK } from '../hooks'

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Theme State
  const [theme, setTheme] = useState<ThemeType>('light')

  // 2. Sidebar Collapsed State
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 3. Looker Embed State
  const [selectedType, setSelectedType] = useState<EmbedType>('simple')
  const [activeEndpoint, setActiveEndpoint] = useState<string>(
    `${API_BASE_URL}/api/embed/simple`
  )

  // 4. Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguageState] = useState<string>('English')
  const [brand, setBrandState] = useState<string>("Levi's")
  const [sourceEnabled, setSourceEnabledState] = useState<boolean>(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [lookerUser, setLookerUser] = useState<any | null>(null)

  // 5. Auth Trigger key to notify hooks to re-acquire sessions
  const [authTrigger, setAuthTrigger] = useState(0)
  const [dateFilter, setDateFilter] = useState<string>('')
  const [isFiltering, setIsFiltering] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState<string>(LOOKER_EMBED_PATHS.dashboard)

  // Looker host is resolved statically from config/env variables
  const lookerHost = LOOKER_HOST
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  const syncSession = async (role: EmbedType, lang: string, brnd: string) => {
    await syncLookerSession(role, lang, brnd, (data) => {
      if (data) setLookerUser(data)
      setAuthTrigger((prev) => prev + 1)
    })
  }

  // Initialize theme & sidebar & settings from localStorage on mount
  useEffect(() => {
    // Theme setup
    const storedTheme = localStorage.getItem('theme') as ThemeType | null
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      setTheme(prefersDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', prefersDark)
    }

    // Sidebar setup
    const collapsed = localStorage.getItem('sidebar_collapsed') === 'true'
    setIsCollapsed(collapsed)

    // Settings setup
    const storedType = (localStorage.getItem('embed_type') ||
      DEFAULT_EMBED_TYPE) as EmbedType
    setSelectedType(storedType)
    const storedLang = localStorage.getItem('language') || DEFAULT_LANGUAGE
    setLanguageState(storedLang)
    const storedBrand = localStorage.getItem('brand') || DEFAULT_BRAND
    setBrandState(storedBrand)
    const storedSource = localStorage.getItem('source_enabled') === 'true'
    setSourceEnabledState(storedSource)

    // Initial sync
    const init = async () => {
      if (window.location.pathname !== '/login') {
        await syncSession(storedType, storedLang, storedBrand)
      }
      setIsLoadingConfig(false)
    }
    init()
  }, [])

  // Sync theme changes to DOM and localStorage
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  // Sync sidebar changes to localStorage
  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }

  const handleSetLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    syncSession(selectedType, lang, brand)
  }

  const handleSetBrand = (brnd: string) => {
    setBrandState(brnd)
    localStorage.setItem('brand', brnd)
    syncSession(selectedType, language, brnd)
  }

  const handleSetSourceEnabled = (enabled: boolean) => {
    setSourceEnabledState(enabled)
    localStorage.setItem('source_enabled', String(enabled))
  }

  // Sync activeEndpoint whenever type, language, or brand changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (language) params.append('language', language.toLowerCase())
    if (brand) params.append('brand', brand.toLowerCase())
    const queryString = params.toString()
    const endpoint = `${API_BASE_URL}/api/embed/${selectedType}${queryString ? `?${queryString}` : ''}`
    setActiveEndpoint(endpoint)
  }, [selectedType, language, brand])

  const setEmbedType = (type: EmbedType) => {
    setSelectedType(type)
    localStorage.setItem('embed_type', type)
    syncSession(type, language, brand)
  }

  const [iframeAnchor, setIframeAnchor] = useState<HTMLDivElement | null>(null)

  // Shared Looker connection singleton management
  const {
    connection,
    connectionState,
    embedError,
    initializeSharedSDK,
    isNavigating,
    navigateIframe,
    resetConnection,
  } = useSharedLookerConnection(
    lookerHost,
    isLoadingConfig,
    authTrigger,
    setDateFilter
  )

  return (
    <PortalContext.Provider
      value={{
        theme,
        toggleTheme,
        isCollapsed,
        setIsCollapsed: handleSetCollapsed,
        selectedType,
        activeEndpoint,
        lookerHost,
        setEmbedType,
        isLoadingConfig,
        isSettingsOpen,
        setIsSettingsOpen,
        language,
        setLanguage: handleSetLanguage,
        brand,
        setBrand: handleSetBrand,
        sourceEnabled,
        setSourceEnabled: handleSetSourceEnabled,
        isProfileModalOpen,
        setIsProfileModalOpen,
        lookerUser,
        authTrigger,
        lookerBrowserSdk,
        connection,
        connectionState,
        embedError,
        initializeSharedSDK,
        dateFilter,
        setDateFilter,
        isFiltering,
        setIsFiltering,
        iframeAnchor,
        setIframeAnchor,
        isNavigating,
        navigateIframe,
        resetConnection,
        dashboardUrl,
        setDashboardUrl,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export const usePortal = () => {
  const context = useContext(PortalContext)
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}

export { useEmbedSDK }
