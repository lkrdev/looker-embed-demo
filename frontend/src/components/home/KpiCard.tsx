import * as React from 'react'
import { Card } from '../ui/Card'
import { SourceHighlighter } from '../embed/SourceHighlighter'
import { usePortal } from '../../context/PortalContext'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { KpiCardProps } from '../../types'
import { useKpiQuery } from '../../hooks'

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  queryId,
  badgeText,
  badgeVariant = 'success',
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary-light',
  formatter,
  className = ''
}) => {
  const { lookerBrowserSdk, authTrigger } = usePortal()

  const {
    data: value,
    isLoading,
    error: queryError
  } = useKpiQuery(queryId, authTrigger, lookerBrowserSdk, formatter)

  const error = queryError ? 'Data unavailable' : null


  return (
    <SourceHighlighter sourceType="api" className={`h-full ${className}`}>
      <Card variant="glass" className="kpi-card relative overflow-hidden transition-all hover-lift h-full">
        <div className="kpi-content flex-col gap-2 relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="flex-between flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-xs font-bold text-muted uppercase tracking-wider" style={{ letterSpacing: '0.05em' }}>{title}</span>
            <div className={`app-icon-container ${iconBgColor}`} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>

          <div className="kpi-value-container flex-row items-baseline gap-3 pt-1" style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            {isLoading ? (
              <div className="kpi-skeleton animate-pulse" style={{ height: '36px', width: '120px', backgroundColor: 'var(--border)', borderRadius: '6px' }} />
            ) : error ? (
              <span className="text-sm font-medium" style={{ color: 'var(--error)' }}>{error}</span>
            ) : (
              <>
                <div className="text-3xl font-extrabold tracking-tight" style={{ fontSize: '30px', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
                  {value}
                </div>
                <span className={`kpi-badge flex-center flex-row`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', backgroundColor: `var(--${badgeVariant}-light)`, color: `var(--${badgeVariant})` }}>
                  {badgeVariant === 'success' ? <TrendingUp size={12} /> :
                   badgeVariant === 'warning' ? <Minus size={12} /> :
                   badgeVariant === 'error' ? <TrendingDown size={12} /> : null}
                  <span>{badgeText}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    </SourceHighlighter>
  )
}
