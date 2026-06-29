import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { Looker40SDK } from '@looker/sdk'
import { usePortal } from '../context/PortalContext'

export function useKpiQuery(
  queryId: string,
  authTrigger: number,
  lookerBrowserSdk: Looker40SDK | null,
  formatter?: (val: any) => string
) {
  const { connectionState, language, brand } = usePortal()
  const isWarmbooting = !lookerBrowserSdk || connectionState !== 'connected'

  const query = useQuery({
    queryKey: ['looker-kpi', queryId, authTrigger, connectionState, brand, language],
    queryFn: async () => {
      if (!lookerBrowserSdk) return null

      const response = await lookerBrowserSdk.ok(
        lookerBrowserSdk.run_query({
          query_id: queryId,
          result_format: 'json',
          apply_formatting: true,
          limit: 1,
          cache: false
        })
      )

      if (Array.isArray(response) && response.length > 0) {
        const row = response[0]
        const rawVal = Object.values(row).find(
          (v) => typeof v === 'string'
        )
        if (rawVal !== undefined) {
          return rawVal
        }
        return 'N/A'
      }
      return '0'
    },
    enabled: !isWarmbooting,
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    isLoading: (query.isLoading || isWarmbooting) && query.data === undefined,
    isWarmbooting,
  }
}
