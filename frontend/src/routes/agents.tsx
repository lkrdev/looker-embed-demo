import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useLingui } from '@lingui/react'
import { AccessDenied } from '../components'
import { usePortal } from '../context/PortalContext'
import { isRouteGated } from '../config/constants'
import { Agents as AgentsText } from '../config/Agents'
import { useConversationalAnalytics } from '../hooks'
import { AgentsSidebar, AgentsChatArea } from '../components/agents'

export const Route = createFileRoute('/agents')({
  component: Agents,
})

function Agents() {
  const { selectedType } = usePortal()
  const { i18n } = useLingui()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const {
    conversations,
    activeConversationId,
    messages,
    isChatting,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
  } = useConversationalAnalytics()

  if (isRouteGated('/agents', selectedType)) {
    return <AccessDenied title={i18n._(AgentsText.TITLE)} />
  }

  return (
    <div className="agents-page-container">
      <AgentsSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onCreateConversation={() => createConversation()}
        onDeleteConversation={(id, e) => {
          e.stopPropagation();
          deleteConversation(id);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <AgentsChatArea
        messages={messages}
        onSendMessage={(text) => sendMessage(text)}
        onClearConversation={() => deleteConversation()}
        isChatting={isChatting}
        activeConversationId={activeConversationId}
      />
    </div>
  )
}
