/**
 * Household chore foundation — assigned adult schedules, kitchen priority, localStorage.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { CHORE_ZIP_RECORDS } from "./choreZipSeed";
import type { ChoreZipRecord, DayPattern, HouseholdMember } from "../types/chore";
import { HOUSEHOLD_MEMBERS } from "../types/chore";
import type {
  Checklist,
  ChoreDefinition,
  ChoreTask,
  ChoreTaskStatus,
  MemberSchedule,
  PersistedChoreNotes,
  PersistedChoreState,
  PersistedMemberSchedules,
  ScheduleBundle,
} from "../types/cleaning";
import {
  CHORE_NOTES_STORAGE_KEY,
  CHORE_STATE_STORAGE_KEY,
  MEMBER_SCHEDULES_STORAGE_KEY,
} from "../types/cleaning";
import { writeChoreOfflineSnapshot } from "./choreOfflineSnapshot";
import { broadcastChoreUpdate } from "./choreRealtimeSync";

export { HOUSEHOLD_MEMBERS };
/** @deprecated Use HOUSEHOLD_MEMBERS */
export const CHORE_FAMILY_MEMBERS = HOUSEHOLD_MEMBERS;
export { CHORE_STATE_STORAGE_KEY, MEMBER_SCHEDULES_STORAGE_KEY, CHORE_NOTES_STORAGE_KEY };
export { CHORE_ZIP_RECORDS, CHORE_ZIP_RECORD_COUNT, CHORE_ZIP_ROOMS } from "./choreZipSeed";

/** M–F kitchen rotation order. */
const WEEKDAY_KITCHEN_ORDER: HouseholdMember[] = [
  "Lorraine",
  "Herschel",
  "Stella",
  "Nox",
  "Jeremiah",
];

const WEEKEND_KITCHEN_CYCLES: Array<{ saturday: HouseholdMember; sunday: HouseholdMember }> = [
  { saturday: "Lorraine", sunday: "Herschel" },
  { saturday: "Stella", sunday: "Nox" },
  { saturday: "Jeremiah", sunday: "Lorraine" },
];

const DEEP_CLEAN_ROTATION: HouseholdMember[] = [
  "Stella",
  "Lorraine",
  "Herschel",
  "Nox",
  "Jeremiah",
];

const PERSONAL_RESPONSIBILITY_ITEMS = [
  "Clean up after yourself when making food",
  "Wipe counters if you make a mess",
  "Unload or pick up dishes when needed, even if not yours",
  "If unavailable, assign or ask someone else to cover",
];

const KITCHEN_DUTY_TASK_ID = "rule-kitchen-duty";
const PERSONAL_RESPONSIBILITY_CHECKLIST_ID = "checklist-personal-daily";

