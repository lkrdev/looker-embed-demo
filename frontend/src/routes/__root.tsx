import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Link,
  Outlet,
  createRootRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import {
  GlobalLookerContainer,
  Navbar,
  SettingsDialog,
  Sidebar,
  UserDetailsDialog,
} from "../components";
import { GATED_ROUTES, LOOKER_ROUTES } from "../config/constants";
import { PortalProvider, usePortal } from "../context/PortalContext";
import { isAuthenticated } from "../utils/auth";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated() && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
  },
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: () => {
    return (
      <div className="not-found-container">
        <h2 className="text-3xl mb-2">Page Not Found</h2>
        <p className="text-muted not-found-desc">
          The page or asset you are trying to access doesn't exist in the
          portal.
        </p>
        <Link to="/" className="btn btn-primary rounded-full">
          Back to Home
        </Link>
      </div>
    );
  },
});

const globalQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours offline cache retention
    },
  },
});

const asyncStorage = {
  getItem: async (key: string) => window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => window.localStorage.removeItem(key),
};

const localStoragePersister = createAsyncStoragePersister({
  storage: asyncStorage,
  key: "TANSTACK_QUERY_GLOBAL_OFFLINE_CACHE",
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={globalQueryClient}
      persistOptions={{ persister: localStoragePersister }}
    >
      <PortalProvider>
        <PortalLayoutContent />
      </PortalProvider>
    </PersistQueryClientProvider>
  );
}

function PortalLayoutContent() {
  const { isCollapsed, selectedType } = usePortal();

  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });

  // List of paths that require the Looker iframe
  const isLookerRoute = LOOKER_ROUTES.includes(currentPath);

  // Access check matching page permissions
  const isSimpleUser = selectedType === "simple";
  const isDenied = isSimpleUser && GATED_ROUTES.includes(currentPath);

  // We only show Looker iframe if it's a Looker route and user is NOT denied access
  const showLookerIFrame = isLookerRoute && !isDenied;

  if (currentPath === "/login") {
    return (
      <main
        className="portal-content"
        style={{ padding: 0, margin: 0, overflow: "hidden" }}
      >
        <Outlet />
      </main>
    );
  }

  return (
    <div className={`portal-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar />
      <div className="portal-main">
        <Navbar />
        <main className="portal-content">
          <div className="portal-pane" style={{ position: "relative" }}>
            <Outlet />

            {/* Persistent Looker IFrame */}
            <GlobalLookerContainer
              isVisible={showLookerIFrame}
              currentRoute={currentPath}
            />
          </div>
        </main>
      </div>
      <SettingsDialog />
      <UserDetailsDialog />
    </div>
  );
}
