import { HeadContent, Scripts, createRootRoute, Outlet, Link, useRouterState, ScriptOnce } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Sidebar, Navbar, SettingsDialog, UserDetailsDialog, GlobalLookerContainer } from '../components'
import { PortalProvider, usePortal } from '../context/PortalContext'
import { LOOKER_ROUTES, GATED_ROUTES } from '../config/constants'

export const Route = createRootRoute({
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: () => {
    return (
      <div className="not-found-container">
        <h2 className="text-3xl mb-2">Page Not Found</h2>
        <p className="text-muted not-found-desc">
          The page or asset you are trying to access doesn't exist in the portal.
        </p>
        <Link to="/" className="btn btn-primary rounded-full">
          Back to Home
        </Link>
      </div>
    )
  }
})


function RootDocument({ children }: { children: React.ReactNode }) {
  const themeScript = `
    (function() {
      try {
        var storedTheme = localStorage.getItem('theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var appliedTheme = storedTheme === 'dark' || (!storedTheme && prefersDark) ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', appliedTheme === 'dark');
      } catch (e) {}
    })()
  `

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <ScriptOnce>{themeScript}</ScriptOnce>
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  return (
    <PortalProvider>
      <PortalLayoutContent />
    </PortalProvider>
  )
}

function PortalLayoutContent() {
  const { isCollapsed, selectedType } = usePortal()

  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  })

  // List of paths that require the Looker iframe
  const isLookerRoute = LOOKER_ROUTES.includes(currentPath)

  // Access check matching page permissions
  const isSimpleUser = selectedType === 'simple'
  const isDenied = isSimpleUser && GATED_ROUTES.includes(currentPath)

  // We only show Looker iframe if it's a Looker route and user is NOT denied access
  const showLookerIFrame = isLookerRoute && !isDenied

  return (
    <div className={`portal-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <div className="portal-main">
        <Navbar />
        <main className="portal-content">
          <div className="portal-pane" style={{ position: 'relative' }}>
            <Outlet />

            {/* Persistent Looker IFrame */}
            <GlobalLookerContainer isVisible={showLookerIFrame} currentRoute={currentPath} />
          </div>
        </main>
      </div>
      <SettingsDialog />
      <UserDetailsDialog />
    </div>
  )
}
