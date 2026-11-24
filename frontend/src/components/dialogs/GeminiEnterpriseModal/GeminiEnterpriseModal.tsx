import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useLingui } from "@lingui/react";
import {
  API_BASE_URL,
  CHAT_AGENT_ID,
  LOOKER_GE_SA_EMAIL,
} from "../../../config/constants";
import {
  AGENT_NAME_TRANSLATIONS,
  GeminiEnterpriseModalText,
} from "../../../config/GeminiEnterpriseModal";
import { usePortal } from "../../../context/PortalContext";
import { useGeAgentInfo } from "../../../hooks/useGeAgentInfo";
import type { GeAgentSummary, GeLocation } from "../../../types";
import { GoldenQueryChips } from "../../ui/GoldenQueryChips";
import styles from "./GeminiEnterpriseModal.module.css";

const REGIONS: GeLocation[] = ["global", "us", "eu"];

export function GeminiEnterpriseModal() {
  const { i18n } = useLingui();
  const {
    isGeModalOpen,
    setIsGeModalOpen,
    isGePromptsOpen,
    setIsGePromptsOpen,
    language,
    navigateIframe,
    embedTheme,
  } = usePortal();
  const { data: agentInfo } = useGeAgentInfo();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetAgentId, setTargetAgentId] = useState<string>(CHAT_AGENT_ID);
  const [project, setProject] = useState("");
  const [region, setRegion] = useState<GeLocation>("global");
  const [engineId, setEngineId] = useState("");
  const [saCopied, setSaCopied] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const isAnyOpen = isGeModalOpen || isGePromptsOpen;

  useEffect(() => {
    if (!isAnyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSeeding) {
        setIsGeModalOpen(false);
        setIsGePromptsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAnyOpen, isSeeding, setIsGeModalOpen, setIsGePromptsOpen]);

  if (!isAnyOpen) return null;

  const serviceAccount =
    agentInfo?.installer_service_account ||
    LOOKER_GE_SA_EMAIL ||
    "your-cloud-run-sa@your-project.iam.gserviceaccount.com";

  const agents: GeAgentSummary[] =
    agentInfo?.agents && agentInfo.agents.length > 0
      ? agentInfo.agents
      : [
          {
            agent_id: agentInfo?.agent_id || CHAT_AGENT_ID,
            name: agentInfo?.name || "Ecomm Data Agent",
            description: agentInfo?.description || "",
            prompts: agentInfo?.golden_queries ?? [],
          },
        ];

  const getLocalizedAgentName = (rawName: string) =>
    AGENT_NAME_TRANSLATIONS[rawName]
      ? i18n._(AGENT_NAME_TRANSLATIONS[rawName])
      : rawName;

  const handleCopySa = async () => {
    try {
      await navigator.clipboard.writeText(serviceAccount);
      setSaCopied(true);
      window.setTimeout(() => setSaCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSeedPrompt = async (question: string, agentId: string) => {
    if (isSeeding) return;

    try {
      await navigator.clipboard.writeText(question);
    } catch {
      // Ignore clipboard failure
    }

    setIsSeeding(true);
    setSeedError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question,
          agent_id: agentId,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.conversation_id) {
        throw new Error(data?.detail || "Failed to seed conversation.");
      }

      setIsGePromptsOpen(false);
      await navigateIframe(
        `/embed/conversations/${encodeURIComponent(
          data.conversation_id
        )}?theme=${encodeURIComponent(embedTheme)}`
      );
    } catch (err: any) {
      setSeedError(err?.message || "Failed to seed conversation.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (isGePromptsOpen) {
    return (
      <div
        className={styles.overlay}
        onClick={() => {
          if (!isSeeding) setIsGePromptsOpen(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ge-prompts-modal-title"
      >
        <div
          className={`${styles.modal} ${styles.promptsModal}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div>
              <h2 id="ge-prompts-modal-title" className={styles.title}>
                {i18n._(GeminiEnterpriseModalText.PROMPTS_MODAL_TITLE)}
              </h2>
              <p className={styles.subtitle}>
                {i18n._(GeminiEnterpriseModalText.PROMPTS_SUBTITLE_CA)}
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              disabled={isSeeding}
              onClick={() => setIsGePromptsOpen(false)}
              aria-label={i18n._(GeminiEnterpriseModalText.CLOSE_ARIA)}
            >
              <X size={18} />
            </button>
          </div>

          {isSeeding && (
            <div className={styles.seedingBanner}>
              <LoaderCircle size={15} className={styles.spinIcon} />
              <span>
                {i18n._(GeminiEnterpriseModalText.SEEDING_CONVERSATION)}
              </span>
            </div>
          )}

          {seedError && (
            <div className={`${styles.statusBanner} ${styles.statusErr}`}>
              {seedError}
            </div>
          )}

          <div
            className={`${styles.stepBody} ${
              isSeeding ? styles.seedingDimmed : ""
            }`}
          >
            <div className={styles.agentPromptsStack}>
              {agents.map((ag) => (
                <section key={ag.agent_id} className={styles.agentPromptGroup}>
                  <h3 className={styles.agentGroupHeading}>
                    {i18n._(GeminiEnterpriseModalText.SECTION_PREFIX)}{" "}
                    {getLocalizedAgentName(ag.name)}
                  </h3>
                  <GoldenQueryChips
                    prompts={ag.prompts}
                    compact
                    onSelectPrompt={(q) => handleSeedPrompt(q, ag.agent_id)}
                  />
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.trim() || !engineId.trim() || isInstalling) return;
    setIsInstalling(true);
    setInstallStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ge/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project: project.trim(),
          location: region,
          engine_id: engineId.trim(),
          agent_id: targetAgentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Installation failed");
      }
      setInstallStatus({
        ok: true,
        message: i18n._(GeminiEnterpriseModalText.INSTALL_SUCCESS),
      });
    } catch (err: any) {
      setInstallStatus({
        ok: false,
        message: err?.message || "Installation failed",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const stepsMeta = [
    { num: 1 as const, label: i18n._(GeminiEnterpriseModalText.STEP_PILL_1) },
    { num: 2 as const, label: i18n._(GeminiEnterpriseModalText.STEP_PILL_2) },
    { num: 3 as const, label: i18n._(GeminiEnterpriseModalText.STEP_PILL_3) },
  ];

  const renderSaCopyBox = () => (
    <div className={styles.saBox}>
      <code className={styles.saCode} title={serviceAccount}>
        {serviceAccount}
      </code>
      <button
        type="button"
        className={styles.saCopyBtn}
        onClick={handleCopySa}
      >
        {saCopied ? <Check size={13} /> : <Copy size={13} />}
        <span>
          {saCopied
            ? i18n._(GeminiEnterpriseModalText.BTN_COPIED)
            : i18n._(GeminiEnterpriseModalText.BTN_COPY)}
        </span>
      </button>
    </div>
  );

  return (
    <div
      className={styles.overlay}
      onClick={() => setIsGeModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ge-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.headerPill}>
              <Sparkles size={13} />
              <span>{i18n._(GeminiEnterpriseModalText.HEADER_PILL)}</span>
            </div>
            <h2 id="ge-modal-title" className={styles.title}>
              {i18n._(GeminiEnterpriseModalText.TITLE)}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsGeModalOpen(false)}
            aria-label={i18n._(GeminiEnterpriseModalText.CLOSE_ARIA)}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.stepperBar} role="tablist">
          {stepsMeta.map((s, idx) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.stepPill} ${
                    isActive ? styles.stepPillActive : ""
                  } ${isDone ? styles.stepPillDone : ""}`}
                  onClick={() => setStep(s.num)}
                >
                  <span className={styles.stepBadge}>
                    {isDone ? <Check size={11} /> : s.num}
                  </span>
                  <span className={styles.stepLabel}>{s.label}</span>
                </button>
                {idx < stepsMeta.length - 1 && (
                  <div
                    className={`${styles.stepConnector} ${
                      isDone ? styles.stepConnectorDone : ""
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className={styles.stepBody}>
          {step === 1 && (
            <div className={styles.stepPanel}>
              <h3 className={styles.stepHeading}>
                1. {i18n._(GeminiEnterpriseModalText.STEP_1_TITLE)}
              </h3>
              <ol className={styles.instructionList}>
                <li>{i18n._(GeminiEnterpriseModalText.STEP_1_ITEM_1)}</li>
                <li>
                  <div>{i18n._(GeminiEnterpriseModalText.STEP_1_ITEM_2)}</div>
                  {renderSaCopyBox()}
                </li>
                <li>{i18n._(GeminiEnterpriseModalText.STEP_1_ITEM_3)}</li>
              </ol>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepPanel}>
              <h3 className={styles.stepHeading}>
                2. {i18n._(GeminiEnterpriseModalText.STEP_2_TITLE)}
              </h3>
              <ol className={styles.instructionList}>
                <li>{i18n._(GeminiEnterpriseModalText.STEP_2_ITEM_1)}</li>
                <li>
                  <div>{i18n._(GeminiEnterpriseModalText.STEP_2_ITEM_2)}</div>
                  {renderSaCopyBox()}
                </li>
              </ol>
              <p className={styles.subtleNote}>
                {i18n._(GeminiEnterpriseModalText.STEP_2_NOTE)}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepPanel}>
              <h3 className={styles.stepHeading}>
                3. {i18n._(GeminiEnterpriseModalText.STEP_3_TITLE)}
              </h3>

              <form className={styles.installForm} onSubmit={handleInstall}>
                <div className={styles.formGrid}>
                  {agents.length > 1 && (
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label>{i18n._(GeminiEnterpriseModalText.LABEL_AGENT)}</label>
                      <div
                        className={styles.regionGroup}
                        role="radiogroup"
                        aria-label={i18n._(GeminiEnterpriseModalText.LABEL_AGENT)}
                      >
                        {agents.map((ag) => (
                          <button
                            key={ag.agent_id}
                            type="button"
                            role="radio"
                            aria-checked={targetAgentId === ag.agent_id}
                            className={`${styles.regionBtn} ${
                              targetAgentId === ag.agent_id
                                ? styles.regionBtnActive
                                : ""
                            }`}
                            onClick={() => setTargetAgentId(ag.agent_id)}
                          >
                            {getLocalizedAgentName(ag.name)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label htmlFor="ge-project-input">
                      {i18n._(GeminiEnterpriseModalText.LABEL_PROJECT)}
                    </label>
                    <input
                      id="ge-project-input"
                      type="text"
                      className={styles.input}
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      placeholder={i18n._(
                        GeminiEnterpriseModalText.PLACEHOLDER_PROJECT
                      )}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>{i18n._(GeminiEnterpriseModalText.LABEL_REGION)}</label>
                    <div
                      className={styles.regionGroup}
                      role="radiogroup"
                      aria-label={i18n._(GeminiEnterpriseModalText.LABEL_REGION)}
                    >
                      {REGIONS.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          role="radio"
                          aria-checked={region === loc}
                          className={`${styles.regionBtn} ${
                            region === loc ? styles.regionBtnActive : ""
                          }`}
                          onClick={() => setRegion(loc)}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label htmlFor="ge-engine-input">
                      {i18n._(GeminiEnterpriseModalText.LABEL_ENGINE)}
                    </label>
                    <input
                      id="ge-engine-input"
                      type="text"
                      className={styles.input}
                      value={engineId}
                      onChange={(e) => setEngineId(e.target.value)}
                      placeholder={i18n._(
                        GeminiEnterpriseModalText.PLACEHOLDER_ENGINE
                      )}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.installNowBtn}
                  disabled={
                    !project.trim() || !engineId.trim() || isInstalling
                  }
                >
                  <Sparkles size={15} />
                  <span>
                    {isInstalling
                      ? i18n._(GeminiEnterpriseModalText.BTN_INSTALLING)
                      : i18n._(GeminiEnterpriseModalText.BTN_RUN_INSTALL)}
                  </span>
                </button>
              </form>

              {installStatus && (
                <div
                  className={`${styles.statusBanner} ${
                    installStatus.ok ? styles.statusOk : styles.statusErr
                  }`}
                >
                  {installStatus.message}
                </div>
              )}

              <p className={styles.subtleNote}>
                {i18n._(GeminiEnterpriseModalText.STEP_3_SYNC_NOTE)}
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              <ArrowLeft size={14} />
              <span>{i18n._(GeminiEnterpriseModalText.BTN_BACK)}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
            >
              <span>
                {step === 1
                  ? i18n._(GeminiEnterpriseModalText.BTN_NEXT_STEP_2)
                  : i18n._(GeminiEnterpriseModalText.BTN_NEXT_STEP_3)}
              </span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.doneBtn}
              onClick={() => setIsGeModalOpen(false)}
            >
              <span>{i18n._(GeminiEnterpriseModalText.BTN_DONE)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
