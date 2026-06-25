import { createFileRoute } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'
import { ConversationalAnalytics as ConversationalAnalyticsText } from '../config/ConversationalAnalytics'

export const Route = createFileRoute('/conversational-analytics')({
  component: ConversationalAnalytics,
})

function ConversationalAnalytics() {
  const { selectedType } = usePortal()
  const { i18n } = useLingui()

  if (isRouteGated('/conversational-analytics', selectedType)) {
    return <AccessDenied title={i18n._(ConversationalAnalyticsText.TITLE)} />
  }

  return (
    <div className="page-container">
      <PageHeader
        title={i18n._(ConversationalAnalyticsText.TITLE)}
        subtitle={i18n._(ConversationalAnalyticsText.SUBTITLE)}
      />
      <EmbedPlaceholder />
    </div>
  )
}

