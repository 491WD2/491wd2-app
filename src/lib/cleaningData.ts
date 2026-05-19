import { useCallback, useMemo, useSyncExternalStore } from "react";
import { CHORE_ZIP_RECORDS } from "./choreZipSeed";
import type {
  Chore,
  ChoreCompletionMap,
  ChoreDraft,
  ChoreFamilyMember,
  ChoreHubCategoryId,
  ChoreHubCategoryStats,
  ChoreSchedule,
  ChoreStatus,
  ChoreZipRecord,
  ChoreZipRecordView,
  CleaningCadence,
  CleaningPageId,
} from "../types/chore";
import { HOUSEHOLD_MEMBERS } from "../types/chore";

/** @deprecated */
export const CHORE_FAMILY_MEMBERS = HOUSEHOLD_MEMBERS;
import type {
  ChoreHubSummary,
  ChoreTaskEdit,
  ChoreTaskSnooze,
  ChoreTaskStatus,
  CleaningSupply,
  CustomTaskDraft,
  PersistedChoresState,
  SupplyDraft,
  TodayFirstHubSummary,
} from "../types/cleaning";

/** Legacy kiosk task row (ZIP layer). */
type LegacyChoreTask = {
  id: string;
  title: string;
  area: string;
  room: string;
  roomSlug: string | null;
  assignedTo: string;
  schedule: string;
  frequency: string;
  dueDate: string;
  status: string;
  notes: string;
  completed: boolean;
  completedAt: string | null;
  lastCompletedAt: string | null;
  nextDueDate: string;
  source: string;
  exportIndex?: number;
  cadence: CleaningCadence;
  snoozedUntil: string | null;
};
import type { ChoreFlowHubId } from "../types/chore";
import {
  CHORES_STATE_STORAGE_KEY,
  CLEANING_CHECKLISTS_STORAGE_KEY,
  CLEANING_SUPPLIES_STORAGE_KEY,
  LEGACY_CHORE_KIOSK_KEY,
  LEGACY_CHORE_ZIP_COMPLETIONS_KEY,
} from "../types/cleaning";

export {
  CHORES_STATE_STORAGE_KEY,
  CLEANING_CHECKLISTS_STORAGE_KEY,
  CLEANING_SUPPLIES_STORAGE_KEY,
};
export { CHORE_ZIP_RECORDS, CHORE_ZIP_RECORD_COUNT, CHORE_ZIP_ROOMS } from "./choreZipSeed";

/** Kitchen-zone rooms in export (no dedicated Kitchen room). */
export const ROTATION_KITCHEN_ROOM_SLUGS = [
  "Pantry-2ef97e9c2a3181979138c282576cd910",
  "Dining-Room-2ef97e9c2a318192bdd0f0418b269200",
] as const;

export const ROTATION_BATH_ROOM_SLUGS = [
  "Bathroom-2ef97e9c2a3181eb8860fe936b7b084a",
  "Half-Bath-2ef97e9c2a3181d881c4f8476b0304b8",
] as const;

/** @deprecated Use CHORES_STATE_STORAGE_KEY */
export const CHORE_KIOSK_STORAGE_KEY = LEGACY_CHORE_KIOSK_KEY;
/** @deprecated Use CHORES_STATE_STORAGE_KEY */
export const CHORE_ZIP_COMPLETIONS_KEY = LEGACY_CHORE_ZIP_COMPLETIONS_KEY;

type StoreSnapshot = {
  completions: ChoreCompletionMap;
  edits: Record<string, ChoreTaskEdit>;
  snoozes: Record<string, ChoreTaskSnooze>;
  customTasks: LegacyChoreTask[];
  supplies: CleaningSupply[];
};

type ChoreListener = () => void;
const listeners = new Set<ChoreListener>();

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWithinLastDays(isoTimestamp: string | null, days: number) {
  if (!isoTimestamp) {
    return false;
  }
  const then = new Date(isoTimestamp).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return then >= cutoff;
}

function stripRoomEmoji(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\s]+/u, "").trim() || label;
}

export function recordDisplayTitle(record: ChoreZipRecord): string {
  const name = record.name.trim();
  if (
    name &&
    !name.startsWith("http") &&
    name !== "New Chore" &&
    name !== "New Schedule Plan"
  ) {
    return name;
  }
  const room = record.roomLabel ? stripRoomEmoji(record.roomLabel) : "";
  if (room && record.frequency) {
    return `${room} — ${record.frequency}`;
  }
  if (room) {
    return `${room} maintenance`;
  }
  if (record.frequency) {
    return `${record.frequency} household task`;
  }
  if (record.assignedTo || record.assigned) {
    return `Task · ${record.assignedTo || record.assigned}`;
  }
  if (record.scheduledDate) {
    return `Scheduled · ${record.scheduledDate}`;
  }
  return `Household task ${record.exportIndex + 1}`;
}

