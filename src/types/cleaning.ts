import type { DayPattern, HouseholdMember } from "./chore";

export const CHORE_STATE_STORAGE_KEY = "491wd-chore-state";
export const MEMBER_SCHEDULES_STORAGE_KEY = "491wd-member-schedules";
export const CHORE_NOTES_STORAGE_KEY = "491wd-chore-notes";

/** Legacy keys — migrated on load. */
export const CHORES_STATE_STORAGE_KEY = "491wd-chores-state";
export const CLEANING_CHECKLISTS_STORAGE_KEY = "491wd-cleaning-checklists";
export const CLEANING_SUPPLIES_STORAGE_KEY = "491wd-cleaning-supplies";
export const LEGACY_CHORE_KIOSK_KEY = "491wd-chore-kiosk";
export const LEGACY_CHORE_ZIP_COMPLETIONS_KEY = "491wd-chore-zip-completions";

export type ChoreTaskStatus = "To Do" | "In Progress" | "Done" | "Overdue" | "Skipped";

export type ChoreTaskSource = "rule" | "zip" | "personal";

export type ChoreTask = {
  id: string;
  title: string;
  room: string;
  assignedTo: HouseholdMember | "";
  frequency: string;
  dayPattern: DayPattern | string;
  dueDate: string;
  status: ChoreTaskStatus;
  notes: string;
  photoExampleUrl: string;
  improvementNotes: string;
  completedAt: string | null;
  skippedReason: string | null;
  source: ChoreTaskSource;
  /** Kitchen duty suppresses other chores for that member today. */
  isKitchenDuty?: boolean;
  suppressedByKitchenDuty?: boolean;
  zipExportIndex?: number;
};

export type MemberSchedule = {
  memberName: HouseholdMember;
  monthlySchedule: ChoreTask[];
  todaySchedule: ChoreTask[];
  cleaningThisMonth: string[];
  messageBoard: string;
};

export type Checklist = {
  id: string;
  title: string;
  room: string;
  items: string[];
  supplies: string[];
  photoExamples: string[];
  notes: string;
};

export type ChoreDefinition = {
  id: string;
  title: string;
  room: string;
  frequency: string;
  dayPattern: DayPattern | string;
  assignRule:
    | "fixed"
    | "kitchen-weekday"
    | "kitchen-weekend"
    | "saturday-deep-clean"
    | "nox-jeremiah-living-bath"
    | "nox-entry"
    | "jeremiah-entry"
    | "jeremiah-trash-rooms"
    | "jeremiah-curb"
    | "jeremiah-laundry"
    | "weekly-dining"
    | "stella-deep-mop"
    | "lorraine-pantry"
    | "herschel-family-room"
    | "personal-daily"
    | "zip-derived";
  fixedAssignee?: HouseholdMember;
  category: "kitchen" | "room" | "entry" | "trash" | "deep-clean" | "personal" | "general";
  notes?: string;
  photoExampleUrl?: string;
  zipId?: string;
};

export type PersistedChoreState = {
  version: 1;
  completions: Record<string, { completedAt: string }>;
  skipped: Record<string, { reason: string; skippedAt: string }>;
  assignmentOverrides: Record<string, HouseholdMember | "">;
};

export type PersistedMemberSchedules = {
  version: 1;
  messageBoardByMember: Partial<Record<HouseholdMember, string>>;
};

export type PersistedChoreNotes = {
  version: 1;
  improvementNotes: Record<string, string>;
};

export type ScheduleBundle = {
  date: string;
  today: ChoreTask[];
  thisWeek: ChoreTask[];
  thisMonth: ChoreTask[];
  memberSchedules: MemberSchedule[];
  kitchenDutyToday: HouseholdMember | null;
  checklists: Checklist[];
};

export type ChoreHubSummary = {
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  suppliesNeeded: number;
};

export type TodayFirstHubSummary = {
  dueToday: number;
  overdue: number;
  unscheduled: number;
  completedThisWeek: number;
};

/** @deprecated */
export type ChoreScheduleType =
  | "Today"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Seasonal"
  | "Yearly"
  | "Deep Cleaning"
  | "Room"
  | "Supply"
  | "Recurring";

/** @deprecated */
export type CleaningChecklist = Checklist;

/** @deprecated */
export type CleaningSupply = {
  id: string;
  name: string;
  category: string;
  needed: boolean;
  notes: string;
  addToShopping: boolean;
};

/** @deprecated */
export type ChoreTaskCompletion = {
  completed: boolean;
  completedAt: string | null;
};

/** @deprecated */
export type ChoreTaskEdit = {
  title?: string;
  assignedTo?: string;
  notes?: string;
  frequency?: string;
  dueDate?: string;
  archived?: boolean;
};

/** @deprecated */
export type ChoreTaskSnooze = {
  until: string;
};

/** @deprecated */
export type PersistedChoresState = {
  version: 3;
  completions: Record<string, ChoreTaskCompletion>;
  edits: Record<string, ChoreTaskEdit>;
  snoozes: Record<string, ChoreTaskSnooze>;
  /** Legacy kiosk custom rows — opaque for foundation layer. */
  customTasks: Array<Record<string, unknown>>;
};

export type SupplyDraft = {
  name: string;
  category?: string;
  notes?: string;
  needed?: boolean;
};

export type CustomTaskDraft = {
  title: string;
  assignedTo?: HouseholdMember | "";
  notes?: string;
  cadence?: string;
  roomSlug?: string | null;
};
