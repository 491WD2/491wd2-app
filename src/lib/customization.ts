import type { AdminSettings, CustomizationSettings, FoodStoragePlanLine } from "../data/familyData";
import {
  DEFAULT_FOOD_STORAGE_PLAN_LINES,
  DEFAULT_MESSAGE_BOARD_CATEGORY_DEFINITIONS,
  type MessageBoardCategoryDefinition,
  type MessageBoardItem,
  cleaningZones,
  coldLocationDetails,
  defaultDocVisibilityOptions,
  defaultGroceryCategoryOptions,
  defaultInventoryCategoryOptions,
  defaultMemberAgeGroupOptions,
  defaultMemberRoleOptions,
  defaultMemberStatusOptionsForAdmin,
  defaultProjectPriorityOptions,
  defaultProjectStatusOptions,
  defaultTaskCategoryOptions,
  defaultUnitOptions,
  docCategories,
  kitchenLocationDetails,
  pantryLocations,
  pantryShelves,
  pantryWalls,
  plannerCategories,
  priorities,
  storeSections,
  taskFrequencies,
  taskStatuses,
} from "../data/familyData";
import { normalizeColorKey } from "./colorCoding";

/** Keys for `customization.labels` — values fall back to app defaults when blank. */
export const LABEL_KEYS = {
  appDisplayName: "appDisplayName",
  dashboardTitle: "dashboardTitle",
  dashboardWelcomeMessage: "dashboardWelcomeMessage",
  moduleHouseholdInventory: "moduleHouseholdInventory",
  moduleShopping: "moduleShopping",
  moduleTasks: "moduleTasks",
  moduleFamily: "moduleFamily",
  moduleCalendar: "moduleCalendar",
  modulePlanner: "modulePlanner",
  moduleProjects: "moduleProjects",
  moduleDocs: "moduleDocs",
  moduleDashboardNav: "moduleDashboardNav",
  moduleSettings: "moduleSettings",
} as const;

export type CustomizationLabelKey = (typeof LABEL_KEYS)[keyof typeof LABEL_KEYS];

const LABEL_ALIAS_TO_CANON: Record<string, CustomizationLabelKey> = {
  appName: LABEL_KEYS.appDisplayName,
  familyLabel: LABEL_KEYS.moduleFamily,
  calendarLabel: LABEL_KEYS.moduleCalendar,
  tasksLabel: LABEL_KEYS.moduleTasks,
  inventoryLabel: LABEL_KEYS.moduleHouseholdInventory,
  shoppingLabel: LABEL_KEYS.moduleShopping,
  plannerLabel: LABEL_KEYS.modulePlanner,
  projectsLabel: LABEL_KEYS.moduleProjects,
  docsLabel: LABEL_KEYS.moduleDocs,
  settingsLabel: LABEL_KEYS.moduleSettings,
};

/** Merge admin list defaults with values already on records (orphan picks stay visible). */
export function mergeLists(base: string[], fromRecords: (string | undefined | null)[]): string[] {
  const out = new Set<string>();
  for (const s of base) {
    const t = s?.trim();
    if (t) out.add(t);
  }
  for (const s of fromRecords) {
    const t = s?.trim();
    if (t) out.add(t);
  }
  return [...out];
}

function customizationOf(admin: AdminSettings): CustomizationSettings | undefined {
  return admin.customization;
}

function effectiveList(
  customized: string[] | undefined,
  defaults: readonly string[],
): string[] {
  if (!customized || customized.length === 0) {
    return [...defaults];
  }
  const trimmed = customized.map((s) => s.trim()).filter(Boolean);
  return trimmed.length > 0 ? trimmed : [...defaults];
}

/** Map legacy/alias label keys to canonical keys before persist. */
export function remapCustomizationLabelAliases(
  labels: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!labels || typeof labels !== "object") {
    return undefined;
  }
  const next: Record<string, unknown> = { ...labels };
  for (const [alias, canon] of Object.entries(LABEL_ALIAS_TO_CANON)) {
    const rawAlias = next[alias];
    const rawCanon = next[canon];
    if (typeof rawAlias === "string" && rawAlias.trim()) {
      if (typeof rawCanon !== "string" || !rawCanon.trim()) {
        next[canon] = rawAlias;
      }
    }
    delete next[alias];
  }
  const trimmed = trimLabels(next);
  return trimmed;
}

/** Ensures current value appears in options even if removed from the list. */
export function selectOptionsWithCurrent(options: string[], current?: string | null): string[] {
  const cur = current?.trim();
  if (!cur) {
    return [...options];
  }
  if (options.includes(cur)) {
    return [...options];
  }
  return [cur, ...options];
}

export function getLabel(
  admin: AdminSettings,
  key: CustomizationLabelKey,
  fallback: string,
): string {
  const labels = customizationOf(admin)?.labels;
  if (!labels) {
    return fallback;
  }
  const direct = labels[key]?.trim();
  if (direct) {
    return direct;
  }
  for (const [alias, canon] of Object.entries(LABEL_ALIAS_TO_CANON)) {
    if (canon === key) {
      const a = labels[alias]?.trim();
      if (a) {
        return a;
      }
    }
  }
  return fallback;
}

