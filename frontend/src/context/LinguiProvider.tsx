import React, { useEffect } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { usePortal } from "./PortalContext";
// @ts-ignore
import { messages as enMessages } from "../locales/en/messages.mjs";

// Synchronously load and activate default English catalog to prevent initial null render
i18n.load("en", enMessages);
i18n.activate("en");

const CATALOG_MAP: Record<string, string> = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
};

export const LinguiPortalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { language } = usePortal();
  const localeCode = CATALOG_MAP[language] || "en";

  useEffect(() => {
    async function loadCatalog() {
      try {
        if (localeCode === "en") {
          i18n.activate("en");
          return;
        }
        // @ts-ignore
        const catalog = await import(`../locales/${localeCode}/messages.mjs`);
        i18n.load(localeCode, catalog.messages);
        i18n.activate(localeCode);
      } catch (err) {
        console.error("Failed to load Lingui catalog for", localeCode, err);
      }
    }
    loadCatalog();
  }, [localeCode]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};
