import React, { useState } from 'react';
import { Plus, Search, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface AgentsSidebarProps {
  conversations: any[];
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AgentsSidebar: React.FC<AgentsSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = (conversations || []).filter(c =>
    (c?.name || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="agents-sidebar collapsed">
        <button
          onClick={onToggleCollapse}
          className="agents-sidebar-toggle-btn"
          title="Expand menu"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={onCreateConversation}
          className="agents-new-chat-icon-only"
          title="New chat"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="agents-sidebar">
      {/* Top Header with Collapse Button */}
      <div className="agents-sidebar-header">
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Conversations</span>
        <button
          onClick={onToggleCollapse}
          className="agents-sidebar-toggle-btn"
          title="Collapse menu"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Gemini Pill New Chat Button */}
      <button
        onClick={onCreateConversation}
        className="agents-new-chat-pill"
      >
        <Plus size={18} style={{ color: 'var(--text-muted)' }} />
        <span>New chat</span>
      </button>

      {/* Search Input */}
      <div className="agents-search-wrapper">
        <Search size={15} className="agents-search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          className="agents-search-input"
        />
      </div>

      {/* Recents Section Title */}
      <div className="agents-recents-title">Recents</div>

      {/* Conversations List */}
      <div className="agents-conv-list">
        {filteredConversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            No recent chats
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`agents-conv-item ${isActive ? 'active' : ''}`}
              >
                <div className="agents-conv-title">
                  <MessageSquare size={15} style={{ flexShrink: 0, opacity: 0.6 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.name || 'Untitled Chat'}
                  </span>
                </div>
                <button
                  onClick={(e) => onDeleteConversation(conv.id, e)}
                  className="agents-conv-delete-btn"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
