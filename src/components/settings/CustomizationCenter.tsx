import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { RotateCcw, Save } from "lucide-react";
import {
  cleaningZones,
  coldLocationDetails,
  defaultDocVisibilityOptions,
  defaultGroceryCategoryOptions,
  defaultInventoryCategoryOptions,
  defaultMemberAgeGroupOptions,
  defaultProjectPriorityOptions,
  defaultProjectStatusOptions,
  defaultTaskCategoryOptions,
  defaultUnitOptions,
  defaultMemberStatusOptionsForAdmin,
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
  type CustomizationSettings,
  type FamilyData,
} from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import {
  ModuleSubnav,
  WorkspaceFilterBar,
  WorkspacePanel,
} from "../workspace/ModuleWorkspace";
import { createActivity } from "../../lib/activity";
import {
  LABEL_KEYS,
  normalizeCustomization,
  type CustomizationLabelKey,
} from "../../lib/customization";
import { cn } from "../../lib/utils";

export type CustomizationTab =
  | "labels"
  | "family"
  | "tasks"
  | "calendar"
  | "grocery"
  | "projects"
  | "docs";

const customizationTabs: { id: CustomizationTab; label: string }[] = [
  { id: "labels", label: "Labels" },
  { id: "family", label: "Members" },
  { id: "tasks", label: "Cleaning" },
  { id: "calendar", label: "Calendar" },
  { id: "grocery", label: "Grocery & Inventory" },
  { id: "projects", label: "Workspace" },
  { id: "docs", label: "Notes" },
];

function cloneDraft(raw: CustomizationSettings | undefined): CustomizationSettings {
  return raw ? (JSON.parse(JSON.stringify(raw)) as CustomizationSettings) : {};
}

function displayStringList(
  draft: CustomizationSettings,
  key: keyof CustomizationSettings,
  fallback: readonly string[],
): string[] {
  const raw = draft[key];
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((s) => String(s));
  }
  return [...fallback];
}

const NAV_APPEARANCE_LABEL_KEYS: CustomizationLabelKey[] = [
  LABEL_KEYS.appDisplayName,
  LABEL_KEYS.dashboardTitle,
  LABEL_KEYS.dashboardWelcomeMessage,
  LABEL_KEYS.moduleHouseholdInventory,
  LABEL_KEYS.moduleShopping,
  LABEL_KEYS.moduleTasks,
  LABEL_KEYS.moduleCalendar,
  LABEL_KEYS.moduleDashboardNav,
  LABEL_KEYS.moduleSettings,
];

type CustomizationCenterProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  /** When set, only these tabs appear in the subnav. */
  allowedTabs?: CustomizationTab[];
  /** Restrict the Labels tab to navigation-facing copy (hides legacy module labels). */
  labelsScope?: "all" | "navAppearance";
  /** Hide the top “picker lists” explainer (embedded sections). */
  compact?: boolean;
};

const LABEL_DEFAULTS: Record<
  CustomizationLabelKey,
  (settings: FamilyData["adminSettings"]) => string
> = {
  [LABEL_KEYS.appDisplayName]: (s) => s.householdName,
  [LABEL_KEYS.dashboardTitle]: (s) => s.householdName,
  [LABEL_KEYS.dashboardWelcomeMessage]: (s) =>
    s.dashboardWelcomeMessage || "Run the house from one calm place.",
  [LABEL_KEYS.moduleHouseholdInventory]: () => "Inventory",
  [LABEL_KEYS.moduleShopping]: () => "Shopping",
  [LABEL_KEYS.moduleTasks]: () => "Cleaning",
  [LABEL_KEYS.moduleFamily]: () => "Members",
  [LABEL_KEYS.moduleCalendar]: () => "Calendar",
  [LABEL_KEYS.modulePlanner]: () => "Calendar",
  [LABEL_KEYS.moduleProjects]: () => "Workspace",
  [LABEL_KEYS.moduleDocs]: () => "Notes",
  [LABEL_KEYS.moduleDashboardNav]: () => "Home",
  [LABEL_KEYS.moduleSettings]: () => "Settings",
};

