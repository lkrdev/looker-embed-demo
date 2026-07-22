import * as React from 'react'
import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
import type { ILookerConnection } from '@looker/embed-sdk'
import { configureCookielessSDK } from '../services'

export function useSharedLookerConnection(
  lookerHost: string | null,
  isLoadingConfig: boolean,
  authTrigger: number,
  setDateFilter: React.Dispatch<React.SetStateAction<string>>,
  embedTheme?: string
) {
  const [connection, setConnection] =
    React.useState<ILookerConnection | null>(null)
  const [connectionState, setConnectionState] = React.useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle')
  const [embedError, setEmbedError] = React.useState<string | null>(null)
  const [isNavigating, setIsNavigating] = React.useState<boolean>(false)
  const sharedContainerRef = React.useRef<HTMLDivElement | null>(null)

  const connectionRef = React.useRef<ILookerConnection | null>(null)
  React.useEffect(() => {
    connectionRef.current = connection
  }, [connection])

  const embedThemeRef = React.useRef(embedTheme)
  React.useEffect(() => {
    embedThemeRef.current = embedTheme
  }, [embedTheme])

  const initializeSharedSDK = React.useCallback(
    async (container: HTMLDivElement) => {
      if (isLoadingConfig) return
      if (connection || connectionState === 'connecting') return
      if (!lookerHost) {
        setEmbedError('Looker host is not configured.')
        setConnectionState('error')
        return
      }

      sharedContainerRef.current = container
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
          .on('page:changed', (event: any) => {
            // const pageUrl = event?.page?.url
            // if (
            //   pageUrl &&
            //   !pageUrl.includes('theme=') &&
            //   embedThemeRef.current &&
            //   connectionRef.current
            // ) {
            //   const separator = pageUrl.includes('?') ? '&' : '?';
            //   const targetUrl = `${pageUrl}${separator}theme=${embedThemeRef.current}`;
            //   console.log('Re-applying theme to iframe URL:', targetUrl);
            //   connectionRef.current.loadUrl({
            //     url: targetUrl,
            //     options: { waitUntilLoaded: true },
            //   }).catch((err: any) => {
            //     console.error('Failed to re-apply theme on page change:', err);
            //   });
            // }
          })
          .build()
          .connect({ waitUntilLoaded: true })

        setConnection(conn)
        setConnectionState('connected')
        console.log(
          'Successfully initialized Looker preloaded connection'
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
    [connection, connectionState, isLoadingConfig, lookerHost]
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

  const resetConnection = React.useCallback(() => {
    setConnectionState((prev) => {
      if (prev !== 'idle') {
        console.log('Warmbooting Looker session: resetting connection to idle...')
        setConnection(null)
        return 'idle'
      }
      return prev
    })
  }, [])

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
        } else if (targetPath.includes('_theme')) {
          await connection.loadUrl({ url: targetPath, options })
        } else {
          await connection.preload(undefined, options)
        }

        // Clean up any stale/extra preloaded iframes left behind by the Embed SDK when transitioning sessions
        if (sharedContainerRef.current) {
          const iframes = sharedContainerRef.current.querySelectorAll('iframe')
          if (iframes.length > 1) {
            console.log(`Cleaning up ${iframes.length - 1} stale Looker iframe(s)...`)
            for (let i = 0; i < iframes.length - 1; i++) {
              iframes[i].remove()
            }
          }
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
    resetConnection,
  }
}