function cadenceToSchedule(cadence: CleaningCadence): string {
  const map: Record<CleaningCadence, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    seasonal: "Seasonal",
    yearly: "Yearly",
    deep: "Deep Cleaning",
    recurring: "Recurring",
    room: "Room",
  };
  return map[cadence];
}

function defaultSupplies(): CleaningSupply[] {
  return [
    {
      id: "supply-all-purpose",
      name: "All-purpose cleaner",
      category: "Cleaner",
      needed: true,
      notes: "Running low",
      addToShopping: false,
    },
    {
      id: "supply-sponges",
      name: "Sponges",
      category: "Tools",
      needed: true,
      notes: "",
      addToShopping: false,
    },
  ];
}

function supplyToChore(supply: CleaningSupply): Chore {
  const today = todayIso();
  return {
    id: supply.id,
    title: supply.name,
    assignedTo: "",
    schedule: "todo",
    dueDate: today,
    recurrence: "none",
    status: supply.needed ? "To Do" : "Done",
    points: 0,
    notes: supply.notes,
    completedAt: supply.needed ? null : new Date().toISOString(),
    kind: "supply",
  };
}

function choreToSupply(chore: Chore): CleaningSupply {
  return {
    id: chore.id,
    name: chore.title,
    category: "General",
    needed: chore.status !== "Done",
    notes: chore.notes,
    addToShopping: false,
  };
}

