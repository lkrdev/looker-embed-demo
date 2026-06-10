import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'

export const Route = createFileRoute('/conversational-analytics')({
  component: ConversationalAnalytics,
})

function ConversationalAnalytics() {
  const { selectedType } = usePortal()

  if (selectedType === 'simple') {
    return <AccessDenied title="Conversational Analytics" />
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Conversational Analytics"
        subtitle="Interact with a conversational AI analytics assistant to query metrics."
      />
      <EmbedPlaceholder />
    </div>
  )
}
