import { usePortal } from '../../context/PortalContext'
import type { SourceHighlighterProps } from '../../types'

export function SourceHighlighter({
  children,
  sourceType,
  className = '',
  style = {}
}: SourceHighlighterProps) {
  const { sourceEnabled } = usePortal()

  const highlightClass = sourceEnabled
    ? sourceType === 'iframe'
      ? 'highlight-iframe'
      : 'highlight-api'
    : ''
  const badgeText = sourceType === 'iframe' ? 'Looker iFrame' : 'Looker API'

  return (
    <div
      className={`source-highlight-container ${highlightClass} ${className}`.trim()}
      style={style}
    >
      {sourceEnabled && (
        <span className={`source-highlight-badge badge-${sourceType}`}>
          {badgeText}
        </span>
      )}
      {children}
    </div>
  )
}
