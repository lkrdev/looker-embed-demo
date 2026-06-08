import { createFileRoute } from '@tanstack/react-router'
import { PageHeader, EmbedPlaceholder } from '../components'

export const Route = createFileRoute('/chat')({
  component: Chat,
})

function Chat() {
  return (
    <div className="page-container">
      <PageHeader
        title="Chat Assistant"
        subtitle="Conversational analytics assistant."
      />
      <EmbedPlaceholder />
    </div>
  )
}
