import { useRouterState } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { ROUTE_BREADCRUMB_MAPPINGS } from '../../config/constants'
import { Navbar as NavbarText } from '../../config/Navbar'
import type { NavbarProps } from '../../types'

export function Navbar({}: NavbarProps) {
  const { i18n } = useLingui()
  // Reactive subscription to path changes for correct dynamic breadcrumb
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  })

  const getBreadcrumb = () => {
    const item = ROUTE_BREADCRUMB_MAPPINGS[currentPath]
    return item ? (typeof item === 'string' ? item : i18n._(item)) : i18n._(NavbarText.WORKSPACE)
  }

  return (
    <header className="portal-navbar">
      <div className="navbar-breadcrumb">
        <span className="breadcrumb-root">{i18n._(NavbarText.PORTAL)}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current text-primary font-medium">{getBreadcrumb()}</span>
      </div>
    </header>
  )
}
