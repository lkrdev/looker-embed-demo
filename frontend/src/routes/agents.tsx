import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'

export const Route = createFileRoute('/agents')({
  component: Agents,
})

function Agents() {
  const { selectedType } = usePortal()

  if (selectedType === 'simple') {
    return <AccessDenied title="Agents" />
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Agents"
        subtitle="Manage and interact with Looker AI agents."
      />
      <EmbedPlaceholder />
    </div>
  )
}
