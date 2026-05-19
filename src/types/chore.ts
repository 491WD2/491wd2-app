/** Active household adults for chore assignment. */
export const HOUSEHOLD_MEMBERS = [
  "Lorraine",
  "Herschel",
  "Stella",
  "Nox",
  "Jeremiah",
] as const;

export type HouseholdMember = (typeof HOUSEHOLD_MEMBERS)[number];

/** @deprecated Use HOUSEHOLD_MEMBERS */
export const CHORE_FAMILY_MEMBERS = HOUSEHOLD_MEMBERS;

/** @deprecated Use HouseholdMember */
export type ChoreFamilyMember = HouseholdMember;

export type ChoreSchedule = "todo" | "daily" | "weekly" | "monthly";

export type ChoreRecurrence = "none" | "daily" | "weekly" | "monthly";

export type ChoreStatus = "To Do" | "In Progress" | "Done" | "Overdue" | "Skipped";

export type ChoreItemKind = "chore" | "supply";

export type DayPattern =
  | "daily"
  | "weekly"
  | "biweekly"
  | "interval-3-days"
  | "weekday-kitchen-rotation"
  | "weekend-kitchen-cycle"
  | "saturday-deep-clean"
  | "alternating-living-bath"
  | "entry-twice-weekly"
  | "entry-alternate-days"
  | "as-needed"
  | "monthly";

/** Cadence derived from Notion ZIP export (all 159 records preserved). */
export type CleaningCadence =
  | "daily"
  | "weekly"
  | "monthly"
  | "seasonal"
  | "yearly"
  | "deep"
  | "recurring"
  | "room";

export type CleaningPageId =
  | "today"
  | "this-week"
  | "calendar"
  | "unscheduled"
  | "archive"
  | "weekly-reset"
  | "rotation"
  | "daily"
  | "weekly"
  | "monthly"
  | "seasonal"
  | "yearly"
  | "deep"
  | "supplies"
  | "recurring"
  | "rooms"
  | "room";

export type ChoreFlowHubId =
  | "today"
  | "this-week"
  | "calendar"
  | "unscheduled"
  | "archive"
  | "weekly-reset"
  | "rotation";

export type ChoreHubCategoryId = ChoreFlowHubId;

export type ChoreHubAccent = "teal" | "orange" | "neutral" | "done";

export type ChoreHubCategoryStats = {
  total: number;
  remaining: number;
  completed: number;
  accent: ChoreHubAccent;
};

export type ChoreZipRecord = {
  id: string;
  exportIndex: number;
  name: string;
  assigned: string;
  assignedTo: string;
  frequency: string;
  cadence: CleaningCadence;
  roomSlug: string | null;
  roomLabel: string | null;
  status: string;
  type: string;
  notes: string;
  line: string;
  inbox: boolean;
  scheduledDate: string;
  currentDate: string;
  completionPct: string;
  tasksCompleted: string;
  totalTasks: string;
};

export type ChoreZipRecordView = ChoreZipRecord & {
  completed: boolean;
  completedAt: string | null;
  displayTitle: string;
  effectiveStatus: ChoreStatus;
};

export type Chore = {
  id: string;
  title: string;
  assignedTo: HouseholdMember | "";
  schedule: ChoreSchedule;
  dueDate: string;
  recurrence: ChoreRecurrence;
  status: ChoreStatus;
  points: number;
  notes: string;
  completedAt: string | null;
  kind: ChoreItemKind;
  zipId?: string;
};

export type ChoreDraft = Omit<Chore, "id" | "completedAt"> & {
  completedAt?: string | null;
};

export type ChoreCompletionMap = Record<
  string,
  {
    completed: boolean;
    completedAt: string | null;
  }
>;
