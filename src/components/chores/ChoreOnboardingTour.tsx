import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChoreOnboardingStep } from "../../types/choreOnboarding";
import { choreTourSelector } from "../../lib/choreOnboarding";
import { prefersReducedMotion } from "../../lib/choreMotion";
import { choreCtaClass, choreCn, choreTw } from "../../lib/choreUi";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function measureTarget(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) {
    return null;
  }
  const r = el.getBoundingClientRect();
  const pad = 10;
  return {
    top: Math.max(8, r.top - pad),
    left: Math.max(8, r.left - pad),
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function tooltipPlacement(rect: Rect | null): { top: number; left: number; placement: "below" | "above" | "center" } {
  if (!rect) {
    return {
      top: typeof window !== "undefined" ? window.innerHeight * 0.35 : 200,
      left: 16,
      placement: "center",
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(400, vw - 32);
  const left = Math.min(Math.max(16, rect.left), vw - cardW - 16);
  const belowTop = rect.top + rect.height + 16;
  if (belowTop + 220 < vh) {
    return { top: belowTop, left, placement: "below" };
  }
  const aboveTop = rect.top - 16 - 220;
  if (aboveTop > 80) {
    return { top: Math.max(16, aboveTop), left, placement: "above" };
  }
  return { top: Math.min(vh - 240, rect.top + rect.height / 2), left, placement: "center" };
}

export type ChoreOnboardingTourProps = {
  active: boolean;
  step: ChoreOnboardingStep;
  stepIndex: number;
  stepCount: number;
  isLastStep: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export function ChoreOnboardingTour({
  active,
  step,
  stepIndex,
  stepCount,
  isLastStep,
  onNext,
  onBack,
  onSkip,
}: ChoreOnboardingTourProps) {
  const [spotRect, setSpotRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState(() => tooltipPlacement(null));
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = prefersReducedMotion();

  const updateGeometry = useCallback(() => {
    if (!active || step.kind !== "spotlight" || !step.target) {
      setSpotRect(null);
      setTooltipPos(tooltipPlacement(null));
      return;
    }
    const rect = measureTarget(choreTourSelector(step.target));
    setSpotRect(rect);
    setTooltipPos(tooltipPlacement(rect));
  }, [active, step.kind, step.target]);

  useLayoutEffect(() => {
    updateGeometry();
  }, [updateGeometry, stepIndex]);

  useEffect(() => {
    if (!active || step.kind !== "spotlight") {
      return undefined;
    }
    const onLayout = () => updateGeometry();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    const t = window.setInterval(onLayout, 400);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      window.clearInterval(t);
    };
  }, [active, step.kind, updateGeometry]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onSkip]);

  useEffect(() => {
    if (active && step.kind === "modal") {
      const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [active, step.kind, stepIndex]);

  if (!active) {
    return null;
  }

  const progressPct = Math.round(((stepIndex + 1) / stepCount) * 100);

  const card = (
    <div
      className={choreCn(
        "wd-chore-onboard__card",
        step.kind === "spotlight" && "wd-chore-onboard__card--tooltip",
        tooltipPos.placement === "above" && "wd-chore-onboard__card--above",
      )}
      style={
        step.kind === "spotlight"
          ? { top: tooltipPos.top, left: tooltipPos.left }
          : undefined
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="chore-onboard-title"
      aria-describedby="chore-onboard-body"
      ref={step.kind === "modal" ? dialogRef : undefined}
      tabIndex={-1}
    >
      <div className="wd-chore-onboard__progress" aria-hidden>
        <div className="wd-chore-onboard__progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="wd-chore-onboard__step-label">
        Step {stepIndex + 1} of {stepCount}
      </p>
      <h2 id="chore-onboard-title" className="wd-chore-onboard__title">
        {step.title}
      </h2>
      <p id="chore-onboard-body" className="wd-chore-onboard__body">
        {step.body}
      </p>
      <div className="wd-chore-onboard__actions">
        {stepIndex > 0 ? (
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), choreTw.focusRing, "wd-chore-onboard__btn")}
            onClick={onBack}
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), choreTw.focusRing, "wd-chore-onboard__btn")}
            onClick={onSkip}
          >
            Skip tour
          </button>
        )}
        <button
          type="button"
          className={choreCn(choreCtaClass("primary"), choreTw.focusRing, "wd-chore-onboard__btn")}
          onClick={onNext}
        >
          {isLastStep ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );

  if (step.kind === "modal") {
    return (
      <div className="wd-chore-onboard" data-reduced={reducedMotion || undefined}>
        <button
          type="button"
          className="wd-chore-onboard__scrim"
          aria-label="Skip tutorial"
          onClick={onSkip}
        />
        <div className="wd-chore-onboard__modal-wrap">{card}</div>
      </div>
    );
  }

  return (
    <div className="wd-chore-onboard" data-reduced={reducedMotion || undefined}>
      <button
        type="button"
        className="wd-chore-onboard__scrim"
        aria-label="Skip tutorial"
        onClick={onSkip}
      />
      {spotRect ? (
        <div
          className="wd-chore-onboard__ring"
          style={{
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
          }}
          aria-hidden
        />
      ) : null}
      {card}
    </div>
  );
}