function exportDueDate(record: ChoreZipRecord): string | null {
  const raw = record.scheduledDate || record.currentDate || "";
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function effectiveDueDate(
  record: ChoreZipRecord,
  edit: ChoreTaskEdit | undefined,
): string | null {
  if (edit?.dueDate === "") {
    return null;
  }
  if (edit?.dueDate) {
    return edit.dueDate;
  }
  return exportDueDate(record);
}

function isArchived(edit: ChoreTaskEdit | undefined) {
  return edit?.archived === true;
}

function allOpenTaskViews(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const today = todayIso();
  const state = { ...snapshot, completions };
  const zip = CHORE_ZIP_RECORDS.filter((record) => {
    const edit = state.edits[record.id];
    if (isArchived(edit)) {
      return false;
    }
    const task = zipRecordToChoreTask(record, state, today);
    return !task.completed;
  }).map((record) => zipRecordToView(record, completions));

  const custom = snapshot.customTasks
    .filter((task) => {
      const completion = completions[task.id];
      return !completion?.completed && !snapshot.edits[task.id]?.archived;
    })
    .map((task) => {
      const completion = completions[task.id];
      return choreTaskToZipView({
        ...task,
        completed: false,
        completedAt: completion?.completedAt ?? null,
      });
    });

  return [...zip, ...custom];
}

function isSnoozedActive(snooze: ChoreTaskSnooze | undefined, today: string) {
  return Boolean(snooze?.until && snooze.until > today);
}

function mapExportStatus(
  status: string,
  completed: boolean,
  dueDate: string | null,
  today: string,
  snoozed: boolean,
): ChoreTaskStatus {
  if (completed) {
    return "Done";
  }
  if (snoozed) {
    return "Skipped";
  }
  const normalized = status.trim().toLowerCase();
  if (normalized === "in progress") {
    return "In Progress";
  }
  if (normalized === "done" || normalized === "completed") {
    return "Done";
  }
  if (dueDate && dueDate < today) {
    return "Overdue";
  }
  return "To Do";
}

export function zipRecordToChoreTask(
  record: ChoreZipRecord,
  state: Pick<StoreSnapshot, "completions" | "edits" | "snoozes">,
  today: string = todayIso(),
): LegacyChoreTask {
  const completion = state.completions[record.id];
  const edit = state.edits[record.id];
  const snooze = state.snoozes[record.id];
  const completed = completion?.completed === true;
  const completedAt = completion?.completedAt ?? null;
  const dueDateValue = effectiveDueDate(record, edit);
  const dueDate = dueDateValue ?? "";
  const snoozed = isSnoozedActive(snooze, today);
  const room = record.roomLabel ? stripRoomEmoji(record.roomLabel) : "";

  return {
    id: record.id,
    title: edit?.title?.trim() || recordDisplayTitle(record),
    area: room || "Household",
    room,
    roomSlug: record.roomSlug,
    assignedTo: edit?.assignedTo ?? record.assignedTo ?? record.assigned ?? "",
    schedule: cadenceToSchedule(record.cadence),
    frequency: edit?.frequency ?? record.frequency ?? "",
    dueDate,
    status: mapExportStatus(record.status, completed, dueDateValue, today, snoozed),
    notes: edit?.notes ?? record.notes ?? "",
    completed,
    completedAt,
    lastCompletedAt: completedAt,
    nextDueDate: snooze?.until ?? dueDateValue ?? "",
    source: "zip",
    exportIndex: record.exportIndex,
    cadence: record.cadence,
    snoozedUntil: snooze?.until ?? null,
  };
}

export function choreTaskToZipView(task: LegacyChoreTask): ChoreZipRecordView {
  const record = CHORE_ZIP_RECORDS.find((entry) => entry.id === task.id);
  if (!record) {
    return {
      id: task.id,
      exportIndex: -1,
      name: task.title,
      assigned: task.assignedTo,
      assignedTo: task.assignedTo,
      frequency: task.frequency,
      cadence: task.cadence,
      roomSlug: task.roomSlug,
      roomLabel: task.room || null,
      status: task.status,
      type: "custom",
      notes: task.notes,
      line: "",
      inbox: false,
      scheduledDate: task.dueDate,
      currentDate: "",
      completionPct: "",
      tasksCompleted: "",
      totalTasks: "",
      completed: task.completed,
      completedAt: task.completedAt,
      displayTitle: task.title,
      effectiveStatus: task.status as ChoreStatus,
    };
  }

  const edit = snapshot.edits[record.id];
  const due = effectiveDueDate(record, edit);

  return {
    ...record,
    name: task.title,
    assignedTo: task.assignedTo,
    notes: task.notes,
    frequency: task.frequency,
    scheduledDate: due ?? "",
    completed: task.completed,
    completedAt: task.completedAt,
    displayTitle: task.title,
    effectiveStatus: task.status as ChoreStatus,
  };
}

function buildAllTasks(snapshot: StoreSnapshot, today: string): LegacyChoreTask[] {
  const zipTasks = CHORE_ZIP_RECORDS.map((record) =>
    zipRecordToChoreTask(record, snapshot, today),
  );
  const custom = snapshot.customTasks.map((task) => {
    const completion = snapshot.completions[task.id];
    const completed = completion?.completed === true;
    return {
      ...task,
      completed,
      completedAt: completion?.completedAt ?? task.completedAt,
      status: completed ? ("Done" as const) : task.status,
    };
  });
  return [...zipTasks, ...custom];
}

function migrateLegacyStore(): PersistedChoresState {
  const completions: ChoreCompletionMap = {};
  const edits: Record<string, ChoreTaskEdit> = {};
  const snoozes: Record<string, ChoreTaskSnooze> = {};
  let customTasks: LegacyChoreTask[] = [];

  if (typeof window === "undefined") {
    return {
      version: 3,
      completions,
      edits,
      snoozes,
      customTasks: customTasks as unknown as Array<Record<string, unknown>>,
    };
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_CHORE_KIOSK_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as Record<string, unknown>;
      if (parsed.version === 2 && parsed.completions && typeof parsed.completions === "object") {
        Object.assign(completions, parsed.completions as ChoreCompletionMap);
      }
      if (Array.isArray(parsed.supplies) && !window.localStorage.getItem(CLEANING_SUPPLIES_STORAGE_KEY)) {
        window.localStorage.setItem(
          CLEANING_SUPPLIES_STORAGE_KEY,
          JSON.stringify((parsed.supplies as Chore[]).map(choreToSupply)),
        );
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const legacyCompletions = window.localStorage.getItem(LEGACY_CHORE_ZIP_COMPLETIONS_KEY);
    if (legacyCompletions) {
      Object.assign(completions, JSON.parse(legacyCompletions) as ChoreCompletionMap);
    }
  } catch {
    /* ignore */
  }

  try {
    const stateRaw = window.localStorage.getItem(CHORES_STATE_STORAGE_KEY);
    if (stateRaw) {
      const parsed = JSON.parse(stateRaw) as PersistedChoresState;
      if (parsed.version === 3) {
        return {
          version: 3,
          completions: parsed.completions ?? completions,
          edits: parsed.edits ?? edits,
          snoozes: parsed.snoozes ?? snoozes,
          customTasks: parsed.customTasks ?? customTasks,
        };
      }
    }
  } catch {
    /* ignore */
  }

  return {
    version: 3,
    completions,
    edits,
    snoozes,
    customTasks: customTasks as unknown as Array<Record<string, unknown>>,
  };
}

function loadStore(): StoreSnapshot {
  const migrated = migrateLegacyStore();
  let supplies = defaultSupplies();

  if (typeof window !== "undefined") {
    try {
      const suppliesRaw = window.localStorage.getItem(CLEANING_SUPPLIES_STORAGE_KEY);
      if (suppliesRaw) {
        const parsed = JSON.parse(suppliesRaw) as CleaningSupply[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          supplies = parsed;
        }
      }
    } catch {
      supplies = defaultSupplies();
    }

    persistState(migrated, supplies);
  }

  return {
    completions: migrated.completions,
    edits: migrated.edits,
    snoozes: migrated.snoozes,
    customTasks: migrated.customTasks as unknown as LegacyChoreTask[],
    supplies,
  };
}

function persistState(state: PersistedChoresState, supplies: CleaningSupply[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORES_STATE_STORAGE_KEY, JSON.stringify(state));
  window.localStorage.setItem(CLEANING_SUPPLIES_STORAGE_KEY, JSON.stringify(supplies));
  window.localStorage.setItem(
    LEGACY_CHORE_KIOSK_KEY,
    JSON.stringify({ version: 2, completions: state.completions, supplies: supplies.map(supplyToChore) }),
  );
  window.localStorage.setItem(LEGACY_CHORE_ZIP_COMPLETIONS_KEY, JSON.stringify(state.completions));
  window.localStorage.setItem(
    CLEANING_CHECKLISTS_STORAGE_KEY,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString() }),
  );
}

