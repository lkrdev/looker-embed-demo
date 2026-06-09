import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Settings, Check } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'
import { usePortal } from '../context/PortalContext'

interface NavbarProps {
}

export function Navbar({}: NavbarProps) {
  const { theme, toggleTheme, selectedType, setEmbedType } = usePortal()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])


  // Reactive subscription to path changes for correct dynamic breadcrumb
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  })

  const getBreadcrumb = () => {
    switch (currentPath) {
      case '/':
        return 'Home'
      case '/dashboard':
        return 'Dashboard'
      case '/chat':
        return 'Chat Assistant'
      case '/explore':
        return 'Query Explorer'
      case '/report-builder':
        return 'Report Builder'
      default:
        return 'Workspace'
    }
  }

  return (
    <header className="portal-navbar">
      <div className="navbar-breadcrumb">
        <span className="breadcrumb-root">Portal</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current text-primary font-medium">{getBreadcrumb()}</span>
      </div>

      <div className="navbar-actions">
        {/* Theme Toggle */}
        <button
          className="navbar-btn-icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Settings Dropdown Container */}
        <div className="navbar-settings-container" ref={dropdownRef}>
          <button
            className={`navbar-btn-icon ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          {isDropdownOpen && (
            <div className="settings-dropdown">
              <div className="dropdown-header">Embed User Profile</div>
              
              <button
                className="dropdown-item"
                onClick={() => {
                  setEmbedType('simple')
                  setIsDropdownOpen(false)
                }}
              >
                <div className="dropdown-item-title">
                  <span>Simple Embed User</span>
                  {selectedType === 'simple' && <Check size={14} className="text-primary" />}
                </div>
                <div className="dropdown-item-desc">
                  View and query metrics with standard dashboard interaction levels.
                </div>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setEmbedType('advanced')
                  setIsDropdownOpen(false)
                }}
              >
                <div className="dropdown-item-title">
                  <span>Advanced Embed User</span>
                  {selectedType === 'advanced' && <Check size={14} className="text-primary" />}
                </div>
                <div className="dropdown-item-desc">
                  Create, customize layouts, perform drill downs and save agent templates.
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}


