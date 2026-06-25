import * as React from 'react'
import { Card } from '../ui/Card'
import { ShoppingBag, PackageCheck, AlertCircle, RefreshCw, Star } from 'lucide-react'
import { useSalesActivities } from '../../hooks'
import { useLingui } from '@lingui/react'
import { SalesActivityFeed as SalesActivityFeedText } from '../../config/SalesActivityFeed'

const ICON_MAP = {
  ShoppingBag,
  Star,
  PackageCheck,
  RefreshCw,
  AlertCircle,
} as const

export const SalesActivityFeed: React.FC = () => {
  const { activities } = useSalesActivities()
  const { i18n } = useLingui()

  const activityMap: Record<number, { title: any, desc: any, time: any }> = {
    1: { title: SalesActivityFeedText.ACT_1_TITLE, desc: SalesActivityFeedText.ACT_1_DESC, time: SalesActivityFeedText.ACT_1_TIME },
    2: { title: SalesActivityFeedText.ACT_2_TITLE, desc: SalesActivityFeedText.ACT_2_DESC, time: SalesActivityFeedText.ACT_2_TIME },
    3: { title: SalesActivityFeedText.ACT_3_TITLE, desc: SalesActivityFeedText.ACT_3_DESC, time: SalesActivityFeedText.ACT_3_TIME },
    4: { title: SalesActivityFeedText.ACT_4_TITLE, desc: SalesActivityFeedText.ACT_4_DESC, time: SalesActivityFeedText.ACT_4_TIME },
    5: { title: SalesActivityFeedText.ACT_5_TITLE, desc: SalesActivityFeedText.ACT_5_DESC, time: SalesActivityFeedText.ACT_5_TIME },
  }

  return (
    <Card variant="glass" className="flex-col gap-4">
      <div className="flex-between flex-row border-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="section-title mb-0" style={{ fontSize: '18px', fontFamily: 'var(--font-heading)' }}>{i18n._(SalesActivityFeedText.TITLE)}</h3>
          <p className="page-subtitle" style={{ fontSize: '12px', margin: 0 }}>{i18n._(SalesActivityFeedText.SUBTITLE)}</p>
        </div>
        <div className="system-status flex-center" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 12px', backgroundColor: 'var(--surface-hover)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <span className="status-dot success animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
          <span className="font-semibold text-xs">{i18n._(SalesActivityFeedText.STATUS_TEXT)}</span>
        </div>
      </div>

      <div className="activity-feed-list flex-col gap-3 pt-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.map((item) => {
          const Icon = ICON_MAP[item.iconName]
          const loc = activityMap[item.id]
          return (
            <div
              key={item.id}
              className={`activity-item flex-row flex-between p-3 rounded-xl transition-all hover-lift`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: item.highlight ? 'var(--primary-light)' : 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: item.highlight ? '0 4px 12px rgba(11, 87, 208, 0.1)' : 'var(--shadow-sm)'
              }}
            >
              <div className="flex-row items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  className={`flex-center ${item.iconBg}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.highlight ? 'rgba(255,255,255,0.6)' : undefined
                  }}
                >
                  <Icon size={20} className={item.iconColor} />
                </div>
                <div className="flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-row items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-bold text-sm" style={{ color: item.highlight ? 'var(--primary-hover)' : 'var(--text)' }}>
                      {loc ? i18n._(loc.title) : item.title}
                    </span>
                    <span className="text-xs text-muted font-medium bg-surface-hover px-2 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
                      {loc ? i18n._(loc.time) : item.time}
                    </span>
                  </div>
                  <span className="text-xs text-secondary mt-0.5" style={{ fontSize: '12px', color: item.highlight ? 'var(--text)' : 'var(--text-secondary)' }}>
                    {loc ? i18n._(loc.desc) : item.description}
                  </span>
                </div>
              </div>

              {item.amount && (
                <div className="font-extrabold text-sm whitespace-nowrap ml-4 font-heading" style={{ fontSize: '14px', color: item.amount.startsWith('+') ? 'var(--success)' : 'var(--error)' }}>
                  {item.amount}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