/** Rule-based household chores (priority assignments). */
export const HOUSEHOLD_CHORE_DEFINITIONS: ChoreDefinition[] = [
  {
    id: KITCHEN_DUTY_TASK_ID,
    title: "Kitchen duty (full kitchen reset)",
    room: "Kitchen",
    frequency: "Daily",
    dayPattern: "weekday-kitchen-rotation",
    assignRule: "kitchen-weekday",
    category: "kitchen",
    notes: "Priority duty — other chores for this person move to another day.",
  },
  {
    id: "rule-kitchen-weekend",
    title: "Kitchen duty (weekend)",
    room: "Kitchen",
    frequency: "Daily",
    dayPattern: "weekend-kitchen-cycle",
    assignRule: "kitchen-weekend",
    category: "kitchen",
  },
  {
    id: "rule-saturday-deep",
    title: "Saturday deep-clean assignment",
    room: "Household",
    frequency: "Weekly",
    dayPattern: "saturday-deep-clean",
    assignRule: "saturday-deep-clean",
    category: "deep-clean",
  },
  {
    id: "rule-stella-deep-mop",
    title: "Deep-clean mopping",
    room: "Household",
    frequency: "Weekly",
    dayPattern: "weekly",
    assignRule: "stella-deep-mop",
    fixedAssignee: "Stella",
    category: "deep-clean",
    notes: "Weekly or as needed.",
  },
  {
    id: "rule-lorraine-pantry",
    title: "Pantry organization",
    room: "Pantry",
    frequency: "Weekly",
    dayPattern: "weekly",
    assignRule: "lorraine-pantry",
    fixedAssignee: "Lorraine",
    category: "deep-clean",
  },
  {
    id: "rule-herschel-family-room",
    title: "Family room deep clean",
    room: "Family Room",
    frequency: "Weekly",
    dayPattern: "weekly",
    assignRule: "herschel-family-room",
    fixedAssignee: "Herschel",
    category: "deep-clean",
  },
  {
    id: "rule-nox-monthly-entry-reset",
    title: "Monthly entry deep clean",
    room: "Entry",
    frequency: "Monthly",
    dayPattern: "monthly",
    assignRule: "fixed",
    fixedAssignee: "Nox",
    category: "deep-clean",
    notes: "Monthly owner clean when Nox does not have weekend kitchen duty.",
    photoExampleUrl: "photo-example://entry-reset",
  },
  {
    id: "rule-jeremiah-monthly-laundry-reset",
    title: "Monthly laundry room deep clean",
    room: "Laundry Room",
    frequency: "Monthly",
    dayPattern: "monthly",
    assignRule: "fixed",
    fixedAssignee: "Jeremiah",
    category: "deep-clean",
    notes: "Monthly owner clean when Jeremiah does not have weekend kitchen duty.",
    photoExampleUrl: "photo-example://laundry-room-reset",
  },
  {
    id: "rule-dining-weekly",
    title: "Dining room clean",
    room: "Dining Room",
    frequency: "Weekly",
    dayPattern: "weekly",
    assignRule: "weekly-dining",
    category: "room",
    notes: "Once weekly — assign at weekly reset.",
  },
  {
    id: "rule-nox-entry",
    title: "Entry sweep and mop",
    room: "Entry",
    frequency: "Twice weekly",
    dayPattern: "entry-twice-weekly",
    assignRule: "nox-entry",
    fixedAssignee: "Nox",
    category: "entry",
  },
  {
    id: "rule-jeremiah-entry",
    title: "Entry sweep and mop",
    room: "Entry",
    frequency: "Twice weekly",
    dayPattern: "entry-alternate-days",
    assignRule: "jeremiah-entry",
    fixedAssignee: "Jeremiah",
    category: "entry",
    notes: "Alternating days with Nox entry schedule.",
  },
  {
    id: "rule-jeremiah-laundry",
    title: "Laundry room sweep and mop",
    room: "Laundry Room",
    frequency: "As needed",
    dayPattern: "as-needed",
    assignRule: "jeremiah-laundry",
    fixedAssignee: "Jeremiah",
    category: "room",
  },
  {
    id: "rule-jeremiah-trash-rooms",
    title: "Check trash and recycling (all rooms)",
    room: "All rooms",
    frequency: "Every 3 days",
    dayPattern: "interval-3-days",
    assignRule: "jeremiah-trash-rooms",
    fixedAssignee: "Jeremiah",
    category: "trash",
  },
  {
    id: "rule-jeremiah-curb",
    title: "Take trash, recycling, and yard waste to curb",
    room: "Exterior",
    frequency: "Weekly",
    dayPattern: "weekly",
    assignRule: "jeremiah-curb",
    fixedAssignee: "Jeremiah",
    category: "trash",
    notes: "Weekly curb run.",
  },
  {
    id: "rule-living-room-day",
    title: "Living room clean",
    room: "Family Room",
    frequency: "Daily",
    dayPattern: "alternating-living-bath",
    assignRule: "nox-jeremiah-living-bath",
    category: "room",
    notes: "Nox and Jeremiah alternate living room and bathroom days.",
  },
  {
    id: "rule-bathroom-day",
    title: "Bathroom clean",
    room: "Bathroom",
    frequency: "Daily",
    dayPattern: "alternating-living-bath",
    assignRule: "nox-jeremiah-living-bath",
    category: "room",
  },
];