export function CustomizationCenter({
  data,
  setData,
  allowedTabs,
  labelsScope = "all",
  compact = false,
}: CustomizationCenterProps) {
  const tabsListed = allowedTabs?.length
    ? customizationTabs.filter((t) => allowedTabs.includes(t.id))
    : customizationTabs;
  const initialTab = tabsListed[0]?.id ?? "labels";
  const [tab, setTab] = useState<CustomizationTab>(initialTab);
  const [draft, setDraft] = useState<CustomizationSettings>(() =>
    cloneDraft(data.adminSettings.customization),
  );
  const [saveHint, setSaveHint] = useState("");

  useEffect(() => {
    setDraft(cloneDraft(data.adminSettings.customization));
  }, [data.adminSettings.customization]);

  useEffect(() => {
    if (!allowedTabs?.length) {
      return;
    }
    if (!allowedTabs.includes(tab)) {
      setTab(allowedTabs[0] ?? "labels");
    }
  }, [allowedTabs, tab]);

  const save = useCallback(() => {
    const cleaned = normalizeCustomization(draft);
    const welcomeFromLabel = draft.labels?.[LABEL_KEYS.dashboardWelcomeMessage]?.trim();
    setData((current) =>
      createActivity(
        {
          ...current,
          adminSettings: {
            ...current.adminSettings,
            customization: cleaned,
            ...(welcomeFromLabel
              ? { dashboardWelcomeMessage: welcomeFromLabel }
              : {}),
          },
        },
        {
          type: "updated",
          entityType: "settings",
          entityId: "customization",
          entityTitle: "Customization",
          message: "Updated customization settings",
        },
      ),
    );
    setSaveHint("Saved.");
    window.setTimeout(() => setSaveHint(""), 4000);
  }, [draft, setData]);

  const resetAll = () => {
    const ok = window.confirm(
      "Reset all customization to app defaults?\n\nOnly customization settings (labels and picker lists) will be cleared. Tasks, family members, inventory, shopping, and other household data are not changed.",
    );
    if (!ok) return;
    setDraft({});
    setData((current) =>
      createActivity(
        {
          ...current,
          adminSettings: {
            ...current.adminSettings,
            customization: undefined,
          },
        },
        {
          type: "updated",
          entityType: "settings",
          entityId: "customization",
          entityTitle: "Customization",
          message: "Updated customization settings",
        },
      ),
    );
    setSaveHint("All customization cleared.");
    window.setTimeout(() => setSaveHint(""), 4000);
  };

  const admin = data.adminSettings;

  const labelField = (key: CustomizationLabelKey, label: string, hint: string) => {
    const value = draft.labels?.[key] ?? "";
    const placeholder = LABEL_DEFAULTS[key](admin);

    return (
      <label className="block space-y-1.5" key={key}>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(event) =>
            setDraft((d) => ({
              ...d,
              labels: {
                ...d.labels,
                [key]: event.target.value,
              },
            }))
          }
        />
        <p className="text-xs text-slate-500">{hint}</p>
      </label>
    );
  };

  const optionList = (
    title: string,
    listHint: string,
    draftKey: keyof CustomizationSettings,
    defaults: readonly string[],
    resetHint: string,
    extraHint?: string,
  ) => {
    const values = displayStringList(draft, draftKey, defaults);
    return (
      <WorkspacePanel eyebrow={resetHint} title={title}>
        <p className="mb-3 text-xs text-slate-500">{listHint}</p>
        {extraHint ? <p className="mb-3 text-xs text-slate-600">{extraHint}</p> : null}
        <div className="space-y-2">
          {values.map((row, index) => (
            <div className="flex gap-2" key={`${draftKey}-${index}`}>
              <Input
                className="flex-1"
                value={row}
                onChange={(event) => {
                  const next = [...values];
                  next[index] = event.target.value;
                  setDraft((d) => ({ ...d, [draftKey]: next }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const ok = window.confirm(
                    "Remove this option from the picker list?\n\nRemoving an option does not delete existing records that already use it.",
                  );
                  if (!ok) return;
                  const next = values.filter((_, i) => i !== index);
                  setDraft((d) => ({
                    ...d,
                    [draftKey]: next.length > 0 ? next : undefined,
                  }));
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                [draftKey]: [...values, "New option"],
              }))
            }
          >
            Add option
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const ok = window.confirm(
                `Reset “${title}” to the default list?\n\nYou can still edit again after reset.`,
              );
              if (!ok) return;
              setDraft((d) => {
                const next = { ...d };
                delete next[draftKey];
                return next;
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset group
          </Button>
        </div>
      </WorkspacePanel>
    );
  };

  const labelEntries: {
    key: CustomizationLabelKey;
    label: string;
    hint: string;
  }[] = [
    {
      key: LABEL_KEYS.appDisplayName,
      label: "App display name",
      hint: "Shown in the top bar. Falls back to household name if empty.",
    },
    {
      key: LABEL_KEYS.dashboardTitle,
      label: "Dashboard title",
      hint: "Main headline on the hub. Falls back to household name if empty.",
    },
    {
      key: LABEL_KEYS.dashboardWelcomeMessage,
      label: "Dashboard welcome message",
      hint: "Intro text on the hub. Also updates Household welcome when saved.",
    },
    {
      key: LABEL_KEYS.moduleHouseholdInventory,
      label: "Household Inventory label",
      hint: "Default nav label for pantry, inventory, Add Stock, and storage planning.",
    },
    {
      key: LABEL_KEYS.moduleShopping,
      label: "Shopping label",
      hint: "Nav label for shopping lists and Shopping Needs.",
    },
    {
      key: LABEL_KEYS.moduleTasks,
      label: "Cleaning label",
      hint: "Nav tab and cleaning module title.",
    },
    {
      key: LABEL_KEYS.moduleFamily,
      label: "Members label",
      hint: "Labels for member directory routes (often hidden from the main nav).",
    },
    {
      key: LABEL_KEYS.moduleCalendar,
      label: "Calendar label",
      hint: "Nav tab and calendar module.",
    },
    {
      key: LABEL_KEYS.modulePlanner,
      label: "Legacy calendar alias",
      hint: "Rarely used alternate label; the main calendar uses Calendar label above.",
    },
    {
      key: LABEL_KEYS.moduleProjects,
      label: "Workspace label",
      hint: "Legacy shortcut label; main navigation hides this module by design.",
    },
    {
      key: LABEL_KEYS.moduleDocs,
      label: "Notes label",
      hint: "Nav label for stored notes when that module is visible.",
    },
    {
      key: LABEL_KEYS.moduleDashboardNav,
      label: "Home nav label",
      hint: 'First tab label (default "Home").',
    },
    {
      key: LABEL_KEYS.moduleSettings,
      label: "Settings label",
      hint: 'Nav tab for this page (default "Settings").',
    },
  ];

  const visibleLabelEntries =
    labelsScope === "navAppearance"
      ? labelEntries.filter((e) => NAV_APPEARANCE_LABEL_KEYS.includes(e.key))
      : labelEntries;

  return (
    <WorkspaceFilterBar className="space-y-4">
      {!compact ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          <p className="font-medium">Picker lists</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/90">
            Removing an option does not delete existing records that already use it. Orphan values still
            appear in dropdowns until you edit those records.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-950">
            {compact ? "Customize lists" : "Admin Customization Center"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {compact
              ? "Changes apply on this device after you save."
              : "Edit dropdown options and display labels for this browser. Save to apply. Empty label fields use normal defaults."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={save}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          {!compact ? (
            <Button type="button" variant="secondary" onClick={resetAll}>
              Reset all customization
            </Button>
          ) : null}
        </div>
      </div>
      {saveHint ? <p className="text-sm font-medium text-emerald-800">{saveHint}</p> : null}

      {tabsListed.length > 1 ? (
        <ModuleSubnav activeTab={tab} onChange={setTab} tabs={tabsListed} />
      ) : null}

      {tab === "labels" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleLabelEntries.map((entry) =>
            labelField(entry.key, entry.label, entry.hint),
          )}
        </div>
      ) : null}

      {tab === "family" ? (
        <div className="space-y-4">
          {optionList(
            "Age groups",
            "Suggested age groups for members.",
            "memberAgeGroups",
            defaultMemberAgeGroupOptions,
            "Household demographics",
          )}
          {optionList(
            "Member statuses",
            "Lifecycle statuses for household members (stored as short keys; legacy values stay valid on existing profiles).",
            "memberStatuses",
            defaultMemberStatusOptionsForAdmin,
            "Directory and filters",
          )}
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="space-y-4">
          {optionList(
            "Zones / rooms",
            "Chore and task zone filters and assignments.",
            "taskZones",
            cleaningZones,
            "Task geography",
          )}
          {optionList(
            "Task statuses",
            "Status options for tasks and chores.",
            "taskStatuses",
            taskStatuses,
            "Task board and filters",
          )}
          {optionList(
            "Priorities",
            "Task priority picks.",
            "taskPriorities",
            priorities,
            "Urgency",
          )}
          {optionList(
            "Frequencies",
            "Recurring chore cadence values stored in data.",
            "taskFrequencies",
            taskFrequencies,
            "Recurring logic",
            "Use the exact tokens bundled with the app (e.g. one-time, daily, weekly). Changing spelling can break existing chores until tasks are updated.",
          )}
          {optionList(
            "Task categories",
            "Categories for organizing tasks.",
            "taskCategories",
            defaultTaskCategoryOptions,
            "Labels",
          )}
        </div>
      ) : null}

      {tab === "calendar" ? (
        <div className="space-y-4">
          {optionList(
            "Event categories",
            "Calendar event categories.",
            "calendarCategories",
            plannerCategories,
            "Scheduling",
          )}
        </div>
      ) : null}

      {tab === "grocery" ? (
        <div className="space-y-4">
          {optionList(
            "Grocery categories",
            "Library and list category tags.",
            "groceryCategories",
            defaultGroceryCategoryOptions,
            "Shopping metadata",
          )}
          {optionList(
            "Store sections",
            "Store aisle sections (values are usually lowercase slugs).",
            "groceryStoreSections",
            storeSections,
            "Shopping paths",
          )}
          {optionList(
            "Inventory categories",
            "Pantry item categories.",
            "inventoryCategories",
            defaultInventoryCategoryOptions,
            "Pantry taxonomy",
          )}
          {optionList(
            "Storage areas",
            "Primary storage locations for inventory and shopping destinations.",
            "inventoryStorageAreas",
            pantryLocations,
            "Cold and dry storage",
          )}
          {optionList(
            "Kitchen location details",
            "Cabinet and kitchen sub-locations.",
            "kitchenLocationDetails",
            kitchenLocationDetails,
            "Kitchen detail picks",
          )}
          {optionList(
            "Pantry wall options",
            "Wall labels inside pantry storage.",
            "pantryWallOptions",
            pantryWalls,
            "Vertical slots",
          )}
          {optionList(
            "Pantry shelf options",
            "Shelf labels inside pantry storage.",
            "pantryShelfOptions",
            pantryShelves,
            "Horizontal slots",
          )}
          {optionList(
            "Fridge / freezer location details",
            "Cold storage sub-locations.",
            "fridgeFreezerLocationDetails",
            coldLocationDetails,
            "Cold chain",
          )}
          {optionList(
            "Units",
            "Suggested quantity units for pantry and shopping.",
            "units",
            defaultUnitOptions,
            "Measure",
          )}
        </div>
      ) : null}

      {tab === "projects" ? (
        <div className="space-y-4">
          {optionList(
            "Project statuses",
            "Pipeline states for household projects.",
            "projectStatuses",
            defaultProjectStatusOptions,
            "Project board",
          )}
          {optionList(
            "Project priorities",
            "Priority chips for projects.",
            "projectPriorities",
            defaultProjectPriorityOptions,
            "Ranking",
          )}
        </div>
      ) : null}

      {tab === "docs" ? (
        <div className="space-y-4">
          {optionList(
            "Doc categories",
            "Note categories in the doc vault.",
            "docCategories",
            docCategories,
            "Knowledge base",
          )}
          {optionList(
            "Doc visibility options",
            "Visibility / sharing labels for documents.",
            "docVisibility",
            defaultDocVisibilityOptions,
            "Access control picks",
          )}
        </div>
      ) : null}

      <div className={cn("flex justify-end border-t border-slate-200 pt-4")}>
        <Button type="button" variant="primary" onClick={save}>
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>
    </WorkspaceFilterBar>
  );
}
