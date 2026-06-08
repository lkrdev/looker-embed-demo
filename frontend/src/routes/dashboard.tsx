import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder } from '../components'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        subtitle="Visual analytical dashboards and reports."
      />
      <EmbedPlaceholder />
    </div>
  )
}
