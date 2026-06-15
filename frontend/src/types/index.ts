import type { ILookerConnection } from '@looker/embed-sdk'
import type * as React from 'react'

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
  brand: string
  setBrand: (brand: string) => void
  sourceEnabled: boolean
  setSourceEnabled: (enabled: boolean) => void

  // Profile Modal State
  isProfileModalOpen: boolean
  setIsProfileModalOpen: (isOpen: boolean) => void

  // Cookieless session refresh trigger
  authTrigger: number

  // Shared Connection properties
  connection: ILookerConnection | null
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  embedError: string | null
  initializeSharedSDK: (container: HTMLDivElement) => Promise<void>
  dateFilter: string
  setDateFilter: React.Dispatch<React.SetStateAction<string>>
  isFiltering: boolean
  setIsFiltering: React.Dispatch<React.SetStateAction<boolean>>

  // Dynamic anchoring properties
  iframeAnchor: HTMLDivElement | null
  setIframeAnchor: (element: HTMLDivElement | null) => void
}

export interface AccessDeniedProps {
  title: string
}

export interface AppCardProps {
  to: string
  title: React.ReactNode
  description?: React.ReactNode
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hoverable' | 'glass'
}

export interface EmbedPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface HeroBannerProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  badgeText?: string
  badgeIcon?: React.ComponentType<{ size?: number; className?: string }>
  actions?: React.ReactNode
  decoration?: React.ReactNode
}

export interface LookerLogoProps extends React.SVGProps<SVGSVGElement> {}

export interface NavbarProps {}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  border?: boolean
}

export interface SourceHighlighterProps {
  children: React.ReactNode
  sourceType: 'iframe' | 'api'
  className?: string
  style?: React.CSSProperties
}

export interface GlobalLookerContainerProps {
  isVisible: boolean
  currentRoute: string
}

export type ViewType = 'main' | 'userType' | 'language' | 'brand'


