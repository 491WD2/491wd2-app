/**
 * Local predictive model — updated when chores complete early/late or are skipped.
 */
import type {
  PredictiveModelRecord,
  PredictiveTimingFeedback,
} from "../types/chorePredictive";
import type { ChoreTask } from "../types/cleaning";
import type { HouseholdMember } from "../types/chore";

export const CHORE_PREDICTIVE_MODEL_KEY = "491wd-chore-predictive-model";

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

export function defaultPredictiveModel(): PredictiveModelRecord {
  return {
    version: 1,
    taskTiming: {},
    memberPeakHour: {},
    hourHistogram: new Array(24).fill(0) as number[],
    lastUpdated: Date.now(),
  };
}

export function loadPredictiveModel(): PredictiveModelRecord {
  if (typeof window === "undefined") {
    return defaultPredictiveModel();
  }
  try {
    const raw = window.localStorage.getItem(CHORE_PREDICTIVE_MODEL_KEY);
    if (!raw) {
      return defaultPredictiveModel();
    }
    const parsed = JSON.parse(raw) as PredictiveModelRecord;
    if (parsed.version !== 1) {
      return defaultPredictiveModel();
    }
    return {
      ...defaultPredictiveModel(),
      ...parsed,
      hourHistogram:
        parsed.hourHistogram?.length === 24
          ? parsed.hourHistogram
          : new Array(24).fill(0),
    };
  } catch {
    return defaultPredictiveModel();
  }
}

function save(model: PredictiveModelRecord) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORE_PREDICTIVE_MODEL_KEY, JSON.stringify(model));
  notify();
}

export function subscribePredictiveModel(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPeakActivityHours(model: PredictiveModelRecord, limit = 3): number[] {
  const ranked = model.hourHistogram
    .map((count, hour) => ({ hour, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  if (ranked.length === 0) {
    return [9, 14, 18];
  }
  return ranked.slice(0, limit).map((x) => x.hour);
}

function classifyTiming(
  completedHour: number,
  suggestedHour: number | null,
): PredictiveTimingFeedback {
  if (suggestedHour == null) {
    return "on_time";
  }
  const delta = completedHour - suggestedHour;
  if (delta <= -2) {
    return "early";
  }
  if (delta >= 3) {
    return "late";
  }
  return "on_time";
}

export function feedbackFromCompletion(
  completedAtIso: string,
  suggestedHour: number | null,
): PredictiveTimingFeedback {
  const completedHour = new Date(completedAtIso).getHours();
  return classifyTiming(completedHour, suggestedHour);
}

export function recordPredictiveTimingFeedback(
  task: ChoreTask,
  feedback: PredictiveTimingFeedback,
  completedAtIso?: string,
) {
  const model = loadPredictiveModel();
  const entry = model.taskTiming[task.id] ?? {
    early: 0,
    onTime: 0,
    late: 0,
    skipped: 0,
  };

  if (feedback === "skipped") {
    entry.skipped += 1;
  } else if (feedback === "early") {
    entry.early += 1;
  } else if (feedback === "late") {
    entry.late += 1;
  } else {
    entry.onTime += 1;
  }

  model.taskTiming[task.id] = entry;

  if (feedback !== "skipped" && completedAtIso && task.assignedTo) {
    const hour = new Date(completedAtIso).getHours();
    if (!Number.isNaN(hour)) {
      model.hourHistogram[hour] = (model.hourHistogram[hour] ?? 0) + 1;
      const prev = model.memberPeakHour[task.assignedTo];
      model.memberPeakHour[task.assignedTo] =
        prev == null ? hour : Math.round((prev + hour) / 2);
    }
  }

  model.lastUpdated = Date.now();
  save(model);
}

export function getTaskTimingBias(taskId: string): number {
  const row = loadPredictiveModel().taskTiming[taskId];
  if (!row) {
    return 0;
  }
  const total = row.early + row.onTime + row.late + row.skipped;
  if (total === 0) {
    return 0;
  }
  return (row.late + row.skipped * 1.5 - row.early * 0.5) / total;
}

export function getMemberPeakHour(member: HouseholdMember): number | null {
  return loadPredictiveModel().memberPeakHour[member] ?? null;
}
