import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useLingui } from "@lingui/react";
import {
  GeminiEnterpriseModalText,
  PROMPT_BADGE_TRANSLATIONS,
  PROMPT_TEXT_TRANSLATIONS,
} from "../../../config/GeminiEnterpriseModal";
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
        const localizedQuestion = PROMPT_TEXT_TRANSLATIONS[item.question]
          ? i18n._(PROMPT_TEXT_TRANSLATIONS[item.question])
          : item.question;
        const localizedBadge = PROMPT_BADGE_TRANSLATIONS[item.badge]
          ? i18n._(PROMPT_BADGE_TRANSLATIONS[item.badge])
          : item.badge;
        const badgeClass =
          (
            { purple: styles.badgePurple, green: styles.badgeGreen } as Record<
              string,
              string
            >
          )[item.variant] || styles.badgeBlue;

        return (
          <div
            key={item.question}
            role={onSelectPrompt ? "button" : undefined}
            tabIndex={onSelectPrompt ? 0 : undefined}
            className={`${styles.chipCard} ${
              onSelectPrompt ? styles.clickable : ""
            } ${isCopied ? styles.copiedCard : ""}`}
            onClick={(e) => {
              if (onSelectPrompt) {
                onSelectPrompt(localizedQuestion);
              } else {
                handleCopy(e, localizedQuestion, idx);
              }
            }}
            onKeyDown={(e) => {
              if (onSelectPrompt && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectPrompt(localizedQuestion);
              }
            }}
          >
            <div className={styles.chipBody}>
              <span className={`${styles.chipBadge} ${badgeClass}`}>
                {localizedBadge}
              </span>
              <span className={styles.chipText}>{localizedQuestion}</span>
            </div>

            <button
              type="button"
              className={`${styles.copyBtn} ${isCopied ? styles.copiedBtn : ""}`}
              onClick={(e) => handleCopy(e, localizedQuestion, idx)}
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
