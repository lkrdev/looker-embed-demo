import * as React from 'react'
import { Card } from '../../ui/Card'
import { SourceHighlighter } from '../../embed/SourceHighlighter'
import { usePortal } from '../../../context/PortalContext'
import { Sparkles, Lightbulb, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useExecutiveBriefing } from '../../../hooks'
import { useLingui } from '@lingui/react'
import { InsightsPanel as InsightsPanelText } from '../../../config/InsightsPanel'
import styles from './InsightsPanel.module.css'

const ICON_MAP: Record<string, any> = {
  Lightbulb,
  TrendingUp,
  Target,
}

export const InsightsPanel: React.FC = () => {
  const { brand } = usePortal()
  const { insights, isLoading, isWarmbooting, error } = useExecutiveBriefing(brand)
  const { i18n } = useLingui()

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const [activeCardIndex, setActiveCardIndex] = React.useState(0)
  const [visibleCardsCount, setVisibleCardsCount] = React.useState(1)

  const updateScrollState = React.useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 5)
    const maxScroll = scrollWidth - clientWidth
    setCanScrollRight(scrollLeft < maxScroll - 5 && maxScroll > 5)

    const cardsVisible = clientWidth >= 1024 ? 2 : 1
    setVisibleCardsCount(cardsVisible)

    const totalCards = insights.length
    if (totalCards > 0 && el.children.length > 0) {
      const firstCard = el.children[0] as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth + 16
        const index = Math.round(scrollLeft / (cardWidth || 1))
        setActiveCardIndex(Math.min(totalCards - 1, Math.max(0, index)))
      }
    }
  }, [insights.length])

  React.useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    updateScrollState()
    const handleResize = () => updateScrollState()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateScrollState, insights])

  const smoothScrollTo = (el: HTMLDivElement, targetLeft: number, duration = 300) => {
    const startLeft = el.scrollLeft
    const distance = targetLeft - startLeft
    if (Math.abs(distance) < 1) return

    // Temporarily disable CSS scroll-snap so the browser doesn't abruptly jump right to the target
    const originalSnap = el.style.scrollSnapType
    el.style.scrollSnapType = 'none'

    let startTime: number | null = null

    const easeInOut = (t: number): number => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    const animationFrame = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const easedProgress = easeInOut(progress)

      el.scrollLeft = startLeft + distance * easedProgress

      if (progress < 1) {
        window.requestAnimationFrame(animationFrame)
      } else {
        // Restore scroll-snap when the 0.3s ease-in-out transition completes
        el.style.scrollSnapType = originalSnap
        updateScrollState()
      }
    }

    window.requestAnimationFrame(animationFrame)
  }

  const scrollByPage = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el || el.children.length === 0) return
    const firstCard = el.children[0] as HTMLElement
    const targetIndex = direction === 'left'
      ? Math.max(0, activeCardIndex - visibleCardsCount)
      : Math.min(insights.length - 1, activeCardIndex + visibleCardsCount)

    const targetCard = el.children[targetIndex] as HTMLElement
    if (targetCard) {
      const targetLeft = targetCard.offsetLeft - firstCard.offsetLeft
      smoothScrollTo(el, targetLeft, 300)
    }
  }

  const scrollToIndex = (index: number) => {
    const el = scrollContainerRef.current
    if (!el || el.children.length === 0) return
    const firstCard = el.children[0] as HTMLElement
    const targetCard = el.children[index] as HTMLElement
    if (targetCard) {
      const targetLeft = targetCard.offsetLeft - firstCard.offsetLeft
      smoothScrollTo(el, targetLeft, 300)
    }
  }

  return (
    <SourceHighlighter sourceType="api-and-bqml" className="insights-panel-wrapper w-full" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card variant="glass" className="insights-panel flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))', border: '1px solid var(--border)', height: '28rem', display: 'flex', flexDirection: 'column' }}>
        {/* Decorative background glow elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-surface/40 blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex-between flex-row relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flexShrink: 0 }}>
          <div className="flex-row items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="w-8 h-8 rounded-full bg-primary flex-center text-surface flex items-center justify-center" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff' }}>
              <Sparkles size={16} />
            </div>
            <h3 className="section-title mb-0 text-primary-hover" style={{ fontSize: '18px', margin: 0 }}>{i18n._(InsightsPanelText.TITLE)}</h3>
            {isLoading && (
              <div className="system-status flex-center" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '2px 10px', backgroundColor: 'var(--surface-hover)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <span className="status-dot animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isWarmbooting ? 'var(--warning)' : 'var(--primary)' }} />
                <span className="font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {isWarmbooting ? i18n._(InsightsPanelText.STATUS_WARMBOOTING) : i18n._(InsightsPanelText.STATUS_FETCHING)}
                </span>
              </div>
            )}
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface text-primary uppercase tracking-wider shadow-sm" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
            {i18n._(InsightsPanelText.BRAND_FOCUS_PREFIX)}{brand}
          </span>
        </div>

        <div className="relative z-10 pt-1 w-full flex-1" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Option 1 Floating Arrows & Edge Shadows */}
          {!isLoading && !error && insights.length > visibleCardsCount && (
            <>
              {canScrollLeft && (
                <>
                  <button
                    type="button"
                    className={`${styles.insightsFloatingArrow} ${styles.left} animate-in fade-in duration-200`}
                    onClick={() => scrollByPage('left')}
                    title="Scroll Left"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </>
              )}
              {canScrollRight && (
                <>
                  <button
                    type="button"
                    className={`${styles.insightsFloatingArrow} ${styles.right} animate-in fade-in duration-200`}
                    onClick={() => scrollByPage('right')}
                    title="Scroll Right"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={updateScrollState}
            className={`${styles.insightsScrollTrack} w-full flex-1`}
            style={{ minHeight: 0, alignItems: 'stretch' }}
          >
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="default" className={`${styles.insightSnapCard} flex-col gap-3 p-4 bg-surface/90 backdrop-blur-md animate-pulse`} style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', height: '100%' }}>
                    <div className="h-4 bg-border rounded w-2/3 mb-2" style={{ height: '16px', width: '60%', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
                    <div className="h-12 bg-border/60 rounded w-full" style={{ height: '48px', width: '100%', backgroundColor: 'var(--border)', opacity: 0.6, borderRadius: '4px' }} />
                  </Card>
                ))}
              </>
            ) : error ? (
              <div className="w-full p-4 text-center text-error bg-error/10 rounded-xl border border-error/20 font-medium" style={{ padding: '16px', color: 'var(--error)', borderRadius: '12px', border: '1px solid var(--border)', flex: '0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i18n._(InsightsPanelText.ERROR_MSG)}
              </div>
            ) : insights.length === 0 ? (
              <div className="w-full p-4 text-center text-secondary bg-surface/60 rounded-xl border border-border" style={{ padding: '16px', color: 'var(--secondary)', borderRadius: '12px', border: '1px solid var(--border)', flex: '0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i18n._(InsightsPanelText.EMPTY_MSG_PREFIX)}{brand}{i18n._(InsightsPanelText.EMPTY_MSG_SUFFIX)}
              </div>
            ) : (
              insights.map((item, idx) => {
                const IconComponent = ICON_MAP[item.iconName] || Lightbulb
                return (
                  <Card key={item.id} variant="default" className={`${styles.insightSnapCard} flex-col gap-3 p-4 bg-surface/90 hover-lift backdrop-blur-md`} style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', animationDelay: `${idx * 80}ms`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-row items-center gap-2 font-semibold text-sm flex-shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: `var(--${item.variant})` }}>
                      <IconComponent size={18} />
                      <span>{item.title === 'Strategic Insight' ? i18n._(InsightsPanelText.DEFAULT_TITLE) : item.title}</span>
                    </div>
                    <p className="text-xs text-secondary mb-0" style={{ fontSize: '13px', margin: 0, flexGrow: 1 }}>
                      {typeof item.description === 'function' ? item.description(brand) : (item.description === 'No briefing details provided.' ? i18n._(InsightsPanelText.DEFAULT_DESC) : item.description)}
                    </p>
                  </Card>
                )
              })
            )}
          </div>

          {/* Dot Pills under cards */}
          {!isLoading && !error && insights.length > visibleCardsCount && (
            <div className={`${styles.insightsDotPills} mt-2 animate-in fade-in duration-200`} style={{ flexShrink: 0 }}>
              {Array.from({ length: Math.max(1, insights.length - visibleCardsCount + 1) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.insightsDotPill} ${i === activeCardIndex ? styles.active : ''}`}
                  onClick={() => scrollToIndex(i)}
                  title={`Go to insight ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-between flex-row relative z-10 pt-2 border-t border-border/40" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexShrink: 0 }}>
          <span className="text-xs text-secondary font-medium" style={{ fontSize: '12px' }}>
            {i18n._(InsightsPanelText.FOOTER_NOTE)}
          </span>
        </div>
      </Card>
    </SourceHighlighter>
  )
}
