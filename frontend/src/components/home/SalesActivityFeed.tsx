import * as React from 'react'
import { Card } from '../ui/Card'
import {
  ShoppingBag,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  Star,
  ArrowUpRight,
  Zap,
} from 'lucide-react'
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

type FilterCategory = 'all' | 'revenue' | 'logistics' | 'alert'

export const SalesActivityFeed: React.FC = () => {
  const { activities } = useSalesActivities()
  const { i18n } = useLingui()
  const [activeFilter, setActiveFilter] = React.useState<FilterCategory>('all')

  const activityMap: Record<number, { title: any; desc: any; time: any; action?: any }> = {
    1: {
      title: SalesActivityFeedText.ACT_1_TITLE,
      desc: SalesActivityFeedText.ACT_1_DESC,
      time: SalesActivityFeedText.ACT_1_TIME,
      action: SalesActivityFeedText.ACT_1_ACTION,
    },
    2: {
      title: SalesActivityFeedText.ACT_2_TITLE,
      desc: SalesActivityFeedText.ACT_2_DESC,
      time: SalesActivityFeedText.ACT_2_TIME,
      action: SalesActivityFeedText.ACT_2_ACTION,
    },
    3: {
      title: SalesActivityFeedText.ACT_3_TITLE,
      desc: SalesActivityFeedText.ACT_3_DESC,
      time: SalesActivityFeedText.ACT_3_TIME,
      action: SalesActivityFeedText.ACT_3_ACTION,
    },
    4: {
      title: SalesActivityFeedText.ACT_4_TITLE,
      desc: SalesActivityFeedText.ACT_4_DESC,
      time: SalesActivityFeedText.ACT_4_TIME,
      action: SalesActivityFeedText.ACT_4_ACTION,
    },
    5: {
      title: SalesActivityFeedText.ACT_5_TITLE,
      desc: SalesActivityFeedText.ACT_5_DESC,
      time: SalesActivityFeedText.ACT_5_TIME,
      action: SalesActivityFeedText.ACT_5_ACTION,
    },
  }

  const filteredActivities = React.useMemo(() => {
    if (activeFilter === 'all') return activities
    return activities.filter((item) => item.category === activeFilter)
  }, [activities, activeFilter])

  const counts = React.useMemo(() => {
    return {
      all: activities.length,
      revenue: activities.filter((i) => i.category === 'revenue').length,
      logistics: activities.filter((i) => i.category === 'logistics').length,
      alert: activities.filter((i) => i.category === 'alert').length,
    }
  }, [activities])

  const filterTabs: Array<{ id: FilterCategory; label: string; count: number }> = [
    { id: 'all', label: i18n._(SalesActivityFeedText.TAB_ALL), count: counts.all },
    { id: 'revenue', label: i18n._(SalesActivityFeedText.TAB_REVENUE), count: counts.revenue },
    { id: 'logistics', label: i18n._(SalesActivityFeedText.TAB_LOGISTICS), count: counts.logistics },
    { id: 'alert', label: i18n._(SalesActivityFeedText.TAB_ALERTS), count: counts.alert },
  ]

  const getCategoryBorderColor = (category?: string) => {
    switch (category) {
      case 'revenue':
        return 'var(--success)'
      case 'logistics':
        return 'var(--info)'
      case 'alert':
        return 'var(--error)'
      default:
        return 'var(--primary)'
    }
  }

  const getActionStyle = (variant?: string) => {
    switch (variant) {
      case 'alert':
        return {
          backgroundColor: 'var(--error-light)',
          color: 'var(--error)',
          borderColor: 'var(--error)',
        }
      case 'logistics':
        return {
          backgroundColor: 'var(--info-light)',
          color: 'var(--info)',
          borderColor: 'var(--info)',
        }
      default:
        return {
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          borderColor: 'var(--primary)',
        }
    }
  }

  return (
    <Card variant="glass" className="flex-col gap-4" style={{ height: '28rem', display: 'flex', flexDirection: 'column' }}>
      <div
        className="flex-between flex-row border-bottom"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} style={{ color: 'var(--primary)' }} />
            <h3
              className="section-title mb-0"
              style={{ fontSize: '18px', fontFamily: 'var(--font-heading)' }}
            >
              {i18n._(SalesActivityFeedText.TITLE)}
            </h3>
          </div>
          <p
            className="page-subtitle"
            style={{ fontSize: '12px', margin: '2px 0 0 0' }}
          >
            {i18n._(SalesActivityFeedText.SUBTITLE)}
          </p>
        </div>
        <div
          className="system-status flex-center"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 12px',
            backgroundColor: 'var(--surface-hover)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}
        >
          <span
            className="status-dot success animate-pulse"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
            }}
          />
          <span className="font-semibold text-xs">
            {i18n._(SalesActivityFeedText.STATUS_TEXT)}
          </span>
        </div>
      </div>

      {/* Alternative 1: Interactive Category Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '5px 11px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSelected
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border)',
                backgroundColor: isSelected
                  ? 'var(--primary-light)'
                  : 'var(--surface)',
                color: isSelected
                  ? 'var(--primary)'
                  : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  backgroundColor: isSelected
                    ? 'var(--primary)'
                    : 'var(--surface-hover)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div
        className="activity-feed-list flex-col gap-3 pt-1 flex-1"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', minHeight: 0, paddingRight: '4px' }}
      >
        {filteredActivities.map((item) => {
          const Icon = ICON_MAP[item.iconName]
          const loc = activityMap[item.id]
          const actionStyles = getActionStyle(item.actionVariant)

          return (
            <div
              key={item.id}
              className="activity-item flex-row flex-between p-3 rounded-xl transition-all hover-lift"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${getCategoryBorderColor(item.category)}`,
                boxShadow: item.category === 'alert'
                  ? '0 2px 12px rgba(217, 48, 37, 0.08)'
                  : 'var(--shadow-sm)',
                gap: '12px',
              }}
            >
              <div
                className="flex-row items-center gap-3"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, minWidth: 0 }}
              >
                <div
                  className="flex-center"
                  style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: 'transparent',
                  }}
                >
                  <Icon size={20} className={item.iconColor} />
                </div>
                <div
                  className="flex-col"
                  style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
                >
                  <div
                    className="flex-row items-center gap-2 flex-wrap"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span
                      className="font-bold text-sm"
                      style={{ color: 'var(--text)' }}
                    >
                      {loc ? i18n._(loc.title) : item.title}
                    </span>
                    <span
                      className="text-xs text-muted font-medium bg-surface-hover px-2 py-0.5 rounded-full"
                      style={{ fontSize: '10px' }}
                    >
                      {loc ? i18n._(loc.time) : item.time}
                    </span>
                  </div>
                  <span
                    className="text-xs text-secondary mt-0.5"
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {loc ? i18n._(loc.desc) : item.description}
                  </span>
                </div>
              </div>

              {/* Balanced Right Anchor: Amount + Contextual Action Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                }}
              >
                {item.amount && (
                  <div
                    className="font-extrabold text-sm whitespace-nowrap font-heading"
                    style={{
                      fontSize: '14px',
                      color: item.amount.startsWith('+')
                        ? 'var(--success)'
                        : 'var(--error)',
                    }}
                  >
                    {item.amount}
                  </div>
                )}

                {item.actionText && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 9px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: `1px solid ${actionStyles.borderColor}`,
                      backgroundColor: actionStyles.backgroundColor,
                      color: actionStyles.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{loc?.action ? i18n._(loc.action) : item.actionText}</span>
                    <ArrowUpRight size={12} />
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

