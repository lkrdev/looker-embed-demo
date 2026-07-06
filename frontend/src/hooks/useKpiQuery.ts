import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { Looker40SDK } from '@looker/sdk'
import { usePortal } from '../context/PortalContext'

export function useKpiQuery(
  queryId: string,
  authTrigger: number,
  lookerBrowserSdk: Looker40SDK | null,
  _formatter?: (val: any) => string
) {
  const { connectionState, language, brand } = usePortal()
  const isWarmbooting = !lookerBrowserSdk || connectionState !== 'connected'

  const query = useQuery({
    queryKey: ['looker-kpi', queryId, authTrigger, connectionState, language, brand],
    queryFn: async () => {
      if (!lookerBrowserSdk) return null

      // result_format 'json_detail' brings through any html formatting applied in LookML
      const response = await lookerBrowserSdk.ok(
        lookerBrowserSdk.run_query({
          query_id: queryId,
          result_format: 'json_detail',
          apply_formatting: true,
          limit: 1,
          cache: false
        })
      )

      const res = response as any
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const row = res.data[0]
        if (row && typeof row === 'object') {
          const cell = Object.values(row)[0] as any
          if (cell && typeof cell === 'object') {
            const val = cell.html ?? cell.rendered ?? cell.value
            if (val !== undefined && val !== null) {
              return String(val).replace(/\s+/g, ' ').trim()
            }
          }
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
