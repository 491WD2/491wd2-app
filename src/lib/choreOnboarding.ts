/**
 * Chore kiosk onboarding progress — localStorage, no server.
 */
import type { ChoreOnboardingPersisted, ChoreOnboardingStepId } from "../types/choreOnboarding";
import { CHORE_ONBOARDING_VERSION } from "../types/choreOnboarding";

export const CHORE_ONBOARDING_STORAGE_KEY = "491wd-chore-onboarding";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      /* ignore */
    }
  }
}

function defaultState(): ChoreOnboardingPersisted {
  return {
    version: CHORE_ONBOARDING_VERSION,
    completed: false,
    completedAt: null,
    lastStepId: null,
  };
}

export function loadChoreOnboardingState(): ChoreOnboardingPersisted {
  if (typeof window === "undefined") {
    return defaultState();
  }
  try {
    const raw = window.localStorage.getItem(CHORE_ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw) as ChoreOnboardingPersisted;
    if (parsed.version !== CHORE_ONBOARDING_VERSION) {
      return defaultState();
    }
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState(state: ChoreOnboardingPersisted) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORE_ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  notify();
}

export function subscribeChoreOnboarding(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isChoreOnboardingComplete(): boolean {
  return loadChoreOnboardingState().completed;
}

export function shouldAutoStartChoreOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("tutorial") === "1") {
    return true;
  }
  if (params.get("tutorial") === "0") {
    return false;
  }
  return !loadChoreOnboardingState().completed;
}

export function setChoreOnboardingStep(stepId: ChoreOnboardingStepId) {
  const state = loadChoreOnboardingState();
  saveState({ ...state, lastStepId: stepId });
}

export function completeChoreOnboarding() {
  saveState({
    version: CHORE_ONBOARDING_VERSION,
    completed: true,
    completedAt: Date.now(),
    lastStepId: "finish",
  });
}

export function resetChoreOnboarding() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CHORE_ONBOARDING_STORAGE_KEY);
  notify();
}

export function choreTourSelector(target: string): string {
  return `[data-chore-tour="${target}"]`;
}
