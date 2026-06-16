import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Home,
  LayoutDashboard,
  MessageSquare,
  Compass,
  FileSpreadsheet,
  User,
  Settings,
  Sun,
  Moon,
  Lock,
  Sparkles,
  FileText,
  LogOut
} from 'lucide-react'
import { LookerLogo } from './LookerLogo'
import { usePortal } from '../../context/PortalContext'
import { DEFAULT_USER_NAME, USER_ROLE_MAPPINGS, GATED_ROUTES, PORTAL_NAV_ITEMS } from '../../config/constants'
import { clearAuthSession } from '../../utils/auth'
import type { ToggleIconProps } from '../../types'

const ICON_MAP = {
  Home,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Sparkles,
  Compass,
  FileSpreadsheet,
} as const

export function Sidebar() {
  const { isCollapsed, setIsCollapsed, selectedType, theme, toggleTheme, setIsSettingsOpen, setIsProfileModalOpen } = usePortal()
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const [isBtnHovered, setIsBtnHovered] = useState(false)
  const [isThemeHovered, setIsThemeHovered] = useState(false)
  const [isSettingsHovered, setIsSettingsHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)
  const [isLogoutHovered, setIsLogoutHovered] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  // Toggle Widget Icon Component (Gemini style)
  const ToggleIcon = ({ collapsed, hovered }: ToggleIconProps) => (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <line x1="9" y1="3" x2="9" y2="21" />
      {hovered && (
        collapsed ? (
          <path d="M12 9l3 3-3 3" strokeWidth="1.5" />
        ) : (
          <path d="M16 9l-3 3 3 3" strokeWidth="1.5" />
        )
      )}
    </svg>
  )


  return (
    <aside className={`portal-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div
        className="sidebar-brand"
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => {
          setIsHeaderHovered(false)
          setIsBtnHovered(false)
        }}
      >
        {isCollapsed ? (
          // Collapsed state: Hovering over the brand section swaps the Looker logo with the collapse button
          <div className="sidebar-toggle-wrapper">
            <button
              className="sidebar-toggle-widget-btn"
              onClick={() => setIsCollapsed(false)}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              aria-label="Expand sidebar"
            >
              {isHeaderHovered ? (
                <ToggleIcon collapsed={true} hovered={isBtnHovered} />
              ) : (
                <div className="brand-logo-wrapper">
                  <LookerLogo />
                </div>
              )}
            </button>
            {isHeaderHovered && (
              <div className="sidebar-tooltip">
                Expand sidebar
              </div>
            )}
          </div>
        ) : (
          // Expanded state: Brand logo & text on the left, collapse button on the right
          <>
            <div className="flex-row gap-3 flex-center">
              <div className="brand-logo-wrapper">
                <LookerLogo />
              </div>
              <span className="brand-name font-bold">Looker Embed</span>
            </div>

            <div className="sidebar-toggle-wrapper">
              <button
                className="sidebar-toggle-widget-btn"
                onClick={() => setIsCollapsed(true)}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                aria-label="Collapse sidebar"
              >
                <ToggleIcon collapsed={false} hovered={isBtnHovered} />
              </button>
              {isBtnHovered && (
                <div className="sidebar-tooltip">
                  Collapse sidebar
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {PORTAL_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName]
          const isGated = selectedType === 'simple' && GATED_ROUTES.includes(item.to)

          if (isGated) {
            return (
              <div
                key={item.to}
                className="nav-link gated"
                title={isCollapsed ? `${item.label} (Locked)` : undefined}
              >
                <div className="gated-content">
                  <span className="nav-icon-container" style={{ visibility: 'hidden' }}>
                    <Icon size={20} />
                  </span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </div>
                <span className="lock-overlay">
                  <Lock size={14} />
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'active' }}
              activeOptions={{ exact: item.exact }}
              className="nav-link"
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon-container">
                <Icon size={20} />
              </span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          )
        })}
      </nav>


      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-container">
          <div className="user-profile-wrapper" style={{ position: 'relative' }}>
            <button
              className="user-profile"
              onClick={() => setIsProfileModalOpen(true)}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
              aria-label="User details"
            >
              <div className="user-avatar">
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className="user-details">
                  <span className="user-name">{DEFAULT_USER_NAME}</span>
                  <span className="user-role">{USER_ROLE_MAPPINGS[selectedType]}</span>
                </div>
              )}
            </button>
            {isProfileHovered && (
              <div className="sidebar-tooltip profile-tooltip">
                User details
              </div>
            )}
          </div>

          <div className="footer-actions">
            <div className="footer-action-wrapper" style={{ position: 'relative' }}>
              <button
                className="footer-btn"
                onClick={toggleTheme}
                onMouseEnter={() => setIsThemeHovered(true)}
                onMouseLeave={() => setIsThemeHovered(false)}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {isThemeHovered && (
                <div className="sidebar-tooltip footer-tooltip">
                  {theme === 'light' ? 'Dark theme' : 'Light theme'}
                </div>
              )}
            </div>

            <div className="footer-action-wrapper" style={{ position: 'relative' }}>
              <button
                className="footer-btn"
                onClick={() => setIsSettingsOpen(true)}
                onMouseEnter={() => setIsSettingsHovered(true)}
                onMouseLeave={() => setIsSettingsHovered(false)}
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>
              {isSettingsHovered && (
                <div className="sidebar-tooltip footer-tooltip">
                  Settings
                </div>
              )}
            </div>

            <div className="footer-action-wrapper" style={{ position: 'relative' }}>
              <button
                className="footer-btn"
                onClick={handleLogout}
                onMouseEnter={() => setIsLogoutHovered(true)}
                onMouseLeave={() => setIsLogoutHovered(false)}
                aria-label="Log Out"
              >
                <LogOut size={16} className="text-error" />
              </button>
              {isLogoutHovered && (
                <div className="sidebar-tooltip footer-tooltip">
                  Log Out
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