let snapshot: StoreSnapshot = loadStore();

function persist() {
  const state: PersistedChoresState = {
    version: 3,
    completions: snapshot.completions,
    edits: snapshot.edits,
    snoozes: snapshot.snoozes,
    customTasks: snapshot.customTasks as unknown as Array<Record<string, unknown>>,
  };
  persistState(state, snapshot.supplies);
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: ChoreListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

export function zipRecordToView(
  record: ChoreZipRecord,
  completions: ChoreCompletionMap,
): ChoreZipRecordView {
  return choreTaskToZipView(zipRecordToChoreTask(record, { ...snapshot, completions }));
}

export function recordsForCadence(
  cadence: CleaningCadence,
  completions: ChoreCompletionMap,
): ChoreZipRecordView[] {
  return CHORE_ZIP_RECORDS.filter((record) => record.cadence === cadence).map((record) =>
    zipRecordToView(record, completions),
  );
}

export function recordsForRoom(
  roomSlug: string,
  completions: ChoreCompletionMap,
): ChoreZipRecordView[] {
  return CHORE_ZIP_RECORDS.filter((record) => record.roomSlug === roomSlug).map((record) =>
    zipRecordToView(record, completions),
  );
}

export function recordsForToday(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const today = todayIso();
  const state = { ...snapshot, completions };
  return CHORE_ZIP_RECORDS.filter((record) => {
    const edit = state.edits[record.id];
    if (isArchived(edit)) {
      return false;
    }
    const task = zipRecordToChoreTask(record, state, today);
    if (task.completed || task.status === "Skipped") {
      return false;
    }
    const due = effectiveDueDate(record, edit);
    if (due === today) {
      return true;
    }
    return task.status === "Overdue";
  })
    .map((record) => zipRecordToView(record, completions))
    .concat(
      snapshot.customTasks
        .filter((task) => {
          const completion = completions[task.id];
          if (completion?.completed || snapshot.edits[task.id]?.archived) {
            return false;
          }
          const due = snapshot.edits[task.id]?.dueDate ?? task.dueDate;
          return due === today || (due && due < today);
        })
        .map((task) => choreTaskToZipView(task)),
    );
}

export function recordsForThisWeek(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const today = todayIso();
  const end = addDays(today, 7);
  return allOpenTaskViews(completions).filter((record) => {
    const due = record.scheduledDate;
    if (!due) {
      return false;
    }
    return due >= today && due <= end;
  });
}

export function recordsForUnscheduled(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const state = { ...snapshot, completions };
  return CHORE_ZIP_RECORDS.filter((record) => {
    const edit = state.edits[record.id];
    if (isArchived(edit)) {
      return false;
    }
    const task = zipRecordToChoreTask(record, state, todayIso());
    if (task.completed || task.status === "Skipped") {
      return false;
    }
    const due = effectiveDueDate(record, edit);
    if (due !== null) {
      return false;
    }
    return record.cadence === "recurring" || record.inbox || !record.frequency.trim();
  }).map((record) => zipRecordToView(record, completions));
}

export function recordsForArchive(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const state = { ...snapshot, completions };
  return CHORE_ZIP_RECORDS.filter((record) => {
    const edit = state.edits[record.id];
    const task = zipRecordToChoreTask(record, state, todayIso());
    return task.completed || isArchived(edit);
  }).map((record) => zipRecordToView(record, completions));
}

export function recordsForWeeklyReset(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const today = todayIso();
  const state = { ...snapshot, completions };
  return CHORE_ZIP_RECORDS.filter((record) => {
    const edit = state.edits[record.id];
    if (isArchived(edit)) {
      return false;
    }
    const task = zipRecordToChoreTask(record, state, today);
    if (task.completed) {
      return false;
    }
    const due = effectiveDueDate(record, edit);
    if (task.status === "Overdue") {
      return true;
    }
    if (due && due > addDays(today, 21)) {
      return true;
    }
    if (record.cadence === "weekly" && !(edit?.assignedTo ?? record.assignedTo ?? record.assigned)) {
      return true;
    }
    return false;
  }).map((record) => zipRecordToView(record, completions));
}

function dedupeRotationRecords(records: ChoreZipRecordView[]): ChoreZipRecordView[] {
  const seen = new Set<string>();
  const result: ChoreZipRecordView[] = [];
  for (const record of records) {
    const key = record.displayTitle.trim().toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(record);
  }
  return result;
}

export function recordsForRotation(completions: ChoreCompletionMap): ChoreZipRecordView[] {
  const slugs = new Set<string>([...ROTATION_KITCHEN_ROOM_SLUGS, ...ROTATION_BATH_ROOM_SLUGS]);
  const records = allOpenTaskViews(completions).filter(
    (record) => record.roomSlug && slugs.has(record.roomSlug),
  );
  return dedupeRotationRecords(records);
}

export function recordsForCalendarDay(
  completions: ChoreCompletionMap,
  dayIso: string,
): ChoreZipRecordView[] {
  return allOpenTaskViews(completions).filter((record) => record.scheduledDate === dayIso);
}

export function recordsForFlowPage(
  page: ChoreFlowHubId,
  completions: ChoreCompletionMap,
): ChoreZipRecordView[] {
  switch (page) {
    case "today":
      return recordsForToday(completions);
    case "this-week":
      return recordsForThisWeek(completions);
    case "unscheduled":
      return recordsForUnscheduled(completions);
    case "archive":
      return recordsForArchive(completions);
    case "weekly-reset":
      return recordsForWeeklyReset(completions);
    case "rotation":
      return recordsForRotation(completions);
    case "calendar":
      return recordsForThisWeek(completions);
    default:
      return [];
  }
}

export function computeTodayFirstHubSummary(
  completions: ChoreCompletionMap,
): TodayFirstHubSummary {
  const today = todayIso();
  const tasks = buildAllTasks({ ...snapshot, completions }, today);
  let overdue = 0;
  let completedThisWeek = 0;

  for (const task of tasks) {
    if (!task.completed && task.status === "Overdue") {
      overdue += 1;
    }
    if (isWithinLastDays(task.completedAt, 7)) {
      completedThisWeek += 1;
    }
  }

  return {
    dueToday: recordsForToday(completions).length,
    overdue,
    unscheduled: recordsForUnscheduled(completions).length,
    completedThisWeek,
  };
}

export function computeFlowHubStats(
  completions: ChoreCompletionMap,
): Record<ChoreFlowHubId, ChoreHubCategoryStats> {
  return {
    today: statsFromRecords(recordsForToday(completions)),
    "this-week": statsFromRecords(recordsForThisWeek(completions)),
    calendar: statsFromRecords(recordsForThisWeek(completions)),
    unscheduled: statsFromRecords(recordsForUnscheduled(completions)),
    archive: statsFromRecords(recordsForArchive(completions)),
    "weekly-reset": statsFromRecords(recordsForWeeklyReset(completions)),
    rotation: statsFromRecords(recordsForRotation(completions)),
  };
}

export function recordsForPage(
  page: CleaningPageId,
  completions: ChoreCompletionMap,
  roomSlug?: string,
): ChoreZipRecordView[] {
  if (page === "today") {
    return recordsForToday(completions);
  }
  if (page === "this-week") {
    return recordsForThisWeek(completions);
  }
  if (page === "calendar") {
    return recordsForThisWeek(completions);
  }
  if (page === "unscheduled") {
    return recordsForUnscheduled(completions);
  }
  if (page === "archive") {
    return recordsForArchive(completions);
  }
  if (page === "weekly-reset") {
    return recordsForWeeklyReset(completions);
  }
  if (page === "rotation") {
    return recordsForRotation(completions);
  }
  if (page === "room" && roomSlug) {
    return recordsForRoom(roomSlug, completions);
  }
  if (page === "rooms" || page === "supplies") {
    return [];
  }
  if (
    page !== "daily" &&
    page !== "weekly" &&
    page !== "monthly" &&
    page !== "seasonal" &&
    page !== "yearly" &&
    page !== "deep" &&
    page !== "recurring"
  ) {
    return [];
  }
  const cadenceMap = {
    daily: "daily",
    weekly: "weekly",
    monthly: "monthly",
    seasonal: "seasonal",
    yearly: "yearly",
    deep: "deep",
    recurring: "recurring",
  } as const satisfies Record<string, CleaningCadence>;
  const cadence = cadenceMap[page];
  const zip = recordsForCadence(cadence, completions);
  const custom = snapshot.customTasks
    .filter((task) => task.cadence === cadence)
    .map((task) => {
      const completion = completions[task.id];
      const completed = completion?.completed === true;
      return choreTaskToZipView({
        ...task,
        completed,
        completedAt: completion?.completedAt ?? null,
        status: completed ? "Done" : task.status,
      });
    });
  return [...zip, ...custom];
}

function accentForRecords(records: ChoreZipRecordView[]): ChoreHubCategoryStats["accent"] {
  if (records.length === 0) {
    return "neutral";
  }
  const remaining = records.filter((record) => !record.completed);
  if (remaining.length === 0) {
    return "done";
  }
  if (remaining.some((record) => record.effectiveStatus === "Overdue")) {
    return "orange";
  }
  if (remaining.some((record) => record.effectiveStatus === "In Progress")) {
    return "teal";
  }
  return "teal";
}

function statsFromRecords(records: ChoreZipRecordView[]): ChoreHubCategoryStats {
  const completed = records.filter((record) => record.completed).length;
  const remaining = records.length - completed;
  return {
    total: records.length,
    remaining,
    completed,
    accent: accentForRecords(records),
  };
}

export function computeHubCategoryStats(
  completions: ChoreCompletionMap,
  _supplies: CleaningSupply[],
): Record<ChoreHubCategoryId, ChoreHubCategoryStats> {
  return computeFlowHubStats(completions);
}

export function computeHubSummary(
  completions: ChoreCompletionMap,
  supplies: CleaningSupply[],
): ChoreHubSummary {
  const today = todayIso();
  const tasks = buildAllTasks(snapshot, today);
  let overdue = 0;
  let completedThisWeek = 0;

  for (const task of tasks) {
    if (!task.completed && task.status === "Overdue") {
      overdue += 1;
    }
    if (isWithinLastDays(task.completedAt, 7)) {
      completedThisWeek += 1;
    }
  }

  return {
    dueToday: recordsForToday(completions).length,
    overdue,
    completedThisWeek,
    suppliesNeeded: supplies.filter((item) => item.needed).length,
  };
}

export function hubStatusLabel(stats: ChoreHubCategoryStats): string {
  if (stats.total === 0) {
    return "No tasks";
  }
  if (stats.remaining === 0) {
    return "Complete";
  }
  if (stats.accent === "orange") {
    return "Needs attention";
  }
  if (stats.accent === "teal" && stats.completed > 0) {
    return "In progress";
  }
  return "Open";
}

export function resetSectionCompletions(page: CleaningPageId, roomSlug?: string) {
  const ids = recordsForPage(page, snapshot.completions, roomSlug).map((record) => record.id);
  const completions = { ...snapshot.completions };
  for (const id of ids) {
    delete completions[id];
  }
  snapshot = { ...snapshot, completions };
  persist();
}

export function useChoreKioskStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const today = todayIso();

  const zipRecords = useMemo(
    () => CHORE_ZIP_RECORDS.map((record) => zipRecordToView(record, store.completions)),
    [store.completions],
  );

  const toggleZipComplete = useCallback((id: string, completed?: boolean) => {
    const current = store.completions[id]?.completed === true;
    const next = completed ?? !current;
    snapshot = {
      ...snapshot,
      completions: {
        ...snapshot.completions,
        [id]: {
          completed: next,
          completedAt: next ? new Date().toISOString() : null,
        },
      },
    };
    persist();
  }, [store.completions]);

  const updateTaskEdit = useCallback((id: string, patch: ChoreTaskEdit) => {
    snapshot = {
      ...snapshot,
      edits: {
        ...snapshot.edits,
        [id]: { ...snapshot.edits[id], ...patch },
      },
    };
    persist();
  }, []);

  const snoozeTask = useCallback(
    (id: string, days = 1) => {
      snapshot = {
        ...snapshot,
        snoozes: {
          ...snapshot.snoozes,
          [id]: { until: addDays(today, days) },
        },
        completions: {
          ...snapshot.completions,
          [id]: { completed: false, completedAt: null },
        },
      };
      persist();
    },
    [today],
  );

  const addCustomTask = useCallback((draft: CustomTaskDraft) => {
    const task: LegacyChoreTask = {
      id: `custom-${crypto.randomUUID()}`,
      title: draft.title.trim() || "New task",
      area: draft.roomSlug ?? "Household",
      room: "",
      roomSlug: draft.roomSlug ?? null,
      assignedTo: draft.assignedTo ?? "",
      schedule: cadenceToSchedule((draft.cadence ?? "recurring") as CleaningCadence),
      frequency: "",
      dueDate: today,
      status: "To Do",
      notes: draft.notes ?? "",
      completed: false,
      completedAt: null,
      lastCompletedAt: null,
      nextDueDate: today,
      source: "custom",
      cadence: (draft.cadence ?? "recurring") as CleaningCadence,
      snoozedUntil: null,
    };
    snapshot = { ...snapshot, customTasks: [task, ...snapshot.customTasks] };
    persist();
    return task;
  }, [today]);

  const deleteCustomTask = useCallback((id: string) => {
    if (!id.startsWith("custom-")) {
      return;
    }
    snapshot = {
      ...snapshot,
      customTasks: snapshot.customTasks.filter((task) => task.id !== id),
    };
    const completions = { ...snapshot.completions };
    delete completions[id];
    snapshot = { ...snapshot, completions };
    persist();
  }, []);

  const addSupply = useCallback((draft: SupplyDraft) => {
    const supply: CleaningSupply = {
      id: `supply-${crypto.randomUUID()}`,
      name: draft.name.trim() || "Supply item",
      category: draft.category?.trim() || "General",
      needed: draft.needed !== false,
      notes: draft.notes ?? "",
      addToShopping: false,
    };
    snapshot = { ...snapshot, supplies: [supply, ...snapshot.supplies] };
    persist();
    return supply;
  }, []);

  const updateSupply = useCallback((id: string, patch: Partial<CleaningSupply>) => {
    snapshot = {
      ...snapshot,
      supplies: snapshot.supplies.map((item) =>
        item.id === id ? { ...item, ...patch, id: item.id } : item,
      ),
    };
    persist();
  }, []);

  const deleteSupply = useCallback((id: string) => {
    snapshot = {
      ...snapshot,
      supplies: snapshot.supplies.filter((item) => item.id !== id),
    };
    persist();
  }, []);

  const addChore = useCallback((draft: ChoreDraft) => {
    if (draft.kind !== "supply") {
      return null;
    }
    return addSupply({
      name: draft.title,
      notes: draft.notes,
      needed: draft.status !== "Done",
    });
  }, [addSupply]);

  const updateChore = useCallback(
    (id: string, patch: Partial<Chore>) => {
      updateSupply(id, {
        name: patch.title,
        notes: patch.notes,
        needed: patch.status !== "Done",
      });
    },
    [updateSupply],
  );

  const deleteChore = useCallback(
    (id: string) => {
      deleteSupply(id);
    },
    [deleteSupply],
  );

  const markDone = useCallback(
    (id: string) => {
      if (id.startsWith("zip-") || id.startsWith("custom-")) {
        toggleZipComplete(id, true);
        return;
      }
      updateSupply(id, { needed: false });
    },
    [toggleZipComplete, updateSupply],
  );

  const snoozeChore = useCallback(
    (id: string, days = 1) => {
      if (id.startsWith("zip-") || id.startsWith("custom-")) {
        snoozeTask(id, days);
        return;
      }
      const supply = snapshot.supplies.find((entry) => entry.id === id);
      if (!supply) {
        return;
      }
      updateSupply(id, { needed: true, notes: `${supply.notes}\nSnoozed until ${addDays(today, days)}`.trim() });
    },
    [snoozeTask, today, updateSupply],
  );

  const assignChore = useCallback(
    (id: string, assignedTo: ChoreFamilyMember | "") => {
      if (id.startsWith("zip-") || id.startsWith("custom-")) {
        updateTaskEdit(id, { assignedTo });
        return;
      }
    },
    [updateTaskEdit],
  );

  const setTaskDate = useCallback(
    (id: string, date: string) => {
      updateTaskEdit(id, { dueDate: date });
    },
    [updateTaskEdit],
  );

  const clearTaskDate = useCallback(
    (id: string) => {
      updateTaskEdit(id, { dueDate: "" });
    },
    [updateTaskEdit],
  );

  const archiveTask = useCallback(
    (id: string) => {
      updateTaskEdit(id, { archived: true });
    },
    [updateTaskEdit],
  );

  const assignRotation = useCallback(
    (id: string, assignedTo: ChoreFamilyMember | "") => {
      const record = zipRecords.find((entry) => entry.id === id);
      if (!record) {
        assignChore(id, assignedTo);
        return;
      }
      const duplicate = recordsForRotation(store.completions).find(
        (entry) =>
          entry.id !== id &&
          entry.displayTitle.trim().toLowerCase() === record.displayTitle.trim().toLowerCase() &&
          (entry.assignedTo || entry.assigned) === assignedTo &&
          assignedTo !== "",
      );
      if (duplicate) {
        window.alert(
          `${assignedTo} is already assigned to “${record.displayTitle}”. Pick another adult or chore.`,
        );
        return;
      }
      assignChore(id, assignedTo);
    },
    [assignChore, store.completions, zipRecords],
  );

  const hubStats = useMemo(
    () => computeHubCategoryStats(store.completions, snapshot.supplies),
    [store.completions, snapshot.supplies],
  );

  const hubSummary = useMemo(
    () => computeHubSummary(store.completions, snapshot.supplies),
    [store.completions, snapshot.supplies],
  );

  const todayFirstSummary = useMemo(
    () => computeTodayFirstHubSummary(store.completions),
    [store.completions],
  );

  const flowHubStats = useMemo(
    () => computeFlowHubStats(store.completions),
    [store.completions],
  );

  const summary = useMemo(
    () => ({
      todayCount: hubSummary.dueToday,
      overdueCount: hubSummary.overdue,
      completedCount: hubSummary.completedThisWeek,
      openCount: zipRecords.filter((record) => !record.completed).length,
    }),
    [hubSummary, zipRecords],
  );

  const suppliesAsChores: Chore[] = useMemo(
    () => snapshot.supplies.map(supplyToChore),
    [snapshot.supplies],
  );

  const chores: Chore[] = useMemo(
    () => [
      ...zipRecords.map((record) => ({
        id: record.id,
        title: record.displayTitle,
        assignedTo: (HOUSEHOLD_MEMBERS.includes(record.assignedTo as ChoreFamilyMember)
          ? record.assignedTo
          : "") as ChoreFamilyMember | "",
        schedule: (record.cadence === "daily"
          ? "daily"
          : record.cadence === "weekly"
            ? "weekly"
            : record.cadence === "monthly"
              ? "monthly"
              : "todo") as ChoreSchedule,
        dueDate: today,
        recurrence: "none" as const,
        status: record.effectiveStatus,
        points: 0,
        notes: record.notes,
        completedAt: record.completedAt,
        kind: "chore" as const,
        zipId: record.id,
      })),
      ...suppliesAsChores,
    ],
    [suppliesAsChores, today, zipRecords],
  );

  return {
    chores,
    zipRecords,
    completions: store.completions,
    supplies: suppliesAsChores,
    cleaningSupplies: snapshot.supplies,
    today,
    addChore,
    updateChore,
    deleteChore,
    markDone,
    snoozeChore,
    assignChore,
    toggleZipComplete,
    updateTaskEdit,
    snoozeTask,
    addCustomTask,
    deleteCustomTask,
    addSupply,
    updateSupply,
    deleteSupply,
    resetSectionCompletions,
    recordsForPage: (page: CleaningPageId, roomSlug?: string) =>
      recordsForPage(page, store.completions, roomSlug),
    recordsForFlowPage: (page: ChoreFlowHubId) =>
      recordsForFlowPage(page, store.completions),
    hubStats,
    hubSummary,
    todayFirstSummary,
    flowHubStats,
    summary,
    setTaskDate,
    clearTaskDate,
    archiveTask,
    assignRotation,
  };
}
