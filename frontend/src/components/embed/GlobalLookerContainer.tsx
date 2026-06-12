import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { usePortal } from '../../context/PortalContext'
import { getLookerPath } from '../../config/constants'
import { SourceHighlighter } from './SourceHighlighter'
import type { GlobalLookerContainerProps } from '../../types'

export const GlobalLookerContainer: React.FC<GlobalLookerContainerProps> = ({
  isVisible,
  currentRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    initializeSharedSDK,
    connection,
    connectionState,
    embedError,
    iframeAnchor,
    isLoadingConfig,
  } = usePortal()

  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' })

  // Initialize the shared preloaded iframe once container is mounted
  useEffect(() => {
    if (containerRef.current && connectionState === 'idle' && !isLoadingConfig) {
      console.log('Mounting/Re-mounting shared Looker preloaded iframe...')
      containerRef.current.replaceChildren()
      initializeSharedSDK(containerRef.current)
    }
  }, [connectionState, isLoadingConfig])

  // Track anchor element position to place the iframe overlay exactly on it
  useEffect(() => {
    if (!isVisible || !iframeAnchor) {
      setStyle({ display: 'none' })
      return
    }

    const updatePosition = () => {
      const parent = iframeAnchor.closest('.portal-pane')
      if (!parent) return

      const rect = iframeAnchor.getBoundingClientRect()
      const parentRect = parent.getBoundingClientRect()

      setStyle({
        position: 'absolute',
        top: `${rect.top - parentRect.top}px`,
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
        pointerEvents: 'auto',
      })
    }

    // Run layout calculations
    updatePosition()

    // Listen to resize and scroll events
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true) // Listen to nested scroll containers

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [iframeAnchor, isVisible])

  // Whenever the active Looker route or active path changes, trigger navigation inside the iframe
  useEffect(() => {
    if (isVisible && connection && connectionState === 'connected') {
      const targetPath = getLookerPath(currentRoute)
      console.log('Shared Looker IFrame navigating to path:', targetPath)

      if (targetPath.includes('/dashboards/')) {
        const id = targetPath.split('/dashboards/')[1].split('?')[0]
        connection.loadDashboard(id)
      } else if (targetPath.includes('/explore/')) {
        const id = targetPath.split('/explore/')[1].split('?')[0]
        connection.loadExplore(id)
      } else if (targetPath.includes('/conversations')) {
        connection.loadConversationalAnalytics()
      } else {
        // Fallback or navigate back to the preload blank page
        connection.preload()
      }
    }
  }, [currentRoute, isVisible, connection, connectionState])

  return (
    <div style={style}>
      <div className="relative flex-grow flex-col h-full w-full">
        {connectionState === 'connecting' && (
          <div className="looker-loading-overlay flex-center gap-2">
            <div className="spinner" />
            <span>Warmbooting Looker Session...</span>
          </div>
        )}

        {embedError && (
          <div className="embed-error-alert">
            <strong>Embed Error:</strong> {embedError}
          </div>
        )}

        <SourceHighlighter
          sourceType="iframe"
          className="flex-grow flex-col h-full w-full"
        >
          <div
            ref={containerRef}
            className="looker-iframe-container"
          />
        </SourceHighlighter>
      </div>
    </div>
  )
}
