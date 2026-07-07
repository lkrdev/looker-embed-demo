import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useLingui } from '@lingui/react';
import { MessageTurn } from './MessageBubble';
import { PageHeader } from '../ui/PageHeader';
import { Agents as AgentsText } from '../../config/Agents';
import { AgentsChatArea as AgentsChatAreaText } from '../../config/AgentsChatArea';

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
        const textType = (sys?.text?.textType || sys?.textType || '').toUpperCase();
        const isExplicitFinal = textType === 'FINAL_RESPONSE';
        const isKnownIntermediary =
          textType === 'THOUGHT' ||
          textType === 'INTERMEDIARY' ||
          textType === 'PROGRESS';

        const hasTechnicalPayload = Boolean(
          sys?.schema ||
            sys?.data ||
            sys?.query ||
            sys?.chart ||
            sys?.vegaConfig ||
            next?.chart ||
            next?.vegaConfig
        );

        const hasTextContent = Boolean(
          sys?.text &&
            ((typeof sys.text === 'string' && sys.text.trim().length > 0) ||
              (Array.isArray(sys.text.parts) && sys.text.parts.join('').trim().length > 0) ||
              (typeof sys.text?.parts === 'string' && sys.text.parts.trim().length > 0))
        );

        const isLastMessageInTurn =
          j === messages.length - 1 ||
          (j + 1 < messages.length &&
            (messages[j + 1].type === 'user' ||
              messages[j + 1].message?.userMessage ||
              messages[j + 1].userMessage));

        const isFinal =
          isExplicitFinal ||
          (!isKnownIntermediary &&
            !hasTechnicalPayload &&
            hasTextContent &&
            isLastMessageInTurn &&
            !isChatting);

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
          placeholder={i18n._(AgentsChatAreaText.INPUT_PLACEHOLDER)}
          disabled={isChatting}
          className="agents-gemini-input-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isChatting}
          className="agents-gemini-send-btn"
          title={i18n._(AgentsChatAreaText.SEND_MESSAGE)}
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
        title={i18n._(AgentsChatAreaText.PAGE_TITLE)}
        subtitle={i18n._(AgentsText.SUBTITLE)}
        className="agents-chat-page-header"
        actions={
          activeConversationId ? (
            <button
              onClick={onClearConversation}
              className="agents-clear-btn"
              title={i18n._(AgentsChatAreaText.CLEAR_CHAT)}
            >
              <Trash2 size={15} />
              <span>{i18n._(AgentsChatAreaText.CLEAR_CHAT)}</span>
            </button>
          ) : undefined
        }
      />

      {/* Center Greeting & Centered Input when empty */}
      {turns.length === 0 ? (
        <div className="agents-gemini-empty-container">
          <div className="agents-gemini-greeting">
            {i18n._(AgentsChatAreaText.GREETING)}
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
