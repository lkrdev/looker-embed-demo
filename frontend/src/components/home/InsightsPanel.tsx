import * as React from 'react'
import { Card } from '../ui/Card'
import { usePortal } from '../../context/PortalContext'
import { Sparkles, ArrowRight, Lightbulb, Target, TrendingUp } from 'lucide-react'
import { useExecutiveBriefing } from '../../hooks'

const ICON_MAP = {
  Lightbulb,
  TrendingUp,
  Target,
} as const

export const InsightsPanel: React.FC = () => {
  const { brand } = usePortal()
  const { insights, applyAllRules } = useExecutiveBriefing(brand)

  return (
    <Card variant="glass" className="insights-panel flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))', border: '1px solid var(--border)' }}>
      {/* Decorative background glow elements */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-surface/40 blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex-between flex-row relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex-row items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="w-8 h-8 rounded-full bg-primary flex-center text-surface flex items-center justify-center" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff' }}>
            <Sparkles size={16} />
          </div>
          <h3 className="section-title mb-0 text-primary-hover" style={{ fontSize: '18px', margin: 0 }}>AI Strategic Executive Briefing</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface text-primary uppercase tracking-wider shadow-sm" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
          Brand Focus: {brand}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 pt-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {insights.map((item) => {
          const IconComponent = ICON_MAP[item.iconName]
          return (
            <Card key={item.id} variant="default" className="flex-col gap-3 p-4 bg-surface/90 hover-lift backdrop-blur-md" style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="flex-row items-center gap-2 font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: `var(--${item.variant})` }}>
                <IconComponent size={18} />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-secondary mb-0" style={{ fontSize: '13px', margin: 0 }}>
                {item.description(brand)}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="flex-between flex-row relative z-10 pt-2 border-t border-border/40" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span className="text-xs text-secondary font-medium" style={{ fontSize: '12px' }}>
          Recommendations generated asynchronously via Google Gemini Machine Learning Models
        </span>
        <button
          className="btn btn-secondary flex-center gap-1.5 text-xs py-1.5 px-4 rounded-full font-bold transition-all hover:bg-primary hover:text-surface"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
          onClick={applyAllRules}
        >
          <span>Apply All Strategic Rules</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  )
}
