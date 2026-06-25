---
name: localize-frontend-cleanup
description: Systematic workflow and cleanup skill for auditing React UI components, extracting hardcoded strings into relevant aliased config constant files, and triggering the localization extraction and compilation pipeline.
---

# Frontend Localization Cleanup Workflow

This skill defines the systematic process for scanning UI components, abstracting hardcoded strings into config constants files, and synchronizing multilingual catalogs. Use this skill when auditing components or onboarding new frontend pages to localization.

## 1. Component Audit & String Identification
Search the target React UI component (`.tsx` / `.jsx`) for any hardcoded human-readable strings, including:
- Page headings (`<h1>`, `<h2>`, `<h3>`), section titles, and subtitle banners.
- Button labels, tooltips (`title` attribute), aria-labels, and input placeholder text.
- Modal dialog prompts, confirmation warnings, and empty/error fallback messages.
- Static arrays or mapping definitions for tabs, breadcrumbs, or status badges.

## 2. Config Constant Creation & Aliasing
For each audited component:
1. Check if a configuration file exists in `frontend/src/config/` bearing the component's exact name (e.g., `frontend/src/config/MyComponent.ts` for `MyComponent.tsx`). If not, create it.
2. Import Lingui core macro at the top of the file:
   ```typescript
   import { msg } from "@lingui/core/macro";
   ```
3. Export an object aliased by the component name containing message descriptors created with tagged template literals (`msg\`...\``):
   ```typescript
   export const MyComponent = {
     TITLE: msg`My Component Title`,
     SUBTITLE: msg`Welcome to the module`,
     ACTION_BTN: msg`Submit Data`,
   };
   ```
4. Ensure the new constant is exported in `frontend/src/config/index.ts`.

> [!CRITICAL]
> Always use `import { msg } from "@lingui/core/macro"` and `msg\`...\``. Do NOT use custom wrappers or normal function calls, as Lingui CLI's AST scanner requires explicit macro literals to extract keys during `pnpm extract`.

## 3. Wiring Descriptors in React Components
Refactor the React component to consume the newly created descriptors:
1. Import `useLingui` from `@lingui/react` and import the aliased config object:
   ```tsx
   import { useLingui } from "@lingui/react";
   import { MyComponent as MyComponentText } from "../../config/MyComponent";
   ```
2. Initialize `const { i18n } = useLingui()` inside the functional component.
3. Replace all hardcoded strings with `i18n._(MyComponentText.KEY)`. For dynamic properties or union types, use a helper:
   ```tsx
   const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));
   ```

## 4. Triggering the Localization Pipeline
Once strings have been moved out of components into config files and wired up:
1. **Extract Message Keys**: Open a terminal in `frontend/` and run Lingui extraction to scan the AST and populate `.po` catalogs:
   ```bash
   pnpm extract
   ```
2. **Translate Missing Catalog Entries**: Check the catalog statistics output. If new strings were added, open the target locale files (`src/locales/{es,fr,de}/messages.po`) and populate translations for any entries where `msgstr ""` is empty.
3. **Compile Runtime Bundles**: Compile the `.po` files into production ES module bundles (`messages.mjs`):
   ```bash
   pnpm compile
   ```
4. **Verify Build Integrity**: Run a quick build verification to ensure no TypeScript or bundling errors were introduced:
   ```bash
   pnpm build
   ```
