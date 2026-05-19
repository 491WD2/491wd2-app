/**
 * Local feedback loop for chore AI suggestions — adjusts category weights over time.
 */
import type { ChoreSuggestionCategory } from "../types/choreAi";

export const CHORE_AI_FEEDBACK_KEY = "491wd-chore-ai-feedback";

const MAX_DISMISSALS = 40;
const SCORE_CLAMP = { min: -8, max: 12 };

type FeedbackRecord = {
  version: 1;
  /** Rolling score per category — positive = more of this type */
  categoryScores: Partial<Record<ChoreSuggestionCategory, number>>;
  /** Recently dismissed suggestion ids (pattern keys) */
  dismissals: Array<{ id: string; category: ChoreSuggestionCategory; at: number }>;
  helpful: number;
  notHelpful: number;
};

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) {
    try {
      l();
    } catch {
      /* ignore */
    }
  }
}

function defaultRecord(): FeedbackRecord {
  return {
    version: 1,
    categoryScores: {},
    dismissals: [],
    helpful: 0,
    notHelpful: 0,
  };
}

export function loadChoreAiFeedback(): FeedbackRecord {
  if (typeof window === "undefined") {
    return defaultRecord();
  }
  try {
    const raw = window.localStorage.getItem(CHORE_AI_FEEDBACK_KEY);
    if (!raw) {
      return defaultRecord();
    }
    const parsed = JSON.parse(raw) as FeedbackRecord;
    if (parsed.version !== 1) {
      return defaultRecord();
    }
    return { ...defaultRecord(), ...parsed };
  } catch {
    return defaultRecord();
  }
}

function save(record: FeedbackRecord) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORE_AI_FEEDBACK_KEY, JSON.stringify(record));
  notify();
}

export function subscribeChoreAiFeedback(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function clampScore(n: number): number {
  return Math.max(SCORE_CLAMP.min, Math.min(SCORE_CLAMP.max, n));
}

/** Multiplier applied to confidence (roughly 0.85–1.15). */
export function getCategoryFeedbackBoost(category: ChoreSuggestionCategory): number {
  const score = loadChoreAiFeedback().categoryScores[category] ?? 0;
  return 1 + score * 0.025;
}

const DISMISS_TTL_MS = 48 * 60 * 60 * 1000;

export function isSuggestionDismissed(suggestionId: string): boolean {
  const now = Date.now();
  const { dismissals } = loadChoreAiFeedback();
  return dismissals.some((d) => d.id === suggestionId && now - d.at < DISMISS_TTL_MS);
}

export function recordSuggestionHelpful(
  suggestionId: string,
  category: ChoreSuggestionCategory,
) {
  const record = loadChoreAiFeedback();
  const next = clampScore((record.categoryScores[category] ?? 0) + 1);
  save({
    ...record,
    categoryScores: { ...record.categoryScores, [category]: next },
    helpful: record.helpful + 1,
    dismissals: record.dismissals.filter((d) => d.id !== suggestionId),
  });
  notify();
}

export function recordSuggestionNotHelpful(
  _suggestionId: string,
  category: ChoreSuggestionCategory,
) {
  const record = loadChoreAiFeedback();
  const next = clampScore((record.categoryScores[category] ?? 0) - 1);
  save({
    ...record,
    categoryScores: { ...record.categoryScores, [category]: next },
    notHelpful: record.notHelpful + 1,
  });
  notify();
}

export function recordSuggestionDismiss(
  suggestionId: string,
  category: ChoreSuggestionCategory,
) {
  const record = loadChoreAiFeedback();
  const dismissals = [
    { id: suggestionId, category, at: Date.now() },
    ...record.dismissals.filter((d) => d.id !== suggestionId),
  ].slice(0, MAX_DISMISSALS);
  const next = clampScore((record.categoryScores[category] ?? 0) - 0.5);
  save({
    ...record,
    categoryScores: { ...record.categoryScores, [category]: next },
    dismissals,
  });
  notify();
}

export function getFeedbackSummary() {
  const r = loadChoreAiFeedback();
  return { helpful: r.helpful, notHelpful: r.notHelpful, scores: r.categoryScores };
}
