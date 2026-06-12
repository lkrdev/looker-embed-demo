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
    <div className="deco-card animate-float">
      <div className="deco-header">
        <div className="deco-dot bg-error" />
        <div className="deco-dot bg-warning" />
        <div className="deco-dot bg-success" />
      </div>
      <div className="deco-content">
        <div className="deco-bar bg-primary" style={{ width: '70%' }} />
        <div className="deco-bar" style={{ width: '90%' }} />
        <div className="deco-bar bg-accent" style={{ width: '45%' }} />
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
      <div className="metrics-grid">
        <Card variant="glass" className="flex-row gap-4 flex-center card-compact">
          <div className="app-icon-container bg-success-light">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="flex-col">
            <span className="text-xs text-muted font-medium">System Connection</span>
            <span className="font-bold text-base">Active</span>
          </div>
        </Card>

        <Card variant="glass" className="flex-row gap-4 flex-center card-compact">
          <div className="app-icon-container bg-primary-light">
            <Activity size={20} className="text-primary" />
          </div>
          <div className="flex-col">
            <span className="text-xs text-muted font-medium">API Latency</span>
            <span className="font-bold text-base">124 ms</span>
          </div>
        </Card>

        <Card variant="glass" className="flex-row gap-4 flex-center card-compact">
          <div className="app-icon-container bg-accent-light">
            <ShieldCheck size={20} className="text-accent" />
          </div>
          <div className="flex-col">
            <span className="text-xs text-muted font-medium">Authorization Level</span>
            <span className="font-bold text-base">Administrator</span>
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
      <Card variant="default" className="resource-banner flex-between flex-row gap-4 rounded-xl">
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
