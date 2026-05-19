import { memo, useEffect, useRef, useState } from "react";
import { useChoreShell } from "../../context/ChoreShellContext";
import { trackKioskEvent } from "../../lib/kioskAnalytics";
import type { ChoreSuggestion, ChoreSuggestionAction } from "../../types/choreAi";
import type { ChoreShellTab } from "../../lib/choreTheme";
import type { HouseholdMember } from "../../types/chore";
import { choreCn, choreTw } from "../../lib/choreUi";
import { ChoreCtaButton } from "./ChoreCtaButton";

export type ChoreAiSuggestionsProps = {
  onNavigateTab?: (tab: ChoreShellTab) => void;
  onFocusMember?: (member: HouseholdMember) => void;
  onFocusTask?: (taskId: string) => void;
};

function SuggestionCard({
  suggestion,
  accepted,
  onAction,
  onHelpful,
  onNotHelpful,
  onDismiss,
}: {
  suggestion: ChoreSuggestion;
  accepted: boolean;
  onAction?: () => void;
  onHelpful: () => void;
  onNotHelpful: () => void;
  onDismiss: () => void;
}) {
  return (
    <article
      className={choreCn(
        "wd-chore-hh__ai-card",
        `wd-chore-hh__ai-card--${suggestion.priority}`,
        suggestion.personalized && "wd-chore-hh__ai-card--personal",
        suggestion.highlight && "wd-chore-hh__ai-card--highlight",
        accepted && "wd-chore-hh__ai-card--accepted",
      )}
    >
      {suggestion.highlight ? (
        <span className="wd-chore-hh__ai-spotlight" aria-hidden>
          Recommended now
        </span>
      ) : null}
      <div className="wd-chore-hh__ai-card-head">
        <span className="wd-chore-hh__ai-badge" aria-hidden>
          {suggestion.personalized ? "For you · " : ""}
          {Math.round(suggestion.confidence * 100)}% match
        </span>
        <h4>{suggestion.title}</h4>
      </div>
      <p>{suggestion.detail}</p>
      {suggestion.actionLabel && onAction && !accepted ? (
        <ChoreCtaButton variant="ghost" className="wd-chore-hh__ai-action" onClick={onAction}>
          {suggestion.actionLabel}
        </ChoreCtaButton>
      ) : null}
      {accepted ? (
        <p className="wd-chore-hh__ai-accepted" aria-live="polite">
          <span aria-hidden>✓</span> Applied
        </p>
      ) : (
        <div className="wd-chore-hh__ai-feedback" role="group" aria-label="Rate this suggestion">
          <button
            type="button"
            className={choreCn("wd-chore-hh__ai-feedback-btn", choreTw.focusRing)}
            onClick={onHelpful}
            aria-label="Helpful suggestion"
          >
            Helpful
          </button>
          <button
            type="button"
            className={choreCn("wd-chore-hh__ai-feedback-btn", choreTw.focusRing)}
            onClick={onNotHelpful}
            aria-label="Not helpful"
          >
            Not helpful
          </button>
          <button
            type="button"
            className={choreCn("wd-chore-hh__ai-feedback-btn wd-chore-hh__ai-feedback-btn--muted", choreTw.focusRing)}
            onClick={onDismiss}
            aria-label="Dismiss suggestion"
          >
            Not now
          </button>
        </div>
      )}
    </article>
  );
}

function ChoreAiSuggestionsInner({
  onNavigateTab,
  onFocusMember,
  onFocusTask,
}: ChoreAiSuggestionsProps) {
  const {
    suggestions,
    acceptedSuggestionIds,
    acceptSuggestion,
    rateSuggestion,
    dismissSuggestion,
  } = useChoreShell();
  const [entered, setEntered] = useState(false);
  const prevCount = useRef(0);
  const hasHighlight = suggestions.some((s) => s.highlight);

  useEffect(() => {
    if (suggestions.length > 0 && suggestions.length !== prevCount.current) {
      prevCount.current = suggestions.length;
      setEntered(false);
      trackKioskEvent({
        category: "interaction",
        action: "ai_suggestions_shown",
        surface: "chores:ai",
        metadata: {
          count: suggestions.length,
          highlight: hasHighlight,
        },
      });
      const t = window.requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(t);
    }
    if (suggestions.length === 0) {
      prevCount.current = 0;
      setEntered(false);
    }
    return undefined;
  }, [hasHighlight, suggestions]);

  if (suggestions.length === 0) {
    return null;
  }

  const runAction = (suggestion: ChoreSuggestion) => {
    const action: ChoreSuggestionAction | undefined = suggestion.action;
    trackKioskEvent({
      category: "chore",
      action: "ai_suggestion_accept",
      surface: "chores:ai",
      metadata: {
        suggestionId: suggestion.id,
        category: suggestion.category,
        reason: suggestion.reason,
      },
    });
    acceptSuggestion(suggestion);

    if (action === "navigate_schedule") {
      onNavigateTab?.("schedule");
    } else if (action === "navigate_users" || action === "focus_member") {
      if (suggestion.member) {
        onFocusMember?.(suggestion.member);
      }
      onNavigateTab?.("user");
    } else if (action === "focus_task" && suggestion.taskId) {
      onFocusTask?.(suggestion.taskId);
      onNavigateTab?.("home");
    }
  };

  return (
    <section
      className={choreCn(
        "wd-chore-hh__ai",
        entered && "wd-chore-hh__ai--enter",
        hasHighlight && "wd-chore-hh__ai--highlight-active",
      )}
      aria-labelledby="chore-ai-title"
      data-chore-tour="ai-suggestions"
    >
      <header className="wd-chore-hh__ai-head">
        <h3 id="chore-ai-title">Smart suggestions</h3>
        <p>Adaptive tips from your schedule, roles, completion patterns, and feedback</p>
      </header>
      <ul className="wd-chore-hh__ai-list">
        {suggestions.map((s, index) => (
          <li
            key={s.id}
            className={choreCn(
              "wd-chore-hh__ai-list-item",
              s.highlight && "wd-chore-hh__ai-list-item--highlight",
            )}
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <SuggestionCard
              suggestion={s}
              accepted={acceptedSuggestionIds.has(s.id)}
              onAction={s.actionLabel ? () => runAction(s) : undefined}
              onHelpful={() => {
                trackKioskEvent({
                  category: "interaction",
                  action: "ai_feedback_helpful",
                  surface: "chores:ai",
                  metadata: { suggestionId: s.id, category: s.category },
                });
                rateSuggestion(s, true);
              }}
              onNotHelpful={() => {
                trackKioskEvent({
                  category: "interaction",
                  action: "ai_feedback_not_helpful",
                  surface: "chores:ai",
                  metadata: { suggestionId: s.id, category: s.category },
                });
                rateSuggestion(s, false);
              }}
              onDismiss={() => {
                trackKioskEvent({
                  category: "interaction",
                  action: "ai_feedback_dismiss",
                  surface: "chores:ai",
                  metadata: { suggestionId: s.id, category: s.category },
                });
                dismissSuggestion(s);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export const ChoreAiSuggestions = memo(ChoreAiSuggestionsInner);
