import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Sidebar, Navbar, SettingsDialog, UserDetailsDialog } from '../components'
import { PortalProvider, usePortal } from '../context/PortalContext'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div className="flex-center flex-col gap-4" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto var(--space-6) auto' }}>
          The page or asset you are trying to access doesn't exist in the portal.
        </p>
        <Link to="/" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)' }}>
          Back to Home
        </Link>
      </div>
    )
  }
})

function RootComponent() {
  return (
    <>
      <PortalProvider>
        <PortalLayoutContent />
      </PortalProvider>
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
    </>
  )
}

function PortalLayoutContent() {
  const { isCollapsed } = usePortal()

  return (
    <div className={`portal-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <div className="portal-main">
        <Navbar />
        <main className="portal-content">
          <div className="portal-pane">
            <Outlet />
          </div>
        </main>
      </div>
      <SettingsDialog />
      <UserDetailsDialog />
    </div>
  )
}
