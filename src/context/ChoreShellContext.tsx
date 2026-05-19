import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { reloadChoreFoundationFromStorage, useHouseholdChoreStore } from "../lib/choreData";
import {
  recordSuggestionDismiss,
  recordSuggestionHelpful,
  recordSuggestionNotHelpful,
  subscribeChoreAiFeedback,
} from "../lib/choreAiFeedback";
import { generateChoreSuggestions, getHighlightedTaskId } from "../lib/choreAiSuggestions";
import {
  feedbackFromCompletion,
  recordPredictiveTimingFeedback,
  subscribePredictiveModel,
} from "../lib/chorePredictiveModel";
import { buildPredictiveSchedule } from "../lib/chorePredictiveSchedule";
import { useChoreReminders } from "../hooks/useChoreReminders";
import {
  buildChorePersonalization,
  resolveActiveHouseholdMember,
  setActiveHouseholdMember,
} from "../lib/chorePersonalization";
import {
  CHORE_ASSIGN_FLASH_MS,
  CHORE_COMPLETE_MS,
  CHORE_SCHEDULE_PULSE_MS,
} from "../lib/choreMotion";
import { subscribeChoreRealtime } from "../lib/choreRealtimeSync";
import {
  trackActiveMemberChange,
  trackChoreComplete,
  trackChoreSkip,
} from "../lib/kioskAnalytics";
import { useKioskSchedulePerf } from "../hooks/useKioskSchedulePerf";
import type { ChoreCompleteVia } from "../types/kioskAnalytics";
import { CHORE_STATE_STORAGE_KEY } from "../types/cleaning";
import type { ChorePersonalization, ChoreSuggestion, ChoreToast } from "../types/choreAi";
import type {
  ChoreReminder,
  ChoreReminderPrefs,
  PredictiveScheduleReport,
} from "../types/chorePredictive";
import type { ChoreTask } from "../types/cleaning";
import type { HouseholdMember } from "../types/chore";

export type ChoreMarkDoneOptions = {
  surface?: string;
  via?: ChoreCompleteVia;
};

type ChoreShellContextValue = {
  suggestions: ChoreSuggestion[];
  personalization: ChorePersonalization;
  activeMember: HouseholdMember | null;
  setActiveMember: (member: HouseholdMember | null) => void;
  acceptedSuggestionIds: ReadonlySet<string>;
  dismissedSuggestionIds: ReadonlySet<string>;
  highlightedTaskId: string | null;
  acceptSuggestion: (suggestion: ChoreSuggestion) => void;
  rateSuggestion: (suggestion: ChoreSuggestion, helpful: boolean) => void;
  dismissSuggestion: (suggestion: ChoreSuggestion) => void;
  toasts: ChoreToast[];
  completingIds: ReadonlySet<string>;
  assignFlashIds: ReadonlySet<string>;
  schedulePulse: boolean;
  dismissToast: (id: string) => void;
  markDone: (task: ChoreTask, options?: ChoreMarkDoneOptions) => void;
  skipTask: (taskId: string, reason: string, surface?: string) => void;
  setAssignment: (taskId: string, member: HouseholdMember | "") => void;
  setImprovementNote: (taskId: string, text: string) => void;
  setMessageBoard: (member: HouseholdMember, text: string) => void;
  schedule: ReturnType<typeof useHouseholdChoreStore>["schedule"];
  choreState: ReturnType<typeof useHouseholdChoreStore>["choreState"];
  choreNotes: ReturnType<typeof useHouseholdChoreStore>["choreNotes"];
  today: string;
  predictiveSchedule: PredictiveScheduleReport;
  reminders: ChoreReminder[];
  reminderPrefs: ChoreReminderPrefs;
  setReminderPrefs: (prefs: ChoreReminderPrefs) => void;
  dismissReminder: (id: string) => void;
  findTaskById: (taskId: string) => ChoreTask | null;
};

const ChoreShellContext = createContext<ChoreShellContextValue | null>(null);

function syncFromRemote() {
  reloadChoreFoundationFromStorage();
}