export function getAppDisplayName(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.appDisplayName, admin.householdName);
}

export function getDashboardTitle(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.dashboardTitle, "Home operations");
}

const DEFAULT_WELCOME =
  "Welcome home. Here is a calm read on what deserves attention today.";

export function getDashboardWelcomeMessage(admin: AdminSettings): string {
  const fromLabel = customizationOf(admin)?.labels?.[LABEL_KEYS.dashboardWelcomeMessage]?.trim();
  if (fromLabel) {
    return fromLabel;
  }
  const fromSettings = admin.dashboardWelcomeMessage?.trim();
  if (fromSettings) {
    return fromSettings;
  }
  return DEFAULT_WELCOME;
}

export function getModuleHouseholdInventoryLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleHouseholdInventory, "Pantry & Inventory");
}

export function getModuleShoppingLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleShopping, "Shopping");
}

export function getModuleTasksLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleTasks, "Cleaning");
}

export function getModuleFamilyLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleFamily, "Family");
}

export function getModuleCalendarLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleCalendar, "Calendar");
}

export function getModulePlannerLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.modulePlanner, "Calendar");
}

export function getModuleProjectsLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleProjects, "Workspace");
}

export function getModuleDocsLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleDocs, "Notes");
}

export function getModuleDashboardNavLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleDashboardNav, "Home");
}

export function getModuleSettingsLabel(admin: AdminSettings): string {
  return getLabel(admin, LABEL_KEYS.moduleSettings, "Settings");
}

export function getMemberRoles(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.memberRoles, [...defaultMemberRoleOptions]);
}

export function getMemberAgeGroups(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.memberAgeGroups,
    [...defaultMemberAgeGroupOptions],
  );
}

export function getMemberStatuses(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.memberStatuses,
    [...defaultMemberStatusOptionsForAdmin],
  );
}

export function getTaskZones(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.taskZones, [...cleaningZones]);
}

export function getTaskStatuses(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.taskStatuses, [...taskStatuses]);
}

export function getTaskPriorities(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.taskPriorities, [...priorities]);
}

export function getTaskFrequencies(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.taskFrequencies, [...taskFrequencies]);
}

export function getTaskCategories(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.taskCategories, defaultTaskCategoryOptions);
}

export function getCalendarCategories(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.calendarCategories, [...plannerCategories]);
}

export function getGroceryCategories(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.groceryCategories, defaultGroceryCategoryOptions);
}

export function getGroceryStoreSections(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.groceryStoreSections, [...storeSections]);
}

export function getInventoryCategories(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.inventoryCategories,
    defaultInventoryCategoryOptions,
  );
}

export function getInventoryStorageAreas(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.inventoryStorageAreas,
    [...pantryLocations],
  );
}

export function getKitchenLocationDetailsList(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.kitchenLocationDetails,
    [...kitchenLocationDetails],
  );
}

export function getPantryWallOptions(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.pantryWallOptions, [...pantryWalls]);
}

export function getPantryShelfOptions(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.pantryShelfOptions, [...pantryShelves]);
}

export function getFridgeFreezerLocationDetailsList(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.fridgeFreezerLocationDetails,
    [...coldLocationDetails],
  );
}

export function getUnitOptions(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.units, defaultUnitOptions);
}

export function getProjectStatuses(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.projectStatuses, [...defaultProjectStatusOptions]);
}

export function getProjectPriorities(admin: AdminSettings): string[] {
  return effectiveList(
    customizationOf(admin)?.projectPriorities,
    [...defaultProjectPriorityOptions],
  );
}

export function getDocCategories(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.docCategories, [...docCategories]);
}

export function getDocVisibilityOptions(admin: AdminSettings): string[] {
  return effectiveList(customizationOf(admin)?.docVisibility, [...defaultDocVisibilityOptions]);
}

function normalizeMessageBoardCategories(
  value: unknown,
): MessageBoardCategoryDefinition[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out: MessageBoardCategoryDefinition[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const r = row as Record<string, unknown>;
    const label = typeof r.label === "string" ? r.label.trim() : "";
    if (!label) {
      continue;
    }
    const id =
      typeof r.id === "string" && r.id.trim()
        ? r.id.trim()
        : `mb-${label.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`;
    out.push({
      id,
      label,
      colorKey: normalizeColorKey(r.colorKey),
    });
  }
  return out.length > 0 ? out : undefined;
}

const FOOD_PLAN_GROUPS: FoodStoragePlanLine["group"][] = [
  "three_month_supply",
  "long_term_storage",
  "water",
  "household_essentials",
];

