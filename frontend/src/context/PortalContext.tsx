import React, { createContext, useContext, useState, useEffect } from 'react'
import type { EmbedType, ThemeType, PortalContextType } from '../types'
import { lookerBrowserSdk, syncLookerSession } from '../services'
import {
  API_BASE_URL,
  LOOKER_HOST,
  DEFAULT_EMBED_TYPE,
  DEFAULT_LANGUAGE,
  DEFAULT_BRAND,
  getEmbedThemeName,
  getLookerPath,
} from '../config/constants'
import { useSharedLookerConnection, useEmbedSDK } from '../hooks'

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Lazy Initialization matching OS Preference if unconfigured
  const [theme, setTheme] = useState<ThemeType>(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  const [brand, setBrandState] = useState<string>(() => {
    return localStorage.getItem('brand') || DEFAULT_BRAND
  })

  const [embedTheme, setEmbedTheme] = useState<string>(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null
    const isDark = storedTheme === 'dark' || (storedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const storedBrand = localStorage.getItem('brand') || DEFAULT_BRAND
    return getEmbedThemeName(isDark, storedBrand)
  })

  // Reactive DOM Class Synchronization
  useEffect(() => {
    // Explicitly toggle both classes to prevent OS media query conflicts (:root:not(.light))
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // 2. Sidebar Collapsed State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  // 3. Looker Embed State
  const [selectedType, setSelectedType] = useState<EmbedType>(() => {
    return (localStorage.getItem('embed_type') || DEFAULT_EMBED_TYPE) as EmbedType
  })
  const [activeEndpoint, setActiveEndpoint] = useState<string>(
    `${API_BASE_URL}/api/embed/simple`
  )

  // 4. Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('language') || DEFAULT_LANGUAGE
  })
  const [sourceEnabled, setSourceEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('source_enabled') === 'true'
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [lookerUser, setLookerUser] = useState<any | null>(null)

  // 5. Auth Trigger key to notify hooks to re-acquire sessions
  const [authTrigger, setAuthTrigger] = useState(0)
  const [dateFilter, setDateFilter] = useState<string>('')
  const [isFiltering, setIsFiltering] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState<string>(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null
    const isDark = storedTheme === 'dark' || (storedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const storedBrand = localStorage.getItem('brand') || DEFAULT_BRAND
    return getLookerPath('/dashboard', getEmbedThemeName(isDark, storedBrand))
  })

  // Looker host is resolved statically from config/env variables
  const lookerHost = LOOKER_HOST
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  const syncSession = async (role: EmbedType, lang: string, brnd: string) => {
    await syncLookerSession(role, lang, brnd, (data) => {
      if (data) setLookerUser(data)
      setAuthTrigger((prev) => prev + 1)
    })
  }

  // Initialize session sync on mount
  useEffect(() => {
    const init = async () => {
      if (window.location.pathname !== '/login') {
        await syncSession(selectedType, language, brand)
      }
      setIsLoadingConfig(false)
    }
    init()
  }, [])

  // Theme Toggle Handler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    const nextIsDark = nextTheme === 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    setEmbedTheme(getEmbedThemeName(nextIsDark, brand))
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

  const handleSetBrand = (newBrand: string) => {
    setBrandState(newBrand)
    localStorage.setItem('brand', newBrand)
    setEmbedTheme(getEmbedThemeName(theme === 'dark', newBrand))
    syncSession(selectedType, language, newBrand)
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

  const isFirstMount = React.useRef(true)
  const prevEmbedThemeRef = React.useRef(embedTheme)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (prevEmbedThemeRef.current === embedTheme) {
      return
    }
    prevEmbedThemeRef.current = embedTheme

    // Update iframe target URL parameter
    setDashboardUrl((prevUrl) => {
      try {
        const url = new URL(prevUrl, window.location.origin)
        url.searchParams.set('theme', embedTheme)
        return url.pathname + url.search
      } catch {
        return getLookerPath('/dashboard', embedTheme)
      }
    })

    // Trigger iframe connection warmboot
    resetConnection()
  }, [embedTheme, resetConnection])

  return (
    <PortalContext.Provider
      value={{
        theme,
        embedTheme,
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
