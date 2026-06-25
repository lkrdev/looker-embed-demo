import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'

export const Route = createFileRoute('/explore')({
  component: Explore,
})

function Explore() {
  const { selectedType } = usePortal()

  if (isRouteGated('/explore', selectedType)) {
    return <AccessDenied title="Explore" />
  }

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
