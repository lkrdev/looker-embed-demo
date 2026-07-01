import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useLingui } from '@lingui/react';
import { MessageTurn } from './MessageBubble';
import { PageHeader } from '../ui/PageHeader';
import { Agents as AgentsText } from '../../config/Agents';

interface AgentsChatAreaProps {
  messages: any[];
  onSendMessage: (text: string) => void;
  onClearConversation: () => void;
  isChatting: boolean;
  activeConversationId: string | null;
}

export const AgentsChatArea: React.FC<AgentsChatAreaProps> = ({
  messages,
  onSendMessage,
  onClearConversation,
  isChatting,
  activeConversationId,
}) => {
  const { i18n } = useLingui();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatting]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatting) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Turn grouping logic: pair each User message with subsequent system/agent messages
  const turns: any[] = [];
  let i = 0;
  while (i < messages.length) {
    const current = messages[i];
    const type = current.type || (current.userMessage ? 'user' : 'system');

    if (type === 'user') {
      const userMsg = current;
      const steps: any[] = [];
      let finalResp: any = null;
      let j = i + 1;

      while (j < messages.length) {
        const next = messages[j];
        const nextType = next.type || (next.userMessage ? 'user' : 'system');
        if (nextType === 'user') break;

        const sys = next.message?.systemMessage || next.systemMessage || next;
        const isFinal = sys?.text?.textType === 'FINAL_RESPONSE' || (j === messages.length - 1 && sys?.text);

        if (isFinal && !finalResp) {
          finalResp = next;
        } else {
          steps.push(next);
        }
        j++;
      }
      turns.push({ userMessage: userMsg, intermediarySteps: steps, finalResponse: finalResp });
      i = j;
    } else {
      // System message without preceding user message in current window
      turns.push({ userMessage: null, intermediarySteps: [current], finalResponse: null });
      i++;
    }
  }

  const renderInputForm = () => (
    <div className="agents-gemini-input-wrapper">
      <form onSubmit={handleSend} className="agents-gemini-input-pill">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question about your data..."
          disabled={isChatting}
          className="agents-gemini-input-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isChatting}
          className="agents-gemini-send-btn"
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="agents-chat-area">
      {/* Top Bar (Formatted as PageHeader matching other pages) */}
      <PageHeader
        title="Looker Conversational Analytics API"
        subtitle={i18n._(AgentsText.SUBTITLE)}
        className="agents-chat-page-header"
        actions={
          activeConversationId ? (
            <button
              onClick={onClearConversation}
              className="agents-clear-btn"
              title="Clear chat"
            >
              <Trash2 size={15} />
              <span>Clear chat</span>
            </button>
          ) : undefined
        }
      />

      {/* Center Greeting & Centered Input when empty */}
      {turns.length === 0 ? (
        <div className="agents-gemini-empty-container">
          <div className="agents-gemini-greeting">
            Ask away!
          </div>
          {renderInputForm()}
        </div>
      ) : (
        <>
          {/* Messages Scroll Area */}
          <div ref={scrollRef} className="agents-messages-scroll">
            {turns.map((turn, idx) => (
              <MessageTurn
                key={idx}
                userMessage={turn.userMessage}
                intermediarySteps={turn.intermediarySteps}
                finalResponse={turn.finalResponse}
                isActiveStream={isChatting && idx === turns.length - 1}
              />
            ))}
          </div>

          {/* Bottom Floating Input Pill when chatting */}
          <div className="agents-bottom-input-container">
            {renderInputForm()}
          </div>
        </>
      )}
    </div>
  );
};
