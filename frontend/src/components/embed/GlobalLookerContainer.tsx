import * as React from 'react'
import { useEffect, useRef } from 'react'
import { usePortal } from '../../context/PortalContext'
import { getLookerPath } from '../../config/constants'
import { SourceHighlighter } from './SourceHighlighter'
import type { GlobalLookerContainerProps } from '../../types'
import { useIframeAnchorOverlay } from '../../hooks'

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
    isFiltering,
    isNavigating,
    navigateIframe,
  } = usePortal()

  const style = useIframeAnchorOverlay(iframeAnchor, isVisible)

  // Initialize the shared preloaded iframe once container is mounted
  useEffect(() => {
    if (containerRef.current && connectionState === 'idle' && !isLoadingConfig) {
      console.log('Mounting/Re-mounting shared Looker preloaded iframe...')
      containerRef.current.replaceChildren()
      initializeSharedSDK(containerRef.current)
    }
  }, [connectionState, isLoadingConfig, initializeSharedSDK])



  // Whenever the active Looker route or active path changes, trigger navigation inside the iframe
  useEffect(() => {
    if (isVisible && connection && connectionState === 'connected') {
      const targetPath = getLookerPath(currentRoute)
      navigateIframe(targetPath)
    }
  }, [currentRoute, isVisible, connection, connectionState, navigateIframe])

  return (
    <div style={style}>
      <div className="relative flex-grow flex-col h-full w-full">
        {(connectionState === 'connecting' || isNavigating) && (
          <div className="looker-loading-overlay flex-center gap-2">
            <div className="spinner" />
            <span>{isNavigating ? 'Loading Looker Content...' : 'Warmbooting Looker Session...'}</span>
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
            className={`looker-iframe-container ${isFiltering ? 'blur-active' : ''}`}
          />
        </SourceHighlighter>
      </div>
    </div>
  )
}
