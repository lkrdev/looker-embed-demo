import React from 'react';
import { IntermediaryTimeline } from '../IntermediaryTimeline';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { VegaLiteRenderer } from '../VegaLiteRenderer';
import { User } from 'lucide-react';
import { useLingui } from '@lingui/react';
import { LookerLogo } from '../../layout/LookerLogo';
import { MessageBubble as MessageBubbleText } from '../../../config/MessageBubble';
import styles from './MessageBubble.module.css';

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
  const { i18n } = useLingui();
  const rawUserText = userMessage?.message?.userMessage?.text || userMessage?.userMessage?.text || userMessage?.text;
  const userText = typeof rawUserText === 'string'
    ? rawUserText.replace(/\n\n\[(?:System )?Instruction:.*?\]/gs, '')
    : rawUserText;
  const finalMsg = finalResponse?.message?.systemMessage || finalResponse?.systemMessage || finalResponse;
  const finalText = Array.isArray(finalMsg?.text?.parts) ? finalMsg.text.parts.join(' ') : (typeof finalMsg?.text === 'string' ? finalMsg.text : (typeof finalMsg?.text?.parts === 'string' ? finalMsg.text.parts : null));
  const vegaConfig = finalMsg?.chart?.result?.vegaConfig || finalMsg?.chart?.vegaConfig || finalMsg?.chart || finalMsg?.vegaConfig || finalResponse?.chart?.result?.vegaConfig || finalResponse?.chart?.vegaConfig || finalResponse?.chart || finalResponse?.vegaConfig;

  return (
    <div className={styles.agentsTurnContainer}>
      {/* 1. User Message (Right aligned) */}
      {userText && (
        <div className={styles.agentsUserRow}>
          <div className={styles.agentsUserBubble}>
            {userText}
          </div>
          <div className={styles.agentsUserAvatar}>
            <User size={16} />
          </div>
        </div>
      )}

      {/* 2. Agent Response (Left aligned) */}
      {(intermediarySteps.length > 0 || finalText || vegaConfig || isActiveStream) && (
        <div className={styles.agentsAssistantRow}>
          <div className={styles.agentsAssistantAvatar}>
            <LookerLogo width={20} height={20} className={isActiveStream && intermediarySteps.length === 0 ? styles.agentsLogoPulse : ""} style={{ color: 'var(--accent)' }} />
          </div>
          <div className={styles.agentsAssistantContent}>
            {/* Default Loading State when waiting for first message */}
            {isActiveStream && intermediarySteps.length === 0 && !finalText && !vegaConfig && (
              <div className={styles.agentsLoadingCard}>
                <div className={styles.agentsLoadingDots}>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span className={styles.agentsLoadingText}>{i18n._(MessageBubbleText.ANALYZING_DATA)}</span>
              </div>
            )}

            {/* Intermediary Collapsible Timeline */}
            {intermediarySteps.length > 0 && (
              <IntermediaryTimeline steps={intermediarySteps} isActiveStream={isActiveStream} />
            )}

            {/* Final Output Message (Uncollapsed & Displayed in full) */}
            {(finalText || vegaConfig) && (
              <div className={styles.agentsFinalBubble}>
                {vegaConfig && <VegaLiteRenderer spec={vegaConfig} />}
                {finalText && <MarkdownRenderer content={finalText} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
