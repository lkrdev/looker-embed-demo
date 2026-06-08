import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Home,
  LayoutDashboard,
  MessageSquare,
  Compass,
  FileSpreadsheet,
  User
} from 'lucide-react'
import { LookerLogo } from './LookerLogo'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const [isBtnHovered, setIsBtnHovered] = useState(false)

  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'Chat Assistant', icon: MessageSquare },
    { to: '/explore', label: 'Query Explorer', icon: Compass },
    { to: '/report-builder', label: 'Report Builder', icon: FileSpreadsheet },
  ]

  // Toggle Widget Icon Component (Gemini style)
  const ToggleIcon = ({ collapsed, hovered }: { collapsed: boolean; hovered: boolean }) => (
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
        {navItems.map((item) => {
          const Icon = item.icon
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
        <div className="user-profile">
          <div className="user-avatar">
            <User size={18} />
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <span className="user-name">Alex Rivera</span>
              <span className="user-role">Administrator</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
