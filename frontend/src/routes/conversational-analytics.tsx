import { createFileRoute } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { useLingui } from '@lingui/react'
import { PageHeader, EmbedPlaceholder, AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'
import { ConversationalAnalytics as ConversationalAnalyticsText } from '../config/ConversationalAnalytics'
import { GeminiEnterpriseModalText } from '../config/GeminiEnterpriseModal'
import styles from '../components/agents/AgentsChatArea/AgentsChatArea.module.css'

export const Route = createFileRoute('/conversational-analytics')({
  component: ConversationalAnalytics,
})

function ConversationalAnalytics() {
  const { selectedType, setIsGeModalOpen } = usePortal()
  const { i18n } = useLingui()

  if (isRouteGated('/conversational-analytics', selectedType)) {
    return <AccessDenied title={i18n._(ConversationalAnalyticsText.TITLE)} />
  }

  return (
    <div className="page-container">
      <PageHeader
        title={i18n._(ConversationalAnalyticsText.TITLE)}
        subtitle={i18n._(ConversationalAnalyticsText.SUBTITLE)}
        actions={
          <button
            type="button"
            onClick={() => setIsGeModalOpen(true)}
            className={styles.geInstallBtn}
          >
            <Sparkles size={14} />
            <span>{i18n._(GeminiEnterpriseModalText.BTN_INSTALL_GE)}</span>
          </button>
        }
      />
      <EmbedPlaceholder />
    </div>
  )
}

