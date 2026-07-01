import React from 'react';
import { IntermediaryTimeline } from './IntermediaryTimeline';
import { MarkdownRenderer } from './MarkdownRenderer';
import { User } from 'lucide-react';
import { LookerLogo } from '../layout/LookerLogo';

interface MessageTurnProps {
  userMessage?: any;
  intermediarySteps?: any[];
  finalResponse?: any;
  isActiveStream?: boolean;
}

export const MessageTurn: React.FC<MessageTurnProps> = ({
  userMessage,
  intermediarySteps = [],
  finalResponse,
  isActiveStream,
}) => {
  const userText = userMessage?.message?.userMessage?.text || userMessage?.userMessage?.text || userMessage?.text;
  const finalMsg = finalResponse?.message?.systemMessage || finalResponse?.systemMessage || finalResponse;
  const finalText = Array.isArray(finalMsg?.text?.parts) ? finalMsg.text.parts.join(' ') : (typeof finalMsg?.text === 'string' ? finalMsg.text : (typeof finalMsg?.text?.parts === 'string' ? finalMsg.text.parts : null));

  return (
    <div className="agents-turn-container">
      {/* 1. User Message (Right aligned) */}
      {userText && (
        <div className="agents-user-row">
          <div className="agents-user-bubble">
            {userText}
          </div>
          <div className="agents-user-avatar">
            <User size={16} />
          </div>
        </div>
      )}

      {/* 2. Agent Response (Left aligned) */}
      {(intermediarySteps.length > 0 || finalText || isActiveStream) && (
        <div className="agents-assistant-row">
          <div className="agents-assistant-avatar">
            <LookerLogo width={20} height={20} className={isActiveStream && intermediarySteps.length === 0 ? "agents-logo-pulse" : ""} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="agents-assistant-content">
            {/* Default Loading State when waiting for first message */}
            {isActiveStream && intermediarySteps.length === 0 && !finalText && (
              <div className="agents-loading-card">
                <div className="agents-loading-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span className="agents-loading-text">Analyzing data and generating query...</span>
              </div>
            )}

            {/* Intermediary Collapsible Timeline */}
            {intermediarySteps.length > 0 && (
              <IntermediaryTimeline steps={intermediarySteps} isActiveStream={isActiveStream} />
            )}

            {/* Final Output Message (Uncollapsed & Displayed in full) */}
            {finalText && (
              <div className="agents-final-bubble">
                <MarkdownRenderer content={finalText} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
