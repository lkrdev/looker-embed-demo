import { msg } from "@lingui/core/macro";

export const UpgradeModalText = {
  HEADER_BADGE: msg`Workspace Tier Upgrade`,
  TITLE: msg`Upgrade Your Workspace`,
  SUBTITLE: msg`Unlock powerful analytics, AI assistants, and custom report creation. Switch plans instantly at any time.`,
  ROUTE_LOCKED_ALERT: msg`This route requires a higher access tier. Select a plan below to instantly upgrade and continue.`,
  CURRENT_PLAN_BADGE: msg`Current Plan`,
  RECOMMENDED_BADGE: msg`Most Popular`,
  FULL_ACCESS_BADGE: msg`Full Enterprise Access`,

  // Tier Titles
  TIER_SIMPLE_TITLE: msg`Simple Embed User`,
  TIER_SIMPLE_ROLE: msg`Viewer`,
  TIER_SIMPLE_DESC: msg`Essential analytics access with standard dashboard exploration and metric viewing.`,

  TIER_GEMINI_TITLE: msg`Gemini Embed User`,
  TIER_GEMINI_ROLE: msg`Conversational AI`,
  TIER_GEMINI_DESC: msg`Supercharge workflow with natural language querying and autonomous data agents.`,

  TIER_ADVANCED_TITLE: msg`Advanced Embed User`,
  TIER_ADVANCED_DESC: msg`Complete developer and analyst freedom with custom LookML exploration and reporting.`,
  TIER_ADVANCED_ROLE: msg`Explorer & Builder`,

  // Features
  FEAT_SIMPLE_1: msg`Interactive Looker dashboards`,
  FEAT_SIMPLE_2: msg`Standard filtering & cross-filtering`,
  FEAT_SIMPLE_3: msg`Export and view generated reports`,

  FEAT_GEMINI_1: msg`Everything in Simple Embed User`,
  FEAT_GEMINI_2: msg`Natural language Conversational Analytics`,
  FEAT_GEMINI_3: msg`Autonomous AI Data Agents & assistants`,
  FEAT_GEMINI_4: msg`AI-powered executive data summaries`,

  FEAT_ADVANCED_1: msg`Everything in Gemini Embed User`,
  FEAT_ADVANCED_2: msg`Full drag-and-drop Report Builder`,
  FEAT_ADVANCED_3: msg`Unrestricted LookML Query Explorer`,
  FEAT_ADVANCED_4: msg`Custom calculated dimensions & drill-downs`,

  // CTA buttons
  CTA_SWITCH: msg`Switch to Plan`,
  CTA_ACTIVE: msg`Active Plan`,
  CTA_CLOSE: msg`Maybe Later`,
};
