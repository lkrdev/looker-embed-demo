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
  InsightsPanel
} from '../components'
import {
  KPI_TOTAL_REVENUE_QUERY_ID,
  KPI_TOTAL_ORDERS_QUERY_ID,
  KPI_AVERAGE_ORDER_VALUE_QUERY_ID
} from '../config/constants'

export const Route = createFileRoute('/')({
  component: Home,
})

const HeroDecoration = () => (
  <div className="hero-decoration">
    <div className="deco-card animate-float">
      <div className="deco-header">
        <div className="deco-dot bg-error" />
        <div className="deco-dot bg-warning" />
        <div className="deco-dot bg-success" />
      </div>
      <div className="deco-content">
        <div className="deco-bar bg-primary" style={{ width: '75%' }} />
        <div className="deco-bar" style={{ width: '90%' }} />
        <div className="deco-bar bg-accent" style={{ width: '50%' }} />
        <div className="deco-bar" style={{ width: '65%' }} />
      </div>
    </div>
  </div>
)

function Home() {
  return (
    <div className="page-container home-page-container flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Welcome Banner */}
      <HeroBanner
        title="Executive eCommerce Hub"
        subtitle="Monitor live cross-channel revenue performance, evaluate ML-driven business recommendations, and explore operational fulfillment streams."
        badgeText="The Look Analytics Platform"
        badgeIcon={Sparkles}
        decoration={<HeroDecoration />}
      />

      {/* Live REST API Powered KPI Grid */}
      <section className="kpi-section flex-col gap-3">
        <h2 className="section-title mb-0" style={{ fontSize: '20px', fontFamily: 'var(--font-heading)' }}>Live Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <KpiCard
            title="Total Revenue"
            queryId={KPI_TOTAL_REVENUE_QUERY_ID}
            badgeText="+14.2% vs last month"
            badgeVariant="success"
            icon={DollarSign}
            iconColor="text-success"
            iconBgColor="bg-success-light"
            formatter={(val) => '$' + (val / 1000000).toFixed(1) + 'M'}
          />

          <KpiCard
            title="Total Orders"
            queryId={KPI_TOTAL_ORDERS_QUERY_ID}
            badgeText="+8.4% vs last month"
            badgeVariant="info"
            icon={ShoppingBag}
            iconColor="text-primary"
            iconBgColor="bg-primary-light"
            formatter={(val) => (val / 1000).toFixed(1) + 'K'}
          />

          <KpiCard
            title="Average Order Value"
            queryId={KPI_AVERAGE_ORDER_VALUE_QUERY_ID}
            badgeText="+5.1% target yield"
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
        <SalesActivityFeed />
        <InsightsPanel />
      </section>

      {/* Main Apps Grid */}
      <section className="section-container flex-col gap-3">
        <h2 className="section-title mb-0" style={{ fontSize: '20px', fontFamily: 'var(--font-heading)' }}>Analytical Portals</h2>
        <div className="apps-grid">
          <AppCard
            to="/dashboard"
            title="Dashboard"
            description="View embedded analytical dashboard reports and real-time business insights."
            icon={LayoutDashboard}
            iconColor="text-primary"
            iconBgColor="bg-primary-light"
          />

          <AppCard
            to="/conversational-analytics"
            title="Conversational Analytics"
            description="Interact with a conversational AI analytics assistant to query metrics."
            icon={MessageSquare}
            iconColor="text-accent"
            iconBgColor="bg-accent-light"
          />

          <AppCard
            to="/agents"
            title="Agents"
            description="Manage and interact with Looker AI agents."
            icon={Sparkles}
            iconColor="text-warning"
            iconBgColor="bg-warning-light"
          />

          <AppCard
            to="/explore"
            title="Explore"
            description="Build and inspect visual queries, charts, and custom data filters on demand."
            icon={Compass}
            iconColor="text-success"
            iconBgColor="bg-success-light"
          />

          <AppCard
            to="/report-builder"
            title="Report Builder"
            description="Design personalized dashboard layouts, drag-and-drop elements, and templates."
            icon={FileSpreadsheet}
            iconColor="text-info"
            iconBgColor="bg-info-light"
          />
        </div>
      </section>

      {/* Bottom resources section */}
      <Card variant="default" className="resource-banner flex-between flex-row gap-4 rounded-xl" style={{ marginTop: '12px' }}>
        <div className="flex-col gap-1">
          <h3 className="resource-title">Developer documentation</h3>
          <p className="resource-subtitle mb-0">Learn how to embed dashboards, build custom visualization extensions, and manage user attribute variables.</p>
        </div>
        <a
          href="https://developers.looker.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary flex-center gap-2 rounded-full whitespace-nowrap"
        >
          <span>Read Docs</span>
          <ExternalLink size={14} />
        </a>
      </Card>
    </div>
  )
}
