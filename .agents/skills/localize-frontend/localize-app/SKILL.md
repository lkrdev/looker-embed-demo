---
name: localize-app
description: Step-by-step instructions and best practices for localizing the React frontend application using React Lingui v6, managing constant string catalogs, and executing required build commands.
---

# Frontend Application Localization (React Lingui v6)

This skill outlines the architectural standards and development workflow for internationalizing the frontend React application using **React Lingui v6** and `pnpm`.

## 1. Core Architecture & Configuration

The application uses macro-based compile-time message extraction to maintain zero runtime bundle overhead.

### Configuration (`lingui.config.ts`)
The root configuration specifies supported locales (`en`, `es`, `fr`, `de`) and uses the modern `@lingui/format-po` formatter:

```typescript
import type { LinguiConfig } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

const config: LinguiConfig = {
  locales: ["en", "es", "fr", "de"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["<rootDir>/src"],
    },
  ],
  format: formatter(),
};

export default config;
```

### Vite Integration (`vite.config.ts`)
Vite must be configured with Lingui's plugin and Babel macro support:

```typescript
import { lingui } from "@lingui/vite-plugin";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    viteReact({ babel: { plugins: ["macros"] } }),
    lingui(),
  ],
});
```

## 2. Handling Strings in `constants.ts` (Static Descriptors)

Standard React hooks (`useLingui`) **cannot** be called outside functional components. For navigation menus, breadcrumbs, or role mappings exported from `constants.ts`, define simple helper functions or message descriptors:

```typescript
const desc = (id: string) => ({ id, message: id });

export const PORTAL_NAV_ITEMS = [
  { to: "/", label: desc("Home"), iconName: "Home" },
  { to: "/dashboard", label: desc("Dashboard"), iconName: "LayoutDashboard" },
];
```

This avoids any need for Babel macros while deferring evaluation until rendering.

## 3. Consuming Descriptors in UI Components

Inside UI layout components (like `Sidebar.tsx` or `Navbar.tsx`), use the `useLingui` hook to evaluate the descriptor or string key against the active language catalog:

```tsx
import { useLingui } from "@lingui/react";

export function Sidebar() {
  const { i18n } = useLingui();
  
  // Helper to handle both static strings and Lingui descriptors
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));

  return (
    <nav>
      {PORTAL_NAV_ITEMS.map((item) => (
        <span key={item.to}>{getLabel(item.label)}</span>
      ))}
    </nav>
  );
}
```

For standard headings or labels, call `i18n._('String Key')` directly inside the component.

## 4. Dynamic Catalog Loading (`LinguiProvider.tsx`)

The app listens to user language preference changes via `PortalContext` and dynamically imports compiled ES module catalogs (`messages.mjs`):

```tsx
useEffect(() => {
  async function loadCatalog() {
    const catalog = await import(`../locales/${localeCode}/messages.mjs`);
    i18n.load(localeCode, catalog.messages);
    i18n.activate(localeCode);
  }
  loadCatalog();
}, [localeCode]);
```

## 5. Mandatory `pnpm` Build Commands Before Deployment

Before committing code or deploying the frontend application to production, you **MUST** run the Lingui extraction and compilation pipeline using `pnpm`:

```bash
# 1. Extract message keys from source code into .po files
pnpm extract

# 2. Compile .po message files into runtime ES modules (messages.mjs)
pnpm compile
```

If new strings are added to the codebase without running `pnpm extract` and `pnpm compile`, runtime translation lookups will fail or fall back to missing message IDs.
