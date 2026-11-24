import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { Looker40SDK } from '@looker/sdk'
import { LOOKER_FOLDER_ID, DATA_APPS_SUBFOLDER_NAME } from '../config/constants'

export function useSharedReports(lookerBrowserSdk: Looker40SDK) {
  return useQuery({
    queryKey: ['looker-folder-reports', LOOKER_FOLDER_ID, 'v2'],
    queryFn: async () => {
      try {
        console.log('Fetching Looker reports for folder ID:', LOOKER_FOLDER_ID)
        const [dashboardsRes, looksRes, childrenRes] = await Promise.all([
          lookerBrowserSdk.folder_dashboards(LOOKER_FOLDER_ID, 'id,slug,title,description'),
          lookerBrowserSdk.folder_looks(LOOKER_FOLDER_ID, 'id,title,description'),
          lookerBrowserSdk.folder_children({ folder_id: LOOKER_FOLDER_ID, fields: 'id,name' }),
        ])

        let dataApps: any[] = []
        if (childrenRes.ok && Array.isArray(childrenRes.value)) {
          const target = DATA_APPS_SUBFOLDER_NAME.toLowerCase()
          const sub = childrenRes.value.find(
            (f) => f.id && (f.name || '').trim().toLowerCase() === target
          )
          if (sub?.id) {
            const appsRes = await lookerBrowserSdk.folder_dashboards(
              String(sub.id),
              'id,slug,title,description'
            )
            if (appsRes.ok) dataApps = appsRes.value
          }
        }

        return {
          dashboards: dashboardsRes.ok ? dashboardsRes.value : [],
          dataApps,
          looks: looksRes.ok ? looksRes.value : [],
        }
      } catch (err) {
        console.error('Error fetching shared reports from folder:', err)
        return { dashboards: [], dataApps: [], looks: [] }
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    placeholderData: keepPreviousData,
  })
}

export function usePersonalReports(lookerBrowserSdk: Looker40SDK) {
  return useQuery({
    queryKey: ['looker-folder-personal', 'v2'],
    queryFn: async () => {
      try {
        const me = await lookerBrowserSdk.ok(lookerBrowserSdk.me())
        if (!me.id) return []

        const userFolders = await lookerBrowserSdk.ok(
          lookerBrowserSdk.search_folders({
            creator_id: me.id,
          })
        )
        const userFolderId = userFolders[0]?.id
        if (!userFolderId) return []

        const [userDashboardsRes, userLooksRes] = await Promise.all([
          lookerBrowserSdk.folder_dashboards(userFolderId, 'id,slug,title,description'),
          lookerBrowserSdk.folder_looks(userFolderId, 'id,title,description'),
        ])

        const userDashboards = userDashboardsRes.ok
          ? userDashboardsRes.value.map((d: any) => ({ ...d, type: 'dashboard' }))
          : []
        const userLooks = userLooksRes.ok
          ? userLooksRes.value.map((l: any) => ({ ...l, type: 'look' }))
          : []

        return [...userDashboards, ...userLooks]
      } catch (err) {
        console.warn('Could not fetch user personal folder reports:', err)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    placeholderData: keepPreviousData,
  })
}
