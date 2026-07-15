import * as React from 'react'
import { Card } from '../../ui/Card'
import { SourceHighlighter } from '../../embed/SourceHighlighter'
import { usePortal } from '../../../context/PortalContext'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { KpiCardProps } from '../../../types'
import { useKpiQuery } from '../../../hooks'
import { useLingui } from '@lingui/react'
import { KpiCard as KpiCardText } from '../../../config/KpiCard'
import styles from './KpiCard.module.css'

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
  const { i18n } = useLingui()

  const {
    data: value,
    isLoading,
    isWarmbooting,
    error: queryError
  } = useKpiQuery(queryId, authTrigger, lookerBrowserSdk, formatter)

  const error = queryError ? i18n._(KpiCardText.DATA_UNAVAILABLE) : null


  return (
    <SourceHighlighter sourceType="api" className={`h-full ${className}`}>
      <Card variant="glass" className={`${styles.kpiCard} relative overflow-hidden transition-all hover-lift h-full`}>
        <div className="kpi-content flex-col gap-2 relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="flex-between flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-xs font-bold text-muted uppercase tracking-wider" style={{ letterSpacing: '0.05em' }}>{title}</span>
            <div className={`app-icon-container ${iconBgColor}`} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>

          <div className="kpi-value-container flex-row gap-3 pt-1" style={{ display: 'flex', alignItems: isLoading ? 'center' : 'baseline', gap: '12px', flexWrap: 'wrap', minHeight: '36px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                <div className="kpi-skeleton animate-pulse" style={{ height: '36px', width: '110px', backgroundColor: 'var(--border)', borderRadius: '6px' }} />
                <div className="system-status flex-center" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '2px 10px', backgroundColor: 'var(--surface-hover)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <span className="status-dot animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isWarmbooting ? 'var(--warning)' : 'var(--primary)' }} />
                  <span className="font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isWarmbooting ? i18n._(KpiCardText.STATUS_WARMBOOTING) : i18n._(KpiCardText.STATUS_FETCHING)}
                  </span>
                </div>
              </div>
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
