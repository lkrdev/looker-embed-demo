import { useQuery } from '@tanstack/react-query'
import type { Looker40SDK } from '@looker/sdk'
import { usePortal } from '../context/PortalContext'

export function useKpiQuery(
  queryId: string,
  authTrigger: number,
  lookerBrowserSdk: Looker40SDK | null,
  formatter?: (val: any) => string
) {
  const { connectionState } = usePortal()
  const isWarmbooting = !lookerBrowserSdk || connectionState !== 'connected'

  const query = useQuery({
    queryKey: ['looker-kpi', queryId, authTrigger, connectionState],
    queryFn: async () => {
      if (!lookerBrowserSdk) return null

      const response = await lookerBrowserSdk.ok(
        lookerBrowserSdk.run_query({
          query_id: queryId,
          result_format: 'json',
          limit: 1,
        })
      )

      if (Array.isArray(response) && response.length > 0) {
        const row = response[0]
        const rawVal = Object.values(row).find(
          (v) => typeof v === 'number'
        ) as number | undefined
        if (rawVal !== undefined) {
          return formatter ? formatter(rawVal) : String(rawVal)
        }
        return 'N/A'
      }
      return '0'
    },
    enabled: !isWarmbooting,
  })

  return {
    ...query,
    isLoading: query.isLoading || isWarmbooting,
    isWarmbooting,
  }
}
