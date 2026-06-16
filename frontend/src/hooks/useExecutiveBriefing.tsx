import * as React from 'react'
import type { StrategicInsight } from '../types'

export function useExecutiveBriefing(brand: string) {
  const insights: StrategicInsight[] = React.useMemo(
    () => [
      {
        id: 'demand-surge',
        title: 'Demand Surge Detected',
        iconName: 'Lightbulb',
        variant: 'warning',
        description: (b: string) => (
          <>
            Core outerwear and thermal SKUs for <b>{b}</b> are experiencing a 28%
            increase in organic cart additions over the past 4 hours.
          </>
        ),
      },
      {
        id: 'margin-yield',
        title: 'Margin Yield Optimization',
        iconName: 'TrendingUp',
        variant: 'success',
        description: () =>
          'Recommend reducing promotional discounting by 4.5% on top-tier inventory items to capture an estimated $42.5K in incremental margin.',
      },
      {
        id: 'ad-shift',
        title: 'Ad Allocation Shift',
        iconName: 'Target',
        variant: 'accent',
        description: () =>
          'Reallocate top-of-funnel ad spend toward high-converting cross-sell bundles (Fleece Jackets + Knit Beanies) for maximum ROI.',
      },
    ],
    []
  )

  const applyAllRules = React.useCallback(() => {
    alert(
      `Applied optimal dynamic pricing and ad rules for ${brand}. Synchronizing with Looker database...`
    )
  }, [brand])

  return {
    insights,
    applyAllRules,
  }
}
