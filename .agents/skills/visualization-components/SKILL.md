---
name: visualization-components
description: This skill enables agents to assist users in building custom, high-performance data experiences using Looker's React-based visualization components.
---

# Looker Visualization Components

This skill enables agents to assist users in building custom, high-performance data experiences using Looker's React-based visualization components.

## Overview
Looker Visualization Components offer a suite of React primitives to render Looker charts client-side. Unlike iframe-based embedding, these components offer:
- **Performance**: No iframe overhead; faster rendering and interactions.
- **Customization**: Deep control over chart configuration and the ability to swap default charts with custom React components.
- **Seamless Integration**: Fully integrates with Looker's design system (`@looker/components`).

## 1. Installation
Install the core library along with its peer dependencies.

```bash
npm install @looker/visualizations @looker/components-data @looker/components @looker/sdk styled-components react react-dom
```

## 2. Core Architecture
The system relies on a data-loading layer and a rendering layer.

- **`DataProvider`**: Context provider that supplies an authenticated Looker SDK instance.
- **`Query`**: Handles data fetching. Supports fetching by `query` (ID or slug) or `dashboard` ID.
- **`Visualization`**: Renders the chart using metadata returned by the query.

## 3. Basic Usage
Wrap your application in `DataProvider` and use `Query` to fetch data.

```tsx
import { Looker40SDK } from '@looker/sdk'
import { DataProvider } from '@looker/components-data'
import { Query, Visualization } from '@looker/visualizations'

const sdk = new Looker40SDK(authSession)

export const AnalyticsDashboard = () => (
  <DataProvider sdk={sdk}>
    {/* Fetch by Query Slug */}
    <Query query="evomfl66xHx1jZk2Hzvv1R">
      <Visualization />
    </Query>

    {/* Fetch by Dashboard ID (fetches the first query on the dashboard) */}
    <Query dashboard="123">
      <Visualization config={{ type: 'area' }} />
    </Query>
  </DataProvider>
)
```

## 4. Internationalization (i18n)
Localization must be initialized once at the application root.

```tsx
import { i18nInit, frFR } from '@looker/visualizations'

// Initialize with a specific locale
i18nInit(frFR)
```

## 5. Customization & Overrides

### Chart Type Overrides
Force a specific chart type regardless of the Looker-saved configuration.
```tsx
<Visualization config={{ type: 'sparkline', series: [{ color: '#2196f3' }] }} />
```

### Custom Component Mapping
Replace a standard chart type with your own implementation using `chartTypeMap`.
```tsx
const CustomTable = ({ data, fields }) => {
  return <table>...</table>
}

<Visualization chartTypeMap={{ table: CustomTable }} />
```

### Supported Types
- `line`, `area`, `scatter`, `sparkline`
- `bar`, `column`
- `pie`
- `table` (Standard and Pivot support)
- `single_value`

## 6. Advanced Patterns
- **Data Transformations**: The `Query` component automatically applies transformations like `sortByDateTime`, `nullValueZero`, and `xAxisReversed`.
- **Manual Data Handling**: For full control, you can use hooks from `@looker/components-data` (e.g., `useQueryData`, `useVisConfig`) directly instead of the `Query` component.
- **Extension Framework**: When used inside a Looker Extension, the SDK is typically provided via `ExtensionContext`.

## 7. Troubleshooting
- **Theme Errors**: Visualization components require a `ThemeProvider`. If not provided by the app, they will automatically wrap themselves in a `ComponentsProvider` (Looker's default theme).
- **Date Measures**: Measures of type `date` are currently not supported in standard visualization components.
- **Missing Peer Deps**: Ensure `styled-components` version is `^5.3.1` or higher to avoid context mismatches.
