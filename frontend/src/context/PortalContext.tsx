import React, { createContext, useContext, useState, useEffect } from 'react'
import type { EmbedType, ThemeType, PortalContextType } from '../types'
import { lookerBrowserSdk, syncLookerSession } from '../services'
import {
  API_BASE_URL,
  LOOKER_HOST,
  DEFAULT_EMBED_TYPE,
  DEFAULT_LANGUAGE,
  DEFAULT_BRAND,
  BRAND_THEME_PALETTES,
  DEFAULT_BRAND_THEME_PAIR,
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

  // ponytail: Looker mounts Data App tiles in nested data: iframes that don't receive ?theme= settings;
  // reply directly to window.top postMessage requests via event.source without touching /embed/dashboards/id.
  const dataAppSourcesRef = React.useRef<Set<Window>>(new Set())
  const themeStateRef = React.useRef({ theme, brand, embedTheme })
  themeStateRef.current = { theme, brand, embedTheme }

  const postThemeToSource = React.useCallback((win: Window, st = themeStateRef.current) => {
    if (win.closed) {
      dataAppSourcesRef.current.delete(win)
      return
    }
    const isDark = st.theme === 'dark'
    const pair = BRAND_THEME_PALETTES[st.brand] || DEFAULT_BRAND_THEME_PAIR
    const palette = isDark ? pair.dark : pair.light
    win.postMessage(
      {
        type: 'embed-demo-theme',
        theme: st.embedTheme,
        isDark,
        brand: st.brand,
        accent: palette.accent,
        palette,
      },
      '*'
    )
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'embed-demo-theme-request' && e.source && 'postMessage' in e.source) {
        const win = e.source as Window
        dataAppSourcesRef.current.add(win)
        postThemeToSource(win)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [postThemeToSource])

  useEffect(() => {
    for (const win of dataAppSourcesRef.current) {
      if (win.closed) dataAppSourcesRef.current.delete(win)
      else postThemeToSource(win, { theme, brand, embedTheme })
    }
  }, [theme, brand, embedTheme, postThemeToSource])

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

  // Upgrade SaaS Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [upgradeModalTargetRoute, setUpgradeModalTargetRoute] = useState<string | null>(null)
  const [isGeModalOpen, setIsGeModalOpen] = useState(false)
  const [isGePromptsOpen, setIsGePromptsOpen] = useState(false)

  const openUpgradeModal = (targetRoute?: string) => {
    setUpgradeModalTargetRoute(targetRoute || null)
    setIsUpgradeModalOpen(true)
  }

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
    try {
      await syncLookerSession(role, lang, brnd, (data) => {
        if (data) setLookerUser(data)
      })

      // Atomic Session Commit: Update active React states ONLY after backend sync succeeds
      setLanguageState(lang)
      setBrandState(brnd)
      setSelectedType(role)
      localStorage.setItem('language', lang)
      localStorage.setItem('brand', brnd)
      localStorage.setItem('embed_type', role)
      setEmbedTheme(getEmbedThemeName(theme === 'dark', brnd))

      // Notify hooks and connections to re-query with newly issued tokens
      setAuthTrigger((prev) => prev + 1)
    } catch (err) {
      console.error('Error synchronizing Looker session config:', err)
    }
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
    syncSession(selectedType, lang, brand)
  }

  const handleSetBrand = (newBrand: string) => {
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
    setDateFilter,
    embedTheme
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
        url.searchParams.delete('ca_chat')
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
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        upgradeModalTargetRoute,
        openUpgradeModal,
        isGeModalOpen,
        setIsGeModalOpen,
        isGePromptsOpen,
        setIsGePromptsOpen,
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
