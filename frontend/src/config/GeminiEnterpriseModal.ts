import { msg } from "@lingui/core/macro";

export const GeminiEnterpriseModalText = {
  BTN_SHOW_PROMPTS: msg`Show Example Prompts`,
  BTN_INSTALL_GE: msg`Install in Gemini Enterprise`,
  HEADER_PILL: msg`Gemini Enterprise`,
  TITLE: msg`Install in Gemini Enterprise`,
  STEP_PILL_1: msg`IAM Role`,
  STEP_PILL_2: msg`GE License`,
  STEP_PILL_3: msg`Install`,

  STEP_1_TITLE: msg`Grant IAM Access`,
  STEP_1_ITEM_1: msg`In Google Cloud Console, select your Gemini Enterprise project and open IAM & Admin → IAM.`,
  STEP_1_ITEM_2: msg`Click Grant Access and paste this service account into New principals:`,
  STEP_1_ITEM_3: msg`Assign the Discovery Engine Admin (roles/discoveryengine.admin) role and click Save.`,

  STEP_2_TITLE: msg`Assign a Gemini Enterprise License`,
  STEP_2_ITEM_1: msg`Open Gemini Enterprise in Google Cloud Console and go to Manage Users (under Settings / Licenses).`,
  STEP_2_ITEM_2: msg`Verify Assign licenses automatically is enabled, or click Add Users and assign a license to the same service account:`,
  STEP_2_NOTE: msg`Gemini Enterprise requires the registering service account to hold a user seat before it can add an agent.`,

  STEP_3_TITLE: msg`Register Agent`,
  LABEL_AGENT: msg`Looker Agent`,
  LABEL_PROJECT: msg`GCP Project ID`,
  PLACEHOLDER_PROJECT: msg`e.g. my-gcp-project`,
  LABEL_REGION: msg`Region`,
  LABEL_ENGINE: msg`Gemini Enterprise App / Engine ID`,
  PLACEHOLDER_ENGINE: msg`e.g. my-ge-app_1779210162863`,
  BTN_RUN_INSTALL: msg`Install Agent`,
  BTN_INSTALLING: msg`Installing...`,
  INSTALL_SUCCESS: msg`Agent installed! Open your Gemini Enterprise app, select the Looker agent, and click Connect.`,
  STEP_3_SYNC_NOTE: msg`Once installed, open your Gemini Enterprise app, select the Looker agent, and click Connect.`,

  BTN_COPY: msg`Copy`,
  BTN_COPIED: msg`Copied!`,
  BTN_BACK: msg`Back`,
  BTN_NEXT_STEP_2: msg`Next: Add Gemini User`,
  BTN_NEXT_STEP_3: msg`Next: Install Agent`,
  BTN_DONE: msg`Done`,

  PROMPTS_MODAL_TITLE: msg`Example Prompts`,
  PROMPTS_SUBTITLE_CA: msg`Click any prompt to seed a conversation and open it in Conversational Analytics.`,
  SEEDING_CONVERSATION: msg`Seeding conversation in Looker...`,
  SECTION_PREFIX: msg`Example Prompts for`,
  AGENT_NAME_ECOMM: msg`Ecomm Data Agent`,
  AGENT_NAME_BQ_GRAPH: msg`BigQuery Graph Analytics`,

  CHIPS_EMPTY_HEADER: msg`Example Prompts`,
  CHIPS_EMPTY_HINT: msg`Click a card to ask here · Click copy icon for Gemini Enterprise`,
  COPY_PROMPT_ARIA: msg`Copy prompt to clipboard`,
  CLOSE_ARIA: msg`Close modal`,
};

export const AGENT_NAME_TRANSLATIONS: Record<string, any> = {
  "Ecomm Data Agent": GeminiEnterpriseModalText.AGENT_NAME_ECOMM,
  "BigQuery Graph Analytics": GeminiEnterpriseModalText.AGENT_NAME_BQ_GRAPH,
};

export const PROMPT_BADGE_TRANSLATIONS: Record<string, any> = {
  "Multi-Line": msg`Multi-Line`,
  "Ranked Bar": msg`Ranked Bar`,
  "Stacked Bar": msg`Stacked Bar`,
  "Channel Mix": msg`Channel Mix`,
  "Semantic Rule": msg`Semantic Rule`,
  "Geo Comparison": msg`Geo Comparison`,
  "Unit Economics": msg`Unit Economics`,
  "Python Forecast": msg`Python Forecast`,
  "Python Outliers": msg`Python Outliers`,
  "Live Brand RLS": msg`Live Brand RLS`,
  "Cart Conquesting": msg`Cart Conquesting`,
  "Jaccard Affinity": msg`Jaccard Affinity`,
  "Lookalike Audience": msg`Lookalike Audience`,
  "Omnichannel Journey": msg`Omnichannel Journey`,
};

export const PROMPT_TEXT_TRANSLATIONS: Record<string, any> = {
  "Plot monthly revenue vs returned sales over the past 12 months.": msg`Plot monthly revenue vs returned sales over the past 12 months.`,
  "Chart our top 10 product categories by successful order revenue.": msg`Chart our top 10 product categories by successful order revenue.`,
  "Break down order item count by status across our top 6 product categories.": msg`Break down order item count by status across our top 6 product categories.`,
  "Show the share of total revenue by customer traffic source.": msg`Show the share of total revenue by customer traffic source.`,
  "Who are our top 10 loyal customers by total revenue, and which cities are they in?": msg`Who are our top 10 loyal customers by total revenue, and which cities are they in?`,
  "Compare total revenue, average sale price, and return count across our top 10 US states.": msg`Compare total revenue, average sale price, and return count across our top 10 US states.`,
  "Which 10 products generate the highest total sales, and how do their retail prices compare to cost?": msg`Which 10 products generate the highest total sales, and how do their retail prices compare to cost?`,
  "Using monthly revenue over the past 24 months, forecast the next 3 months of sales and plot the trend.": msg`Using monthly revenue over the past 24 months, forecast the next 3 months of sales and plot the trend.`,
  "Calculate the return rate percentage by product category and highlight any statistical outliers.": msg`Calculate the return rate percentage by product category and highlight any statistical outliers.`,
  "Which brand am I currently viewing, and what are my top 5 best-selling products and total revenue?": msg`Which brand am I currently viewing, and what are my top 5 best-selling products and total revenue?`,
  "Which competitor brands in shoppers' carts most often lead to co-purchases of our products, and which of our items win?": msg`Which competitor brands in shoppers' carts most often lead to co-purchases of our products, and which of our items win?`,
  "Which product pairs have the highest Jaccard co-purchase affinity score for bundle merchandising?": msg`Which product pairs have the highest Jaccard co-purchase affinity score for bundle merchandising?`,
  "How large is our lookalike prospect audience, and who are the top 15 prospects with the highest category overlap?": msg`How large is our lookalike prospect audience, and who are the top 15 prospects with the highest category overlap?`,
  "Which online product categories and US states drive the most physical retail store visits?": msg`Which online product categories and US states drive the most physical retail store visits?`,
};
