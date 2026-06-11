import * as React from 'react'
import { useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useEmbedSDK, usePortal } from '../context/PortalContext'
import { getLookerPath } from '../config/constants'
import { SourceHighlighter } from './SourceHighlighter'


export interface EmbedPlaceholderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
}


export const EmbedPlaceholder = React.forwardRef<HTMLDivElement, EmbedPlaceholderProps>(
  ({ className = '', title = 'Add iFrame', ...props }, forwardedRef) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const currentPath = useRouterState({
      select: (state) => state.location.pathname,
    })

    const targetPath = getLookerPath(currentPath)

    const { isConnecting, embedError, isLoadingConfig, lookerHost } = useEmbedSDK(
      containerRef,
      targetPath
    )

    const { sourceEnabled } = usePortal()

    // Assign DOM node to both the local containerRef and the forwarded ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        (containerRef as any).current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          (forwardedRef as any).current = node
        }
      },
      [forwardedRef]
    )

    const computedClassName = `iframe-placeholder ${className}`.trim().replace(/\s+/g, ' ')

    if (isLoadingConfig) {
      return (
        <div className={computedClassName} style={{ borderStyle: 'solid' }}>
          <div className="spinner" style={{ marginRight: 'var(--space-2)' }} />
          <span>Loading configuration...</span>
        </div>
      )
    }

    if (!lookerHost) {
      return (
        <div className={computedClassName} style={{ color: 'var(--error)', borderStyle: 'solid' }}>
          <span>Failed to load Looker configuration. Make sure backend is running.</span>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, position: 'relative' }}>
        {isConnecting && (
          <div className="flex-center gap-2" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            borderRadius: 'var(--radius-xl)'
          }}>
            <div className="spinner" />
            <span>Connecting Looker Embed SDK...</span>
          </div>
        )}

        {embedError && (
          <div style={{
            padding: 'var(--space-4)',
            color: 'var(--error)',
            background: 'var(--error-light)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--error)'
          }}>
            <strong>Embed Error:</strong> {embedError}
          </div>
        )}

        <SourceHighlighter sourceType="iframe" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            ref={setRefs}
            className={className}
            style={{
              flexGrow: 1,
              minHeight: 'calc(100vh - 220px)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: sourceEnabled ? 'none' : '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column'
            }}
            {...props}
          />
        </SourceHighlighter>
      </div>
    )
  }
)

EmbedPlaceholder.displayName = 'EmbedPlaceholder'