function normalizeFoodStoragePlanLines(
  value: unknown,
): FoodStoragePlanLine[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out: FoodStoragePlanLine[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const r = row as Record<string, unknown>;
    const label = typeof r.label === "string" ? r.label.trim() : "";
    if (!label) {
      continue;
    }
    const id =
      typeof r.id === "string" && r.id.trim()
        ? r.id.trim()
        : `fsp-${label.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`;
    const group = r.group as FoodStoragePlanLine["group"];
    if (!FOOD_PLAN_GROUPS.includes(group)) {
      continue;
    }
    const ck = typeof r.categoryKey === "string" && r.categoryKey.trim() ? r.categoryKey.trim() : "other";
    out.push({
      id,
      label,
      group,
      categoryKey: ck as FoodStoragePlanLine["categoryKey"],
      targetAmount: typeof r.targetAmount === "string" ? r.targetAmount : "0",
      targetUnit: typeof r.targetUnit === "string" ? r.targetUnit : "",
    });
  }
  return out.length > 0 ? out : undefined;
}

/** Saved plan lines or bundled defaults for Food Storage Plan. */
export function getFoodStoragePlanLines(admin: AdminSettings): FoodStoragePlanLine[] {
  const raw = customizationOf(admin)?.foodStoragePlanLines;
  if (raw && raw.length > 0) {
    return raw;
  }
  return [...DEFAULT_FOOD_STORAGE_PLAN_LINES];
}

/** Defaults, customized rows, and orphan labels still referenced by messages. */
export function getMessageBoardCategoryDefinitions(
  admin: AdminSettings,
  messages: MessageBoardItem[],
): MessageBoardCategoryDefinition[] {
  const raw = customizationOf(admin)?.messageBoardCategories;
  const core: MessageBoardCategoryDefinition[] =
    raw && raw.length > 0
      ? raw.map((c) => ({
          id: c.id.trim(),
          label: c.label.trim(),
          colorKey: normalizeColorKey(c.colorKey),
        }))
      : [...DEFAULT_MESSAGE_BOARD_CATEGORY_DEFINITIONS];
  const seen = new Set(core.map((c) => c.label.toLowerCase()));
  for (const m of messages) {
    const lab = m.category?.trim();
    if (!lab) {
      continue;
    }
    const key = lab.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      core.push({
        id: `legacy-${key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`,
        label: lab,
        colorKey: normalizeColorKey(m.colorKey),
      });
    }
  }
  return core;
}

function trimStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const next = value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  return next;
}

function trimLabels(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Strip empty optional fields; used after import/migration. */
export function normalizeCustomization(value: unknown): CustomizationSettings | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const labelsFromRaw =
    raw.labels && typeof raw.labels === "object"
      ? remapCustomizationLabelAliases(raw.labels as Record<string, unknown>)
      : undefined;
  const out: CustomizationSettings = {};

  const assign = <K extends keyof CustomizationSettings>(
    key: K,
    val: CustomizationSettings[K],
  ) => {
    if (val !== undefined) {
      (out as Record<string, unknown>)[key] = val;
    }
  };

  if (labelsFromRaw && Object.keys(labelsFromRaw).length > 0) {
    assign("labels", labelsFromRaw);
  }
  assign("memberRoles", trimStringArray(raw.memberRoles));
  assign("memberAgeGroups", trimStringArray(raw.memberAgeGroups));
  assign("memberStatuses", trimStringArray(raw.memberStatuses));
  assign("taskZones", trimStringArray(raw.taskZones));
  assign("taskStatuses", trimStringArray(raw.taskStatuses));
  assign("taskPriorities", trimStringArray(raw.taskPriorities));
  assign("taskFrequencies", trimStringArray(raw.taskFrequencies));
  assign("taskCategories", trimStringArray(raw.taskCategories));
  assign("calendarCategories", trimStringArray(raw.calendarCategories));
  assign("groceryCategories", trimStringArray(raw.groceryCategories));
  assign("groceryStoreSections", trimStringArray(raw.groceryStoreSections));
  assign("inventoryCategories", trimStringArray(raw.inventoryCategories));
  assign("inventoryStorageAreas", trimStringArray(raw.inventoryStorageAreas));
  assign("kitchenLocationDetails", trimStringArray(raw.kitchenLocationDetails));
  assign("pantryWallOptions", trimStringArray(raw.pantryWallOptions));
  assign("pantryShelfOptions", trimStringArray(raw.pantryShelfOptions));
  assign("fridgeFreezerLocationDetails", trimStringArray(raw.fridgeFreezerLocationDetails));
  assign("units", trimStringArray(raw.units));
  assign("projectStatuses", trimStringArray(raw.projectStatuses));
  assign("projectPriorities", trimStringArray(raw.projectPriorities));
  assign("docCategories", trimStringArray(raw.docCategories));
  assign("docVisibility", trimStringArray(raw.docVisibility));
  assign("messageBoardCategories", normalizeMessageBoardCategories(raw.messageBoardCategories));
  assign("foodStoragePlanLines", normalizeFoodStoragePlanLines(raw.foodStoragePlanLines));

  return Object.keys(out).length > 0 ? out : undefined;
}

/** Merges draft overrides with current admin for one activity log entry. */
export function mergeCustomizationUpdate(
  admin: AdminSettings,
  next: CustomizationSettings | undefined,
): AdminSettings {
  return {
    ...admin,
    customization: next && Object.keys(next).length > 0 ? next : undefined,
  };
}
