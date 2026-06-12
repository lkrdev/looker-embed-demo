import { useRouterState } from '@tanstack/react-router'
import { ROUTE_BREADCRUMB_MAPPINGS } from '../../config/constants'
import type { NavbarProps } from '../../types'

export function Navbar({}: NavbarProps) {
  // Reactive subscription to path changes for correct dynamic breadcrumb
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  })

  const getBreadcrumb = () => ROUTE_BREADCRUMB_MAPPINGS[currentPath] || 'Workspace'

  return (
    <header className="portal-navbar">
      <div className="navbar-breadcrumb">
        <span className="breadcrumb-root">Portal</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current text-primary font-medium">{getBreadcrumb()}</span>
      </div>
    </header>
  )
}
