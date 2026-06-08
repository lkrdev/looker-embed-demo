import { useState, useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load sidebar collapsed state from localStorage on mount
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebar_collapsed') === 'true'
    setIsCollapsed(collapsed)
  }, [])

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }

  return (
    <div className={`portal-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={handleSetCollapsed} />
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
