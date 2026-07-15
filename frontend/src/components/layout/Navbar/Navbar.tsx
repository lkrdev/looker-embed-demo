import { useRouterState } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { ROUTE_BREADCRUMB_MAPPINGS } from '../../../config/constants'
import { Navbar as NavbarText } from '../../../config/Navbar'
import type { NavbarProps } from '../../../types'
import styles from './Navbar.module.css'

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
    <header className={`${styles.portalNavbar} portal-navbar`}>
      <div className={styles.navbarBreadcrumb}>
        <span className={styles.breadcrumbRoot}>{i18n._(NavbarText.PORTAL)}</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className="breadcrumb-current text-primary font-medium">{getBreadcrumb()}</span>
      </div>
    </header>
  )
}
