import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
// import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Link,
  Outlet,
  createRootRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import {
  GlobalLookerContainer,
  Navbar,
  SettingsDialog,
  Sidebar,
  UserDetailsDialog,
} from "../components";
import { isRouteGated, LOOKER_ROUTES } from "../config/constants";
import { PortalProvider, usePortal } from "../context/PortalContext";
import { LinguiPortalProvider } from "../context/LinguiProvider";
import { isAuthenticated } from "../utils/auth";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated() && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
  },
  shellComponent: RootDocument,
  component: RootLayout,
  errorComponent: ({ error, reset }) => {
    return (
      <div
        className="error-container flex-col items-center justify-center p-8 text-center min-h-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          gap: "16px",
          padding: "32px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--error)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          Application Error
        </h2>
        <p style={{ color: "var(--secondary)", maxWidth: "480px", margin: 0 }}>
          An unexpected error occurred while rendering this page.
        </p>
        <pre
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            color: "var(--error)",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            maxWidth: "600px",
            overflowX: "auto",
            margin: "4px 0",
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={reset}
            className="btn btn-secondary rounded-full font-bold"
            style={{
              padding: "8px 20px",
              borderRadius: "24px",
              cursor: "pointer",
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            }}
          >
            Try Again
          </button>
          <Link
            to="/"
            className="btn btn-primary rounded-full font-bold"
            style={{
              padding: "8px 20px",
              borderRadius: "24px",
              backgroundColor: "var(--primary)",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  },
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

export const globalQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours offline cache retention
      refetchOnWindowFocus: false,
      retry: 1,
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
      {/* <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      /> */}
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
        <LinguiPortalProvider>
          <PortalLayoutContent />
        </LinguiPortalProvider>
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
  const isDenied = isRouteGated(currentPath, selectedType);

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
