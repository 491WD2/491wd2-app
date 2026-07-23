import {
  CLEANING_PLAYBOOK_CANONICAL_IDS,
  cloneCleaningRoomStarter,
} from "./cleaningPlaybookTemplates";
import { createDemoPantryInventoryItems } from "./demoPantryInventory";

export type TaskStatus =
  | "Not Started"
  | "Today"
  | "In Progress"
  | "Waiting Review"
  | "Completed"
  | "Done"
  | "Skipped"
  | "Snoozed";
export type Priority = "Low" | "Medium" | "High";
export type TaskType = "task" | "chore";
export type TaskFrequency =
  | "one-time"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "as-needed";
export type TaskSource = "manual" | "seed" | "import";
export type DataSource = "manual" | "seed" | "import" | "lookup";
export type FamilyMemberStatus =
  | "active"
  | "away"
  | "archived"
  | "guest"
  | "extended"
  | "emergency"
  | "pet";

export type PresenceStatus =
  | "home"
  | "away"
  | "school"
  | "work"
  | "sleeping"
  | "busy"
  | "unknown"
  | "custom";

export type PresenceSource =
  | "manual"
  | "home_assistant"
  | "life360"
  | "device"
  | "unknown";

export type Presence = {
  status: PresenceStatus;
  customLabel?: string;
  source: PresenceSource;
  lastUpdated?: string;
  note?: string;
};

export type CleaningRoomTask = {
  id: string;
  title: string;
  completed?: boolean;
  completedAt?: string;
  completedByMemberId?: string | null;
};

export type CleaningRoomTaskGroupFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "custom";

export type CleaningRoomTaskGroup = {
  id: string;
  title: string;
  /** When set, drives playbook grouping; otherwise inferred from title when migrating. */
  frequency?: CleaningRoomTaskGroupFrequency;
  tasks: CleaningRoomTask[];
};

export type CleaningCompletionStatus =
  | "completed"
  | "needs_review"
  | "approved"
  | "needs_redo";

