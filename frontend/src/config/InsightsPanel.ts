import { msg } from "@lingui/core/macro";

export const InsightsPanel = {
  TITLE: msg`AI Strategic Executive Briefing`,
  STATUS_WARMBOOTING: msg`Warmbooting Session...`,
  STATUS_FETCHING: msg`Fetching Briefing...`,
  BRAND_FOCUS_PREFIX: msg`Brand Focus: `,
  ERROR_MSG: msg`Failed to load dynamic AI Executive Briefings from BigQuery.`,
  EMPTY_MSG_PREFIX: msg`No strategic AI briefings pre-generated for `,
  EMPTY_MSG_SUFFIX: msg` yet.`,
  FOOTER_NOTE: msg`Recommendations generated asynchronously and persisted via BigQuery AI.GENERATE`,
  APPLY_BTN: msg`Apply All Strategic Rules`,
  DEFAULT_TITLE: msg`Strategic Insight`,
  DEFAULT_DESC: msg`No briefing details provided.`,
  ALERT_PREFIX: msg`Applied optimal dynamic pricing and ad rules for `,
  ALERT_SUFFIX: msg`. Synchronizing with Looker database...`,
};
