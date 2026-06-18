import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StrategicInsight } from '../types'
import { usePortal } from '../context/PortalContext'

export function useExecutiveBriefing(brand: string) {
  const { lookerBrowserSdk, authTrigger, connectionState } = usePortal()

  const {
    data: insights = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['looker-executive-briefing', brand, authTrigger, connectionState],
    queryFn: async () => {
      if (!lookerBrowserSdk || !brand) return []

      const response = await lookerBrowserSdk.ok(
        lookerBrowserSdk.run_inline_query({
          result_format: 'json',
          body: {
            model: 'embed_demo',
            view: 'ai_executive_briefing',
            fields: [
              'ai_executive_briefing.insight_id',
              'ai_executive_briefing.insight_title',
              'ai_executive_briefing.insight_icon',
              'ai_executive_briefing.insight_variant',
              'ai_executive_briefing.insight_description',
            ],
            sorts: ['ai_executive_briefing.insight_id'],
            limit: '3',
          },
        })
      )

      if (Array.isArray(response) && response.length > 0) {
        return response.map((row: any): StrategicInsight => ({
          id: String(row['ai_executive_briefing.insight_id'] || Math.random()),
          title: String(row['ai_executive_briefing.insight_title'] || 'Strategic Insight'),
          iconName: (row['ai_executive_briefing.insight_icon'] || 'Lightbulb') as any,
          variant: (row['ai_executive_briefing.insight_variant'] || 'accent') as any,
          description: String(row['ai_executive_briefing.insight_description'] || 'No briefing details provided.'),
        }))
      }

      return []
    },
    enabled: !!lookerBrowserSdk && !!brand && connectionState === 'connected',
  })

  const applyAllRules = React.useCallback(() => {
    alert(
      `Applied optimal dynamic pricing and ad rules for ${brand}. Synchronizing with Looker database...`
    )
  }, [brand])

  return {
    insights,
    isLoading,
    error,
    applyAllRules,
  }
}
