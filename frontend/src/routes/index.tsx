import { createFileRoute } from '@tanstack/react-router'
import {
  LayoutDashboard,
  MessageSquare,
  Compass,
  FileSpreadsheet,
  Sparkles,
  DollarSign,
  ShoppingBag,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import {
  HeroBanner,
  AppCard,
  Card,
  KpiCard,
  SalesActivityFeed,
  InsightsPanel,
  ErrorBoundary
} from '../components'
import {
  KPI_TOTAL_REVENUE_QUERY_ID,
  KPI_TOTAL_ORDERS_QUERY_ID,
  KPI_AVERAGE_ORDER_VALUE_QUERY_ID
} from '../config/constants'
import { useLingui } from '@lingui/react'
import { Home as HomeText } from '../config/Home'
import { usePortal } from '../context/PortalContext'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { i18n } = useLingui()
  const { brand } = usePortal()

  return (
    <div className="page-container home-page-container flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'hidden' }}>
      {/* Fixed Hero Welcome Banner */}
      <header className="home-fixed-header" style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <HeroBanner
          title={i18n._(HomeText.HERO_TITLE)}
          subtitle={i18n._(HomeText.HERO_SUBTITLE)}
          badgeText={`${brand} ${i18n._(HomeText.HERO_BADGE_SUFFIX)}`}
          badgeIcon={Sparkles}
        />
      </header>

      {/* Main Content Section (Scrolling Underneath) */}
      <div className="home-scroll-content flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '28px', overflowY: 'auto', flexGrow: 1, paddingRight: '6px', paddingBottom: '24px' }}>
        {/* Live REST API Powered KPI Grid */}
      <section className="kpi-section flex-col gap-3">
        <h2 className="section-title mb-0" style={{ fontSize: '20px', fontFamily: 'var(--font-heading)' }}>{i18n._(HomeText.SECTION_KPI_TITLE)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <KpiCard
            title={i18n._(HomeText.KPI_REV_TITLE)}
            queryId={KPI_TOTAL_REVENUE_QUERY_ID}
            badgeText={i18n._(HomeText.KPI_REV_BADGE)}
            badgeVariant="success"
            icon={DollarSign}
            iconColor="text-success"
            iconBgColor="bg-success-light"
            formatter={(val) => '$' + (val / 1000000).toFixed(1) + 'M'}
          />

          <KpiCard
            title={i18n._(HomeText.KPI_ORD_TITLE)}
            queryId={KPI_TOTAL_ORDERS_QUERY_ID}
            badgeText={i18n._(HomeText.KPI_ORD_BADGE)}
            badgeVariant="info"
            icon={ShoppingBag}
            iconColor="text-primary"
            iconBgColor="bg-primary-light"
            formatter={(val) => (val / 1000).toFixed(1) + 'K'}
          />

          <KpiCard
            title={i18n._(HomeText.KPI_AOV_TITLE)}
            queryId={KPI_AVERAGE_ORDER_VALUE_QUERY_ID}
            badgeText={i18n._(HomeText.KPI_AOV_BADGE)}
            badgeVariant="warning"
            icon={CreditCard}
            iconColor="text-accent"
            iconBgColor="bg-accent-light"
            formatter={(val) => '$' + Number(val).toFixed(2)}
          />
        </div>
      </section>

      {/* Operational Ticker & Strategic ML Insights */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        <ErrorBoundary fallbackTitle={i18n._(HomeText.FALLBACK_SALES)}>
          <SalesActivityFeed />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle={i18n._(HomeText.FALLBACK_INSIGHTS)}>
          <InsightsPanel />
        </ErrorBoundary>
      </section>

      {/* Main Apps Grid */}
      <section className="section-container flex-col gap-3">
        <h2 className="section-title mb-0" style={{ fontSize: '20px', fontFamily: 'var(--font-heading)' }}>{i18n._(HomeText.SECTION_APPS_TITLE)}</h2>
        <div className="apps-grid">
          <AppCard
            to="/dashboard"
            title={i18n._(HomeText.APP_DASH_TITLE)}
            description={i18n._(HomeText.APP_DASH_DESC)}
            icon={LayoutDashboard}
            iconColor="text-primary"
            iconBgColor="bg-primary-light"
          />

          <AppCard
            to="/conversational-analytics"
            title={i18n._(HomeText.APP_CA_TITLE)}
            description={i18n._(HomeText.APP_CA_DESC)}
            icon={MessageSquare}
            iconColor="text-accent"
            iconBgColor="bg-accent-light"
          />

          <AppCard
            to="/agents"
            title={i18n._(HomeText.APP_AGENTS_TITLE)}
            description={i18n._(HomeText.APP_AGENTS_DESC)}
            icon={Sparkles}
            iconColor="text-warning"
            iconBgColor="bg-warning-light"
          />

          <AppCard
            to="/explore"
            title={i18n._(HomeText.APP_EXPLORE_TITLE)}
            description={i18n._(HomeText.APP_EXPLORE_DESC)}
            icon={Compass}
            iconColor="text-success"
            iconBgColor="bg-success-light"
          />

          <AppCard
            to="/report-builder"
            title={i18n._(HomeText.APP_REPORT_TITLE)}
            description={i18n._(HomeText.APP_REPORT_DESC)}
            icon={FileSpreadsheet}
            iconColor="text-info"
            iconBgColor="bg-info-light"
          />
        </div>
      </section>

      {/* Bottom resources section */}
      <Card variant="default" className="resource-banner flex-between flex-row gap-4 rounded-xl" style={{ marginTop: '12px' }}>
        <div className="flex-col gap-1">
          <h3 className="resource-title">{i18n._(HomeText.RESOURCE_TITLE)}</h3>
          <p className="resource-subtitle mb-0">{i18n._(HomeText.RESOURCE_SUBTITLE)}</p>
        </div>
        <a
          href="https://github.com/lkrdev/looker-embed-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary flex-center gap-2 rounded-full whitespace-nowrap"
        >
          <span>{i18n._(HomeText.RESOURCE_BTN)}</span>
          <ExternalLink size={14} />
        </a>
      </Card>
      </div>
    </div>
  )
}
