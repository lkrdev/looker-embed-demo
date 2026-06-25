---
name: customize-frontend-branding
description: Guidelines and instructions for customizing application header titles, brand names, navigation breadcrumbs, and SVG or image logos in the Looker Embed Portal.
---

# Looker Embed Portal - Customizing Header & Branding

This skill provides step-by-step instructions for customizing the application name, header breadcrumbs, tooltips, and logo components (SVG or image assets).

---

## 1. Customizing Brand Name & Header ([Sidebar.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/layout/Sidebar.tsx))

The primary brand header is rendered at the top of the sidebar in [Sidebar.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/layout/Sidebar.tsx#L91-L148).

### Modifying Brand Name
Locate line 129 in `Sidebar.tsx`:
```tsx
<span className="brand-name font-bold">Looker Embed</span>
```
Change `"Looker Embed"` to your desired brand or application name (e.g. `"Levi's Portal"`, `"Acme Analytics"`).

---

## 2. Customizing Workspace Navbar Header ([Navbar.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/layout/Navbar.tsx))

The top navigation bar displays the workspace root name and dynamic route breadcrumb in [Navbar.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/layout/Navbar.tsx#L14-L20).

### Modifying Root Breadcrumb Label
Locate line 16 in `Navbar.tsx`:
```tsx
<span className="breadcrumb-root">Portal</span>
```
Change `"Portal"` to your custom root identifier.

### Modifying Route Breadcrumb Mappings
To customize route titles shown in the navbar, update `ROUTE_BREADCRUMB_MAPPINGS` in [constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts#L177-L185):
```typescript
export const ROUTE_BREADCRUMB_MAPPINGS: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Executive Overview",
  "/conversational-analytics": "AI Assistant",
  "/agents": "Custom Agents",
  "/explore": "Data Explorer",
  "/report-builder": "Report Builder",
};
```

---

## 3. Customizing Application Logo ([LookerLogo.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/layout/LookerLogo.tsx))

The `<LookerLogo />` component renders the brand icon used in both expanded and collapsed sidebar states.

### Pattern A: Custom Inline SVG
Replace the SVG `<path d="..." />` inside `LookerLogo.tsx` with your custom vector path:
```tsx
export function LookerLogo({ className = '', ...props }: LookerLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`looker-logo-icon ${className}`.trim()}
      fill="currentColor"
      width={24}
      height={24}
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10..." />
    </svg>
  );
}
```

### Pattern B: Custom Image Asset (PNG / SVG / WebP)
1. Place your logo image asset (e.g. `brand-logo.png` or `brand-logo.svg`) inside `frontend/public/`.
2. Update `LookerLogo.tsx` to render an `<img>` tag:
```tsx
export function LookerLogo({ className = '', ...props }: LookerLogoProps) {
  return (
    <img
      src="/brand-logo.png"
      alt="Brand Logo"
      className={`looker-logo-icon ${className}`.trim()}
      width={24}
      height={24}
      {...props}
    />
  );
}
```

---

## 4. Verification Step

After updating header text or logo components:
1. Ensure valid JSX and proper image path referencing.
2. Run `pnpm run build` in `frontend/` to verify zero build or TypeScript errors.
