import { useEffect, useState } from 'react'
import { Sun, Moon, Settings } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'

interface NavbarProps {
}

export function Navbar({}: NavbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Initialize theme on mount
  useEffect(() => {
    // Check local storage or system preferences
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

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

        {/* Settings */}
        <button className="navbar-btn-icon" aria-label="Settings" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
