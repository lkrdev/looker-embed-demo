import * as React from 'react'
import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
import type { ILookerConnection } from '@looker/embed-sdk'
import { configureCookielessSDK } from '../services'

export function useSharedLookerConnection(
  lookerHost: string | null,
  isLoadingConfig: boolean,
  authTrigger: number,
  setDateFilter: React.Dispatch<React.SetStateAction<string>>
) {
  const [connection, setConnection] =
    React.useState<ILookerConnection | null>(null)
  const [connectionState, setConnectionState] = React.useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle')
  const [embedError, setEmbedError] = React.useState<string | null>(null)
  const [isNavigating, setIsNavigating] = React.useState<boolean>(false)

  const initializeSharedSDK = React.useCallback(
    async (container: HTMLDivElement) => {
      if (isLoadingConfig) return
      if (connection || connectionState === 'connecting') return
      if (!lookerHost) {
        setEmbedError('Looker host is not configured.')
        setConnectionState('error')
        return
      }

      setConnectionState('connecting')
      setEmbedError(null)

      try {
        const sdk = getEmbedSDK(new LookerEmbedExSDK())
        sdk.clearSession()

        configureCookielessSDK(sdk, lookerHost, () => true)

        const builder = sdk.preload()
        const conn = await builder
          .appendTo(container)
          .withAllowAttr('fullscreen')
          .on('page:changed', (event) => {
            console.log(
              'Page changed event from Looker, resetting dateFilter to default empty:',
              event
            )
            setDateFilter('')
          })
          .build()
          .connect({ waitUntilLoaded: true })

        setConnection(conn)
        setConnectionState('connected')
        console.log(
          'Successfully initialized Looker preloaded connection',
          conn
        )
      } catch (err: any) {
        console.error(
          'Failed to initialize Looker preloaded connection:',
          err
        )
        setEmbedError(err.message || 'Initialization failed')
        setConnectionState('error')
      }
    },
    [connection, connectionState, isLoadingConfig, lookerHost, setDateFilter]
  )

  // Watch for authTrigger changes (when settings change) to reset connection
  React.useEffect(() => {
    if (connectionState !== 'idle') {
      console.log(
        'Resetting shared Looker connection due to authentication settings change...'
      )
      setConnection(null)
      setConnectionState('idle')
      setDateFilter('')
    }
  }, [authTrigger])

  const navigateIframe = React.useCallback(
    async (targetPath: string) => {
      if (!connection || connectionState !== 'connected') return

      setIsNavigating(true)
      setEmbedError(null)

      try {
        console.log('Shared Looker IFrame navigating to path:', targetPath)
        const options = { waitUntilLoaded: true }

        if (targetPath.includes('/dashboards/')) {
          const id = targetPath.split('/dashboards/')[1]
          await connection.loadDashboard({ id, options })
        } else if (targetPath.includes('/explore/')) {
          const id = targetPath.split('/explore/')[1]
          await connection.loadExplore({ id, options })
        } else if (targetPath.includes('/conversations')) {
          await connection.loadUrl({ url: targetPath, options })
        } else if (targetPath.includes('/looks/')) {
          const id = targetPath.split('/looks/')[1].split('?')[0]
          await connection.loadLook({ id, options })
        } else {
          await connection.preload(undefined, options)
        }
      } catch (err: any) {
        console.error('Looker iframe navigation error:', err)
        setEmbedError(err.message || 'Failed to load Looker content')
      } finally {
        setIsNavigating(false)
      }
    },
    [connection, connectionState]
  )

  return {
    connection,
    connectionState,
    embedError,
    initializeSharedSDK,
    isNavigating,
    navigateIframe,
  }
}
