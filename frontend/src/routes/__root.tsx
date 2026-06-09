import { HeadContent, Scripts, createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'
import { PortalProvider, usePortal } from '../context/PortalContext'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Looker Embed Portal',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/looker.svg',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
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


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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
    </div>
  )
}


