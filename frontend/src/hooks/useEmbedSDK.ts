import { useState, useEffect } from 'react'
import { getEmbedSDK, LookerEmbedExSDK } from '@looker/embed-sdk'
import type { ILookerConnection } from '@looker/embed-sdk'
import { usePortal } from '../context/PortalContext'
import { configureCookielessSDK } from '../services'
import { applyContrastDataLabels } from '../utils/embedEvents'

export function useEmbedSDK(
  containerRef: React.RefObject<HTMLDivElement | null>,
  targetPath: string
) {
  const { lookerHost, authTrigger, isLoadingConfig } = usePortal()
  const [isConnecting, setIsConnecting] = useState(false)
  const [embedError, setEmbedError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (isLoadingConfig || !lookerHost || !containerRef.current) {
      return
    }

    // Clear target container before mounting new iframe
    containerRef.current.replaceChildren()
    setEmbedError(null)
    setIsConnecting(true)

    try {
      // 1. Reinitialize the Embed SDK with current auth trigger & looker host
      const sdk = getEmbedSDK(new LookerEmbedExSDK())
      sdk.clearSession() // Reset SDK token caching

      configureCookielessSDK(sdk, lookerHost, () => active)

      // 2. Build the Looker embed client based on target path type
      let builder
      if (targetPath.includes('/dashboards/')) {
        builder = sdk.createDashboardWithUrl(targetPath)
      } else if (targetPath.includes('/explore/')) {
        builder = sdk.createExploreWithUrl(targetPath)
      } else if (targetPath.includes('/conversations')) {
        builder = sdk.createConversationalAnalyticsWithUrl(targetPath)
      } else if (targetPath.includes('/looks/')) {
        builder = sdk.createLookWithUrl(targetPath)
      } else {
        builder = sdk.createDashboardWithUrl(targetPath)
      }

      // 3. Append to DOM container, and connect
      builder
        .appendTo(containerRef.current)
        .withAllowAttr('fullscreen')
        .on('dashboard:loaded', function (this: ILookerConnection, event: any) {
          applyContrastDataLabels.call(this, event)
        })
        .on('dashboard:run:complete', function (this: ILookerConnection, event: any) {
          applyContrastDataLabels.call(this, event)
        })
        .build()
        .connect()
        .then(() => {
          if (!active) {
            if (containerRef.current) {
              containerRef.current.replaceChildren()
            }
            return
          }
          console.log(
            'Successfully connected Looker Embed SDK for',
            targetPath
          )
          setIsConnecting(false)
        })
        .catch((err) => {
          if (!active) return
          console.error('Looker Embed SDK connection error:', err)
          setEmbedError(err.message || 'Failed to connect Looker Embed SDK')
          setIsConnecting(false)
        })
    } catch (err: any) {
      if (!active) return
      console.error('Failed to initialize Looker Embed SDK:', err)
      setEmbedError(err.message || 'Initialization failed')
      setIsConnecting(false)
    }

    return () => {
      active = false
      if (containerRef.current) {
        containerRef.current.replaceChildren()
      }
    }
  }, [lookerHost, authTrigger, isLoadingConfig, targetPath, containerRef])

  return {
    isConnecting,
    embedError,
    isLoadingConfig,
    lookerHost,
  }
}
