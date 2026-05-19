import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  completeChoreOnboarding,
  loadChoreOnboardingState,
  resetChoreOnboarding,
  setChoreOnboardingStep,
  shouldAutoStartChoreOnboarding,
  subscribeChoreOnboarding,
} from "../lib/choreOnboarding";
import { CHORE_ONBOARDING_STEPS } from "../lib/choreOnboardingSteps";
import { trackInteraction } from "../lib/kioskAnalytics";

export function useChoreOnboarding() {
  const persisted = useSyncExternalStore(
    subscribeChoreOnboarding,
    loadChoreOnboardingState,
    () => loadChoreOnboardingState(),
  );

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step = CHORE_ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex >= CHORE_ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("tutorial") === "1") {
      resetChoreOnboarding();
    }
    if (!shouldAutoStartChoreOnboarding()) {
      return undefined;
    }
    const t = window.setTimeout(() => {
      setActive(true);
      setStepIndex(0);
      setChoreOnboardingStep("welcome");
      trackInteraction("chores:onboarding", params.get("tutorial") === "1" ? "url_start" : "auto_start");
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  const startTour = useCallback((fromReset = false) => {
    if (fromReset) {
      resetChoreOnboarding();
    }
    setStepIndex(0);
    setActive(true);
    trackInteraction("chores:onboarding", fromReset ? "restart" : "manual_start");
  }, []);

  const dismissTour = useCallback(() => {
    completeChoreOnboarding();
    setActive(false);
    trackInteraction("chores:onboarding", "dismiss", { step: step?.id ?? "unknown" });
  }, [step?.id]);

  const finishTour = useCallback(() => {
    completeChoreOnboarding();
    setActive(false);
    trackInteraction("chores:onboarding", "complete");
  }, []);

  const goToStep = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, CHORE_ONBOARDING_STEPS.length - 1));
    setStepIndex(clamped);
    const id = CHORE_ONBOARDING_STEPS[clamped]?.id;
    if (id) {
      setChoreOnboardingStep(id);
      trackInteraction("chores:onboarding", "step_view", { step: id, index: clamped });
    }
  }, []);

  const nextStep = useCallback(() => {
    if (isLastStep) {
      finishTour();
      return;
    }
    goToStep(stepIndex + 1);
  }, [finishTour, goToStep, isLastStep, stepIndex]);

  const prevStep = useCallback(() => {
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  return {
    active,
    step,
    stepIndex,
    stepCount: CHORE_ONBOARDING_STEPS.length,
    isLastStep,
    completed: persisted.completed,
    startTour,
    dismissTour,
    finishTour,
    nextStep,
    prevStep,
    goToStep,
  };
}
