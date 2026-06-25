import { createFileRoute } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'
import { Agents as AgentsText } from '../config/Agents'

export const Route = createFileRoute('/agents')({
  component: Agents,
})

function Agents() {
  const { selectedType } = usePortal()
  const { i18n } = useLingui()

  if (isRouteGated('/agents', selectedType)) {
    return <AccessDenied title={i18n._(AgentsText.TITLE)} />
  }

  return (
    <div className="page-container">
      <PageHeader
        title={i18n._(AgentsText.TITLE)}
        subtitle={i18n._(AgentsText.SUBTITLE)}
      />
      <EmbedPlaceholder />
    </div>
  )
}

