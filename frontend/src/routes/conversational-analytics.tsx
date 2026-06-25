import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'

export const Route = createFileRoute('/conversational-analytics')({
  component: ConversationalAnalytics,
})

function ConversationalAnalytics() {
  const { selectedType } = usePortal()

  if (isRouteGated('/conversational-analytics', selectedType)) {
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
