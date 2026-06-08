import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder } from '../components'

export const Route = createFileRoute('/report-builder')({
  component: ReportBuilder,
})

function ReportBuilder() {
  return (
    <div className="page-container">
      <PageHeader
        title="Report Builder"
        subtitle="Design custom dashboards and reports."
      />
      <EmbedPlaceholder />
    </div>
  )
}
