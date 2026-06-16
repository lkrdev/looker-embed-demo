import { useQuery } from '@tanstack/react-query'
import type { Looker40SDK } from '@looker/sdk'
import { LOOKER_FOLDER_ID } from '../config/constants'

export function useFolderReports(lookerBrowserSdk: Looker40SDK) {
  return useQuery({
    queryKey: ['looker-folder-reports', LOOKER_FOLDER_ID],
    queryFn: async () => {
      try {
        console.log('Fetching Looker reports for folder ID:', LOOKER_FOLDER_ID)
        const [dashboardsRes, looksRes] = await Promise.all([
          lookerBrowserSdk.folder_dashboards(LOOKER_FOLDER_ID, 'id,title,description'),
          lookerBrowserSdk.folder_looks(LOOKER_FOLDER_ID, 'id,title,description'),
        ])

        return {
          dashboards: dashboardsRes.ok ? dashboardsRes.value : [],
          looks: looksRes.ok ? looksRes.value : [],
        }
      } catch (err) {
        console.error('Error fetching reports from folder:', err)
        return { dashboards: [], looks: [] }
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  })
}