/** Room playbook completion session (no photo proof). */
export type CleaningCompletionRecord = {
  id: string;
  roomId: string;
  completedByMemberId?: string;
  completedAt: string;
  checklistProgress: { completed: number; total: number };
  status: CleaningCompletionStatus;
  reviewedByMemberId?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type CleaningRoom = {
  id: string;
  name: string;
  /** Links chores/tasks by zone when set; defaults to matching {@link CleaningRoom.name}. */
  zone?: string;
  /** Lucide icon name (stored as string for portability). */
  icon: string;
  description?: string;
  referenceImageUrl?: string;
  referenceImageCaption?: string;
  whatToDo: string[];
  whatToAvoid: string[];
  suppliesNeeded: string[];
  taskGroups: CleaningRoomTaskGroup[];
  createdAt: string;
  updatedAt: string;
};

export type PantryLocation =
  | "Kitchen Fridge"
  | "Kitchen Freezer"
  | "Kitchen Cabinets"
  | "Pantry"
  | "Laundry Room Fridge"
  | "Laundry Room Freezer"
  | "Family Room Freezer"
  | "Custom Location";

export type PantryWall = "Wall 1" | "Wall 2" | "Wall 3" | "Wall 4";
export type PantryShelf =
  | "Shelf 1"
  | "Shelf 2"
  | "Shelf 3"
  | "Shelf 4"
  | "Shelf 5";
export type StockStatus = "Stocked" | "Low" | "Out";
export type StoreSection =
  | "produce"
  | "meat"
  | "dairy"
  | "frozen"
  | "aisles"
  | "household"
  | "checkout";

export type ModuleKey =
  | "dashboard"
  | "family"
  | "tasks"
  | "projects"
  | "pantry"
  | "shopping"
  | "calendar"
  | "planner"
  | "docs";

export type InstacartSettings = {
  enableInstacartExport: boolean;
  preferredStoreName?: string;
  preferredZipCode?: string;
  notes?: string;
};

export type DataSourceMode = "local" | "cloud-preview";

/**
 * Optional admin-editable lists and labels (localStorage). Missing entries use bundled defaults.
 * Label aliases (e.g. appName, settingsLabel) normalize to canonical keys on save — see `lib/customization`.
 */
export type CustomizationSettings = {
  labels?: Record<string, string> &
    Partial<{
      appDisplayName: string;
      dashboardTitle: string;
      dashboardWelcomeMessage: string;
      moduleHouseholdInventory: string;
      moduleShopping: string;
      moduleTasks: string;
      moduleFamily: string;
      moduleCalendar: string;
      modulePlanner: string;
      moduleProjects: string;
      moduleDocs: string;
      moduleDashboardNav: string;
      moduleSettings: string;
    }>;
  memberRoles?: string[];
  memberAgeGroups?: string[];
  memberStatuses?: string[];
  taskZones?: string[];
  taskStatuses?: string[];
  taskPriorities?: string[];
  taskFrequencies?: string[];
  taskCategories?: string[];
  calendarCategories?: string[];
  groceryCategories?: string[];
  groceryStoreSections?: string[];
  inventoryCategories?: string[];
  inventoryStorageAreas?: string[];
  kitchenLocationDetails?: string[];
  pantryWallOptions?: string[];
  pantryShelfOptions?: string[];
  fridgeFreezerLocationDetails?: string[];
  units?: string[];
  projectStatuses?: string[];
  projectPriorities?: string[];
  docCategories?: string[];
  docVisibility?: string[];
  /** Message board category labels + colors (does not delete existing messages when edited). */
  messageBoardCategories?: MessageBoardCategoryDefinition[];
  /** Editable targets for Food Storage Plan (Household Inventory). */
  foodStoragePlanLines?: FoodStoragePlanLine[];
};

/** User-facing groups for food storage planning (inspired by common readiness guidance). */
export type FoodStoragePlanGroup =
  | "three_month_supply"
  | "long_term_storage"
  | "water"
  | "household_essentials";

export type PantryItemType = "food" | "household" | "medical" | "pet" | "other";

export type StorageClass =
  | "everyday"
  | "three_month_supply"
  | "long_term_storage"
  | "emergency"
  | "household_supply";

/** User-facing storage bucket (scanner / inventory edit). Maps to {@link StorageClass} when saving. */
export type PantryStorageType =
  | "short_term"
  | "long_term"
  | "emergency"
  | "household_supply"
  | "other";

export type ItemUseType = "single_use" | "partial_use" | "multi_pack" | "unknown";

export type ShelfLifeSource = "default_guidance" | "manual" | "unknown";

/** Pantry shelf-life / Church-inspired planning categories (guidance only). */
export type FoodStorageCategory =
  | "grains"
  | "beans_legumes"
  | "pasta"
  | "oats"
  | "potatoes"
  | "canned_vegetables"
  | "canned_fruit"
  | "canned_meat"
  | "dairy_powder"
  | "baking"
  | "oils_fats"
  | "water"
  | "comfort_food"
  | "household_supply"
  | "other";

export type RotationStatus =
  | "fresh"
  | "use_first"
  | "rotate_soon"
  | "past_best_quality"
  | "inspect_before_use"
  | "discard_if_damaged";

export type CanCondition =
  | "good"
  | "dented"
  | "rusted"
  | "swollen"
  | "leaking"
  | "unknown";

/** One row in the Food Storage Plan (targets vs pantry totals). */
export type FoodStoragePlanLine = {
  id: string;
  /** Stable key for matching pantry `foodStorageCategory` values. */
  categoryKey: FoodStorageCategory | "custom";
  label: string;
  group: FoodStoragePlanGroup;
  /** Planning amount (string so users can enter ranges or notes). */
  targetAmount: string;
  targetUnit: string;
};

/** Kiosk home anchor section (scroll target on `/kiosk`). */
export const kioskDefaultViewOptions = [
  "dashboard",
  "today",
  "chores",
  "shopping",
  "calendar",
] as const;
export type KioskDefaultView = (typeof kioskDefaultViewOptions)[number];

/** Device profile for the kitchen / wall workstation (informational + layout hints). */
export const kitchenWallDisplayDeviceOptions = [
  "surface_pro",
  "ipad",
  "iphone",
  "android_phone",
] as const;
export type KitchenWallDisplayDevice = (typeof kitchenWallDisplayDeviceOptions)[number];

/** Weekday kitchen duty (full week — manual assignments per day). */
export type KitchenWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type KitchenScheduleDay = {
  day: KitchenWeekday;
  memberId: string;
};

export type KitchenSchedule = {
  weekdays: KitchenScheduleDay[];
  updatedAt?: string;
  /** Dates (YYYY-MM-DD) marked as kitchen-lead completed for that day. */
  completedDates?: string[];
  /**
   * Calendar date (YYYY-MM-DD) for which incomplete-duty in-app reminders were already issued.
   * Cleared when duty is marked undone so reminders can fire again; prevents duplicates after dismiss + reload.
   */
  kitchenDutyReminderIssuedForDate?: string;
};

/** Logged completion for kitchen duty (weekday lead). */
export type KitchenDutyCompletion = {
  id: string;
  dayKey: KitchenWeekday;
  /** Calendar date this completion applies to. */
  dutyDate: string;
  memberId: string;
  completedAt: string;
  completedByMemberId?: string;
  notes?: string;
  createdAt: string;
};

/** Reference photo for a kitchen checklist task (stored compressed as JPEG data URL). */
export type CleaningPhotoReference = {
  id: string;
  imageDataUrl?: string;
  caption?: string;
  instructions?: string;
  objectPositionX?: number;
  objectPositionY?: number;
  scale?: number;
  createdAt: string;
  updatedAt: string;
};

/** Editable daily kitchen closing checklist (checked state is per calendar day via checkedDate). */
export type KitchenChecklistItem = {
  id: string;
  label: string;
  sortOrder: number;
  /** When equal to today's YYYY-MM-DD, the row shows checked for that day. */
  checkedDate?: string;
  /** Custom step lines; when absent, bundled hints from `kitchenTaskNotes` apply. */
  stepsLines?: string[];
  /** Free-form notes for this row (device-local). */
  notesText?: string;
  /** Reference photos + instructions for this task. */
  photoReferences?: CleaningPhotoReference[];
};

/** Tailwind-backed palette keys for message categories (soft, readable). */
export type MessageBoardColorKey =
  | "slate"
  | "blue"
  | "sky"
  | "teal"
  | "green"
  | "amber"
  | "orange"
  | "rose"
  | "purple"
  | "pink";

export type MessageBoardPriority = "low" | "normal" | "important" | "urgent";

export type MessageBoardCategoryDefinition = {
  id: string;
  label: string;
  colorKey: MessageBoardColorKey;
};

/** Bundled defaults; customizable via Settings → Customization → Message Board. */
export const DEFAULT_MESSAGE_BOARD_CATEGORY_DEFINITIONS: MessageBoardCategoryDefinition[] = [
  { id: "mb-general", label: "General", colorKey: "slate" },
  { id: "mb-reminder", label: "Reminder", colorKey: "blue" },
  { id: "mb-kitchen", label: "Kitchen", colorKey: "sky" },
  { id: "mb-shopping", label: "Shopping", colorKey: "teal" },
  { id: "mb-cleaning", label: "Cleaning", colorKey: "green" },
  { id: "mb-calendar", label: "Calendar", colorKey: "amber" },
  { id: "mb-school", label: "School", colorKey: "orange" },
  { id: "mb-medical", label: "Medical", colorKey: "rose" },
  { id: "mb-bills", label: "Bills", colorKey: "purple" },
  { id: "mb-important", label: "Important", colorKey: "pink" },
  { id: "mb-family-update", label: "Family Update", colorKey: "slate" },
];

export type MessageBoardItem = {
  id: string;
  /** Short headline; body stays in `message`. */
  title: string;
  message: string;
  /** Category label (may be legacy/custom — resolved against customization + orphans). */
  category: string;
  colorKey: MessageBoardColorKey;
  priority: MessageBoardPriority;
  pinned: boolean;
  authorMemberId?: string;
  relatedMemberIds?: string[];
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SectionSize = "compact" | "normal" | "large";

/** Per-page layout + optional flag stored alongside layout prefs. */
export type MemberPageLayoutSettings = {
  lockLayout?: boolean;
  hiddenSections?: string[];
  collapsedSections?: string[];
  sectionSizes?: Record<string, SectionSize>;
  notificationsEnabled?: boolean;
};

export type MemberNotificationPreferences = {
  enableReminders?: boolean;
  choresDue?: boolean;
  /** Synthetic overdue chore reminders (separate from due-today). */
  choresOverdue?: boolean;
  shoppingUpdates?: boolean;
  kitchenDutyReminders?: boolean;
  /** Legacy — prefer {@link calendarEventsToday}; kept for migration fallback. */
  calendarReminders?: boolean;
  /** Planner items dated today (household broadcast reminders). */
  calendarEventsToday?: boolean;
  inventoryLowStock?: boolean;
  petMedicationDue?: boolean;
  importantMessages?: boolean;
};

/** Preferences for a family member (localStorage; not tied to auth). */
export type UserMemberPreferences = {
  pageSettings?: Record<string, MemberPageLayoutSettings>;
  notificationPreferences?: MemberNotificationPreferences;
  /** Preferred first route when opening the app (optional future use). */
  defaultLandingPage?: ModuleKey;
};

export type AdminSettings = {
  householdName: string;
  dashboardWelcomeMessage: string;
  appModeLabel: string;
  /**
   * Storage backend for this device.
   * - `local`: saved in this browser only (default)
   * - `cloud-preview`: reads/writes the connected cloud household without touching localStorage
   */
  dataSourceMode?: DataSourceMode;
  colorThemeOptions: string;
  animalIconHelpText: string;
  instacart: InstacartSettings;
  moduleVisibility: Record<ModuleKey, boolean>;
  customization?: CustomizationSettings;
  /** Tablet/kitchen kiosk: show Kiosk in nav and `/kiosk` command surface. */
  enableKioskMode?: boolean;
  /** First panel to scroll into view when opening the kiosk page. */
  kioskDefaultView?: KioskDefaultView;
  /** Kitchen or wall-mounted device running kiosk / wall UI (saved per household on this device). */
  kitchenWallDisplayDevice?: KitchenWallDisplayDevice;
  showClock?: boolean;
  showQuickActions?: boolean;
  /** Larger typography in nav and main content (workstation readability). */
  largeTextMode?: boolean;
  /** When true, the dashboard getting-started checklist stays hidden. */
  setupChecklistDismissed?: boolean;
  /** Enable presence UI & manual status controls. */
  enablePresencePanel?: boolean;
  /** Show presence panel on the main dashboard. */
  showPresenceOnDashboard?: boolean;
  /** Show presence cards on the kiosk page. */
  showPresenceOnKiosk?: boolean;
  /** Future config only (no tokens, no frontend API calls). */
  homeAssistantBridge?: {
    url?: string;
    memberEntityMap?: Record<string, string>;
  };
  /** Selected cloud household ID (Supabase). Local data remains authoritative for now. */
  cloudHouseholdId?: string;
  /** Cached cloud household name for display. */
  cloudHouseholdName?: string;
  /** Cloud role for the current signed-in user (if known). */
  cloudHouseholdRole?: string;
  /** ISO timestamp when the last cloud upload completed. */
  lastCloudUploadAt?: string;
  /** ISO timestamp when the last cloud migration preview ran. */
  lastCloudPreviewAt?: string;
  /**
   * Member used for “My settings” / per-member layout & notification prefs.
   * Does not require sign-in; ties prefs to a family profile on this device.
   */
  activePreferencesMemberId?: string;
  /** Per-member preferences (layout locks, sections, notifications). */
  userPreferencesByMemberId?: Record<string, UserMemberPreferences>;
  /** Household-wide defaults for reminder preference toggles (UI placeholder). */
  siteNotificationDefaults?: MemberNotificationPreferences;
  /**
   * Signed-in profile for this device (kiosk / PIN). Cleared on Lock. Not cloud authentication.
   */
  activeMemberId?: string;
};

export const CURRENT_DATA_VERSION = 1;

export type ActivityType =
  | "created"
  | "updated"
  | "completed"
  | "deleted"
  | "imported"
  | "reset"
  | "exported"
  | "assigned"
  | "put-away";

export type ActivityEntityType =
  | "task"
  | "chore"
  | "planner"
  | "project"
  | "doc"
  | "pantryItem"
  | "groceryItem"
  | "shopping"
  | "shoppingItem"
  | "familyMember"
  | "settings"
  | "data"
  | "messageBoard"
  | "cleaningRoom";

export type ActivityLogItem = {
  id: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle: string;
  memberId?: string;
  message: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  dueTime?: string;
  type: TaskType;
  frequency: TaskFrequency;
  lastCompletedDate: string;
  nextDueDate: string;
  assignedMemberId: string;
  zone?: string;
  room?: string;
  category?: string;
  notes?: string;
  /** Roster member who last marked this chore done (optional). */
  lastCompletedByMemberId?: string;
  /** ISO timestamp when the chore was last marked Done (optional; complements date-only `lastCompletedDate`). */
  lastCompletedAt?: string;
  checklist?: TaskChecklistItem[];
  rewardPoints?: number;
  requiresVerification?: boolean;
  requiresProof?: boolean;
  referenceMedia?: TaskReferenceMedia[];
  completionProof?: TaskCompletionProof[];
  isBrainDump?: boolean;
  brainDumpType?: "task" | "chore" | "project" | "planner" | "doc" | "grocery";
  source?: TaskSource;
  sourceSystem?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TaskChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
};

export type TaskReferenceMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  caption: string;
  displayOrder: number;
  createdAt: string;
};

export type TaskCompletionProof = {
  id: string;
  type: "image" | "video";
  url: string;
  note: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type FamilyTask = Task;

export type ProjectStatus = "planned" | "active" | "waiting" | "done" | "archived";
export type ProjectPriority = "low" | "medium" | "high";
export type ProjectMilestoneStatus = "not-started" | "active" | "done";

export type ProjectMilestone = {
  id: string;
  title: string;
  status: ProjectMilestoneStatus;
  dueDate: string;
  notes: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  name: string;
  lead: string;
  leadMemberId: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  targetDate: string;
  completedDate: string;
  milestones: ProjectMilestone[];
  milestoneIds?: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  nextStep: string;
};

export type PantryItem = {
  id: string;
  /** Display name (may match product title or be household-specific). */
  name: string;
  /** Canonical product title from lookup or packaging (optional). */
  productName?: string;
  quantity: string;
  unit?: string;
  category: string;
  storageArea: PantryLocation;
  location: PantryLocation;
  locationDetail?: string;
  customLocationName?: string;
  kitchenLocationDetail?: string;
  pantryLocationNote?: string;
  coldLocationDetail?: string;
  pantryWall?: PantryWall;
  pantryShelf?: PantryShelf;
  wall?: PantryWall;
  shelf?: PantryShelf;
  status: StockStatus;
  groceryItemId?: string;
  barcode?: string;
  brand?: string;
  productImageUrl?: string;
  lookupMetadata?: ProductLookupMetadata;
  /** Legacy field; prefer bestByDate when both exist. */
  expiryDate?: string;
  itemType?: PantryItemType;
  storageClass?: StorageClass;
  foodStorageCategory?: FoodStorageCategory;
  packageType?: string;
  purchaseDate?: string;
  /** Best-by or expiration date on package (YYYY-MM-DD). */
  bestByDate?: string;
  openedDate?: string;
  /** User-adjustable estimates for shelf-life planning. */
  estimatedShelfLifeMonths?: number;
  /** Preferred field for recommended shelf-life window (months); falls back to {@link estimatedShelfLifeMonths}. */
  recommendedShelfLifeMonths?: number;
  shelfLifeSource?: ShelfLifeSource;
  /** Short-term vs long-term bucket; persists alongside {@link storageClass}. */
  storageType?: PantryStorageType;
  itemUseType?: ItemUseType;
  longTermShelfLifeYears?: number;
  rotationDueDate?: string;
  rotationStatus?: RotationStatus;
  canCondition?: CanCondition;
  notes?: string;
  isStaple: boolean;
  minQuantity?: string;
  /** Optional upper bound — quantity above this surfaces “too much” when set. */
  maxQuantity?: string;
  /** Optional numeric threshold (same units as quantity) for overstock hints. */
  overstockThreshold?: string;
  /** User-flagged for “use soon” lists (guidance only). */
  useSoonMarked?: boolean;
  /** Last “use / consume” actor (optional, local-only). */
  lastConsumptionMemberId?: string;
  /** Optional free-text recipe note from last consume (local-only). */
  lastConsumptionRecipeNote?: string;
  /** Optional note from last consume / stock update (local-only). */
  lastConsumptionNote?: string;
  /** When true, row is hidden from default inventory views (soft-remove). */
  inactiveInInventory?: boolean;
  tags: string[];
  source?: DataSource;
  sourceSystem?: string;
  lastUpdated: string;
  createdAt: string;
  /** Optional reference photo URL (no binary/local file storage in this pass). */
  itemPhotoUrl?: string;
  itemPhotoCaption?: string;
  /** Longer product text from lookup or your own description (optional). */
  productDescription?: string;
  /** Compressed JPEG data URL for an uploaded shelf photo (optional). */
  productImageDataUrl?: string;
  /** Human-readable source label for last product lookup (e.g. Open Food Facts). */
  productLookupSource?: string;
  /** ISO timestamp when product lookup metadata was last applied. */
  productLookupUpdatedAt?: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category: string;
  storeSection: StoreSection;
  preferredStore?: string;
  neededBy: string;
  purchased: boolean;
  needsPutAway?: boolean;
  destination: PantryLocation;
  destinationDetail?: string;
  customDestinationName?: string;
  pantryNote?: string;
  wall?: PantryWall;
  shelf?: PantryShelf;
  groceryItemId?: string;
  barcode?: string;
  brand?: string;
  productImageUrl?: string;
  notes?: string;
  source?: DataSource;
  sourceSystem?: string;
  lookupMetadata?: ProductLookupMetadata;
  /** Member who asked for this item (optional). */
  requestedByMemberId?: string;
  /** Member responsible for buying / picking up (optional). */
  assignedToMemberId?: string;
  /** When added from an inventory row (restock tracking). */
  sourcePantryItemId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductLookupMetadata = {
  provider: "openfoodfacts";
  lookedUpAt: string;
  status: "found" | "not-found" | "error";
  rawCode?: string;
};

export type PlannerStickyColor = "dark" | "blue" | "yellow" | "green";

export type PlannerEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: PlannerEventCategory;
  assignedMemberId: string;
  assignedPerson: string;
  assignedMemberIds?: string[];
  responsibleAdultId?: string;
  startTime?: string;
  endTime?: string;
  /** Inclusive end date for multi-day travel / camp spans (YYYY-MM-DD). */
  endDate?: string;
  isAllDay?: boolean;
  repeatEnabled?: boolean;
  repeatRule?: PlannerRepeatRule;
  location?: string;
  notes?: string;
  /** Freeform household tags (school, travel, tentative, band, camp, …). */
  tags?: string[];
  /** Tentative / not confirmed — prefer this over category "Tentative". */
  isTentative?: boolean;
  /** Shown at bottom of No School sticky notes. */
  noSchoolReason?: string;
  /** Sticky note color for school markers. */
  stickyColor?: PlannerStickyColor;
  prepChecklist?: PlannerPrepChecklistItem[];
  reminderSettings?: PlannerReminderSetting[];
  createdAt?: string;
  updatedAt?: string;
};

export type PlannerEventCategory =
  | "Family"
  | "School"
  | "No School"
  | "Activity"
  | "Travel"
  | "Household"
  | "Chores"
  | "Reminder"
  | "Tentative"
  | "Sports"
  | "Medical"
  | "Work"
  | "Church"
  | "Errand"
  | "Social"
  | "Personal"
  | "Other"
  | "Meals"
  | "Home";

export type PlannerRepeatRule =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly"
  | "Custom later";

export type PlannerPrepChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type PlannerReminderSetting = {
  id: string;
  label: string;
  offsetMinutes: number;
};

export type CalendarLink = {
  id: string;
  name: string;
  calendarUrl: string;
  createdAt: string;
  displayName: string;
  publicUrl: string;
  embedUrl?: string;
  notes: string;
  updatedAt: string;
};

export type DocItem = {
  id: string;
  title: string;
  content: string;
  category: DocCategory;
  tags: string[];
  pinned: boolean;
  relatedMemberIds: string[];
  relatedProjectId: string;
  visibility: DocVisibility;
  createdAt: string;
  updatedAt: string;
  source: DataSource;
  sourceSystem?: string;
  body: string;
};

export type DocNote = DocItem;
export type DocCategory =
  | "routine"
  | "school"
  | "medical"
  | "house"
  | "emergency"
  | "recipe"
  | "finance"
  | "vehicle"
  | "pet"
  | "other";
export type DocVisibility = "household" | "private-note";

export type FamilyMember = {
  id: string;
  name: string;
  nickname?: string;
  role?: string;
  roleLabel?: string;
  status: FamilyMemberStatus;
  presence?: Presence;
  colorTheme: string;
  animalIcon?: string;
  ageGroup?: string;
  schoolWorkLabel?: string;
  allergies?: string;
  emergencyContact?: string;
  notes: string;
  updatedAt?: string;
  /**
   * Local kiosk PIN (4 digits). Household convenience only — replace with secure auth / server-side hashing later.
   */
  pinCode?: string;
  pinUpdatedAt?: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  storeSection: StoreSection;
  preferredStore?: string;
  amountDefault?: string;
  defaultLocation: PantryLocation;
  defaultWall?: PantryWall;
  defaultShelf?: PantryShelf;
  barcode?: string;
  brand?: string;
  productImageUrl?: string;
  notes?: string;
  source?: DataSource;
  sourceSystem?: string;
  lookupMetadata?: ProductLookupMetadata;
};

export type GroceryLibraryItem = GroceryItem;

export const taskStatuses: TaskStatus[] = [
  "Not Started",
  "In Progress",
  "Waiting Review",
  "Completed",
  "Done",
  "Skipped",
  "Snoozed",
];

export const priorities: Priority[] = ["Low", "Medium", "High"];

export const taskTypes: TaskType[] = ["task", "chore"];
export const taskFrequencies: TaskFrequency[] = [
  "one-time",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "as-needed",
];

export const cleaningZones = [
  "Bathroom",
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Laundry",
  "Pantry",
  "Garage",
  "Entryway",
  "Outdoor",
  "Pets",
  "Admin",
  "Custom Zone",
] as const;

/** Default role suggestions for member profiles (Customization center). */
export const defaultMemberRoleOptions = [
  "Parent",
  "Adult",
  "Teen",
  "Child",
  "Caregiver",
  "Guest",
] as const;

export const defaultMemberAgeGroupOptions = [
  "Adult",
  "Teen",
  "Child",
  "Pet",
  "Other",
] as const;

export const defaultTaskCategoryOptions = [
  "cleaning",
  "brain dump",
  "errand",
  "meal",
  "maintenance",
  "admin",
  "other",
];

export const defaultGroceryCategoryOptions = [
  "produce",
  "dairy",
  "frozen",
  "meat",
  "pantry",
  "beverage",
  "snack",
  "Breakfast",
  "household",
  "other",
];

export const defaultInventoryCategoryOptions = [
  "Grocery",
  "produce",
  "dairy",
  "frozen",
  "pantry",
  "snack",
  "beverage",
  "household",
  "other",
];

export const defaultUnitOptions = [
  "each",
  "lb",
  "oz",
  "g",
  "kg",
  "gallon",
  "qt",
  "pt",
  "cup",
  "fl oz",
  "ml",
  "L",
  "tbsp",
  "tsp",
  "box",
  "bag",
  "bottle",
  "can",
  "jar",
];

export const defaultProjectStatusOptions: ProjectStatus[] = [
  "planned",
  "active",
  "waiting",
  "done",
  "archived",
];

export const defaultProjectPriorityOptions: ProjectPriority[] = [
  "low",
  "medium",
  "high",
];

export const defaultDocVisibilityOptions: DocVisibility[] = [
  "household",
  "private-note",
];

export const pantryLocations: PantryLocation[] = [
  "Kitchen Fridge",
  "Kitchen Freezer",
  "Kitchen Cabinets",
  "Pantry",
  "Laundry Room Fridge",
  "Laundry Room Freezer",
  "Family Room Freezer",
  "Custom Location",
];

export const kitchenLocationDetails = [
  "Cabinet",
  "Drawer",
  "Shelf",
  "Counter",
  "Island",
  "Custom Kitchen Location",
] as const;

export const coldLocationDetails = [
  "Top Shelf",
  "Middle Shelf",
  "Bottom Shelf",
  "Door",
  "Drawer",
  "Bin",
  "Custom Fridge/Freezer Location",
] as const;

export const pantryWalls: PantryWall[] = [
  "Wall 1",
  "Wall 2",
  "Wall 3",
  "Wall 4",
];

export const pantryShelves: PantryShelf[] = [
  "Shelf 1",
  "Shelf 2",
  "Shelf 3",
  "Shelf 4",
  "Shelf 5",
];

export const stockStatuses: StockStatus[] = ["Stocked", "Low", "Out"];

/** Starter rows for Food Storage Plan — editable in Household Inventory. */
export const DEFAULT_FOOD_STORAGE_PLAN_LINES: FoodStoragePlanLine[] = [
  {
    id: "plan-wheat",
    categoryKey: "grains",
    label: "Wheat",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-white-rice",
    categoryKey: "grains",
    label: "White rice",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-beans",
    categoryKey: "beans_legumes",
    label: "Dry beans",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-oats",
    categoryKey: "oats",
    label: "Oats",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-pasta",
    categoryKey: "pasta",
    label: "Pasta",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-potato",
    categoryKey: "potatoes",
    label: "Potato flakes",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-sugar",
    categoryKey: "baking",
    label: "Sugar / honey",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-salt",
    categoryKey: "other",
    label: "Salt",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-milk",
    categoryKey: "dairy_powder",
    label: "Powdered milk",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "lbs",
  },
  {
    id: "plan-fd",
    categoryKey: "comfort_food",
    label: "Dehydrated / freeze-dried foods",
    group: "long_term_storage",
    targetAmount: "0",
    targetUnit: "servings",
  },
  {
    id: "plan-water",
    categoryKey: "water",
    label: "Water storage",
    group: "water",
    targetAmount: "0",
    targetUnit: "gal",
  },
  {
    id: "plan-three-month",
    categoryKey: "other",
    label: "Three-month usable foods (combined)",
    group: "three_month_supply",
    targetAmount: "0",
    targetUnit: "servings",
  },
  {
    id: "plan-household",
    categoryKey: "household_supply",
    label: "Household essentials",
    group: "household_essentials",
    targetAmount: "0",
    targetUnit: "kits",
  },
];

export const storeSections: StoreSection[] = [
  "produce",
  "meat",
  "dairy",
  "frozen",
  "aisles",
  "household",
  "checkout",
];

export const moduleKeys: ModuleKey[] = [
  "dashboard",
  "family",
  "tasks",
  "projects",
  "pantry",
  "shopping",
  "calendar",
  "planner",
  "docs",
];

export const plannerCategories: PlannerEvent["category"][] = [
  "Family",
  "Household",
  "School",
  "No School",
  "Activity",
  "Travel",
  "Chores",
  "Reminder",
  "Tentative",
  "Sports",
  "Medical",
  "Work",
  "Church",
  "Errand",
  "Social",
  "Personal",
  "Other",
];

export const docCategories: DocCategory[] = [
  "routine",
  "school",
  "medical",
  "house",
  "emergency",
  "recipe",
  "finance",
  "vehicle",
  "pet",
  "other",
];

/** Statuses shown by default in Admin Customization; legacy values remain valid on saved members. */
export const defaultMemberStatusOptionsForAdmin = ["active", "away", "archived"] as const;

/** All values that may appear on saved FamilyMember records. */
export const familyMemberStatuses: FamilyMemberStatus[] = [
  "active",
  "away",
  "archived",
  "guest",
  "extended",
  "emergency",
  "pet",
];

export const memberColorThemes = [
  "blue",
  "green",
  "emerald",
  "purple",
  "violet",
  "amber",
  "orange",
  "rose",
  "slate",
] as const;

/**
 * Canonical household roster — used for defaults, empty roster normalization,
 * and the Settings repair tool.
 *
 * Seed IDs stay `member-1`… in this array order so existing seed chores/kitchen
 * schedule keep stable references. Wake-page button order is
 * {@link WAKE_PAGE_MEMBER_DISPLAY_ORDER}.
 */
export const CANONICAL_HOUSEHOLD_ROSTER_NAMES = [
  "Lorraine",
  "Hershel",
  "Stella",
  "Nox",
  "Jeremiah",
  "Selena",
] as const;

/** Portrait kiosk wake-page member button order (display only). */
export const WAKE_PAGE_MEMBER_DISPLAY_ORDER = [
  "Hershel",
  "Lorraine",
  "Stella",
  "Nox",
  "Jeremiah",
  "Selena",
] as const;

const CANONICAL_MEMBER_COLOR_THEMES: (typeof memberColorThemes)[number][] = [
  "rose",
  "blue",
  "purple",
  "green",
  "orange",
  "emerald",
];

/** Stable IDs `member-1`… match bundled seed tasks and projects; Selena is `member-6`. */
export function createCanonicalHouseholdFamilyMembers(): FamilyMember[] {
  return CANONICAL_HOUSEHOLD_ROSTER_NAMES.map((name, index) => ({
    id: `member-${index + 1}`,
    name,
    status: "active",
    colorTheme: CANONICAL_MEMBER_COLOR_THEMES[index] ?? "slate",
    notes: "",
  }));
}

export const KITCHEN_SCHEDULE_WEEKDAYS: KitchenWeekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Default week kitchen duty: canonical roster order Mon–Fri; weekend uses first two members. */
export function createDefaultKitchenSchedule(): KitchenSchedule {
  return {
    weekdays: [
      { day: "monday", memberId: "member-1" },
      { day: "tuesday", memberId: "member-2" },
      { day: "wednesday", memberId: "member-3" },
      { day: "thursday", memberId: "member-4" },
      { day: "friday", memberId: "member-5" },
      { day: "saturday", memberId: "member-1" },
      { day: "sunday", memberId: "member-2" },
    ],
    updatedAt: "2026-05-04T00:00:00.000Z",
  };
}

const DEFAULT_KITCHEN_CHECKLIST_LABELS = [
  "Clean Counters",
  "Clean Sink",
  "Dishes",
  "Wipe Table",
  "Sweep Floor",
  "Trash",
  "Check Stove",
  "Clear Fridge Items if needed",
] as const;

export function createDefaultKitchenChecklist(): KitchenChecklistItem[] {
  return DEFAULT_KITCHEN_CHECKLIST_LABELS.map((label, sortOrder) => ({
    id: `kitchen-check-${sortOrder}`,
    label,
    sortOrder,
  }));
}

export type HouseholdNotificationType =
  | "inventory_low"
  | "inventory_out"
  | "shopping_added"
  | "message"
  | "kitchen_duty"
  | "pet_flea_med_due"
  | "chore_due"
  | "calendar_reminder";

/** In-app alerts; optional browser mirror via Settings after permission. Local-only. */
export type HouseholdNotification = {
  id: string;
  recipientMemberId: string;
  type: HouseholdNotificationType;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  /** When this dose was due (ISO), for pet flea reminders. */
  dueAt?: string;
  /** Pet id for `pet_flea_med_due` notifications. */
  petId?: string;
  readAt?: string;
  /** When set, hide from active alert lists (history may remain). */
  dismissedAt?: string;
  createdAt: string;
};

export type PetSpecies = "cat" | "dog" | "other";

export type Pet = {
  id: string;
  name: string;
  species: PetSpecies;
  colorTheme?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PetMedicationType = "flea";

export type PetMedicationEntry = {
  id: string;
  petId: string;
  medicationType: PetMedicationType;
  givenAt: string;
  givenByMemberId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIdeaSource = "manual" | "suggested" | "ai_future";

export type RecipeIdea = {
  id: string;
  title: string;
  ingredients: string[];
  usesInventoryItemIds?: string[];
  notes?: string;
  source: RecipeIdeaSource;
  createdAt: string;
  updatedAt: string;
};

/** User-defined storage zone metadata (pantry walls, shelves, etc.). */
export type HouseholdStorageLocation = {
  id: string;
  name: string;
  storageArea: PantryLocation;
  locationDetail?: string;
  pantryWall?: PantryWall;
  pantryShelf?: PantryShelf;
  photoUrl?: string;
  photoCaption?: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyData = {
  dataVersion: number;
  adminSettings: AdminSettings;
  familyMembers: FamilyMember[];
  groceryItems: GroceryItem[];
  tasks: Task[];
  projects: Project[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  planner: PlannerEvent[];
  calendarLinks: CalendarLink[];
  docs: DocItem[];
  cleaningRooms: CleaningRoom[];
  /** Local-only cleaning playbook completion history (no proof images). */
  cleaningCompletionRecords: CleaningCompletionRecord[];
  /** Full-week kitchen duty roster (one assignee per day). */
  kitchenSchedule: KitchenSchedule;
  /** Kitchen duty completion history (append-only; undo today removes matching row). */
  kitchenDutyCompletions: KitchenDutyCompletion[];
  /** Daily kitchen closing checklist. */
  kitchenChecklist: KitchenChecklistItem[];
  /** Household message board (local only). */
  messageBoard: MessageBoardItem[];
  /** Rule-based or manual meal ideas (local only). */
  recipeIdeas: RecipeIdea[];
  /** In-app notifications (local only). */
  notifications: HouseholdNotification[];
  activityLog: ActivityLogItem[];
  /** Optional storage-location catalog with photo URLs (local only). */
  storageLocations: HouseholdStorageLocation[];
  /** Household pets (cats/dogs); seeded via normalization when missing. */
  pets: Pet[];
  /** Medication log entries (flea doses, etc.). */
  petMedicationEntries: PetMedicationEntry[];
};

export const initialFamilyData: FamilyData = {
  dataVersion: CURRENT_DATA_VERSION,
  adminSettings: {
    householdName: "FamilySite_491",
    dashboardWelcomeMessage:
      "Welcome home. Here is a calm read on what deserves attention today.",
    appModeLabel: "Local workspace",
    dataSourceMode: "local",
    colorThemeOptions: "rose, blue, purple, green, orange, slate",
    animalIconHelpText: "Initials are generated from each family member name.",
    instacart: {
      enableInstacartExport: false,
      preferredStoreName: "",
      preferredZipCode: "",
      notes: "",
    },
    moduleVisibility: {
      dashboard: true,
      family: true,
      tasks: true,
      projects: true,
      pantry: true,
      shopping: true,
      calendar: true,
      planner: true,
      docs: true,
    },
    enableKioskMode: false,
    kioskDefaultView: "dashboard",
    kitchenWallDisplayDevice: "ipad",
    showClock: true,
    showQuickActions: true,
    largeTextMode: false,
    setupChecklistDismissed: false,
    enablePresencePanel: true,
    showPresenceOnDashboard: true,
    showPresenceOnKiosk: true,
    homeAssistantBridge: {
      url: "",
      memberEntityMap: {},
    },
    cloudHouseholdId: "",
    cloudHouseholdName: "",
    cloudHouseholdRole: "",
    lastCloudUploadAt: "",
    lastCloudPreviewAt: "",
    activePreferencesMemberId: "member-1",
    userPreferencesByMemberId: {},
    siteNotificationDefaults: {
      enableReminders: true,
      choresDue: true,
      choresOverdue: true,
      shoppingUpdates: true,
      kitchenDutyReminders: true,
      calendarReminders: true,
      calendarEventsToday: true,
      inventoryLowStock: true,
      petMedicationDue: true,
      importantMessages: true,
    },
  },
  familyMembers: createCanonicalHouseholdFamilyMembers(),
  groceryItems: [
    {
      id: "grocery-1",
      name: "Milk",
      category: "dairy",
      storeSection: "dairy",
      defaultLocation: "Kitchen Fridge",
    },
    {
      id: "grocery-2",
      name: "Greek yogurt",
      category: "dairy",
      storeSection: "dairy",
      defaultLocation: "Kitchen Fridge",
    },
    {
      id: "grocery-3",
      name: "Frozen berries",
      category: "frozen",
      storeSection: "frozen",
      defaultLocation: "Laundry Room Freezer",
    },
    {
      id: "grocery-4",
      name: "Pasta",
      category: "pantry",
      storeSection: "aisles",
      defaultLocation: "Pantry",
      defaultWall: "Wall 1",
      defaultShelf: "Shelf 2",
    },
    {
      id: "grocery-5",
      name: "AA batteries",
      category: "household",
      storeSection: "household",
      defaultLocation: "Kitchen Cabinets",
    },
    {
      id: "grocery-6",
      name: "Bananas",
      category: "produce",
      storeSection: "produce",
      defaultLocation: "Kitchen Cabinets",
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "Reset kitchen command center",
      owner: "Lorraine",
      status: "Today",
      priority: "High",
      dueDate: "2026-05-04",
      type: "chore",
      frequency: "daily",
      lastCompletedDate: "",
      nextDueDate: "2026-05-04",
      assignedMemberId: "member-1",
    },
    {
      id: "task-2",
      title: "Sort school papers into docs hub",
      owner: "Stella",
      status: "In Progress",
      priority: "Medium",
      dueDate: "2026-05-05",
      type: "task",
      frequency: "one-time",
      lastCompletedDate: "",
      nextDueDate: "2026-05-05",
      assignedMemberId: "member-3",
    },
    {
      id: "task-3",
      title: "Review weekend grocery list",
      owner: "Herschel",
      status: "Not Started",
      priority: "Medium",
      dueDate: "2026-05-06",
      type: "task",
      frequency: "one-time",
      lastCompletedDate: "",
      nextDueDate: "2026-05-06",
      assignedMemberId: "member-2",
    },
    {
      id: "task-4",
      title: "Move clean towels upstairs",
      owner: "Kids",
      status: "Today",
      priority: "Low",
      dueDate: "2026-05-04",
      type: "chore",
      frequency: "weekly",
      lastCompletedDate: "",
      nextDueDate: "2026-05-04",
      assignedMemberId: "",
    },
  ],
  projects: [
    {
      id: "project-1",
      title: "Garage reset",
      description: "Reset garage storage zones and make household supplies easier to find.",
      name: "Garage reset",
      lead: "Herschel",
      leadMemberId: "member-2",
      status: "active",
      priority: "medium",
      startDate: "2026-05-04",
      targetDate: "2026-06-01",
      completedDate: "",
      milestones: [
        {
          id: "milestone-1",
          title: "Label storage zones",
          status: "active",
          dueDate: "2026-05-15",
          notes: "",
        },
      ],
      tags: ["home", "storage"],
      notes: "",
      createdAt: "2026-05-04",
      updatedAt: "2026-05-04",
      nextStep: "Label storage zones",
    },
    {
      id: "project-2",
      title: "Summer travel planning",
      description: "Coordinate dates, documents, packing, and booking decisions.",
      name: "Summer travel planning",
      lead: "Family",
      leadMemberId: "",
      status: "planned",
      priority: "medium",
      startDate: "2026-05-04",
      targetDate: "2026-06-15",
      completedDate: "",
      milestones: [
        {
          id: "milestone-2",
          title: "Pick target dates",
          status: "not-started",
          dueDate: "2026-05-20",
          notes: "",
        },
      ],
      tags: ["family", "planning"],
      notes: "",
      createdAt: "2026-05-04",
      updatedAt: "2026-05-04",
      nextStep: "Pick target dates",
    },
  ],
  pantry: createDemoPantryInventoryItems(),
  shopping: [
    {
      id: "shop-1",
      name: "Milk",
      category: "Dairy",
      storeSection: "dairy",
      neededBy: "2026-05-05",
      purchased: false,
      destination: "Kitchen Fridge",
    },
    {
      id: "shop-2",
      name: "AA batteries",
      category: "Household",
      storeSection: "household",
      neededBy: "2026-05-08",
      purchased: false,
      destination: "Kitchen Cabinets",
    },
    {
      id: "shop-3",
      name: "Freezer waffles",
      category: "Breakfast",
      storeSection: "frozen",
      neededBy: "2026-05-06",
      purchased: true,
      destination: "Family Room Freezer",
    },
  ],
  planner: [
    {
      id: "plan-1",
      title: "Family planning reset",
      date: "2026-05-04",
      time: "18:30",
      category: "Family",
      assignedMemberId: "member-1",
      assignedPerson: "Lorraine",
    },
    {
      id: "plan-2",
      title: "Taco night",
      date: "2026-05-06",
      time: "17:30",
      category: "Meals",
      assignedMemberId: "",
      assignedPerson: "Family",
    },
    {
      id: "plan-3",
      title: "School forms due",
      date: "2026-05-07",
      time: "08:00",
      category: "School",
      assignedMemberId: "member-3",
      assignedPerson: "Stella",
    },
  ],
  calendarLinks: [
    {
      id: "calendar-491er-family",
      name: "491er Family Calendar",
      calendarUrl: "",
      createdAt: "2026-05-04T00:00:00.000Z",
      displayName: "491er Family Calendar",
      publicUrl: "",
      embedUrl:
        "https://calendar.google.com/calendar/embed?src=491erfamily%40gmail.com&ctz=America%2FLos_Angeles",
      notes: "",
      updatedAt: "2026-05-04T00:00:00.000Z",
    },
  ],
  docs: [
    {
      id: "doc-1",
      title: "Sunday house reset",
      content: "Laundry check, meal plan, backpacks, calendar scan, and grocery list.",
      category: "routine",
      tags: ["weekly", "reset"],
      pinned: true,
      relatedMemberIds: [],
      relatedProjectId: "",
      visibility: "household",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      source: "seed",
      body: "Laundry check, meal plan, backpacks, calendar scan, and grocery list.",
    },
    {
      id: "doc-2",
      title: "Emergency contacts",
      content: "Key phone numbers, providers, school office, and local contacts.",
      category: "emergency",
      tags: ["contacts"],
      pinned: true,
      relatedMemberIds: [],
      relatedProjectId: "",
      visibility: "household",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      source: "seed",
      body: "Key phone numbers, providers, school office, and local contacts.",
    },
    {
      id: "doc-3",
      title: "Medicine cabinet notes",
      content: "Where medicines live, refill reminders, and allergy notes.",
      category: "medical",
      tags: ["medicine"],
      pinned: false,
      relatedMemberIds: [],
      relatedProjectId: "",
      visibility: "household",
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z",
      source: "seed",
      body: "Where medicines live, refill reminders, and allergy notes.",
    },
  ],
  cleaningRooms: CLEANING_PLAYBOOK_CANONICAL_IDS.map((id) =>
    cloneCleaningRoomStarter(id, "2026-05-05T00:00:00.000Z"),
  ),
  cleaningCompletionRecords: [],
  kitchenSchedule: createDefaultKitchenSchedule(),
  kitchenDutyCompletions: [],
  kitchenChecklist: createDefaultKitchenChecklist(),
  messageBoard: [],
  recipeIdeas: [],
  notifications: [],
  activityLog: [],
  storageLocations: [],
  pets: [],
  petMedicationEntries: [],
};

export function createDefaultFamilyData(): FamilyData {
  return JSON.parse(JSON.stringify(initialFamilyData)) as FamilyData;
}
