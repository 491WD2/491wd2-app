import type { ChoreShellTab } from "../lib/choreTheme";

export const CHORE_ONBOARDING_VERSION = 1;

export type ChoreOnboardingStepId =
  | "welcome"
  | "tabs"
  | "complete-task"
  | "ai-suggestions"
  | "schedule-week"
  | "schedule-assign"
  | "finish";

export type ChoreOnboardingStepKind = "modal" | "spotlight";

export type ChoreOnboardingStep = {
  id: ChoreOnboardingStepId;
  kind: ChoreOnboardingStepKind;
  title: string;
  body: string;
  /** `data-chore-tour` target for spotlight steps */
  target?: string;
  tab?: ChoreShellTab;
  /** When on schedule tab, switch to assign board */
  openAssignBoard?: boolean;
};

export type ChoreOnboardingPersisted = {
  version: number;
  completed: boolean;
  completedAt: number | null;
  lastStepId: ChoreOnboardingStepId | null;
};
