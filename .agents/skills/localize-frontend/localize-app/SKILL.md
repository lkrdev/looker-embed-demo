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

## 5. The 3-Step Localization Lifecycle & Build Pipeline

React Lingui does **not** automatically translate text. It is purely an extraction and compilation framework. Before committing code or deploying the application to production, you **MUST** follow this exact 3-step lifecycle flow:

### Step 1: Extraction (`pnpm extract`)
Lingui scans the AST of your JavaScript/TypeScript codebase for macros (`msg\`...\``, `i18n._(...)`). It extracts newly added English message IDs and writes them into language catalog files (`.po` files) with blank target translation strings (`msgstr ""`):
```bash
pnpm extract
```

### Step 2: Translation (Manual, Service, or Script)
Before compiling, empty `msgstr ""` entries in the target locale catalogs (`src/locales/{es,fr,de}/messages.po`) must be populated with translated text. This can happen via:
- **Human Translators:** Editing `.po` files manually or using tools like Poedit.
- **Translation Management Services (TMS):** Platforms like Crowdin, Phrase, or Lokalise that sync with GitHub repositories.
- **Automated AI Scripts:** Custom automation scripts that translate and inject strings into `.po` files.

### Step 3: Compilation (`pnpm compile`)
Once `.po` catalogs are populated with translations, Lingui compiles them into lightweight runtime ES modules (`messages.mjs`) for browser consumption:
```bash
pnpm compile
```

> [!TIP]
> **CI/CD Best Practice:** While checked-in `messages.mjs` files will be bundled by `vite build`, it is recommended to automate compilation prior to bundling in `package.json` (`"build": "lingui compile --namespace es && vite build"`). This guarantees production builds always reflect the latest `.po` translations.

