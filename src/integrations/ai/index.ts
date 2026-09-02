/**
 * AI integration boundary for FamilySite 491.
 * UI and capabilities must call through this module — never embed provider keys in React.
 */
export type {
  HouseholdAiHelpFailure,
  HouseholdAiHelpResult,
  HouseholdAiHelpSuccess,
  HouseholdAiTask,
} from "../../services/aiClient";
export { requestHouseholdAiHelp } from "../../services/aiClient";

import type { IntegrationAdapter } from "../types";

export const aiIntegrationAdapter: IntegrationAdapter = {
  kind: "ai",
  getReadiness() {
    // Live mode depends on Netlify serverless functions configured at deploy time.
    return { ready: true };
  },
};
