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

  const normalizedType = sourceType.replace(/_/g, '-')

  const highlightClass = sourceEnabled ? `highlight-${normalizedType}` : ''

  const getBadgeText = () => {
    switch (normalizedType) {
      case 'iframe':
        return i18n._(SourceHighlighterText.BADGE_IFRAME)
      case 'api':
        return i18n._(SourceHighlighterText.BADGE_API)
      case 'js-embed-events':
        return i18n._(SourceHighlighterText.BADGE_JS_EMBED_EVENTS)
      case 'api-and-bqml':
        return i18n._(SourceHighlighterText.BADGE_API_AND_BQML)
      default:
        return ''
    }
  }

  return (
    <div
      className={`source-highlight-container ${highlightClass} ${className}`.trim()}
      style={style}
    >
      {sourceEnabled && (
        <span className={`source-highlight-badge badge-${normalizedType}`}>
          {getBadgeText()}
        </span>
      )}
      {children}
    </div>
  )
}