export const HOUSEHOLD_CHECKLISTS: Checklist[] = [
  {
    id: PERSONAL_RESPONSIBILITY_CHECKLIST_ID,
    title: "Daily personal responsibility (everyone)",
    room: "All rooms",
    items: PERSONAL_RESPONSIBILITY_ITEMS,
    supplies: [],
    photoExamples: [],
    notes: "Applies to all household members every day.",
  },
  {
    id: "checklist-bedtime-double-check",
    title: "Bedtime double check",
    room: "Whole house",
    items: [
      "Kitchen counters are wiped if anyone made food",
      "Sink and dishwasher are handled or clearly queued",
      "Shared rooms are reset enough for morning",
      "Doors, lights, and pet/household needs are checked",
      "Anything left out is picked up, even if it is not yours",
    ],
    supplies: ["Phone/camera for examples", "Shared notes board"],
    photoExamples: ["photo-example://bedtime-reset"],
    notes: "A final family check so small misses do not become tomorrow's problem.",
  },
  {
    id: "checklist-kitchen-duty",
    title: "Kitchen duty checklist",
    room: "Kitchen",
    items: [
      "Clear and wipe counters and stovetop",
      "Load/unload dishwasher",
      "Sweep kitchen floor",
      "Take out kitchen trash if full",
      "Wipe appliance fronts",
    ],
    supplies: ["All-purpose cleaner", "Dish soap", "Trash bags"],
    photoExamples: [],
    notes: "Kitchen duty has priority over other chores that day.",
  },
  {
    id: "checklist-stella-deep-mopping",
    title: "Stella deep-clean mopping standard",
    room: "Floors",
    items: [
      "Sweep or vacuum before mopping",
      "Mop high-traffic areas weekly",
      "Spot mop as needed",
      "Take example photos when a floor is finished well",
    ],
    supplies: ["Mop", "Floor cleaner", "Vacuum or broom"],
    photoExamples: ["photo-example://deep-mop-before", "photo-example://deep-mop-after"],
    notes: "Stella owns deep-clean mopping weekly or as needed.",
  },
  {
    id: "checklist-lorraine-pantry-organization",
    title: "Lorraine pantry organization standard",
    room: "Pantry",
    items: [
      "Group like items together",
      "Check expired or nearly empty items",
      "Make a note for improvements",
      "Take example photos of the expected shelf layout",
    ],
    supplies: ["Labels", "Bins", "Phone/camera"],
    photoExamples: ["photo-example://pantry-shelf-standard"],
    notes: "Lorraine owns pantry organization.",
  },
  {
    id: "checklist-herschel-family-room",
    title: "Herschel family room standard",
    room: "Family Room",
    items: [
      "Reset seating and blankets",
      "Pick up personal items and dishes",
      "Wipe surfaces as needed",
      "Take example photos of the expected reset",
    ],
    supplies: ["Microfiber cloth", "All-purpose cleaner", "Phone/camera"],
    photoExamples: ["photo-example://family-room-reset"],
    notes: "Herschel owns the family room.",
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseIso(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

function dayOfWeek(iso: string) {
  return parseIso(iso).getDay();
}

function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const ms = parseIso(b).getTime() - parseIso(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function isSaturday(iso: string) {
  return dayOfWeek(iso) === 6;
}

function isSunday(iso: string) {
  return dayOfWeek(iso) === 0;
}

function isWeekday(iso: string) {
  const d = dayOfWeek(iso);
  return d >= 1 && d <= 5;
}

/** Anchor: first Saturday on or after 2026-01-03 for weekend kitchen cycle. */
const WEEKEND_CYCLE_ANCHOR = "2026-01-03";

function weekendCycleIndex(iso: string) {
  const weeks = Math.floor(daysBetween(WEEKEND_CYCLE_ANCHOR, iso) / 7);
  return ((weeks % 3) + 3) % 3;
}

export function getKitchenDutyAssignee(iso: string): HouseholdMember | null {
  const dow = dayOfWeek(iso);
  if (dow >= 1 && dow <= 5) {
    return WEEKDAY_KITCHEN_ORDER[dow - 1] ?? null;
  }
  if (dow === 6) {
    return WEEKEND_KITCHEN_CYCLES[weekendCycleIndex(iso)]?.saturday ?? null;
  }
  if (dow === 0) {
    return WEEKEND_KITCHEN_CYCLES[weekendCycleIndex(iso)]?.sunday ?? null;
  }
  return null;
}

export function getSaturdayDeepCleanAssignee(iso: string): HouseholdMember | null {
  if (!isSaturday(iso)) {
    return null;
  }
  const weeks = Math.floor(daysBetween("2026-01-03", iso) / 7);
  return DEEP_CLEAN_ROTATION[((weeks % 5) + 5) % 5] ?? null;
}

/** Nox → living room days; Jeremiah → bathroom days (alternating). */
export function getLivingBathAssignment(iso: string): {
  livingRoom: HouseholdMember;
  bathroom: HouseholdMember;
} {
  const flip = daysBetween("2026-01-01", iso) % 2 === 0;
  return flip
    ? { livingRoom: "Nox", bathroom: "Jeremiah" }
    : { livingRoom: "Jeremiah", bathroom: "Nox" };
}

function stripRoomEmoji(label: string) {
  return label.replace(/^[\p{Extended_Pictographic}\s]+/u, "").trim() || label;
}

function normalizeMember(name: string): HouseholdMember | "" {
  const trimmed = name.trim();
  if (trimmed === "Paca") {
    return "Stella";
  }
  return HOUSEHOLD_MEMBERS.includes(trimmed as HouseholdMember) ? (trimmed as HouseholdMember) : "";
}

function isTrashTaskToExclude(record: ChoreZipRecord): boolean {
  const title = record.name.toLowerCase();
  const room = stripRoomEmoji(record.roomLabel ?? "").toLowerCase();
  if (room.includes("trash") || room.includes("recycling")) {
    return true;
  }
  if (!title.includes("trash") && !title.includes("recycling")) {
    return false;
  }
  if (room.includes("bath")) {
    return false;
  }
  const assignee = normalizeMember(record.assignedTo || record.assigned);
  if (assignee === "Jeremiah") {
    return false;
  }
  return true;
}

function zipToDefinition(record: ChoreZipRecord): ChoreDefinition | null {
  if (isTrashTaskToExclude(record)) {
    return null;
  }
  const room = record.roomLabel ? stripRoomEmoji(record.roomLabel) : "Household";
  const title = record.name.trim() || `${room} — ${record.frequency || "task"}`;
  return {
    id: `zip-${record.id}`,
    title,
    room,
    frequency: record.frequency || "As needed",
    dayPattern: mapZipCadenceToPattern(record),
    assignRule: "zip-derived",
    fixedAssignee: normalizeMember(record.assignedTo || record.assigned) || undefined,
    category: "general",
    notes: record.notes || undefined,
    zipId: record.id,
  };
}

function mapZipCadenceToPattern(record: ChoreZipRecord): DayPattern | string {
  if (record.frequency === "Daily") {
    return "daily";
  }
  if (record.frequency === "Weekly") {
    return "weekly";
  }
  if (record.cadence === "monthly") {
    return "monthly";
  }
  return "as-needed";
}

export function buildZipChoreDefinitions(): ChoreDefinition[] {
  return CHORE_ZIP_RECORDS.map((record) => zipToDefinition(record)).filter(
    (entry): entry is ChoreDefinition => entry !== null,
  );
}

export function getAllChoreDefinitions(): ChoreDefinition[] {
  return [...HOUSEHOLD_CHORE_DEFINITIONS, ...buildZipChoreDefinitions()];
}

function resolveAssignee(def: ChoreDefinition, iso: string): HouseholdMember | "" {
  switch (def.assignRule) {
    case "kitchen-weekday":
    case "kitchen-weekend":
      return getKitchenDutyAssignee(iso) ?? "";
    case "saturday-deep-clean":
      return getSaturdayDeepCleanAssignee(iso) ?? "";
    case "nox-jeremiah-living-bath": {
      const { livingRoom, bathroom } = getLivingBathAssignment(iso);
      if (def.id === "rule-bathroom-day" || def.room.toLowerCase().includes("bath")) {
        return bathroom;
      }
      return livingRoom;
    }
    case "nox-entry":
      return "Nox";
    case "jeremiah-entry":
      return "Jeremiah";
    case "jeremiah-trash-rooms":
      return "Jeremiah";
    case "jeremiah-curb":
      return "Jeremiah";
    case "jeremiah-laundry":
      return "Jeremiah";
    case "stella-deep-mop":
      return "Stella";
    case "lorraine-pantry":
      return "Lorraine";
    case "herschel-family-room":
      return "Herschel";
    case "weekly-dining":
      return "";
    case "fixed":
    case "zip-derived":
      return def.fixedAssignee ?? "";
    default:
      return def.fixedAssignee ?? "";
  }
}

function isDefinitionDueOnDate(def: ChoreDefinition, iso: string): boolean {
  const pattern = def.dayPattern;
  if (def.id === KITCHEN_DUTY_TASK_ID) {
    return isWeekday(iso);
  }
  if (def.id === "rule-kitchen-weekend") {
    return isSaturday(iso) || isSunday(iso);
  }
  if (pattern === "daily") {
    return true;
  }
  if (pattern === "weekly" || def.assignRule === "jeremiah-curb") {
    return dayOfWeek(iso) === 6;
  }
  if (pattern === "saturday-deep-clean" || def.assignRule === "saturday-deep-clean") {
    return isSaturday(iso);
  }
  if (pattern === "interval-3-days" || def.assignRule === "jeremiah-trash-rooms") {
    return daysBetween("2026-01-01", iso) % 3 === 0;
  }
  if (pattern === "entry-twice-weekly" || def.assignRule === "nox-entry") {
    return dayOfWeek(iso) === 2 || dayOfWeek(iso) === 5;
  }
  if (pattern === "entry-alternate-days" || def.assignRule === "jeremiah-entry") {
    return daysBetween("2026-01-01", iso) % 2 === 1;
  }
  if (pattern === "alternating-living-bath") {
    return true;
  }
  if (pattern === "monthly") {
    const assignee = resolveAssignee(def, iso);
    if (!assignee) {
      return false;
    }
    return isFirstAvailableWeekendForMemberThisMonth(iso, assignee);
  }
  if (pattern === "weekday-kitchen-rotation" || pattern === "weekend-kitchen-cycle") {
    return false;
  }
  if (def.assignRule === "zip-derived") {
    if (def.frequency === "Daily") {
      return true;
    }
    if (def.frequency === "Weekly") {
      return dayOfWeek(iso) === 1;
    }
    return false;
  }
  if (def.assignRule === "stella-deep-mop" || def.assignRule === "lorraine-pantry" || def.assignRule === "herschel-family-room") {
    return dayOfWeek(iso) === 0;
  }
  return false;
}

function isFirstAvailableWeekendForMemberThisMonth(iso: string, member: HouseholdMember): boolean {
  if (!isSaturday(iso) && !isSunday(iso)) {
    return false;
  }
  if (getKitchenDutyAssignee(iso) === member) {
    return false;
  }

  const current = parseIso(iso);
  const firstOfMonth = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  for (let day = 1; day <= current.getDate(); day += 1) {
    const candidate = new Date(current.getFullYear(), current.getMonth(), day, 12);
    const candidateIso = candidate.toISOString().slice(0, 10);
    if (
      candidate >= firstOfMonth &&
      (isSaturday(candidateIso) || isSunday(candidateIso)) &&
      getKitchenDutyAssignee(candidateIso) !== member
    ) {
      return candidateIso === iso;
    }
  }
  return false;
}

function materializeTask(
  def: ChoreDefinition,
  iso: string,
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
): ChoreTask | null {
  if (!isDefinitionDueOnDate(def, iso)) {
    return null;
  }

  const override = state.assignmentOverrides[def.id];
  const assignedTo = override !== undefined ? override : resolveAssignee(def, iso);
  const completion = state.completions[def.id];
  const skipped = state.skipped[def.id];
  const kitchenDuty = getKitchenDutyAssignee(iso);
  const isKitchen =
    def.category === "kitchen" || def.id === KITCHEN_DUTY_TASK_ID || def.id === "rule-kitchen-weekend";

  let status: ChoreTaskStatus = "To Do";
  if (completion) {
    status = "Done";
  } else if (skipped) {
    status = "Skipped";
  }

  return {
    id: def.id,
    title: def.title,
    room: def.room,
    assignedTo,
    frequency: def.frequency,
    dayPattern: def.dayPattern,
    dueDate: iso,
    status,
    notes: def.notes ?? "",
    photoExampleUrl: def.photoExampleUrl ?? "",
    improvementNotes: notes.improvementNotes[def.id] ?? "",
    completedAt: completion?.completedAt ?? null,
    skippedReason: skipped?.reason ?? null,
    source: def.zipId ? "zip" : "rule",
    isKitchenDuty: isKitchen && assignedTo === kitchenDuty,
    zipExportIndex: def.zipId ? CHORE_ZIP_RECORDS.findIndex((r) => r.id === def.zipId) : undefined,
  };
}

export function applyKitchenDutyConflict(tasks: ChoreTask[], _iso: string): ChoreTask[] {
  const kitchenAssignee = getKitchenDutyAssignee(_iso);
  if (!kitchenAssignee) {
    return tasks;
  }

  const hasKitchen = tasks.some((t) => t.isKitchenDuty && t.assignedTo === kitchenAssignee);
  if (!hasKitchen) {
    return tasks;
  }

  return tasks.map((task) => {
    if (task.assignedTo !== kitchenAssignee || task.isKitchenDuty || task.source === "personal") {
      return task;
    }
    if (task.status === "Done" || task.status === "Skipped") {
      return task;
    }
    return {
      ...task,
      status: "Skipped" as const,
      skippedReason: "Moved — kitchen duty has priority today",
      suppressedByKitchenDuty: true,
    };
  });
}

export function buildTasksForDate(
  iso: string,
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
): ChoreTask[] {
  const defs = getAllChoreDefinitions();
  const materialized = defs
    .map((def) => materializeTask(def, iso, state, notes))
    .filter((task): task is ChoreTask => task !== null);

  const personalTasks: ChoreTask[] = HOUSEHOLD_MEMBERS.map((member) => ({
    id: `personal-${member}-${iso}`,
    title: "Daily personal responsibility",
    room: "All rooms",
    assignedTo: member,
    frequency: "Daily",
    dayPattern: "daily",
    dueDate: iso,
    status: state.completions[`personal-${member}-${iso}`] ? "Done" : "To Do",
    notes: PERSONAL_RESPONSIBILITY_ITEMS.join("; "),
    photoExampleUrl: "",
    improvementNotes: "",
    completedAt: state.completions[`personal-${member}-${iso}`]?.completedAt ?? null,
    skippedReason: null,
    source: "personal",
  }));

  return applyKitchenDutyConflict([...materialized, ...personalTasks], iso);
}

export function buildWeekTasks(
  startIso: string,
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
): ChoreTask[] {
  const tasks: ChoreTask[] = [];
  for (let i = 0; i < 7; i += 1) {
    tasks.push(...buildTasksForDate(addDays(startIso, i), state, notes));
  }
  return tasks;
}

export function buildMonthTasks(
  startIso: string,
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
): ChoreTask[] {
  const tasks: ChoreTask[] = [];
  for (let i = 0; i < 28; i += 7) {
    tasks.push(...buildWeekTasks(addDays(startIso, i), state, notes));
  }
  return tasks;
}

function buildMemberSchedule(
  member: HouseholdMember,
  _iso: string,
  today: ChoreTask[],
  month: ChoreTask[],
  messageBoard: string,
): MemberSchedule {
  const todaySchedule = today.filter((t) => t.assignedTo === member);
  const monthlySchedule = month.filter((t) => t.assignedTo === member);
  const cleaningThisMonth = [...new Set(monthlySchedule.map((t) => t.room))].sort();

  return {
    memberName: member,
    monthlySchedule,
    todaySchedule,
    cleaningThisMonth,
    messageBoard,
  };
}

export function buildScheduleBundle(
  iso: string,
  state: PersistedChoreState,
  memberMeta: PersistedMemberSchedules,
  notes: PersistedChoreNotes,
): ScheduleBundle {
  const today = buildTasksForDate(iso, state, notes);
  const weekStart = iso;
  const thisWeek = buildWeekTasks(weekStart, state, notes);
  const monthStart = `${iso.slice(0, 8)}01`;
  const thisMonth = buildMonthTasks(monthStart, state, notes);

  const memberSchedules = HOUSEHOLD_MEMBERS.map((member) =>
    buildMemberSchedule(
      member,
      iso,
      today,
      thisMonth,
      memberMeta.messageBoardByMember[member] ?? "",
    ),
  );

  return {
    date: iso,
    today,
    thisWeek,
    thisMonth,
    memberSchedules,
    kitchenDutyToday: getKitchenDutyAssignee(iso),
    checklists: HOUSEHOLD_CHECKLISTS,
  };
}

// --- localStorage ---

const defaultChoreState = (): PersistedChoreState => ({
  version: 1,
  completions: {},
  skipped: {},
  assignmentOverrides: {},
});

const defaultMemberSchedules = (): PersistedMemberSchedules => ({
  version: 1,
  messageBoardByMember: {},
});

const defaultChoreNotes = (): PersistedChoreNotes => ({
  version: 1,
  improvementNotes: {},
});

type FoundationSnapshot = {
  choreState: PersistedChoreState;
  memberSchedules: PersistedMemberSchedules;
  choreNotes: PersistedChoreNotes;
};

const listeners = new Set<() => void>();

function loadFoundation(): FoundationSnapshot {
  if (typeof window === "undefined") {
    return {
      choreState: defaultChoreState(),
      memberSchedules: defaultMemberSchedules(),
      choreNotes: defaultChoreNotes(),
    };
  }

  let choreState = defaultChoreState();
  let memberSchedules = defaultMemberSchedules();
  let choreNotes = defaultChoreNotes();

  try {
    const raw = window.localStorage.getItem(CHORE_STATE_STORAGE_KEY);
    if (raw) {
      choreState = { ...defaultChoreState(), ...(JSON.parse(raw) as PersistedChoreState) };
    }
  } catch {
    /* ignore */
  }

  try {
    const legacy = window.localStorage.getItem("491wd-chores-state");
    if (legacy && Object.keys(choreState.completions).length === 0) {
      const parsed = JSON.parse(legacy) as { completions?: Record<string, { completedAt: string | null }> };
      if (parsed.completions) {
        for (const [id, entry] of Object.entries(parsed.completions)) {
          if (entry?.completedAt) {
            choreState.completions[id] = { completedAt: entry.completedAt };
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(MEMBER_SCHEDULES_STORAGE_KEY);
    if (raw) {
      memberSchedules = { ...defaultMemberSchedules(), ...(JSON.parse(raw) as PersistedMemberSchedules) };
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(CHORE_NOTES_STORAGE_KEY);
    if (raw) {
      choreNotes = { ...defaultChoreNotes(), ...(JSON.parse(raw) as PersistedChoreNotes) };
    }
  } catch {
    /* ignore */
  }

  return { choreState, memberSchedules, choreNotes };
}

let foundationSnapshot: FoundationSnapshot = loadFoundation();

const CHORE_STORAGE_SYNC_EVENT = "491wd-chore-storage-sync";

export function reloadChoreFoundationFromStorage() {
  foundationSnapshot = loadFoundation();
  for (const listener of listeners) {
    listener();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener(CHORE_STORAGE_SYNC_EVENT, reloadChoreFoundationFromStorage);
}

function persistFoundation() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORE_STATE_STORAGE_KEY, JSON.stringify(foundationSnapshot.choreState));
  window.localStorage.setItem(
    MEMBER_SCHEDULES_STORAGE_KEY,
    JSON.stringify(foundationSnapshot.memberSchedules),
  );
  window.localStorage.setItem(CHORE_NOTES_STORAGE_KEY, JSON.stringify(foundationSnapshot.choreNotes));
  writeChoreOfflineSnapshot({
    choreState: foundationSnapshot.choreState,
    memberSchedules: foundationSnapshot.memberSchedules,
    choreNotes: foundationSnapshot.choreNotes,
  });
  for (const listener of listeners) {
    listener();
  }
  broadcastChoreUpdate();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getFoundationSnapshot() {
  return foundationSnapshot;
}

export function useHouseholdChoreStore() {
  const snap = useSyncExternalStore(subscribe, getFoundationSnapshot, getFoundationSnapshot);
  const today = todayIso();

  const schedule = useMemo(
    () => buildScheduleBundle(today, snap.choreState, snap.memberSchedules, snap.choreNotes),
    [snap.choreNotes, snap.choreState, snap.memberSchedules, today],
  );

  const markDone = useCallback((taskId: string) => {
    foundationSnapshot = {
      ...foundationSnapshot,
      choreState: {
        ...foundationSnapshot.choreState,
        completions: {
          ...foundationSnapshot.choreState.completions,
          [taskId]: { completedAt: new Date().toISOString() },
        },
      },
    };
    persistFoundation();
  }, []);

  const skipTask = useCallback((taskId: string, reason: string) => {
    foundationSnapshot = {
      ...foundationSnapshot,
      choreState: {
        ...foundationSnapshot.choreState,
        skipped: {
          ...foundationSnapshot.choreState.skipped,
          [taskId]: { reason, skippedAt: new Date().toISOString() },
        },
      },
    };
    persistFoundation();
  }, []);

  const setAssignment = useCallback((taskId: string, member: HouseholdMember | "") => {
    foundationSnapshot = {
      ...foundationSnapshot,
      choreState: {
        ...foundationSnapshot.choreState,
        assignmentOverrides: {
          ...foundationSnapshot.choreState.assignmentOverrides,
          [taskId]: member,
        },
      },
    };
    persistFoundation();
  }, []);

  const setImprovementNote = useCallback((taskId: string, text: string) => {
    foundationSnapshot = {
      ...foundationSnapshot,
      choreNotes: {
        ...foundationSnapshot.choreNotes,
        improvementNotes: {
          ...foundationSnapshot.choreNotes.improvementNotes,
          [taskId]: text,
        },
      },
    };
    persistFoundation();
  }, []);

  const setMessageBoard = useCallback((member: HouseholdMember, text: string) => {
    foundationSnapshot = {
      ...foundationSnapshot,
      memberSchedules: {
        ...foundationSnapshot.memberSchedules,
        messageBoardByMember: {
          ...foundationSnapshot.memberSchedules.messageBoardByMember,
          [member]: text,
        },
      },
    };
    persistFoundation();
  }, []);

  return {
    today,
    schedule,
    definitions: getAllChoreDefinitions(),
    checklists: HOUSEHOLD_CHECKLISTS,
    choreState: snap.choreState,
    choreNotes: snap.choreNotes,
    memberSchedules: snap.memberSchedules,
    markDone,
    skipTask,
    setAssignment,
    setImprovementNote,
    setMessageBoard,
    getKitchenDutyAssignee,
    getLivingBathAssignment,
    applyKitchenDutyConflict,
  };
}

/** Legacy kiosk / ZIP layer — used by cleaning flow pages until migrated. */
export {
  CHORE_KIOSK_STORAGE_KEY,
  CHORE_ZIP_COMPLETIONS_KEY,
  recordDisplayTitle,
  zipRecordToView,
  recordsForCadence,
  recordsForRoom,
  recordsForToday,
  recordsForPage,
  computeHubCategoryStats,
  computeHubSummary,
  hubStatusLabel,
  resetSectionCompletions,
  computeTodayFirstHubSummary,
  computeFlowHubStats,
  recordsForFlowPage,
  recordsForCalendarDay,
  ROTATION_KITCHEN_ROOM_SLUGS,
  ROTATION_BATH_ROOM_SLUGS,
  useChoreKioskStore,
} from "./cleaningData";

export {
  CHORES_STATE_STORAGE_KEY,
  CLEANING_CHECKLISTS_STORAGE_KEY,
  CLEANING_SUPPLIES_STORAGE_KEY,
} from "../types/cleaning";
