import React, { createContext, useContext, useState, useEffect } from 'react'
import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
import type { EmbedType, ThemeType, PortalContextType } from '../types'
import { API_BASE_URL, LOOKER_HOST } from '../config/constants'

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme State
  const [theme, setTheme] = useState<ThemeType>('light')

  // 2. Sidebar Collapsed State
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 3. Looker Embed State
  const [selectedType, setSelectedType] = useState<EmbedType>('simple')
  const [activeEndpoint, setActiveEndpoint] = useState<string>(`${API_BASE_URL}/api/embed/simple`)

  // 4. Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [language, setLanguageState] = useState<string>('English')
  const [company, setCompanyState] = useState<string>('Google')
  const [sourceEnabled, setSourceEnabledState] = useState<boolean>(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // 5. Auth Trigger key to notify hooks to re-acquire sessions
  const [authTrigger, setAuthTrigger] = useState(0)
  
  // Looker host is resolved statically from config/env variables
  const lookerHost = LOOKER_HOST
  const isLoadingConfig = false

  const syncLookerSession = async (role: EmbedType, lang: string, comp: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/looker/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role_id: role === 'advanced' ? 'explorer' : 'viewer',
          locale: lang === 'Spanish' ? 'es_ES' : 'en_US',
          company: comp
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update Looker session config')
      }
      const data = await response.json()
      console.log('Successfully synchronized Looker session config', data)
      // Increment trigger to force useEmbedSDK hook to re-initialize Cookieless SDK
      setAuthTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error synchronizing Looker session config:', err)
    }
  }

  // Initialize theme & sidebar & settings from localStorage on mount
  useEffect(() => {
    // Theme setup
    const storedTheme = localStorage.getItem('theme') as ThemeType | null
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', prefersDark)
    }

    // Sidebar setup
    const collapsed = localStorage.getItem('sidebar_collapsed') === 'true'
    setIsCollapsed(collapsed)

    // Settings setup
    const storedType = (localStorage.getItem('embed_type') || 'simple') as EmbedType
    setSelectedType(storedType)
    const storedLang = localStorage.getItem('language') || 'English'
    setLanguageState(storedLang)
    const storedComp = localStorage.getItem('company') || 'Google'
    setCompanyState(storedComp)
    const storedSource = localStorage.getItem('source_enabled') === 'true'
    setSourceEnabledState(storedSource)

    // Initial sync
    syncLookerSession(storedType, storedLang, storedComp)
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
    syncLookerSession(selectedType, lang, company)
  }

  const handleSetCompany = (comp: string) => {
    setCompanyState(comp)
    localStorage.setItem('company', comp)
    syncLookerSession(selectedType, language, comp)
  }

  const handleSetSourceEnabled = (enabled: boolean) => {
    setSourceEnabledState(enabled)
    localStorage.setItem('source_enabled', String(enabled))
  }

  // Sync activeEndpoint whenever type, language, or company changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (language) params.append('language', language.toLowerCase())
    if (company) params.append('company', company.toLowerCase())
    const queryString = params.toString()
    const endpoint = `${API_BASE_URL}/api/embed/${selectedType}${queryString ? `?${queryString}` : ''}`
    setActiveEndpoint(endpoint)
  }, [selectedType, language, company])

  const setEmbedType = (type: EmbedType) => {
    setSelectedType(type)
    localStorage.setItem('embed_type', type)
    syncLookerSession(type, language, company)
  }

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
        company,
        setCompany: handleSetCompany,
        sourceEnabled,
        setSourceEnabled: handleSetSourceEnabled,
        isProfileModalOpen,
        setIsProfileModalOpen,
        authTrigger
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

/**
 * Custom hook to handle the Looker Embed SDK mounting lifecycle inside a DOM container.
 * Consumes the global configuration state and runs the iframe build/connection side-effects.
 */
export function useEmbedSDK(
  containerRef: React.RefObject<HTMLDivElement | null>,
  targetPath: string
) {
  const { lookerHost, authTrigger, isLoadingConfig } = usePortal()
  const [isConnecting, setIsConnecting] = useState(false)
  const [embedError, setEmbedError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (isLoadingConfig || !lookerHost || !containerRef.current) {
      return
    }

    // Clear target container before mounting new iframe
    containerRef.current.replaceChildren()
    setEmbedError(null)
    setIsConnecting(true)

    try {
      // 1. Reinitialize the Embed SDK with current auth trigger & looker host
      const sdk = getEmbedSDK(new LookerEmbedExSDK())
      sdk.clearSession() // Reset SDK token caching

      sdk.initCookieless(
        lookerHost,
        // acquireSession callback
        async () => {
          if (!active) throw new Error('Embed SDK connection aborted')
          const response = await fetch(`${API_BASE_URL}/api/looker/acquire-embed-session`, {
            method: 'POST',
            credentials: 'include' // Crucial to pass HttpOnly configuration/identity cookies
          })
          if (!response.ok) throw new Error('Failed to acquire cookieless embed session')
          if (!active) throw new Error('Embed SDK connection aborted')
          return response.json()
        },
        // generateTokens callback
        async (tokens) => {
          if (!active) throw new Error('Embed SDK connection aborted')
          const response = await fetch(`${API_BASE_URL}/api/looker/generate-embed-tokens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokens),
            credentials: 'include' // Crucial to pass HttpOnly tokens cookies
          })
          if (!response.ok) throw new Error('Failed to refresh cookieless embed tokens')
          if (!active) throw new Error('Embed SDK connection aborted')
          return response.json()
        }
      )

      // 2. Build the Looker embed client based on target path type
      let builder
      if (targetPath.includes('/dashboards/')) {
        builder = sdk.createDashboardWithUrl(targetPath)
      } else if (targetPath.includes('/explore/')) {
        builder = sdk.createExploreWithUrl(targetPath)
      } else if (targetPath.includes('/conversations')) {
        builder = sdk.createConversationalAnalyticsWithUrl(targetPath)
      } else {
        builder = sdk.createDashboardWithUrl(targetPath)
      }

      // 3. Append to DOM container, and connect
      builder
        .appendTo(containerRef.current)
        .withAllowAttr('fullscreen')
        .build()
        .connect()
        .then((connection) => {
          if (!active) {
            if (containerRef.current) {
              containerRef.current.replaceChildren()
            }
            return
          }
          console.log('Successfully connected Looker Embed SDK for', targetPath, connection)
          setIsConnecting(false)
        })
        .catch((err) => {
          if (!active) return
          console.error('Looker Embed SDK connection error:', err)
          setEmbedError(err.message || 'Failed to connect Looker Embed SDK')
          setIsConnecting(false)
        })
    } catch (err: any) {
      if (!active) return
      console.error('Failed to initialize Looker Embed SDK:', err)
      setEmbedError(err.message || 'Initialization failed')
      setIsConnecting(false)
    }

    return () => {
      active = false
      if (containerRef.current) {
        containerRef.current.replaceChildren()
      }
    }
  }, [lookerHost, authTrigger, isLoadingConfig, targetPath, containerRef])

  return {
    isConnecting,
    embedError,
    isLoadingConfig,
    lookerHost
  }
}
