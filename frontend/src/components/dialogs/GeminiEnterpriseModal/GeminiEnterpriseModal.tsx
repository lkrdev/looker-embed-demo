import React, { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Sparkles, X } from "lucide-react";
import { useLingui } from "@lingui/react";
import { API_BASE_URL } from "../../../config/constants";
import { GeminiEnterpriseModalText } from "../../../config/GeminiEnterpriseModal";
import { usePortal } from "../../../context/PortalContext";
import { useGeAgentInfo } from "../../../hooks/useGeAgentInfo";
import type { GeLocation } from "../../../types";
import { GoldenQueryChips } from "../../ui/GoldenQueryChips";
import styles from "./GeminiEnterpriseModal.module.css";

const REGIONS: GeLocation[] = ["global", "us", "eu"];

export function GeminiEnterpriseModal() {
  const { i18n } = useLingui();
  const { isGeModalOpen, setIsGeModalOpen } = usePortal();
  const { data: agentInfo } = useGeAgentInfo();

  const [project, setProject] = useState("");
  const [region, setRegion] = useState<GeLocation>("global");
  const [engineId, setEngineId] = useState("");
  const [cmdCopied, setCmdCopied] = useState(false);

  const [showDirectToken, setShowDirectToken] = useState(false);
  const [gcpToken, setGcpToken] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isGeModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsGeModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGeModalOpen, setIsGeModalOpen]);

  if (!isGeModalOpen) return null;

  const origin = API_BASE_URL || window.location.origin;
  const cleanProj = project.trim() || "<YOUR_PROJECT_NUMBER>";
  const cleanEng = engineId.trim() || "<YOUR_ENGINE_ID>";
  const installUrl = `${origin}/api/ge/install.sh?project=${encodeURIComponent(
    cleanProj
  )}&location=${encodeURIComponent(region)}&engine=${encodeURIComponent(cleanEng)}`;
  const curlCommand = `curl -fsSL "${installUrl}" | bash`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCmdCopied(true);
      window.setTimeout(() => setCmdCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDirectInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.trim() || !engineId.trim() || !gcpToken.trim() || isInstalling) {
      return;
    }
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
          gcp_access_token: gcpToken.trim(),
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
      setGcpToken("");
    } catch (err: any) {
      setInstallStatus({
        ok: false,
        message: err?.message || "Installation failed",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const prompts = agentInfo?.golden_queries ?? [];

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
            <p className={styles.subtitle}>
              {i18n._(GeminiEnterpriseModalText.SUBTITLE)}
            </p>
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

        <div className={styles.formGrid}>
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
              placeholder={i18n._(GeminiEnterpriseModalText.PLACEHOLDER_PROJECT)}
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
              placeholder={i18n._(GeminiEnterpriseModalText.PLACEHOLDER_ENGINE)}
            />
          </div>
        </div>

        <div className={styles.cmdBar}>
          <code className={styles.cmdCode} title={curlCommand}>
            {curlCommand}
          </code>
          <button
            type="button"
            className={styles.cmdCopyBtn}
            onClick={handleCopyCommand}
          >
            {cmdCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>
              {cmdCopied
                ? i18n._(GeminiEnterpriseModalText.BTN_COPIED)
                : i18n._(GeminiEnterpriseModalText.BTN_COPY_COMMAND)}
            </span>
          </button>
        </div>

        <div className={styles.stepsBar}>
          <div>
            <span className={styles.stepNum}>1.</span>{" "}
            {i18n._(GeminiEnterpriseModalText.STEP_1)}
          </div>
          <div>
            <span className={styles.stepNum}>2.</span>{" "}
            {i18n._(GeminiEnterpriseModalText.STEP_2)}
          </div>
          <div>
            <span className={styles.stepNum}>3.</span>{" "}
            {i18n._(GeminiEnterpriseModalText.STEP_3)}
          </div>
        </div>

        <div>
          <button
            type="button"
            className={styles.directToggleBtn}
            onClick={() => setShowDirectToken((v) => !v)}
          >
            <span>{i18n._(GeminiEnterpriseModalText.TOGGLE_DIRECT_INSTALL)}</span>
            {showDirectToken ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDirectToken && (
            <form className={styles.directForm} onSubmit={handleDirectInstall}>
              <input
                type="password"
                className={styles.input}
                value={gcpToken}
                onChange={(e) => setGcpToken(e.target.value)}
                placeholder={i18n._(GeminiEnterpriseModalText.PLACEHOLDER_TOKEN)}
              />
              <button
                type="submit"
                className={styles.installNowBtn}
                disabled={
                  !project.trim() || !engineId.trim() || !gcpToken.trim() || isInstalling
                }
              >
                {isInstalling
                  ? i18n._(GeminiEnterpriseModalText.BTN_INSTALLING)
                  : i18n._(GeminiEnterpriseModalText.BTN_RUN_INSTALL)}
              </button>
            </form>
          )}

          {installStatus && (
            <div
              className={`${styles.statusBanner} ${
                installStatus.ok ? styles.statusOk : styles.statusErr
              }`}
            >
              {installStatus.message}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.promptsSection}>
          <div className={styles.promptsHeader}>
            <span className={styles.promptsTitle}>
              {i18n._(GeminiEnterpriseModalText.PROMPTS_HEADER)}
            </span>
            <span className={styles.promptsCount}>
              {prompts.length} {i18n._(GeminiEnterpriseModalText.PROMPTS_COUNT_LABEL)}
            </span>
          </div>
          <div className={styles.promptsScroll}>
            <GoldenQueryChips prompts={prompts} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
