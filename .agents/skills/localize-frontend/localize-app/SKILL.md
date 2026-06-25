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

## 2. Abstraction into Configuration Constants (`src/config/*.ts`)

To maintain a clean separation of concerns and ensure all text content is central and maintainable, hardcoded UI strings (titles, labels, option descriptions, hints, error messages) should be abstracted out of React components and placed into dedicated configuration constants files in `frontend/src/config/`.

1. **File Naming & Aliasing**: Create a separate TypeScript constants file aliased by the component name (e.g., `SettingsDialog.ts` for `SettingsDialog.tsx`, `AccessDenied.ts` for `AccessDenied.tsx`). Re-export them from `frontend/src/config/index.ts`.
2. **Mandatory Lingui Core Macro**: To ensure Lingui CLI's AST scanner automatically discovers and extracts message descriptors when running `pnpm extract`, you **MUST** import `msg` from `@lingui/core/macro` and use tagged template literals (`msg\`...\``):

```typescript
import { msg } from "@lingui/core/macro";

export const SettingsDialog = {
  TITLE_MAIN: msg`Settings`,
  LABEL_USER_TYPE: msg`User Type`,
  OPT_SIMPLE_DESC: msg`View and query metrics with standard dashboard interaction levels.`,
};
```

> [!WARNING]
> Do **NOT** define custom helper functions like `const msg = (id: string) => ({ id, message: id })`. Lingui CLI AST extraction ignores custom functions and will fail to populate message keys in `.po` catalogs during `pnpm extract`.

## 3. Consuming Descriptors in UI Components

Inside functional React UI components, import `useLingui` from `@lingui/react` and import the component's aliased configuration constants. Evaluate message descriptors using `i18n._(...)`:

```tsx
import { useLingui } from "@lingui/react";
import { SettingsDialog as SettingsDialogText } from "../../config/SettingsDialog";

export function SettingsDialog() {
  const { i18n } = useLingui();
  
  // Helper for dynamic evaluation where properties may be static strings or descriptors
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));

  return (
    <div className="modal-header">
      <h2>{i18n._(SettingsDialogText.TITLE_MAIN)}</h2>
      <label>{i18n._(SettingsDialogText.LABEL_USER_TYPE)}</label>
    </div>
  );
}
```

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
