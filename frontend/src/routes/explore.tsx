import { createFileRoute } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'
import { Explore as ExploreText } from '../config/Explore'

export const Route = createFileRoute('/explore')({
  component: Explore,
})

function Explore() {
  const { selectedType } = usePortal()
  const { i18n } = useLingui()

  if (isRouteGated('/explore', selectedType)) {
    return <AccessDenied title={i18n._(ExploreText.TITLE)} />
  }

  return (
    <div className="page-container">
      <PageHeader
        title={i18n._(ExploreText.TITLE)}
        subtitle={i18n._(ExploreText.SUBTITLE)}
      />
      <EmbedPlaceholder />
    </div>
  )
}

