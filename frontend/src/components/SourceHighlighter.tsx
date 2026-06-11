import React from 'react'
import { usePortal } from '../context/PortalContext'

interface SourceHighlighterProps {
  children: React.ReactNode
  sourceType: 'iframe' | 'api'
  className?: string
  style?: React.CSSProperties
}

export function SourceHighlighter({
  children,
  sourceType,
  className = '',
  style = {}
}: SourceHighlighterProps) {
  const { sourceEnabled } = usePortal()

  if (!sourceEnabled) {
    return <>{children}</>
  }

  const highlightClass = sourceType === 'iframe' ? 'highlight-iframe' : 'highlight-api'
  const badgeText = sourceType === 'iframe' ? 'Looker iFrame' : 'Looker API'

  return (
    <div
      className={`source-highlight-container ${highlightClass} ${className}`}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        ...style
      }}
    >
      <span className={`source-highlight-badge badge-${sourceType}`}>
        {badgeText}
      </span>
      {children}
    </div>
  )
}
