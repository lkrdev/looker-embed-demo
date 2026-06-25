import { usePortal } from '../../context/PortalContext'
import type { SourceHighlighterProps } from '../../types'
import { useLingui } from '@lingui/react'
import { SourceHighlighter as SourceHighlighterText } from '../../config/SourceHighlighter'

export function SourceHighlighter({
  children,
  sourceType,
  className = '',
  style = {}
}: SourceHighlighterProps) {
  const { i18n } = useLingui()
  const { sourceEnabled } = usePortal()

  const highlightClass = sourceEnabled
    ? sourceType === 'iframe'
      ? 'highlight-iframe'
      : 'highlight-api'
    : ''
  const badgeText = sourceType === 'iframe' ? i18n._(SourceHighlighterText.BADGE_IFRAME) : i18n._(SourceHighlighterText.BADGE_API)

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
