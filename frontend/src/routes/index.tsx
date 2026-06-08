import { createFileRoute } from '@tanstack/react-router'
import {
  LayoutDashboard,
  MessageSquare,
  Compass,
  FileSpreadsheet,
  Sparkles,
  Activity,
  CheckCircle,
  ShieldCheck,
  ExternalLink
} from 'lucide-react'
import { HeroBanner, AppCard, Card } from '../components'

export const Route = createFileRoute('/')({
  component: Home,
})

const HeroDecoration = () => (
  <div className="hero-decoration">
    <div
      className="deco-card animate-float"
      style={{
        boxShadow: 'var(--shadow-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div className="deco-header">
        <div className="deco-dot bg-error" />
        <div className="deco-dot bg-warning" />
        <div className="deco-dot bg-success" />
      </div>
      <div className="deco-content">
        <div className="deco-bar" style={{ width: '70%', background: 'var(--primary)' }} />
        <div className="deco-bar" style={{ width: '90%' }} />
        <div className="deco-bar" style={{ width: '45%', background: 'var(--accent)' }} />
        <div className="deco-bar" style={{ width: '60%' }} />
      </div>
    </div>
  </div>
)

function Home() {
  return (
    <div className="page-container home-page-container">
      {/* Hero Welcome Banner */}
      <HeroBanner
        title="Embedded Analytics"
        subtitle="Access secure Looker dashboards, engage with conversational query assistants, design customized analytical layouts, and explore visual queries on demand."
        badgeText="Looker Analytics Platform"
        badgeIcon={Sparkles}
        decoration={<HeroDecoration />}
      />

      {/* Metrics Row */}
      <div className="apps-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Card variant="glass" className="flex-row gap-4 flex-center" style={{ padding: 'var(--space-4)' }}>
          <div className="app-icon-container bg-success-light">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="flex-col">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>System Connection</span>
            <span style={{ fontWeight: '700', fontSize: 'var(--text-base)' }}>Active</span>
          </div>
        </Card>

        <Card variant="glass" className="flex-row gap-4 flex-center" style={{ padding: 'var(--space-4)' }}>
          <div className="app-icon-container bg-primary-light">
            <Activity size={20} className="text-primary" />
          </div>
          <div className="flex-col">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>API Latency</span>
            <span style={{ fontWeight: '700', fontSize: 'var(--text-base)' }}>124 ms</span>
          </div>
        </Card>

        <Card variant="glass" className="flex-row gap-4 flex-center" style={{ padding: 'var(--space-4)' }}>
          <div className="app-icon-container bg-accent-light">
            <ShieldCheck size={20} className="text-accent" />
          </div>
          <div className="flex-col">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>Authorization Level</span>
            <span style={{ fontWeight: '700', fontSize: 'var(--text-base)' }}>Administrator</span>
          </div>
        </Card>
      </div>

      {/* Main Apps Grid */}
      <section className="section-container">
        <h2 className="section-title">Core Applications</h2>
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
            to="/chat"
            title="Chat Assistant"
            description="Interact with a conversational AI analytics assistant to query metrics."
            icon={MessageSquare}
            iconColor="text-accent"
            iconBgColor="bg-accent-light"
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
      <Card variant="default" className="resource-banner flex-between flex-row gap-4" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="flex-col gap-1">
          <h3 className="resource-title">Developer documentation</h3>
          <p className="resource-subtitle" style={{ marginBottom: 0 }}>Learn how to embed dashboards, build custom visualization extensions, and manage user attribute variables.</p>
        </div>
        <a
          href="https://developers.looker.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary flex-center gap-2"
          style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
        >
          <span>Read Docs</span>
          <ExternalLink size={14} />
        </a>
      </Card>
    </div>
  )
}
