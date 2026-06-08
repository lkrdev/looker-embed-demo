import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder } from '../components'

export const Route = createFileRoute('/explore')({
  component: Explore,
})

function Explore() {
  return (
    <div className="page-container">
      <PageHeader
        title="Explore"
        subtitle="Build visual queries on demand."
      />
      <EmbedPlaceholder />
    </div>
  )
}
