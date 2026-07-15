import { usePortal } from '../../../context/PortalContext'
import type { SourceHighlighterProps } from '../../../types'
import { useLingui } from '@lingui/react'
import { SourceHighlighter as SourceHighlighterText } from '../../../config/SourceHighlighter'
import styles from './SourceHighlighter.module.css'

export function SourceHighlighter({
  children,
  sourceType,
  className = '',
  style = {}
}: SourceHighlighterProps) {
  const { i18n } = useLingui()
  const { sourceEnabled } = usePortal()

  const normalizedType = sourceType.replace(/_/g, '-')

  const getHighlightStyleClass = () => {
    if (!sourceEnabled) return ''
    switch (normalizedType) {
      case 'iframe': return `${styles.highlightIframe} highlight-iframe`
      case 'api': return `${styles.highlightApi} highlight-api`
      case 'js-embed-events': return `${styles.highlightJsEmbedEvents} highlight-js-embed-events`
      case 'api-and-bqml': return `${styles.highlightApiAndBqml} highlight-api-and-bqml`
      default: return ''
    }
  }

  const getBadgeStyleClass = () => {
    switch (normalizedType) {
      case 'iframe': return styles.badgeIframe
      case 'api': return styles.badgeApi
      case 'js-embed-events': return styles.badgeJsEmbedEvents
      case 'api-and-bqml': return styles.badgeApiAndBqml
      default: return ''
    }
  }

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
      className={`${styles.sourceHighlightContainer} source-highlight-container ${getHighlightStyleClass()} ${className}`.trim()}
      style={style}
    >
      {sourceEnabled && (
        <span className={`${styles.sourceHighlightBadge} source-highlight-badge badge-${normalizedType} ${getBadgeStyleClass()}`}>
          {getBadgeText()}
        </span>
      )}
      {children}
    </div>
  )
}
