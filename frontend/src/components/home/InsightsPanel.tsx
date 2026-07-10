import * as React from 'react'
import { Card } from '../ui/Card'
import { SourceHighlighter } from '../embed/SourceHighlighter'
import { usePortal } from '../../context/PortalContext'
import { Sparkles, ArrowRight, Lightbulb, Target, TrendingUp } from 'lucide-react'
import { useExecutiveBriefing } from '../../hooks'
import { useLingui } from '@lingui/react'
import { InsightsPanel as InsightsPanelText } from '../../config/InsightsPanel'

const ICON_MAP: Record<string, any> = {
  Lightbulb,
  TrendingUp,
  Target,
}

export const InsightsPanel: React.FC = () => {
  const { brand } = usePortal()
  const { insights, isLoading, isWarmbooting, error } = useExecutiveBriefing(brand)
  const { i18n } = useLingui()

  return (
    <SourceHighlighter sourceType="api-and-bqml" className="insights-panel-wrapper w-full">
      <Card variant="glass" className="insights-panel flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))', border: '1px solid var(--border)' }}>
        {/* Decorative background glow elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-surface/40 blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex-between flex-row relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="default" className="flex-col gap-3 p-4 bg-surface/90 backdrop-blur-md animate-pulse" style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="h-4 bg-border rounded w-2/3 mb-2" style={{ height: '16px', width: '60%', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
                  <div className="h-12 bg-border/60 rounded w-full" style={{ height: '48px', width: '100%', backgroundColor: 'var(--border)', opacity: 0.6, borderRadius: '4px' }} />
                </Card>
              ))}
            </>
          ) : error ? (
            <div className="col-span-3 p-4 text-center text-error bg-error/10 rounded-xl border border-error/20 font-medium" style={{ padding: '16px', gridColumn: '1 / -1', color: 'var(--error)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {i18n._(InsightsPanelText.ERROR_MSG)}
            </div>
          ) : insights.length === 0 ? (
            <div className="col-span-3 p-4 text-center text-secondary bg-surface/60 rounded-xl border border-border" style={{ padding: '16px', gridColumn: '1 / -1', color: 'var(--secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {i18n._(InsightsPanelText.EMPTY_MSG_PREFIX)}{brand}{i18n._(InsightsPanelText.EMPTY_MSG_SUFFIX)}
            </div>
          ) : (
            insights.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || Lightbulb
              return (
                <Card key={item.id} variant="default" className="flex-col gap-3 p-4 bg-surface/90 hover-lift backdrop-blur-md" style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="flex-row items-center gap-2 font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: `var(--${item.variant})` }}>
                    <IconComponent size={18} />
                    <span>{item.title === 'Strategic Insight' ? i18n._(InsightsPanelText.DEFAULT_TITLE) : item.title}</span>
                  </div>
                  <p className="text-xs text-secondary mb-0" style={{ fontSize: '13px', margin: 0 }}>
                    {typeof item.description === 'function' ? item.description(brand) : (item.description === 'No briefing details provided.' ? i18n._(InsightsPanelText.DEFAULT_DESC) : item.description)}
                  </p>
                </Card>
              )
            })
          )}
        </div>

        <div className="flex-between flex-row relative z-10 pt-2 border-t border-border/40" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span className="text-xs text-secondary font-medium" style={{ fontSize: '12px' }}>
            {i18n._(InsightsPanelText.FOOTER_NOTE)}
          </span>
          <button
            className="btn btn-secondary flex-center gap-1.5 text-xs py-1.5 px-4 rounded-full font-bold transition-all hover:bg-primary hover:text-surface"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
            onClick={() => alert(`${i18n._(InsightsPanelText.ALERT_PREFIX)}${brand}${i18n._(InsightsPanelText.ALERT_SUFFIX)}`)}
          >
            <span>{i18n._(InsightsPanelText.APPLY_BTN)}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </Card>
    </SourceHighlighter>
  )
}
