import { useRouterState } from '@tanstack/react-router'

interface NavbarProps {}

export function Navbar({}: NavbarProps) {
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
      case '/conversational-analytics':
        return 'Conversational Analytics'
      case '/agents':
        return 'Agents'
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
    </header>
  )
}
