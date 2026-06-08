---
name: customize-design-theme
description: Guidelines and instructions for customizing the CSS theme system and using/extending the component system in the Looker Embed Portal.
---

# Looker Embed Portal - Customizing Design & Theme

This skill provides step-by-step instructions and references for changing the look and feel of the Looker Embed Portal, configuring color systems, modifying CSS theme variables, and using or extending the core layout components.

---

## 1. Theme Configuration & Custom CSS Variables

All styling, branding, and layouts are centralized inside [styles.css](frontend/src/styles.css) using CSS custom properties (variables).

To customize the branding, typography, spacing, or colors, modify the corresponding variables defined under the `:root` selector.

### Colors (HSL-based Palette)

Colors are structured with a **raw HSL definition** (`--color-name-raw`) and a **computed variable** (`--color-name`). This dual-variable setup allows opacity manipulation using standard CSS `rgba()` or `color-mix()` when needed.

Example layout in `:root`:

```css
/* Color Raw Definitions (Light Mode default) */
--color-primary-raw: 217, 89%, 43%; /* Google Blue #0b57d0 */
--color-primary-hover-raw: 217, 89%, 33%; /* Google Dark Blue #0842a0 */
--color-primary-light-raw:
  217, 90%, 91%; /* Light Blue Active background #d3e3fd */

/* Computed HSL Colors */
--primary: hsl(var(--color-primary-raw));
--primary-hover: hsl(var(--color-primary-hover-raw));
--primary-light: hsl(var(--color-primary-light-raw));
```

To swap color themes (e.g. from Google Blue to looker purple, or warm slate):

1. Locate the brand colors section under `:root` in [styles.css](frontend/src/styles.css).
2. Change the raw values for `--color-primary-raw`, `--color-accent-raw`, etc.
3. Keep semantic colors (like `--color-success-raw` or `--color-error-raw`) in sync to match contrast requirements.

### Dark Mode

Dark mode is activated when the `.dark` class is present on the HTML root element (`document.documentElement`), or via system preference media queries.
Variables that change per theme are overridden in the `@media (prefers-color-scheme: dark)` blocks and inside `html.dark`.

To customize the dark mode theme:

1. Modify values inside `html.dark` or `@media (prefers-color-scheme: dark)` in [styles.css](frontend/src/styles.css).
2. Ensure high contrast levels are maintained against dark background surfaces (`--color-background-raw: 240, 3%, 8%`).

### Spacing System

Spacing is built on a standard 4px block scale. Do not hardcode margins, heights, or paddings. Use the variables instead:

- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-4`: `1rem` (16px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2rem` (32px)
- `--space-10`: `2.5rem` (40px)
- `--space-12`: `3rem` (48px)

---

## 2. Component System Usage & Extensions

Components are imported from the central exports file: `@/components` or relative `../components` paths.
All custom components support standard element properties (such as `className`, `onClick`, `style`, etc.) via prop forwarding, enabling clean style overrides.

### Card Component

Use for layout cards, panels, or content segments.

- **Props**:
  - `variant`: `'default' | 'hoverable' | 'glass'`
    - `default`: subtle border and drop shadow.
    - `hoverable`: lifts and changes border/shadow depth on hover.
    - `glass`: uses glassmorphic opacity and backdrop blur.
  - Extends standard `React.HTMLAttributes<HTMLDivElement>`.
- **Usage Example**:

  ```tsx
  import { Card } from "@/components";

  export function CustomPanel() {
    return (
      <Card variant="glass" className="my-custom-margin shadow-xl">
        <h3>Panel Title</h3>
        <p>Content goes here...</p>
      </Card>
    );
  }
  ```

### PageHeader Component

Use at the top of route views to supply breadcrumbs, page headers, action buttons, and subtitles consistently.

- **Props**:
  - `title`: `React.ReactNode`
  - `subtitle`?: `React.ReactNode`
  - `actions`?: `React.ReactNode`
  - `border`?: `boolean` (adds/removes the bottom separator line, defaults to `true`)
- **Usage Example**:

  ```tsx
  import { PageHeader } from "@/components";
  import { EditButton } from "./EditButton";

  export function DashboardHeader() {
    return (
      <PageHeader
        title="Analytical Reports"
        subtitle="Manage embed instances and configure views."
        actions={<EditButton />}
      />
    );
  }
  ```

### EmbedPlaceholder Component

Provides a clean, dashed skeleton placeholder designed to represent pending iFrames, dashboard templates, or missing embeds.

- **Props**:
  - `title`?: `React.ReactNode` (defaults to `"Add iFrame"`)
  - Extends standard `React.HTMLAttributes<HTMLDivElement>`.
- **Usage Example**:

  ```tsx
  import { EmbedPlaceholder } from "@/components";

  export function ChatEmbed() {
    return (
      <EmbedPlaceholder
        title="Connecting to Looker Assistant..."
        className="custom-height"
      />
    );
  }
  ```

### HeroBanner Component

Large banner component used for greetings, marketing, or highlight notifications.

- **Props**:
  - `title`: `React.ReactNode`
  - `subtitle`?: `React.ReactNode`
  - `badgeText`?: `string`
  - `badgeIcon`?: Lucide/React icon component
  - `actions`?: `React.ReactNode`
  - `decoration`?: `React.ReactNode` (rendered on the right side)
- **Usage Example**:

  ```tsx
  import { HeroBanner } from "@/components";
  import { Sparkles } from "lucide-react";

  export function HomeBanner() {
    return (
      <HeroBanner
        title="Welcome Back"
        subtitle="Explore Looker analytics dashboards."
        badgeText="V2.0 Active"
        badgeIcon={Sparkles}
      />
    );
  }
  ```

### AppCard Component

Shortcuts linking to primary applications with dynamic Lucide Icons and colors.

- **Props**:
  - `to`: string
  - `title`: `React.ReactNode`
  - `description`?: `React.ReactNode`
  - `icon`: React component
  - `iconColor`?: string (CSS class name for icon color, defaults to `text-primary`)
  - `iconBgColor`?: string (CSS class name for icon background, defaults to `bg-primary-light`)

---

## 3. Best Practices for Design Customization

When styling new components or customizing the theme, follow these staff guidelines:

1. **Avoid Hardcoded Style Helpers**: Do not use ad-hoc background colors or margins. Always reference CSS variables (`var(--primary)`, `var(--space-4)`).
2. **Support Dark Mode Out of the Box**: Ensure that any text/color overrides are checked against dark mode to avoid unreadable text overlay contrast.
3. **Propagate Class Names**: When creating a component, make sure it extends standard HTML elements and spreads `className` using template literals:
   ```tsx
   className={`component-base ${className}`}
   ```
4. **Export from index.ts**: Whenever a new component is defined, add it to [components/index.ts](frontend/src/components/index.ts) to maintain a single modular entry point.