export function ChoreShellProvider({ children }: { children: ReactNode }) {
  const store = useHouseholdChoreStore();
  const [toasts, setToasts] = useState<ChoreToast[]>([]);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const [assignFlashIds, setAssignFlashIds] = useState<Set<string>>(() => new Set());
  const [schedulePulse, setSchedulePulse] = useState(false);
  const [activeMember, setActiveMemberState] = useState<HouseholdMember | null>(() =>
    resolveActiveHouseholdMember(),
  );
  const [acceptedSuggestionIds, setAcceptedSuggestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [suggestionsVersion, setSuggestionsVersion] = useState(0);
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const [predictiveVersion, setPredictiveVersion] = useState(0);

  const bumpSuggestions = useCallback(() => {
    setSuggestionsVersion((v) => v + 1);
  }, []);

  const pushToast = useCallback((toast: Omit<ChoreToast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current, { ...toast, id }].slice(-4));
  }, []);

  const setActiveMember = useCallback((member: HouseholdMember | null) => {
    setActiveHouseholdMember(member);
    setActiveMemberState(member);
    setAcceptedSuggestionIds(new Set());
    setSuggestionsVersion((v) => v + 1);
    trackActiveMemberChange(member ?? "household", "chores:greeting");
  }, []);

  useKioskSchedulePerf(store.schedule);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHORE_STATE_STORAGE_KEY || e.key === null) {
        syncFromRemote();
        setSchedulePulse(true);
        pushToast({ tone: "warning", message: "Schedule updated from another screen" });
        window.setTimeout(() => setSchedulePulse(false), CHORE_SCHEDULE_PULSE_MS);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pushToast]);

  useEffect(() => {
    return subscribeChoreRealtime(() => {
      syncFromRemote();
      bumpSuggestions();
    });
  }, [bumpSuggestions]);

  useEffect(() => subscribeChoreAiFeedback(() => setFeedbackVersion((v) => v + 1)), []);

  useEffect(() => subscribePredictiveModel(() => setPredictiveVersion((v) => v + 1)), []);

  useEffect(() => {
    const onMember = () => {
      setActiveMemberState(resolveActiveHouseholdMember());
    };
    window.addEventListener("491wd-chore-member-changed", onMember);
    return () => window.removeEventListener("491wd-chore-member-changed", onMember);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const predictiveSchedule = useMemo(
    () =>
      buildPredictiveSchedule(
        store.schedule,
        store.choreState,
        store.choreNotes,
        store.today,
        activeMember,
      ),
    [
      activeMember,
      predictiveVersion,
      store.choreNotes,
      store.choreState,
      store.schedule,
      store.today,
    ],
  );

  const { reminders, prefs: reminderPrefs, setPrefs: setReminderPrefs, dismissReminder } =
    useChoreReminders(predictiveSchedule, store.today, activeMember);

  const findTaskById = useCallback(
    (taskId: string) => {
      const pools = [
        store.schedule.today,
        store.schedule.thisWeek,
        store.schedule.thisMonth,
      ];
      for (const list of pools) {
        const hit = list.find((t) => t.id === taskId);
        if (hit) {
          return hit;
        }
      }
      return null;
    },
    [store.schedule],
  );

  const applyPredictiveFeedback = useCallback(
    (task: ChoreTask, kind: "complete" | "skip") => {
      const item =
        predictiveSchedule.today.find((i) => i.task.id === task.id) ??
        predictiveSchedule.topFocus;
      const suggestedHour =
        item?.task.id === task.id ? item.suggestedHour : null;
      if (kind === "skip") {
        recordPredictiveTimingFeedback(task, "skipped");
        return;
      }
      const completedAt = new Date().toISOString();
      recordPredictiveTimingFeedback(
        task,
        feedbackFromCompletion(completedAt, suggestedHour),
        completedAt,
      );
    },
    [predictiveSchedule],
  );

  const markDone = useCallback(
    (task: ChoreTask, options?: ChoreMarkDoneOptions) => {
      const surface = options?.surface ?? "chores:task";
      const via = options?.via ?? "unknown";
      setCompletingIds((s) => new Set(s).add(task.id));
      store.markDone(task.id);
      trackChoreComplete(task, surface, via);
      applyPredictiveFeedback(task, "complete");
      bumpSuggestions();
      setPredictiveVersion((v) => v + 1);
      pushToast({
        tone: "success",
        message: `Done — ${task.title}`,
        taskId: task.id,
      });
      window.setTimeout(() => {
        setCompletingIds((s) => {
          const next = new Set(s);
          next.delete(task.id);
          return next;
        });
      }, CHORE_COMPLETE_MS);
    },
    [applyPredictiveFeedback, bumpSuggestions, pushToast, store],
  );

  const skipTask = useCallback(
    (taskId: string, reason: string, surface = "chores:edit-modal") => {
      const task =
        store.schedule.today.find((t) => t.id === taskId) ??
        store.schedule.thisWeek.find((t) => t.id === taskId);
      store.skipTask(taskId, reason);
      trackChoreSkip(
        task ?? { id: taskId, room: "", status: "Skipped" },
        surface,
      );
      if (task) {
        applyPredictiveFeedback(task, "skip");
      }
      pushToast({ tone: "info", message: "Task skipped", taskId });
      bumpSuggestions();
      setPredictiveVersion((v) => v + 1);
    },
    [applyPredictiveFeedback, bumpSuggestions, pushToast, store],
  );

  const setAssignment = useCallback(
    (taskId: string, member: HouseholdMember | "") => {
      store.setAssignment(taskId, member);
      if (member) {
        setAssignFlashIds((s) => new Set(s).add(taskId));
        window.setTimeout(() => {
          setAssignFlashIds((s) => {
            const next = new Set(s);
            next.delete(taskId);
            return next;
          });
        }, CHORE_ASSIGN_FLASH_MS);
        pushToast({ tone: "info", message: `Assigned to ${member}`, taskId });
      }
      bumpSuggestions();
    },
    [bumpSuggestions, pushToast, store],
  );

  const personalization = useMemo(
    () =>
      buildChorePersonalization(
        store.schedule,
        store.choreState,
        store.today,
        activeMember,
      ),
    [activeMember, store.choreState, store.schedule, store.today],
  );

  const suggestions = useMemo(
    () =>
      generateChoreSuggestions(
        store.schedule,
        store.choreState,
        store.today,
        activeMember,
      ).filter((s) => !dismissedSuggestionIds.has(s.id)),
    [
      activeMember,
      dismissedSuggestionIds,
      feedbackVersion,
      store.choreState,
      store.schedule,
      store.today,
      suggestionsVersion,
    ],
  );

  const highlightedTaskId = useMemo(
    () => getHighlightedTaskId(suggestions),
    [suggestions],
  );

  const personalizationWithNudge = useMemo(() => {
    const highlight = suggestions.find((s) => s.highlight);
    return {
      ...personalization,
      aiNudge: highlight?.title,
      focusTaskId: personalization.focusTaskId ?? highlight?.taskId,
      focusTaskTitle: personalization.focusTaskTitle ?? highlight?.title.replace(/^Your next: /, ""),
    };
  }, [personalization, suggestions]);

  const acceptSuggestion = useCallback(
    (suggestion: ChoreSuggestion) => {
      setAcceptedSuggestionIds((s) => new Set(s).add(suggestion.id));
      recordSuggestionHelpful(suggestion.id, suggestion.category);
      pushToast({
        tone: "success",
        message: `Applied: ${suggestion.title}`,
        taskId: suggestion.taskId,
      });
      bumpSuggestions();
    },
    [bumpSuggestions, pushToast],
  );

  const rateSuggestion = useCallback(
    (suggestion: ChoreSuggestion, helpful: boolean) => {
      if (helpful) {
        recordSuggestionHelpful(suggestion.id, suggestion.category);
        pushToast({ tone: "success", message: "Thanks — we'll show more like this." });
      } else {
        recordSuggestionNotHelpful(suggestion.id, suggestion.category);
        pushToast({ tone: "info", message: "Got it — we'll tune suggestions." });
      }
      bumpSuggestions();
    },
    [bumpSuggestions, pushToast],
  );

  const dismissSuggestion = useCallback(
    (suggestion: ChoreSuggestion) => {
      setDismissedSuggestionIds((s) => new Set(s).add(suggestion.id));
      recordSuggestionDismiss(suggestion.id, suggestion.category);
      bumpSuggestions();
    },
    [bumpSuggestions],
  );

  const value = useMemo(
    (): ChoreShellContextValue => ({
      suggestions,
      personalization: personalizationWithNudge,
      activeMember,
      setActiveMember,
      acceptedSuggestionIds,
      dismissedSuggestionIds,
      highlightedTaskId,
      acceptSuggestion,
      rateSuggestion,
      dismissSuggestion,
      toasts,
      completingIds,
      assignFlashIds,
      schedulePulse,
      dismissToast,
      markDone,
      skipTask,
      setAssignment,
      setImprovementNote: store.setImprovementNote,
      setMessageBoard: store.setMessageBoard,
      schedule: store.schedule,
      choreState: store.choreState,
      choreNotes: store.choreNotes,
      today: store.today,
      predictiveSchedule,
      reminders,
      reminderPrefs,
      setReminderPrefs,
      dismissReminder,
      findTaskById,
    }),
    [
      suggestions,
      personalizationWithNudge,
      activeMember,
      setActiveMember,
      acceptedSuggestionIds,
      dismissedSuggestionIds,
      highlightedTaskId,
      acceptSuggestion,
      rateSuggestion,
      dismissSuggestion,
      toasts,
      completingIds,
      assignFlashIds,
      schedulePulse,
      dismissToast,
      markDone,
      skipTask,
      setAssignment,
      store.setImprovementNote,
      store.setMessageBoard,
      store.schedule,
      store.choreState,
      store.choreNotes,
      store.today,
      predictiveSchedule,
      reminders,
      reminderPrefs,
      setReminderPrefs,
      dismissReminder,
      findTaskById,
    ],
  );

  return <ChoreShellContext.Provider value={value}>{children}</ChoreShellContext.Provider>;
}

export function useChoreShell(): ChoreShellContextValue {
  const ctx = useContext(ChoreShellContext);
  if (!ctx) {
    throw new Error("useChoreShell must be used within ChoreShellProvider");
  }
  return ctx;
}
