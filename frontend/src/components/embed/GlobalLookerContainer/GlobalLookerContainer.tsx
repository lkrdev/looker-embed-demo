import * as React from 'react'
import { useEffect, useRef } from 'react'
import { usePortal } from '../../../context/PortalContext'
import { getLookerPath } from '../../../config/constants'
import { SourceHighlighter } from '../SourceHighlighter'
import type { GlobalLookerContainerProps } from '../../../types'
import { useIframeAnchorOverlay } from '../../../hooks'
import { useLingui } from '@lingui/react'
import { GlobalLookerContainer as GlobalLookerContainerText } from '../../../config/GlobalLookerContainer'
import styles from './GlobalLookerContainer.module.css'

export const GlobalLookerContainer: React.FC<GlobalLookerContainerProps> = ({
  isVisible,
  currentRoute,
}) => {
  const { i18n } = useLingui()
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
    dashboardUrl,
    embedTheme,
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
      const targetPath = currentRoute === '/dashboard' ? dashboardUrl : getLookerPath(currentRoute, embedTheme)
      navigateIframe(targetPath)
    }
  }, [currentRoute, isVisible, connection, connectionState, navigateIframe, dashboardUrl, embedTheme])

  return (
    <div style={style}>
      <div className="relative flex-grow flex-col h-full w-full">
        {(connectionState === 'connecting' || isNavigating) && (
          <div className={`${styles.lookerLoadingOverlay} looker-loading-overlay flex-center gap-2`}>
            <div className="spinner" />
            <span>{isNavigating ? i18n._(GlobalLookerContainerText.LOADING_CONTENT) : i18n._(GlobalLookerContainerText.WARMBOOTING_SESSION)}</span>
          </div>
        )}

        {embedError && (
          <div className={`${styles.embedErrorAlert} embed-error-alert`}>
            <strong>{i18n._(GlobalLookerContainerText.EMBED_ERROR_PREFIX)}</strong> {embedError}
          </div>
        )}

        <SourceHighlighter
          sourceType="iframe"
          className="flex-grow flex-col h-full w-full"
        >
          <div
            ref={containerRef}
            className={`${styles.lookerIframeContainer} looker-iframe-container ${isFiltering ? styles.blurActive : ''}`}
          />
        </SourceHighlighter>
      </div>
    </div>
  )
}
