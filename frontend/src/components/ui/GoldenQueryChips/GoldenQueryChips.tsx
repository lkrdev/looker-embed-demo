import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLingui } from "@lingui/react";
import { GeminiEnterpriseModalText } from "../../../config/GeminiEnterpriseModal";
import type { GoldenQueryPrompt } from "../../../types";
import styles from "./GoldenQueryChips.module.css";

interface GoldenQueryChipsProps {
  prompts: GoldenQueryPrompt[];
  onSelectPrompt?: (question: string) => void;
  compact?: boolean;
}

export const GoldenQueryChips: React.FC<GoldenQueryChipsProps> = ({
  prompts,
  onSelectPrompt,
  compact = false,
}) => {
  const { i18n } = useLingui();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (e: React.MouseEvent, text: string, idx: number) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(() => {
        setCopiedIdx((prev) => (prev === idx ? null : prev));
      }, 1500);
    } catch {
      // Ignore clipboard permission failure in restricted contexts
    }
  };

  return (
    <div className={`${styles.chipsGrid} ${compact ? styles.compact : ""}`}>
      {prompts.map((item, idx) => {
        const isCopied = copiedIdx === idx;
        const badgeClass =
          ({ purple: styles.badgePurple, green: styles.badgeGreen } as Record<string, string>)[
            item.variant
          ] || styles.badgeBlue;

        return (
          <div
            key={item.question}
            role={onSelectPrompt ? "button" : undefined}
            tabIndex={onSelectPrompt ? 0 : undefined}
            className={`${styles.chipCard} ${onSelectPrompt ? styles.clickable : ""} ${
              isCopied ? styles.copiedCard : ""
            }`}
            onClick={(e) => {
              if (onSelectPrompt) {
                onSelectPrompt(item.question);
              } else {
                handleCopy(e, item.question, idx);
              }
            }}
            onKeyDown={(e) => {
              if (onSelectPrompt && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectPrompt(item.question);
              }
            }}
          >
            <div className={styles.chipBody}>
              <span className={`${styles.chipBadge} ${badgeClass}`}>
                {item.badge}
              </span>
              <span className={styles.chipText}>{item.question}</span>
            </div>

            <button
              type="button"
              className={`${styles.copyBtn} ${isCopied ? styles.copiedBtn : ""}`}
              onClick={(e) => handleCopy(e, item.question, idx)}
              aria-label={i18n._(GeminiEnterpriseModalText.COPY_PROMPT_ARIA)}
              title={
                isCopied
                  ? i18n._(GeminiEnterpriseModalText.BTN_COPIED)
                  : i18n._(GeminiEnterpriseModalText.COPY_PROMPT_ARIA)
              }
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        );
      })}
    </div>
  );
};
