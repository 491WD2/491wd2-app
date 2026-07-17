import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Barcode,
  Bell,
  ChevronRight,
  Download,
  HardDrive,
  Home,
  ListChecks,
  LogOut,
  MonitorSmartphone,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Tablet,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth";
import {
  CURRENT_DATA_VERSION,
  createDefaultFamilyData,
  moduleKeys,
  kioskDefaultViewOptions,
  kitchenWallDisplayDeviceOptions,
  pantryLocations,
  pantryShelves,
  pantryWalls,
  storeSections,
  type FamilyData,
  type KitchenWallDisplayDevice,
  type KioskDefaultView,
  type MemberNotificationPreferences,
  type PantryItem,
  type PantryLocation,
  type PantryShelf,
  type PantryWall,
  type StoreSection,
  type TaskFrequency,
  type TaskStatus,
  type HouseholdStorageLocation,
} from "../data/familyData";
import { migrateFamilyData, normalizeFamilyData } from "../hooks/useFamilyData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
  WorkspaceTableWrap,
  workspaceTableClassName,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { KitchenHubSection } from "../components/kitchen/KitchenHubSection";
import { HouseholdRosterPanel } from "../components/settings/HouseholdRosterPanel";
import { FAMILY_DATA_STORAGE_KEY } from "../data/localFamilyRepository";
import packageJson from "../../package.json";
import { createActivity } from "../lib/activity";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { createChoreFromSeed, type ChoreSeed } from "../lib/choreSeeds";
import {
  createGroceryItemFromSeed,
  type GroceryItemSeed,
} from "../lib/grocerySeeds";
import { repairCanonicalFamilyMembers } from "../lib/repairCanonicalFamilyMembers";
import {
  hasPrimaryFamilyPayload,
  readLastBackupExportAt,
  writeLastBackupExportAt,
} from "../lib/dataSafety";
import { selectFamilyDataCounts } from "../lib/familyDataSelectors";
import { isOverdue, cn, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";
import { CustomizationCenter } from "../components/settings/CustomizationCenter";
import { VoiceShortcutsSection } from "../components/settings/VoiceShortcutsSection";
import { CloudHouseholdUploadPanel } from "../components/settings/CloudHouseholdUploadPanel";
import { CloudMigrationPreviewPanel } from "../components/settings/CloudMigrationPreviewPanel";
import { FeatureRoadmapPanel } from "../components/settings/FeatureRoadmapPanel";
import { DeviceNotificationsCard } from "../components/settings/DeviceNotificationsCard";
import { SubscriptionSettingsSection } from "../components/settings/SubscriptionSettingsSection";
import { AppearanceLayoutEditor } from "../components/settings/AppearanceLayoutEditor";
import { siteNotificationEnabled } from "../lib/notificationPreferences";
import { testAiConnection } from "../services/aiClient";
import { pingInstacartConnection } from "../services/instacartClient";
import "../styles/pantry-shopping-grofast.css";
import "../styles/guided-kiosk.css";

const moduleLabels: Record<(typeof moduleKeys)[number], string> = {
  dashboard: "Home",
  family: "Members",
  tasks: "Cleaning",
  projects: "Workspace",
  pantry: "Inventory",
  shopping: "Shopping",
  calendar: "Calendar",
  planner: "Calendar",
  docs: "Notes",
};

type SettingsTabId =
  | "household"
  | "members_pins"
  | "kitchen_schedule"
  | "shopping_pantry"
  | "notifications"
  | "subscription"
  | "appearance"
  | "backup_data"
  | "help_install"
  | "integrations"
  | "advanced";

const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: "household", label: "Household" },
  { id: "backup_data", label: "Backup & Data" },
  { id: "members_pins", label: "Members & PINs" },
  { id: "kitchen_schedule", label: "Kitchen Schedule" },
  { id: "shopping_pantry", label: "Shopping & Pantry" },
  { id: "notifications", label: "Notifications" },
  { id: "subscription", label: "Subscription" },
  { id: "appearance", label: "Appearance" },
  { id: "help_install", label: "Help & Install" },
  { id: "integrations", label: "Integrations" },
  { id: "advanced", label: "Advanced" },
];

/** Go-live steps shown under Settings → Help & Install (no persisted state). */
const LAUNCH_CHECKLIST_ITEMS: string[] = [
  "Export backup before deployment",
  "Run npm run build",
  "Run npm run preview",
  "Deploy to Netlify",
  "Open live HTTPS URL on Surface Pro",
  "Install app from Edge/Chrome",
  "Test + Quick Add",
  "Test chores and phone alerts",
  "Test pantry images and barcode scanner",
  "Test Backup & Data import/export",
];

const LEGACY_SETTINGS_TAB: Record<string, SettingsTabId> = {
  member_settings: "members_pins",
  customization: "appearance",
  modules: "shopping_pantry",
  feature_roadmap: "integrations",
  kiosk: "household",
  voice: "integrations",
  data_tools: "backup_data",
  help: "help_install",
  install: "help_install",
  data_health: "advanced",
  backend: "advanced",
  maintenance: "advanced",
  subscription: "subscription",
  billing: "subscription",
};

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const segmentInactiveLight = "text-[#637381] hover:bg-white hover:text-[#1f1f1f]";
const segmentActiveLight =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm";

/** SmartHR-style inset tabs — household sections. */
function SettingsTabRail({
  active,
  onSelect,
}: {
  active: SettingsTabId;
  onSelect: (id: SettingsTabId) => void;
}) {
  return (
    <div
      aria-label="Settings sections"
      className="-mx-1 flex gap-0.5 overflow-x-auto rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-1 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] px-1 sm:flex-wrap"
      role="tablist"
    >
      {SETTINGS_TABS.map((tab) => (
        <button
          key={tab.id}
          id={`settings-tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={cn(
            "min-h-11 shrink-0 whitespace-nowrap rounded-[6px] border border-transparent px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]",
            active === tab.id ? segmentActiveLight : segmentInactiveLight,
          )}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage({ data, setData, onOpenLogin, navigateWithinApp }: PageProps) {
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>("household");
  const [showFullSettings, setShowFullSettings] = useState(true);
  const [importText, setImportText] = useState("");
  const [choreCsvText, setChoreCsvText] = useState("");
  const [groceryCsvText, setGroceryCsvText] = useState("");
  const [inventoryCsvText, setInventoryCsvText] = useState("");
  const [message, setMessage] = useState("");
  const [hasExportedThisSession, setHasExportedThisSession] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [cloudPreviewConfirm, setCloudPreviewConfirm] = useState(false);
  const [cloudPreviewError, setCloudPreviewError] = useState<string | null>(null);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<
    "unknown" | "not_connected" | "ready"
  >("unknown");
  const [aiLastDetail, setAiLastDetail] = useState("");
  const [aiTesting, setAiTesting] = useState(false);
  const [showAiFeatures, setShowAiFeatures] = useState(false);
  const [instacartConnectionStatus, setInstacartConnectionStatus] = useState<
    "unknown" | "not_connected" | "ready"
  >("unknown");
  const [instacartLastDetail, setInstacartLastDetail] = useState("");
  const [instacartTesting, setInstacartTesting] = useState(false);
  const [settingsPreferencesMemberId, setSettingsPreferencesMemberId] = useState("");
  const settings = data.adminSettings;
  const storageStatus = getLocalStorageStatus();
  const { user, signOut } = useAuth();
  const supabaseAuthConfigured = isSupabaseConfigured();
  const localStorageActive = storageStatus === "OK";
  const backupToolsStatus = getBackupToolsStatus();
  const taskCount = data.tasks.filter((task) => task.type !== "chore").length;
  const choreCount = data.tasks.filter((task) => task.type === "chore").length;
  const activeMemberIds = new Set(
    data.familyMembers
      .filter((member) => member.status === "active")
      .map((member) => member.id),
  );
  const orphanedAssignmentCount =
    data.tasks.filter(
      (task) =>
        task.assignedMemberId && !activeMemberIds.has(task.assignedMemberId),
    ).length +
    data.planner.filter(
      (event) =>
        event.assignedMemberId && !activeMemberIds.has(event.assignedMemberId),
    ).length;
  const overdueChoreCount = data.tasks.filter(
    (task) =>
      task.type === "chore" &&
      task.status !== "Done" &&
      task.status !== "Completed" &&
      isOverdue(task.nextDueDate || task.dueDate),
  ).length;
  const latestActivityDate = getLatestActivityDate(data.activityLog);
  const dataSourceMode = settings.dataSourceMode ?? "local";
  const cloudPreviewReady =
    supabaseAuthConfigured &&
    Boolean(user) &&
    Boolean(settings.cloudHouseholdId?.trim());
  const aiModelLabel =
    import.meta.env.VITE_AI_MODEL_LABEL?.trim() || "Configured on server";
  const dataCheckCounts = useMemo(() => selectFamilyDataCounts(data), [data]);

  const lastBackupFriendly = useMemo(() => {
    const iso = readLastBackupExportAt();
    if (!iso) {
      return null;
    }
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        return null;
      }
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return null;
    }
  }, [message, hasExportedThisSession]);
  const choreImportPreview = useMemo(
    () => parseChoreCsv(choreCsvText, data),
    [choreCsvText, data],
  );
  const validChoreRows = choreImportPreview.filter((row) => row.isValid);
  const groceryImportPreview = useMemo(
    () => parseGroceryCsv(groceryCsvText, data),
    [groceryCsvText, data],
  );
  const validGroceryRows = groceryImportPreview.filter((row) => row.isValid);
  const inventoryImportPreview = useMemo(
    () => parseInventoryCsv(inventoryCsvText, data),
    [inventoryCsvText, data],
  );
  const validInventoryRows = inventoryImportPreview.filter((row) => row.isValid);
  const activePantryItems = useMemo(
    () => data.pantry.filter((item) => !item.inactiveInInventory),
    [data.pantry],
  );
  const inventorySpaceRows = useMemo(() => {
    const spaces = [
      {
        id: "pantry",
        label: "Main Pantry",
        match: (item: PantryItem) => item.location === "Pantry" || item.storageArea === "Pantry",
      },
      {
        id: "freezer",
        label: "Freezer",
        match: (item: PantryItem) =>
          item.location.includes("Freezer") || item.storageArea.includes("Freezer"),
      },
      {
        id: "refrigerator",
        label: "Refrigerator",
        match: (item: PantryItem) =>
          item.location.includes("Fridge") || item.storageArea.includes("Fridge"),
      },
      {
        id: "cabinets",
        label: "Kitchen Cabinets",
        match: (item: PantryItem) =>
          item.location === "Kitchen Cabinets" || item.storageArea === "Kitchen Cabinets",
      },
    ];

    return spaces.map((space) => ({
      ...space,
      count: activePantryItems.filter(space.match).length,
    }));
  }, [activePantryItems]);
  const pushNotificationsOn = notificationEffective(
    undefined,
    settings.siteNotificationDefaults,
    "enableReminders",
  );
  const pantryAlertsOn = notificationEffective(
    undefined,
    settings.siteNotificationDefaults,
    "inventoryLowStock",
  );
  const shoppingAlertsOn = notificationEffective(
    undefined,
    settings.siteNotificationDefaults,
    "shoppingUpdates",
  );

  function enterCloudPreview() {
    setCloudPreviewError(null);
    if (!supabaseAuthConfigured) {
      setCloudPreviewError("Cloud preview is not configured on this install yet.");
      return;
    }
    if (!user) {
      setCloudPreviewError("Please sign in before using Cloud Preview.");
      return;
    }
    if (!settings.cloudHouseholdId?.trim()) {
      setCloudPreviewError("Connect a cloud household before using Cloud Preview.");
      return;
    }
    if (!cloudPreviewConfirm) {
      setCloudPreviewError("Please confirm that device data stays saved locally.");
      return;
    }
    setData((prev) =>
      createActivity(
        {
          ...prev,
          adminSettings: {
            ...prev.adminSettings,
            dataSourceMode: "cloud-preview",
          },
        },
        {
          type: "updated",
          entityType: "settings",
          entityId: "data-source",
          entityTitle: "Data source",
          message: "Entered Cloud Preview mode.",
        },
      ),
    );
    window.location.reload();
  }

  function returnToDeviceMode() {
    setCloudPreviewError(null);
    setData((prev) =>
      createActivity(
        {
          ...prev,
          adminSettings: {
            ...prev.adminSettings,
            dataSourceMode: "local",
          },
        },
        {
          type: "updated",
          entityType: "settings",
          entityId: "data-source",
          entityTitle: "Data source",
          message: "Returned to Device Mode.",
        },
      ),
    );
    window.location.reload();
  }

  async function runAiConnectionTest() {
    setAiTesting(true);
    setAiLastDetail("");
    try {
      const result = await testAiConnection();
      setAiConnectionStatus(result.ready ? "ready" : "not_connected");
      setAiLastDetail(result.message);
    } catch (e) {
      setAiConnectionStatus("not_connected");
      setAiLastDetail(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setAiTesting(false);
    }
  }

  async function runInstacartConnectionTest() {
    setInstacartTesting(true);
    setInstacartLastDetail("");
    try {
      const ping = await pingInstacartConnection();
      if (ping.ok && ping.connected) {
        setInstacartConnectionStatus("ready");
        setInstacartLastDetail(
          "Server credentials found. You can create list links from Shopping → Send to Instacart.",
        );
      } else if (ping.ok && !ping.connected) {
        setInstacartConnectionStatus("not_connected");
        setInstacartLastDetail(
          "Instacart is not connected yet. Add INSTACART_API_KEY to your Netlify environment variables.",
        );
      } else {
        setInstacartConnectionStatus("not_connected");
        setInstacartLastDetail(
          ping.message ??
            "Could not reach the Instacart helper. Try netlify dev locally or test on deploy.",
        );
      }
    } catch (e) {
      setInstacartConnectionStatus("not_connected");
      setInstacartLastDetail(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setInstacartTesting(false);
    }
  }

  useEffect(() => {
    function applyHash() {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return;
      const mapped = LEGACY_SETTINGS_TAB[raw];
      if (mapped) {
        setSettingsTab(mapped);
        return;
      }
      if (SETTINGS_TABS.some((tab) => tab.id === raw)) {
        setSettingsTab(raw as SettingsTabId);
      }
    }
    applyHash();
    const roster = new URLSearchParams(window.location.search);
    if (roster.get("roster") === "1" || roster.get("members") === "1") {
      setSettingsTab("members_pins");
      window.requestAnimationFrame(() => {
        document.getElementById("settings-household-roster")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    if (settingsTab !== "backup_data") {
      return;
    }
    const h = window.location.hash.replace(/^#/, "");
    if (h !== "backup_data") {
      return;
    }
    const t = window.setTimeout(() => {
      document.getElementById("settings-backup-data")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [settingsTab]);

  function selectSettingsTab(id: SettingsTabId) {
    setSettingsTab(id);
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", `${base}#${id}`);
  }

  function updateSettings(updates: Partial<FamilyData["adminSettings"]>) {
    setData((current) => ({
      ...current,
      adminSettings: {
        ...current.adminSettings,
        ...updates,
      },
    }));
  }

  function updateInstacartSettings(
    updates: Partial<FamilyData["adminSettings"]["instacart"]>,
  ) {
    setData((current) => ({
      ...current,
      adminSettings: {
        ...current.adminSettings,
        instacart: {
          ...current.adminSettings.instacart,
          ...updates,
        },
      },
    }));
  }

  function updateModuleVisibility(
    key: (typeof moduleKeys)[number],
    isVisible: boolean,
  ) {
    setData((current) => ({
      ...current,
      adminSettings: {
        ...current.adminSettings,
        moduleVisibility: {
          ...current.adminSettings.moduleVisibility,
          [key]: isVisible,
        },
      },
    }));
  }

  const notificationFieldList: {
    key: keyof MemberNotificationPreferences;
    label: string;
  }[] = [
    { key: "enableReminders", label: "Enable alerts" },
    { key: "choresDue", label: "Chores due today" },
    { key: "choresOverdue", label: "Overdue chores" },
    { key: "calendarEventsToday", label: "Calendar events today" },
    { key: "shoppingUpdates", label: "Shopping updates" },
    { key: "inventoryLowStock", label: "Pantry low / out" },
    { key: "petMedicationDue", label: "Pet medication due" },
    { key: "kitchenDutyReminders", label: "Kitchen duty reminders" },
  ];

  function notificationEffective(
    memberPrefs: MemberNotificationPreferences | undefined,
    site: MemberNotificationPreferences | undefined,
    key: keyof MemberNotificationPreferences,
  ): boolean {
    if (memberPrefs && typeof memberPrefs[key] === "boolean") {
      return memberPrefs[key]!;
    }
    if (
      key === "calendarEventsToday" &&
      memberPrefs &&
      typeof memberPrefs.calendarReminders === "boolean"
    ) {
      return memberPrefs.calendarReminders;
    }
    return siteNotificationEnabled(site, key);
  }

  function updateMemberNotificationPrefs(
    patch: Partial<MemberNotificationPreferences>,
  ) {
    const memberId = settingsPreferencesMemberId;
    if (!memberId) {
      return;
    }
    setData((current) => {
      const root = current.adminSettings.userPreferencesByMemberId ?? {};
      const memberPref = root[memberId] ?? {};
      const prevN = memberPref.notificationPreferences ?? {};
      return {
        ...current,
        adminSettings: {
          ...current.adminSettings,
          userPreferencesByMemberId: {
            ...root,
            [memberId]: {
              ...memberPref,
              notificationPreferences: { ...prevN, ...patch },
            },
          },
        },
      };
    });
  }

  function updateSiteNotificationDefaults(
    patch: Partial<MemberNotificationPreferences>,
  ) {
    const base = createDefaultFamilyData().adminSettings.siteNotificationDefaults ?? {};
    updateSettings({
      siteNotificationDefaults: {
        ...base,
        ...settings.siteNotificationDefaults,
        ...patch,
      },
    });
  }

  function handleBackupFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setImportText(text);
      setMessage(
        `Loaded “${file.name}”. If it looks complete below, tap Import Backup.`,
      );
    };
    reader.onerror = () => {
      setMessage(
        "We couldn’t read that file. Try another file, or paste your backup instead.",
      );
    };
    reader.readAsText(file);
  }

  function exportData() {
    if (backupToolsStatus !== "Available") {
      setMessage("Export unavailable in this browser.");
      return;
    }

    const exportedAt = new Date().toISOString();
    // Full FamilySite_491 snapshot: adminSettings, familyMembers, tasks, planner,
    // calendarLinks, projects, docs, shopping, groceryItems, pantry, activityLog, dataVersion.
    const backup = {
      appName: "FamilySite_491",
      backupFormat: "familysite-491.backup.v1",
      exportedAt,
      householdName: settings.householdName,
      appLabel: settings.appModeLabel,
      dataVersion: CURRENT_DATA_VERSION,
      data: {
        ...data,
        dataVersion: CURRENT_DATA_VERSION,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStamp = exportedAt.slice(0, 10);
    link.download = `familysite-491-backup-${dateStamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    writeLastBackupExportAt(exportedAt);
    setData((current) =>
      createActivity(current, {
        type: "exported",
        entityType: "data",
        entityId: "local-backup",
        entityTitle: "Local backup",
        message: "Exported local app backup.",
      }),
    );
    setHasExportedThisSession(true);
    setMessage("Backup saved to your device.");
  }

  function repairFamilyMemberRoster() {
    const { members, addedNames, renamed, clearedAnimalIcons } =
      repairCanonicalFamilyMembers(data.familyMembers);
    setData((current) =>
      createActivity(
        { ...current, familyMembers: members },
        {
          type: "updated",
          entityType: "data",
          entityId: "family-roster-repair",
          entityTitle: "Family roster",
          message: "Checked family member roster.",
        },
      ),
    );
    const parts: string[] = [];
    if (renamed.length > 0) {
      parts.push(
        `Renamed: ${renamed.map((r) => `${r.from} → ${r.to}`).join("; ")}`,
      );
    }
    if (clearedAnimalIcons > 0) {
      parts.push(`Removed outdated icon metadata on ${clearedAnimalIcons} member(s).`);
    }
    if (addedNames.length > 0) {
      parts.push(`Added: ${addedNames.join(", ")}`);
    }
    if (parts.length === 0) {
      parts.push("No roster changes needed; logged check only.");
    }
    setMessage(`Repair complete. ${parts.join(" ")}`);
  }

  function importData() {
    try {
      const parsed = JSON.parse(importText);
      const importCandidate = getImportCandidate(parsed);

      if (!importCandidate.ok) {
        setMessage(importCandidate.error);
        return;
      }

      const migrated = migrateFamilyData(importCandidate.data);

      if (!migrated.ok) {
        setMessage(
          `Import could not finish: ${migrated.error} If this keeps happening, try exporting a fresh backup from a working browser.`,
        );
        return;
      }

      const proceed = window.confirm(
        [
          "Import will replace all household data on this device with the backup you prepared.",
          "",
          "If you have not saved what you need from this device yet, cancel now and use Export Backup first.",
          "",
          "Continue with import?",
        ].join("\n"),
      );
      if (!proceed) {
        setMessage("Import cancelled — nothing was changed.");
        return;
      }

      const next = migrated.data;
      setData(
        createActivity(next, {
          type: "imported",
          entityType: "data",
          entityId: "local-backup",
          entityTitle: "Local backup",
          message: "Imported local app backup.",
        }),
      );
      setImportText("");
      setMessage(
        `Import complete — ${next.familyMembers.length} members, ${next.shopping.length} shopping rows, ${next.pantry.length} pantry items, ${next.planner.length} calendar events.`,
      );
    } catch {
      setMessage(
        "That backup text doesn’t look complete. Paste the full JSON file from Export Backup and try again.",
      );
    }
  }

  function resetData() {
    const backupReminder = hasExportedThisSession
      ? ""
      : "You have not used Export Backup during this visit to Settings. ";

    const acknowledged = window.confirm(
      `${backupReminder}Reset removes all household data on this device and restores the built-in template.\n\n` +
        `Export Backup first and save the file somewhere safe unless you are intentionally starting fresh.\n\n` +
        `Continue to the typing step?`,
    );
    if (!acknowledged) {
      setMessage("Reset cancelled.");
      return;
    }

    const typed = window.prompt(
      `This will erase local household data on this device.\n\n` +
        `Type RESET in capital letters to confirm.`,
    );
    if (typed !== "RESET") {
      if (typed !== null) {
        setMessage("Reset cancelled — type RESET exactly to confirm.");
      } else {
        setMessage("Reset cancelled.");
      }
      return;
    }

    setData(
      createActivity(createDefaultFamilyData(), {
        type: "reset",
        entityType: "data",
        entityId: "default-data",
        entityTitle: "Default data",
        message: "Reset local app data to defaults.",
      }),
    );
    setHasExportedThisSession(false);
    setMessage("Reset complete. This device is back to the default template.");
  }

  function importStagedChores() {
    if (validChoreRows.length === 0) {
      return;
    }

    const skippedCount = choreImportPreview.length - validChoreRows.length;
    const duplicateCount = choreImportPreview.filter((row) =>
      row.warnings.some((warning) => warning.includes("Duplicate")),
    ).length;
    const needsReviewCount = choreImportPreview.filter((row) =>
      row.warnings.some((warning) => warning.includes("needs review")),
    ).length;
    const shouldImport = window.confirm(
      `Import ${validChoreRows.length} staged chore${validChoreRows.length === 1 ? "" : "s"}?\n\n${skippedCount} invalid row${skippedCount === 1 ? "" : "s"} will be skipped. Existing chores will not be deleted.`,
    );

    if (!shouldImport) {
      return;
    }

    setData((current) =>
      createActivity(
        normalizeFamilyData({
          ...current,
          tasks: [
            ...current.tasks,
            ...validChoreRows.map((row) =>
              createChoreFromSeed(
                {
                  ...row.seed,
                  source: "import",
                  sourceSystem: "notion-chores",
                },
                current.familyMembers,
              ),
            ),
          ],
        }),
        {
          type: "imported",
          entityType: "chore",
          entityId: "chore-staging",
          entityTitle: "Chore import",
          message: `Imported ${validChoreRows.length} chore${validChoreRows.length === 1 ? "" : "s"}.`,
        },
      ),
    );
    setMessage(
      `Imported ${validChoreRows.length}; skipped ${skippedCount}; duplicates ${duplicateCount}; needs review ${needsReviewCount}.`,
    );
  }

  function importStagedGroceries() {
    if (validGroceryRows.length === 0) {
      return;
    }

    const skippedCount = groceryImportPreview.length - validGroceryRows.length;
    const duplicateCount = groceryImportPreview.filter((row) =>
      row.warnings.some((warning) => warning.includes("Duplicate")),
    ).length;
    const shouldImport = window.confirm(
      `Import ${validGroceryRows.length} grocery item${validGroceryRows.length === 1 ? "" : "s"}?\n\n${skippedCount} invalid row${skippedCount === 1 ? "" : "s"} will be skipped. Existing grocery items will not be deleted or overwritten.`,
    );

    if (!shouldImport) {
      return;
    }

    setData((current) =>
      createActivity(
        normalizeFamilyData({
          ...current,
          groceryItems: [
            ...current.groceryItems,
            ...validGroceryRows.map((row) =>
              createGroceryItemFromSeed({
                ...row.seed,
                source: "import",
                sourceSystem: "grocery-staging",
              }),
            ),
          ],
        }),
        {
          type: "imported",
          entityType: "data",
          entityId: "grocery-staging",
          entityTitle: "Grocery import",
          message: `Imported ${validGroceryRows.length} grocery item${validGroceryRows.length === 1 ? "" : "s"}.`,
        },
      ),
    );
    setMessage(
      `Imported ${validGroceryRows.length}; skipped ${skippedCount}; duplicates ${duplicateCount}.`,
    );
  }

  function importStagedInventory() {
    if (validInventoryRows.length === 0) {
      return;
    }

    const skippedCount = inventoryImportPreview.length - validInventoryRows.length;
    const duplicateCount = inventoryImportPreview.filter((row) =>
      row.warnings.some((warning) => warning.includes("Duplicate")),
    ).length;
    const needsReviewCount = inventoryImportPreview.filter(
      (row) => row.warnings.length > 0,
    ).length;
    const shouldImport = window.confirm(
      `Import ${validInventoryRows.length} inventory item${validInventoryRows.length === 1 ? "" : "s"}?\n\n${skippedCount} invalid row${skippedCount === 1 ? "" : "s"} will be skipped. Existing inventory items will not be deleted or overwritten.`,
    );

    if (!shouldImport) {
      return;
    }

    const now = new Date().toISOString();
    setData((current) =>
      createActivity(
        normalizeFamilyData({
          ...current,
          pantry: [
            ...current.pantry,
            ...validInventoryRows.map((row) => ({
              ...row.seed,
              source: "import",
              sourceSystem: "inventory-staging",
              createdAt: now,
              lastUpdated: now,
            })),
          ],
        }),
        {
          type: "imported",
          entityType: "pantryItem",
          entityId: "inventory-staging",
          entityTitle: "Inventory import",
          message: `Imported ${validInventoryRows.length} inventory item${validInventoryRows.length === 1 ? "" : "s"}.`,
        },
      ),
    );
    setMessage(
      `Imported ${validInventoryRows.length}; skipped ${skippedCount}; duplicates ${duplicateCount}; needs review ${needsReviewCount}.`,
    );
  }

  const todayKitchen = new Date().toISOString().slice(0, 10);
  const rawStoragePayload =
    typeof window !== "undefined" ? window.localStorage.getItem(FAMILY_DATA_STORAGE_KEY) : null;
  const storagePayloadKb =
    rawStoragePayload != null ? Math.round((rawStoragePayload.length / 1024) * 10) / 10 : null;

  function openSettingsSection(id: SettingsTabId) {
    selectSettingsTab(id);
    setShowFullSettings(true);
  }

  if (!showFullSettings) {
    return (
      <div className="wd-settings-ref">
        <header className="wd-settings-ref__topbar" aria-label="Settings navigation">
          <button type="button" className="wd-settings-ref__back" onClick={() => navigateWithinApp?.("/pantry")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <strong>Settings</strong>
          <span aria-hidden />
        </header>

        <nav className="wd-settings-ref__switcher" aria-label="Shared pantry and shopping pages">
          <button type="button" onClick={() => navigateWithinApp?.("/pantry")}>Inventory</button>
          <button type="button" onClick={() => navigateWithinApp?.("/shopping")}>Shopping</button>
          <button type="button" onClick={() => navigateWithinApp?.("/shopping")}>Product Details</button>
          <button type="button" className="wd-settings-ref__switcher-active" aria-current="page">Settings</button>
        </nav>

        <section className="wd-settings-ref__hero" aria-labelledby="settings-kiosk-title">
          <span aria-hidden><Settings className="h-7 w-7" /></span>
          <div>
            <h1 id="settings-kiosk-title">Settings</h1>
            <p>{settings.householdName || "Shared household"}</p>
          </div>
        </section>

        <main className="wd-settings-ref__content" aria-label="Shared pantry and shopping settings">
          <section className="wd-settings-ref__card">
            <header>
              <span aria-hidden><Barcode className="h-5 w-5" /></span>
              <h2>Barcode Lookup</h2>
            </header>
            <div className="wd-settings-ref__stack">
              <div className="wd-settings-ref__field">
                <span>Product Name Format</span>
                <div className="wd-settings-ref__select-like">
                  <strong>Long Names (Recommended)</strong>
                  <small>Includes brand information from OpenFoodFacts when available</small>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </div>
              </div>
              <div className="wd-settings-ref__example">
                <strong>Example:</strong>
                <p><span>Short:</span> Hot Sauce</p>
                <p><span>Long:</span> Frank's RedHot Original Cayenne Pepper Sauce</p>
              </div>
              <p className="wd-settings-ref__note">
                <strong>Note:</strong> Product names can still be edited manually after scanning.
              </p>
            </div>
          </section>

          <section className="wd-settings-ref__card">
            <header>
              <span aria-hidden><Home className="h-5 w-5" /></span>
              <h2>Inventory Spaces</h2>
            </header>
            <div className="wd-settings-ref__rows">
              {inventorySpaceRows.map((space) => (
                <button
                  key={space.id}
                  type="button"
                  className="wd-settings-ref__row"
                  onClick={() => openSettingsSection("shopping_pantry")}
                >
                  <span className="wd-settings-ref__row-icon" aria-hidden><Home className="h-4 w-4" /></span>
                  <span>
                    <strong>{space.label}</strong>
                    <small>{space.count} item{space.count === 1 ? "" : "s"}</small>
                  </span>
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              ))}
            </div>
          </section>

          <section className="wd-settings-ref__card">
            <header>
              <span aria-hidden><Bell className="h-5 w-5" /></span>
              <h2>Notifications</h2>
            </header>
            <div className="wd-settings-ref__rows">
              <label className="wd-settings-ref__toggle-row">
                <span>
                  <strong>Push Notifications</strong>
                  <small>Receive household alerts and updates</small>
                </span>
                <input
                  type="checkbox"
                  checked={pushNotificationsOn}
                  onChange={(event) =>
                    updateSiteNotificationDefaults({ enableReminders: event.target.checked })
                  }
                />
              </label>
              <label className="wd-settings-ref__toggle-row">
                <span>
                  <strong>Pantry Alerts</strong>
                  <small>Get notified when pantry items need attention</small>
                </span>
                <input
                  type="checkbox"
                  checked={pantryAlertsOn}
                  onChange={(event) =>
                    updateSiteNotificationDefaults({ inventoryLowStock: event.target.checked })
                  }
                />
              </label>
              <label className="wd-settings-ref__toggle-row">
                <span>
                  <strong>Shopping Updates</strong>
                  <small>Notify the household when the shared list changes</small>
                </span>
                <input
                  type="checkbox"
                  checked={shoppingAlertsOn}
                  onChange={(event) =>
                    updateSiteNotificationDefaults({ shoppingUpdates: event.target.checked })
                  }
                />
              </label>
            </div>
          </section>

          <section className="wd-settings-ref__card">
            <header>
              <span aria-hidden><UserRound className="h-5 w-5" /></span>
              <h2>Account</h2>
            </header>
            <div className="wd-settings-ref__rows">
              <button type="button" className="wd-settings-ref__row" onClick={() => openSettingsSection("household")}>
                <span>
                  <strong>Profile Information</strong>
                  <small>{user?.email ?? "Local kiosk profile"}</small>
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" className="wd-settings-ref__row" onClick={() => openSettingsSection("household")}>
                <span>
                  <strong>Organization</strong>
                  <small>{settings.householdName || "Shared household"}</small>
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" className="wd-settings-ref__row" onClick={() => setShowFullSettings(true)}>
                <span>
                  <strong>Advanced Settings</strong>
                  <small>Open the full household settings workspace</small>
                </span>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </section>

          {user ? (
            <button type="button" className="wd-settings-ref__danger" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </button>
          ) : (
            <button type="button" className="wd-settings-ref__danger wd-settings-ref__danger--neutral" onClick={onOpenLogin}>
              Sign In
            </button>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "motion-page flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone="light"
      >
      <ModuleWorkspaceHeader
        description="Household preferences for this device. Export a backup before big changes — start under Backup & Data."
        eyebrow="Household"
        title="Settings"
        tone="light"
      />

      <SettingsTabRail active={settingsTab} onSelect={selectSettingsTab} />

      {settingsTab === "integrations" ? (
      <>
        <Card tone="light">
          <CardHeader tone="light" title="Connections overview" eyebrow="Integrations" />
          <p className="mb-4 text-sm text-[#575757]">
            Status for household tools. No secret keys are collected in this browser UI.
          </p>
          <div className="overflow-x-auto rounded-[8px] border border-[#ededed]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#ededed] bg-[#f8f9fa] text-[0.65rem] font-semibold uppercase tracking-wide text-[#637381]">
                <tr>
                  <th className="px-3 py-2.5">Service</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ededed] text-[#1f1f1f]">
                <tr>
                  <td className="px-3 py-2.5 font-medium">OpenFoodFacts</td>
                  <td className="px-3 py-2.5">
                    <Badge tone="green">Live</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">
                    Public product lookup by barcode from Add Stock, Inventory, and Shopping.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">QR / barcode labels</td>
                  <td className="px-3 py-2.5">
                    <Badge tone="green">Live</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">Camera scanning and manual barcode entry.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">Supabase Cloud Sync</td>
                  <td className="px-3 py-2.5">
                    <Badge
                      tone={
                        dataSourceMode === "cloud-preview"
                          ? "green"
                          : user && settings.cloudHouseholdId?.trim()
                            ? "blue"
                            : supabaseAuthConfigured
                              ? "amber"
                              : "neutral"
                      }
                    >
                      {!supabaseAuthConfigured
                        ? "Planned"
                        : dataSourceMode === "cloud-preview"
                          ? "Live (preview)"
                          : user && settings.cloudHouseholdId?.trim()
                            ? "Connected"
                            : "Not connected"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">
                    Optional cloud household link. Device storage stays the normal source unless you
                    start Cloud Preview.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">OpenAI Assistant</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={aiConnectionStatus === "ready" ? "green" : "amber"}>
                      {aiConnectionStatus === "ready" ? "Live" : "Not connected"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">
                    Server-side tools only — test the connection in the panel below.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">Instacart</td>
                  <td className="px-3 py-2.5">
                    <Badge
                      tone={
                        instacartConnectionStatus === "ready"
                          ? "green"
                          : instacartConnectionStatus === "unknown"
                            ? "neutral"
                            : "amber"
                      }
                    >
                      {instacartConnectionStatus === "ready"
                        ? "Connected"
                        : instacartConnectionStatus === "unknown"
                          ? "Needs setup"
                          : "Not connected"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">
                    Create an Instacart shopping list link from your FamilySite shopping list.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 font-medium">Home Assistant</td>
                  <td className="px-3 py-2.5">
                    <Badge tone="neutral">Future</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[#575757]">URL placeholder only; no live bridge.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="AI Assistant" eyebrow="OpenAI · serverless" />
          <div className="space-y-4 text-sm leading-6 text-slate-600">
            <p className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
              <span>
                AI features use a secure server function. Your ChatGPT password is never stored
                here.
              </span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DataHealthTile
                label="Status"
                value={
                  aiConnectionStatus === "ready"
                    ? "Ready"
                    : aiConnectionStatus === "not_connected"
                      ? "Not connected"
                      : "Unknown — run test"
                }
              />
              <DataHealthTile label="Provider" value="OpenAI" />
              <DataHealthTile label="Model" value={aiModelLabel} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-800">Privacy guardrails</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Send only the minimum text needed for each future feature.</li>
                <li>
                  Do not send sensitive docs, health notes, emergency contacts, or private messages
                  unless you explicitly choose to include them.
                </li>
                <li>Never send full localStorage or an automatic household dump by default.</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={aiTesting}
                type="button"
                variant="primary"
                onClick={() => void runAiConnectionTest()}
              >
                {aiTesting ? "Testing…" : "Test AI connection"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAiFeatures((open) => !open)}
              >
                {showAiFeatures ? "Hide planned AI features" : "View planned AI features"}
              </Button>
            </div>
            {aiLastDetail ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800">
                {aiLastDetail}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              No API key is entered in this browser. Configuration lives on the server (e.g. Netlify
              environment variables). If the function is missing locally, use{" "}
              <span className="font-mono text-[0.7rem]">netlify dev</span> or test on deploy.
            </p>
            {showAiFeatures ? (
              <div className="rounded-lg border border-violet-200 bg-violet-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-900">
                  Planned (not all active yet)
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-violet-950">
                  <li>Summarize today</li>
                  <li>Suggest chores</li>
                  <li>Grocery list helper</li>
                  <li>Pantry meal ideas</li>
                  <li>Cleaning checklist assistant</li>
                  <li>Schedule prep suggestions</li>
                </ul>
              </div>
            ) : null}
          </div>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="Cloud Preview mode" eyebrow="Data source" />
          <div className="space-y-4 text-sm leading-6 text-slate-600">
            <p>
              Device Mode saves in this browser. Cloud Preview temporarily loads your connected cloud
              household so you can test reads and writes. Your device data stays preserved.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DataHealthTile
                label="Active mode"
                value={dataSourceMode === "cloud-preview" ? "Cloud preview" : "Saved on this device"}
              />
              <DataHealthTile label="Local data preserved" value="Yes" />
              <DataHealthTile
                label="Cloud sync status"
                value={dataSourceMode === "cloud-preview" ? "Preview" : "Off"}
              />
            </div>

            {cloudPreviewError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-900">
                {cloudPreviewError}
              </div>
            ) : null}

            {dataSourceMode === "cloud-preview" ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={returnToDeviceMode}>
                  Return to Device Mode
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    Cloud Preview uses your connected cloud household. Your device data stays saved
                    locally.
                  </span>
                  <input
                    checked={cloudPreviewConfirm}
                    className="h-5 w-5 shrink-0 accent-blue-500"
                    onChange={(event) => setCloudPreviewConfirm(event.target.checked)}
                    type="checkbox"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    disabled={!cloudPreviewReady}
                    type="button"
                    variant="primary"
                    onClick={enterCloudPreview}
                  >
                    Switch to Cloud Preview
                  </Button>
                  {!user ? (
                    <Button type="button" variant="secondary" onClick={onOpenLogin}>
                      Sign in
                    </Button>
                  ) : null}
                  {!settings.cloudHouseholdId?.trim() ? (
                    <span className="text-xs text-slate-500">
                      Connect a household below first.
                    </span>
                  ) : null}
                  {!supabaseAuthConfigured ? (
                    <span className="text-xs text-slate-500">
                      Supabase env vars are not configured for this install.
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="Workspace status" eyebrow="Devices & accounts" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Data storage
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DataHealthTile
              label="This device"
              value={localStorageActive ? "Reads and writes OK" : storageStatus}
            />
            <DataHealthTile
              label="Cloud household"
              value={data.adminSettings.cloudHouseholdId ? "Connected" : "Not connected"}
            />
            <DataHealthTile
              label="Cloud sign-in"
              value={
                !supabaseAuthConfigured
                  ? "Not configured"
                  : user
                    ? `Signed in (${user.email ?? "account"})`
                    : "Signed out"
              }
            />
            <DataHealthTile
              label="Primary copy of your data"
              value={dataSourceMode === "cloud-preview" ? "Cloud (preview)" : "On this device"}
            />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Snapshot
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DataHealthTile label="Workspace label" value={settings.appModeLabel} />
            <DataHealthTile
              label="Data format version"
              value={`${data.dataVersion} (supported ${CURRENT_DATA_VERSION})`}
            />
            <DataHealthTile label="Latest activity" value={latestActivityDate} />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Cloud Preview is reversible. Cloud Primary (always-cloud) is not enabled yet.
          </p>
        </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Instacart" eyebrow="Integrations" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div className="space-y-4 text-sm leading-6 text-[#575757]">
            <p>
              Create an Instacart shopping list link from your FamilySite shopping list. Optional
              store and ZIP preferences are included only when you send a list — they stay in this
              browser until then.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DataHealthTile
                label="Status"
                value={
                  instacartConnectionStatus === "ready"
                    ? "Connected"
                    : instacartConnectionStatus === "unknown"
                      ? "Needs setup"
                      : "Not connected"
                }
              />
              <DataHealthTile label="API key" value="Server only (not in this app)" />
              <DataHealthTile label="Shopping action" value="Send to Instacart" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={instacartTesting}
                type="button"
                variant="primary"
                onClick={() => void runInstacartConnectionTest()}
              >
                {instacartTesting ? "Testing…" : "Test connection"}
              </Button>
            </div>
            {instacartLastDetail ? (
              <p className="rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] p-3 text-sm text-[#1f1f1f]">
                {instacartLastDetail}
              </p>
            ) : null}
            <p className="text-xs leading-relaxed text-slate-500">
              Instacart credentials are stored on the server, not in this app. Run{" "}
              <span className="font-mono text-[0.7rem]">netlify dev</span> locally or test on deploy.
              Do not paste API keys into the browser.
            </p>
            <label className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-3 py-2">
              <span className="text-sm font-medium text-[#1f1f1f]">
                Enable Instacart export tools (saved locally)
              </span>
              <input
                checked={settings.instacart.enableInstacartExport}
                className="h-5 w-5 shrink-0 accent-[#F26522]"
                onChange={(event) =>
                  updateInstacartSettings({
                    enableInstacartExport: event.target.checked,
                  })
                }
                type="checkbox"
              />
            </label>
            <SettingsField label="Preferred store name">
              <Input
                placeholder="Optional, like Costco or Kroger"
                value={settings.instacart.preferredStoreName ?? ""}
                onChange={(event) =>
                  updateInstacartSettings({
                    preferredStoreName: event.target.value,
                  })
                }
              />
            </SettingsField>
            <SettingsField label="Preferred ZIP code">
              <Input
                placeholder="Optional"
                value={settings.instacart.preferredZipCode ?? ""}
                onChange={(event) =>
                  updateInstacartSettings({
                    preferredZipCode: event.target.value,
                  })
                }
              />
            </SettingsField>
            <SettingsField label="Notes">
              <Textarea
                placeholder="Optional notes for your household. Kept in this browser only."
                value={settings.instacart.notes ?? ""}
                onChange={(event) =>
                  updateInstacartSettings({ notes: event.target.value })
                }
              />
            </SettingsField>
          </div>
          <div className="rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] p-4 text-sm leading-6 text-[#575757]">
            Plain-text copy and Instacart links use only product-style fields from your shopping
            lines (name, quantity, unit, brand, barcode). Household roster, PINs, locations, and
            activity history are not sent when you create a list link.
          </div>
        </div>
      </Card>

      <VoiceShortcutsSection />

      <FeatureRoadmapPanel />

      <Card tone="light">
        <CardHeader tone="light" title="Home Assistant Bridge" eyebrow="Placeholder" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
          <div className="space-y-3">
            <SettingsField label="Home Assistant URL (saved for later)">
              <Input
                placeholder="http://homeassistant.local:8123"
                value={settings.homeAssistantBridge?.url ?? ""}
                onChange={(event) =>
                  updateSettings({
                    homeAssistantBridge: {
                      ...settings.homeAssistantBridge,
                      url: event.target.value,
                      memberEntityMap: settings.homeAssistantBridge?.memberEntityMap ?? {},
                    },
                  })
                }
              />
            </SettingsField>
            <SettingsField label="Access token (not stored in this version)">
              <Input disabled placeholder="Not stored or used in this version" value="" />
            </SettingsField>
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              Entity mapping placeholder: member → <span className="font-mono">entity_id</span>.
              Connection should be handled by a secure backend or local bridge later.
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">Not connected</p>
            <p className="mt-2">
              This app does not call Home Assistant from the browser and does not store long-lived
              access tokens in this version.
            </p>
          </div>
        </div>
      </Card>

        <CloudHouseholdUploadPanel
          data={data}
          setData={setData}
          onExportBackup={exportData}
        />

        <CloudMigrationPreviewPanel
          data={data}
          setData={setData}
          onExportBackup={exportData}
        />
      </>
      ) : null}

      {settingsTab === "appearance" ? (
      <>
      <AppearanceLayoutEditor />

      <Card tone="light">
        <CardHeader tone="light" title="Theme &amp; readability" eyebrow="Appearance" />
        <p className="mb-3 text-sm text-[#575757]">
          The app uses a premium dark workspace look by default. Large text helps on tablets and wall
          mounts.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
          <span className="text-sm font-medium text-[#1f1f1f]">Large text mode (entire app)</span>
          <input
            checked={settings.largeTextMode ?? false}
            className="h-5 w-5 shrink-0 accent-[#F26522]"
            onChange={(event) =>
              updateSettings({ largeTextMode: event.target.checked })
            }
            type="checkbox"
          />
        </label>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Who&apos;s home widgets" eyebrow="Presence" />
        <div className="space-y-3">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
            <span className="text-sm font-medium text-[#1f1f1f]">Enable presence panel</span>
            <input
              checked={settings.enablePresencePanel ?? true}
              className="h-5 w-5 shrink-0 accent-[#F26522]"
              onChange={(event) =>
                updateSettings({ enablePresencePanel: event.target.checked })
              }
              type="checkbox"
            />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
            <span className="text-sm font-medium text-[#1f1f1f]">Show presence on Home</span>
            <input
              checked={settings.showPresenceOnDashboard ?? true}
              className="h-5 w-5 shrink-0 accent-[#F26522]"
              onChange={(event) =>
                updateSettings({ showPresenceOnDashboard: event.target.checked })
              }
              type="checkbox"
            />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
            <span className="text-sm font-medium text-[#1f1f1f]">Show presence on Kiosk</span>
            <input
              checked={settings.showPresenceOnKiosk ?? true}
              className="h-5 w-5 shrink-0 accent-[#F26522]"
              onChange={(event) =>
                updateSettings({ showPresenceOnKiosk: event.target.checked })
              }
              type="checkbox"
            />
          </label>
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Navigation labels" eyebrow="Words in the shell" />
        <p className="mb-3 text-sm text-[#575757]">
          Rename tabs and headlines without touching your data. Dashboard section sizes stay on the Home
          page (unlock layout there to adjust density).
        </p>
        <CustomizationCenter
          allowedTabs={["labels"]}
          compact
          data={data}
          labelsScope="navAppearance"
          setData={setData}
        />
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Member color themes list" eyebrow="Accents" />
        <p className="mb-3 text-sm text-[#575757]">
          Optional comma-friendly hints for member color picks. Individual accents are set per person
          under Members &amp; PINs.
        </p>
        <SettingsField label="Color theme options (reference)">
          <Textarea
            value={settings.colorThemeOptions}
            onChange={(event) =>
              updateSettings({ colorThemeOptions: event.target.value })
            }
          />
        </SettingsField>
      </Card>
      </>
      ) : null}

      {settingsTab === "household" ? (
      <>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card tone="light">
          <CardHeader tone="light" title="Household profile" eyebrow="Basics" />
          <div className="space-y-3">
            <SettingsField label="Household name">
              <Input
                value={settings.householdName}
                onChange={(event) =>
                  updateSettings({ householdName: event.target.value })
                }
              />
            </SettingsField>
            <SettingsField label="App display name (top bar)">
              <Input
                value={settings.appModeLabel}
                onChange={(event) =>
                  updateSettings({ appModeLabel: event.target.value })
                }
              />
            </SettingsField>
            <SettingsField label="Welcome message">
              <Input
                value={settings.dashboardWelcomeMessage}
                onChange={(event) =>
                  updateSettings({
                    dashboardWelcomeMessage: event.target.value,
                  })
                }
              />
            </SettingsField>
            <p className="text-xs text-slate-500">
              Members, PINs, and per-person details are managed under{" "}
              <span className="font-medium text-[#1f1f1f]">Members &amp; PINs</span>.
            </p>
          </div>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="Wall &amp; kiosk display" eyebrow="Home / tablet" />
          <p className="mb-3 text-sm text-[#575757]">
            Large-touch layout for counters or wall mounts. Enables the Kiosk tab and{" "}
            <span className="font-mono text-xs text-[#637381]">/kiosk</span>.
          </p>
          <div className="space-y-3">
            <SettingsField label="Kitchen wall display">
              <Select
                value={settings.kitchenWallDisplayDevice ?? "ipad"}
                onChange={(event) =>
                  updateSettings({
                    kitchenWallDisplayDevice: event.target.value as KitchenWallDisplayDevice,
                  })
                }
              >
                {kitchenWallDisplayDeviceOptions.map((device) => (
                  <option key={device} value={device}>
                    {kitchenWallDisplayLabel(device)}
                  </option>
                ))}
              </Select>
            </SettingsField>
            <p className="text-xs leading-relaxed text-slate-500">
              {kitchenWallDisplayHint(settings.kitchenWallDisplayDevice ?? "ipad")}
            </p>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
              <span className="text-sm font-medium text-[#1f1f1f]">
                Enable kiosk mode (navigation + /kiosk)
              </span>
              <input
                checked={settings.enableKioskMode ?? false}
                className="h-5 w-5 shrink-0 accent-[#F26522]"
                onChange={(event) =>
                  updateSettings({ enableKioskMode: event.target.checked })
                }
                type="checkbox"
              />
            </label>
            <SettingsField label="Default panel when opening Kiosk">
              <Select
                value={settings.kioskDefaultView ?? "dashboard"}
                onChange={(event) =>
                  updateSettings({
                    kioskDefaultView: event.target.value as KioskDefaultView,
                  })
                }
              >
                {kioskDefaultViewOptions.map((view) => (
                  <option key={view} value={view}>
                    {kioskDefaultViewLabel(view)}
                  </option>
                ))}
              </Select>
            </SettingsField>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
              <span className="text-sm font-medium text-[#1f1f1f]">Show live clock on Kiosk</span>
              <input
                checked={settings.showClock !== false}
                className="h-5 w-5 shrink-0 accent-[#F26522]"
                onChange={(event) =>
                  updateSettings({ showClock: event.target.checked })
                }
                type="checkbox"
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
              <span className="text-sm font-medium text-[#1f1f1f]">Show quick action tiles</span>
              <input
                checked={settings.showQuickActions !== false}
                className="h-5 w-5 shrink-0 accent-[#F26522]"
                onChange={(event) =>
                  updateSettings({ showQuickActions: event.target.checked })
                }
                type="checkbox"
              />
            </label>
          </div>
        </Card>
      </section>

      <Card tone="light">
        <CardHeader tone="light" title="Getting started checklist" eyebrow="Dashboard" />
        <p className="mb-3 text-sm text-[#575757]">
          The home dashboard can show a friendly checklist for new households. Turn it back on anytime
          if you hid it earlier.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-4 py-3">
          <span className="text-sm font-medium text-[#1f1f1f]">
            Hide getting-started checklist on the dashboard
          </span>
          <input
            checked={settings.setupChecklistDismissed ?? false}
            className="h-5 w-5 shrink-0 accent-[#F26522]"
            onChange={(event) =>
              updateSettings({ setupChecklistDismissed: event.target.checked })
            }
            type="checkbox"
          />
        </label>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Pets & flea medication" eyebrow="Household care" />
        <p className="mb-4 text-sm text-[#575757]">
          Track flea doses for household cats, who applied treatment, and in-app reminders on the 29-day
          cycle. Data stays on this device with your household backup.
        </p>
        <Button type="button" variant="primary" onClick={() => navigateWithinApp?.("/pets")}>
          Open Pets
        </Button>
      </Card>
      </>
      ) : null}

      {settingsTab === "members_pins" ? (
        <div id="settings-household-roster">
          <Card tone="light">
            <CardHeader tone="light" title="Household members" eyebrow="Members &amp; PINs" />
            <p className="mb-4 text-sm leading-6 text-[#575757]">
              Add people, edit names, set or clear a 4-digit kiosk PIN, and mark active or away. This
              list powers greetings, kitchen assignments, ownership, and in-app alerts.
            </p>
            <HouseholdRosterPanel data={data} setData={setData} />
          </Card>
        </div>
      ) : null}

      {settingsTab === "kitchen_schedule" ? (
        <Card tone="light">
          <CardHeader tone="light" title="Kitchen schedule &amp; closing checklist" eyebrow="Week" />
          <p className="mb-4 text-sm text-[#575757]">
            Monday–Sunday dinner lead, daily checklist labels, and today&apos;s completion live here too.
            Kitchen duty reminders follow the in-app notification toggles under Notifications.
          </p>
          <KitchenHubSection data={data} setData={setData} today={todayKitchen} />
          <div className="mt-6 flex flex-wrap gap-2 border-t border-[#ededed] pt-4">
            <Button type="button" variant="secondary" onClick={() => navigateWithinApp?.("/")}>
              Open Home
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigateWithinApp?.("/kitchen")}
            >
              Open cleaning module
            </Button>
          </div>
        </Card>
      ) : null}

      {settingsTab === "notifications" ? (
      <>
        <Card tone="light">
          <CardHeader tone="light" title="How notifications work" eyebrow="Household" />
          <p className="text-sm leading-6 text-[#575757]">
            Alerts appear in the app for everyone on this household. Categories below control what we
            generate on this device. Optional browser notifications are available after you grant
            permission — there is no SMS and no cloud push account required.
          </p>
        </Card>
        <DeviceNotificationsCard />
        <Card tone="light">
          <CardHeader tone="light" title="Quiet hours" eyebrow="Coming soon" />
          <p className="text-sm leading-6 text-[#575757]">
            You will be able to mute browser alerts overnight or during focus time. This does not change
            in-app alerts yet.
          </p>
        </Card>
        <Card tone="light">
          <CardHeader tone="light" title="Household defaults" eyebrow="Everyone" />
          <p className="mb-3 text-sm text-[#575757]">
            Baseline reminders for chores, calendar, shopping, pantry, pets, and kitchen duty.
          </p>
          <div className="space-y-2">
            {notificationFieldList.map(({ key, label }) => (
              <label
                key={key}
                className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-3 py-2"
              >
                <span className="text-sm font-medium text-[#1f1f1f]">{label}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#F26522]"
                  checked={notificationEffective(undefined, settings.siteNotificationDefaults, key)}
                  onChange={(event) =>
                    updateSiteNotificationDefaults({ [key]: event.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        </Card>
        <Card tone="light">
          <CardHeader tone="light" title="Per-person overrides" eyebrow="Recipients" />
          <p className="mb-3 text-sm text-[#575757]">
            Pick a member to adjust their reminder preferences on this device. Unchecked values fall back
            to household defaults.
          </p>
          <SettingsField label="Editing notifications for">
            <Select
              value={settingsPreferencesMemberId}
              onChange={(event) => {
                const memberId = event.target.value;
                setSettingsPreferencesMemberId(memberId);
                if (memberId) {
                  updateSettings({ activePreferencesMemberId: memberId });
                }
              }}
            >
              <option value="">Household defaults</option>
              {data.familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {getMemberFullName(m)}
                </option>
              ))}
            </Select>
          </SettingsField>
          {(() => {
            const memberId = settingsPreferencesMemberId;
            const memberPrefs = memberId
              ? settings.userPreferencesByMemberId?.[memberId]?.notificationPreferences
              : undefined;
            return (
              <div className="mt-4 space-y-2">
                {notificationFieldList.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-3 py-2"
                  >
                    <span className="text-sm font-medium text-[#1f1f1f]">{label}</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[#F26522]"
                      checked={notificationEffective(
                        memberPrefs,
                        settings.siteNotificationDefaults,
                        key,
                      )}
                      onChange={(event) =>
                        updateMemberNotificationPrefs({ [key]: event.target.checked })
                      }
                    />
                  </label>
                ))}
              </div>
            );
          })()}
        </Card>
      </>
      ) : null}

      {settingsTab === "subscription" ? (
        <SubscriptionSettingsSection familyMembers={data.familyMembers} />
      ) : null}

      {settingsTab === "shopping_pantry" ? (
      <>
      <Card tone="light">
        <CardHeader tone="light" title="Storage locations" eyebrow="Pantry &amp; Inventory" />
        <p className="mb-4 text-sm text-slate-600">
          Optional catalog of shelf zones with a reference photo URL. Paste a link only — files are
          not uploaded from this browser yet.
        </p>
        <div className="space-y-4">
          {data.storageLocations.map((loc) => (
            <div
              key={loc.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SettingsField label="Zone name">
                  <Input
                    value={loc.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const now = new Date().toISOString();
                      setData((d) => ({
                        ...d,
                        storageLocations: d.storageLocations.map((row) =>
                          row.id === loc.id ? { ...row, name, updatedAt: now } : row,
                        ),
                      }));
                    }}
                  />
                </SettingsField>
                <SettingsField label="Storage area">
                  <Select
                    value={loc.storageArea}
                    onChange={(e) => {
                      const storageArea = e.target.value as PantryLocation;
                      const now = new Date().toISOString();
                      setData((d) => ({
                        ...d,
                        storageLocations: d.storageLocations.map((row) =>
                          row.id === loc.id
                            ? {
                                ...row,
                                storageArea,
                                pantryWall: storageArea === "Pantry" ? row.pantryWall : undefined,
                                pantryShelf: storageArea === "Pantry" ? row.pantryShelf : undefined,
                                updatedAt: now,
                              }
                            : row,
                        ),
                      }));
                    }}
                  >
                    {pantryLocations.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </SettingsField>
                {loc.storageArea === "Pantry" ? (
                  <>
                    <SettingsField label="Pantry wall">
                      <Select
                        value={loc.pantryWall ?? "Wall 1"}
                        onChange={(e) => {
                          const pantryWall = e.target.value as PantryWall;
                          const now = new Date().toISOString();
                          setData((d) => ({
                            ...d,
                            storageLocations: d.storageLocations.map((row) =>
                              row.id === loc.id ? { ...row, pantryWall, updatedAt: now } : row,
                            ),
                          }));
                        }}
                      >
                        {pantryWalls.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </Select>
                    </SettingsField>
                    <SettingsField label="Pantry shelf">
                      <Select
                        value={loc.pantryShelf ?? "Shelf 1"}
                        onChange={(e) => {
                          const pantryShelf = e.target.value as PantryShelf;
                          const now = new Date().toISOString();
                          setData((d) => ({
                            ...d,
                            storageLocations: d.storageLocations.map((row) =>
                              row.id === loc.id ? { ...row, pantryShelf, updatedAt: now } : row,
                            ),
                          }));
                        }}
                      >
                        {pantryShelves.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </SettingsField>
                  </>
                ) : null}
                <SettingsField label="Location detail">
                  <Input
                    value={loc.locationDetail ?? ""}
                    onChange={(e) => {
                      const locationDetail = e.target.value || undefined;
                      const now = new Date().toISOString();
                      setData((d) => ({
                        ...d,
                        storageLocations: d.storageLocations.map((row) =>
                          row.id === loc.id ? { ...row, locationDetail, updatedAt: now } : row,
                        ),
                      }));
                    }}
                  />
                </SettingsField>
                <SettingsField label="Photo URL">
                  <Input
                    value={loc.photoUrl ?? ""}
                    onChange={(e) => {
                      const photoUrl = e.target.value || undefined;
                      const now = new Date().toISOString();
                      setData((d) => ({
                        ...d,
                        storageLocations: d.storageLocations.map((row) =>
                          row.id === loc.id ? { ...row, photoUrl, updatedAt: now } : row,
                        ),
                      }));
                    }}
                  />
                </SettingsField>
                <SettingsField label="Photo caption">
                  <Input
                    value={loc.photoCaption ?? ""}
                    onChange={(e) => {
                      const photoCaption = e.target.value || undefined;
                      const now = new Date().toISOString();
                      setData((d) => ({
                        ...d,
                        storageLocations: d.storageLocations.map((row) =>
                          row.id === loc.id ? { ...row, photoCaption, updatedAt: now } : row,
                        ),
                      }));
                    }}
                  />
                </SettingsField>
              </div>
              {loc.photoUrl?.trim() ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <img
                    alt={loc.photoCaption || loc.name}
                    className="max-h-40 w-full object-cover"
                    src={loc.photoUrl}
                  />
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                  No photo URL
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!window.confirm(`Remove “${loc.name}” from storage locations?`)) {
                      return;
                    }
                    setData((d) => ({
                      ...d,
                      storageLocations: d.storageLocations.filter((row) => row.id !== loc.id),
                    }));
                  }}
                >
                  Remove zone
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              const now = new Date().toISOString();
              const row: HouseholdStorageLocation = {
                id: crypto.randomUUID(),
                name: "New zone",
                storageArea: "Pantry",
                pantryWall: "Wall 1",
                pantryShelf: "Shelf 1",
                createdAt: now,
                updatedAt: now,
              };
              setData((d) => ({ ...d, storageLocations: [...d.storageLocations, row] }));
            }}
          >
            Add storage zone
          </Button>
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Lists &amp; pickers" eyebrow="Shopping · Inventory · Storage plan" />
        <p className="mb-3 text-sm text-[#575757]">
          Tune categories, store sections, storage areas, units, and related dropdowns for Add Stock,
          Inventory, Shopping Needs, and your Storage Plan.
        </p>
        <CustomizationCenter
          allowedTabs={["grocery"]}
          compact
          data={data}
          setData={setData}
        />
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Barcode &amp; scanner" eyebrow="Device" />
        <p className="text-sm leading-6 text-[#575757]">
          The camera scanner lives on Pantry and Shopping. Lookup sends only the barcode to
          OpenFoodFacts — not your household notes. Grant camera permission when the browser asks.
        </p>
      </Card>
      </>
      ) : null}

      {settingsTab === "backup_data" ? (
      <>
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[8px] border border-[#FF6F28]/25 bg-[#fff8f4] px-4 py-3 text-sm leading-relaxed text-[#1f1f1f] shadow-[0_2px_8px_rgba(36,37,38,0.06)]"
        >
          {message}
        </div>
      ) : null}

      <div id="settings-backup-data" className="scroll-mt-24 space-y-5">
        <section
          className="rounded-[8px] border border-[#FF6F28]/22 bg-gradient-to-br from-[#fff8f4] to-[#fffdfb] px-4 py-4 shadow-[0_2px_10px_rgba(242,101,34,0.08)] sm:px-5 sm:py-5"
          aria-labelledby="backup-intro-heading"
        >
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[#FF6F28]/25 bg-white text-[#F26522] shadow-[0_1px_2px_rgba(36,37,38,0.06)]">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="backup-intro-heading"
                className="text-[16px] font-semibold leading-snug text-[#1f1f1f] sm:text-[17px]"
              >
                Backup &amp; Data
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#575757]">
                Your household data is saved in this browser on this device.
              </p>
              <p className="mt-3 rounded-[8px] border border-[#FF6F28]/28 bg-white/90 px-3 py-2.5 text-[13px] font-semibold leading-snug text-[#1f1f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                Launch reminder: Export a backup before going live or switching devices.
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#575757]">
                Also export before clearing browser data or reinstalling the app.
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#637381]">
                <HardDrive className="h-4 w-4 shrink-0 text-[#F26522]" aria-hidden />
                <span>
                  Browser storage:{" "}
                  <span className="font-semibold text-[#1f1f1f]">{storageStatus}</span>
                  {dataSourceMode === "cloud-preview" ? (
                    <span className="text-[#8e8e8e]"> · Cloud preview session</span>
                  ) : null}
                </span>
              </p>
            </div>
          </div>
        </section>

        <Card tone="light">
          <CardHeader
            tone="light"
            title="Data check"
            eyebrow="At a glance"
            action={
              <Badge tone={hasPrimaryFamilyPayload() ? "green" : "amber"}>
                {hasPrimaryFamilyPayload() ? "Household found" : "Empty"}
              </Badge>
            }
          />
          <p className="mb-3 text-[14px] leading-relaxed text-[#575757]">
            {hasPrimaryFamilyPayload()
              ? "Household data found on this device."
              : "No household data found on this device."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DataHealthTile label="Family members" value={dataCheckCounts.members} />
            <DataHealthTile label="Calendar events" value={dataCheckCounts.calendarEvents} />
            <DataHealthTile label="Shopping items" value={dataCheckCounts.shopping} />
            <DataHealthTile label="Pantry items" value={dataCheckCounts.pantry} />
            <DataHealthTile label="Cleaning tasks" value={dataCheckCounts.tasks} />
            <DataHealthTile label="Pets" value={dataCheckCounts.pets} />
            <DataHealthTile label="Notifications" value={dataCheckCounts.notifications} />
          </div>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="Export Backup" eyebrow="Save a copy" />
          <p className="mb-4 text-[14px] leading-relaxed text-[#575757]">
            Downloads a household file you can keep somewhere safe (another device, cloud folder, or USB).
          </p>
          <div className="mb-4 rounded-[8px] border border-[#ededed] bg-[#fafafa] px-3 py-2.5 text-[13px] text-[#637381]">
            <span className="font-medium text-[#1f1f1f]">Last backup from this browser:</span>{" "}
            {lastBackupFriendly ?? "No export recorded yet in this browser."}
          </div>
          <Button type="button" onClick={exportData} variant="primary" className="min-h-11 px-5 font-semibold">
            <Download className="h-4 w-4" aria-hidden />
            Export Backup
          </Button>
        </Card>

        <Card tone="light">
          <CardHeader tone="light" title="Import Backup" eyebrow="Restore from a file" />
          <div className="mb-4 rounded-[8px] border border-[#FF6F28]/18 bg-[#fffaf7] px-3 py-3 text-[13px] leading-relaxed text-[#575757]">
            Import replaces everything on <span className="font-medium text-[#1f1f1f]">this device</span>{" "}
            with the backup after you confirm. If something looks wrong, we won&apos;t apply a broken file —
            you&apos;ll see a short message instead.
          </div>
          <input
            ref={backupFileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Choose backup file"
            onChange={handleBackupFileChange}
          />
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 font-semibold"
              onClick={() => backupFileInputRef.current?.click()}
            >
              Choose backup file
            </Button>
          </div>
          <SettingsField label="Or paste backup text">
            <Textarea
              placeholder="Paste the full contents of a backup file exported from this app."
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              className="min-h-[140px] font-sans text-[14px] leading-relaxed"
            />
          </SettingsField>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!importText.trim() || backupToolsStatus !== "Available"}
              onClick={importData}
              variant="primary"
              className="min-h-11 min-w-[10rem] font-semibold"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Import Backup
            </Button>
          </div>
        </Card>

        <details className="group rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_2px_8px_rgba(36,37,38,0.05)] sm:p-5">
          <summary className="cursor-pointer text-[14px] font-semibold text-[#1f1f1f] outline-none marker:text-[#F26522] focus-visible:rounded-[6px] focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35">
            Troubleshooting — roster repair
          </summary>
          <p className="mt-3 text-[13px] leading-relaxed text-[#575757]">
            If names look out of date after a long time on one device, this aligns roster entries with your
            household list and clears outdated icon metadata. Your assignments stay intact.
          </p>
          <div className="mt-4">
            <Button type="button" onClick={repairFamilyMemberRoster} variant="secondary" className="min-h-10">
              Run roster repair
            </Button>
          </div>
        </details>

        <details className="group rounded-[8px] border border-rose-200/90 bg-rose-50/60 p-4 sm:p-5">
          <summary className="cursor-pointer text-[14px] font-semibold text-[#7f1d1d] outline-none focus-visible:rounded-[6px] focus-visible:ring-2 focus-visible:ring-rose-400/50">
            Advanced — reset household data on this device
          </summary>
          <p className="mt-3 text-[13px] leading-relaxed text-[#575757]">
            Removes household data on this device and restores the starting template. Use only if you mean
            to start fresh. You&apos;ll be asked to confirm twice, including typing RESET.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              className="min-h-11 border-rose-200 bg-white font-semibold text-rose-900 hover:bg-rose-50"
              onClick={resetData}
              variant="secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset household data
            </Button>
          </div>
        </details>
      </div>
      </>
      ) : null}

      {settingsTab === "help_install" ? (
      <>
      <Card tone="light">
        <CardHeader tone="light" title="Help &amp; Install" eyebrow="Launch checklist &amp; PWA" />
        <div className="space-y-6 text-[14px] leading-relaxed text-[#575757]">
          <section
            aria-labelledby="launch-checklist-heading"
            className="rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_2px_rgba(36,37,38,0.05)]"
          >
            <div className="flex gap-3">
              <ListChecks className="mt-0.5 h-7 w-7 shrink-0 text-[#F26522]" aria-hidden />
              <div className="min-w-0 flex-1">
                <h3 id="launch-checklist-heading" className="text-[15px] font-semibold text-[#1f1f1f]">
                  Launch checklist
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#637381]">
                  Before going live or publishing an update, work through these steps on your machine and on the
                  deployed site.
                </p>
                <ul className="mt-4 list-none space-y-2.5 p-0" role="list">
                  {LAUNCH_CHECKLIST_ITEMS.map((label) => (
                    <li key={label} className="flex gap-3 text-[14px] leading-snug text-[#575757]">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F26522]"
                        aria-hidden
                      />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 border-[#ededed] font-semibold text-[#1f1f1f]"
                    onClick={() => selectSettingsTab("backup_data")}
                  >
                    Open Backup &amp; Data
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#ededed] bg-[#fafafa] p-4">
            <div className="flex gap-3">
              <Tablet className="mt-0.5 h-8 w-8 shrink-0 text-[#F26522]" aria-hidden />
              <div>
                <h3 className="text-[15px] font-semibold text-[#1f1f1f]">Install on Surface Pro</h3>
                <p className="mt-2">
                  FamilySite works well as an installed app on a{" "}
                  <span className="font-medium text-[#1f1f1f]">Surface Pro</span> in the kitchen — fullscreen,
                  touch-friendly, and easy to wake back to Home.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex gap-3">
              <MonitorSmartphone className="mt-0.5 h-6 w-6 shrink-0 text-[#F26522]" aria-hidden />
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e8e]">
                  Open in Edge or Chrome
                </h3>
                <p className="mt-2">
                  Use <strong className="font-semibold text-[#1f1f1f]">Microsoft Edge</strong> or{" "}
                  <strong className="font-semibold text-[#1f1f1f]">Google Chrome</strong> on Windows for the most
                  reliable install and camera support when you scan barcodes.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[8px] border border-[#FF6F28]/18 bg-[#fffaf7] px-4 py-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e8e]">
              Install as an app
            </h3>
            <p className="mt-2 text-[#575757]">
              Use the browser menu (<strong className="text-[#1f1f1f]">⋯</strong> in Edge or{" "}
              <strong className="text-[#1f1f1f]">⋮</strong> in Chrome) → look for{" "}
              <strong className="text-[#1f1f1f]">Install app</strong>,{" "}
              <strong className="text-[#1f1f1f]">Install FamilySite</strong>, or{" "}
              <strong className="text-[#1f1f1f]">Add to Dock</strong> — wording varies by browser version.
            </p>
          </section>

          <section className="rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_2px_rgba(36,37,38,0.05)]">
            <div className="flex gap-3">
              <Download className="mt-0.5 h-6 w-6 shrink-0 text-[#F26522]" aria-hidden />
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8e8e8e]">
                  Export backup before switching devices
                </h3>
                <p className="mt-2">
                  Your household file stays in{" "}
                  <strong className="text-[#1f1f1f]">this browser on this device</strong>. Before you switch
                  tablets, reinstall Windows, or clear browser data, export a backup and keep the file somewhere
                  safe.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 min-h-11 border-[#ededed] font-semibold text-[#1f1f1f]"
                  onClick={() => selectSettingsTab("backup_data")}
                >
                  Open Backup &amp; Data
                </Button>
              </div>
            </div>
          </section>
        </div>
      </Card>
      </>
      ) : null}

      {settingsTab === "advanced" ? (
      <>
      <Card tone="light">
        <CardHeader tone="light" title="Build &amp; migrations" eyebrow="Technical" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DataHealthTile label="App package version" value={packageJson.version} />
          <DataHealthTile label="Data format version" value={`${data.dataVersion} (supported ${CURRENT_DATA_VERSION})`} />
          {import.meta.env.DEV ? (
            <DataHealthTile label="Vite mode" value={import.meta.env.MODE} />
          ) : null}
        </div>
        <p className="mt-4 text-sm text-[#575757]">
          Migrations run when the app loads saved data or an imported backup. If something looks wrong after
          an upgrade, export a backup before experimenting.
        </p>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Household counts" eyebrow="Advanced" />
        <p className="text-sm leading-relaxed text-[#575757]">
          Friendly counts and export tools live under{" "}
          <button
            type="button"
            className="font-semibold text-[#F26522] underline decoration-[#FF6F28]/40 underline-offset-2 hover:decoration-[#F26522]"
            onClick={() => selectSettingsTab("backup_data")}
          >
            Backup &amp; Data
          </button>
          .
        </p>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="localStorage" eyebrow="Developer" />
        <p className="text-sm text-[#575757]">
          Read/write probe: <span className="font-medium text-[#1f1f1f]">{storageStatus}</span>. Storage
          key (unchanged):{" "}
          <span className="break-all font-mono text-xs text-[#637381]">{FAMILY_DATA_STORAGE_KEY}</span>
          {storagePayloadKb != null ? (
            <>
              {" "}
              · about <span className="tabular-nums">{storagePayloadKb}</span> KB (raw JSON)
            </>
          ) : null}
          .
        </p>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Navigation &amp; legacy modules" eyebrow="Hidden items" />
        {!settings.moduleVisibility.dashboard ? (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            Home is hidden from navigation, but it will always remain accessible as the safe home route.
          </div>
        ) : null}
        <p className="mb-3 text-sm text-[#575757]">
          Turn modules off to simplify the sidebar. Some older areas stay hidden from the main nav by
          design; your data is still in the household file.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {moduleKeys
            .filter((key) => key !== "family" && key !== "projects" && key !== "docs")
            .map((key) => (
              <label
                className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)] px-3 py-2"
                key={key}
              >
                <span className="text-sm font-medium text-[#1f1f1f]">{moduleLabels[key]}</span>
                <input
                  checked={settings.moduleVisibility[key]}
                  className="h-5 w-5 accent-[#F26522]"
                  onChange={(event) => updateModuleVisibility(key, event.target.checked)}
                  type="checkbox"
                />
              </label>
            ))}
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Household records" eyebrow="Counts" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DataHealthTile label="Exported this session" value={hasExportedThisSession ? "Yes" : "No"} />
          <DataHealthTile label="Orphaned assignments" value={orphanedAssignmentCount} />
          <DataHealthTile label="Tasks / cleaning" value={`${taskCount} / ${choreCount}`} />
          <DataHealthTile label="Inventory items" value={data.pantry.length} />
          <DataHealthTile label="Shopping items" value={data.shopping.length} />
          <DataHealthTile label="Calendar events" value={data.planner.length} />
          <DataHealthTile label="Calendar links" value={data.calendarLinks.length} />
          <DataHealthTile
            label="Legacy (stored, not in nav)"
            value={`${data.docs.length} notes · ${data.projects.length} projects`}
          />
          <DataHealthTile label="Overdue cleaning" value={overdueChoreCount} />
          <DataHealthTile label="Activity log rows" value={data.activityLog.length} />
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light"
          title="Chore Import Staging"
          eyebrow="Review before import"
          action={
            choreImportPreview.length > 0 ? (
              <Badge tone={validChoreRows.length > 0 ? "green" : "amber"}>
                {validChoreRows.length} valid / {choreImportPreview.length} rows
              </Badge>
            ) : null
          }
        />
        <div className="space-y-4">
          <SettingsField label="Paste CSV">
            <Textarea
              placeholder="Paste chore CSV text here. Expected headers can include title, frequency, room, zone, assigned, status, priority, notes."
              value={choreCsvText}
              onChange={(event) => setChoreCsvText(event.target.value)}
            />
          </SettingsField>

          {choreImportPreview.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {choreImportPreview.map((row) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
                    key={row.rowNumber}
                  >
                    <p className="font-semibold text-slate-900">
                      {row.seed.title || "Missing title"}
                    </p>
                    <p className="mt-2 text-slate-600">
                      {row.seed.frequency} ·{" "}
                      {[row.seed.room, row.seed.zone].filter(Boolean).join(" / ") || "No room"}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {row.assignedMemberName || row.assignedName || "Unassigned"} · Priority{" "}
                      {row.seed.priority}
                    </p>
                    <p className="mt-1 text-slate-500">Next due: {row.seed.nextDueDate || "None"}</p>
                    <p className="mt-2 text-xs font-medium">
                      {row.warnings.length > 0 ? (
                        <span className="text-amber-800">{row.warnings.join("; ")}</span>
                      ) : (
                        <span className="text-emerald-800">Ready</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <WorkspaceTableWrap className="hidden bg-slate-50/80 md:block">
              <table className={cn(workspaceTableClassName, "min-w-[760px]")}>
                <thead>
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Frequency</th>
                    <th className="px-3 py-2">Room / zone</th>
                    <th className="px-3 py-2">Assigned match</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Next due</th>
                    <th className="px-3 py-2">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {choreImportPreview.map((row) => (
                    <tr
                      className="border-t border-slate-200 bg-slate-50"
                      key={row.rowNumber}
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.seed.title || "Missing title"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.frequency}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {[row.seed.room, row.seed.zone].filter(Boolean).join(" / ") ||
                          "None"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.assignedMemberName || row.assignedName || "Unassigned"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.priority}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.nextDueDate || "None"}
                      </td>
                      <td className="px-3 py-2">
                        {row.warnings.length > 0 ? (
                          <span className="text-amber-800">
                            {row.warnings.join("; ")}
                          </span>
                        ) : (
                          <span className="text-emerald-800">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WorkspaceTableWrap>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Paste CSV text to preview draft chores before importing.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={validChoreRows.length === 0}
              onClick={importStagedChores}
              variant="primary"
            >
              Import valid chores
            </Button>
            <Button onClick={() => setChoreCsvText("")} variant="secondary">
              Clear staging
            </Button>
          </div>
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light"
          title="Grocery Import Staging"
          eyebrow="Library preview"
          action={
            groceryImportPreview.length > 0 ? (
              <Badge tone={validGroceryRows.length > 0 ? "green" : "amber"}>
                {validGroceryRows.length} valid / {groceryImportPreview.length} rows
              </Badge>
            ) : null
          }
        />
        <div className="space-y-4">
          <SettingsField label="Paste CSV">
            <Textarea
              placeholder="Paste grocery CSV text here. Expected headers can include name, category, store section, store, amount, location, wall, shelf, notes."
              value={groceryCsvText}
              onChange={(event) => setGroceryCsvText(event.target.value)}
            />
          </SettingsField>

          {groceryImportPreview.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {groceryImportPreview.map((row) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
                    key={row.rowNumber}
                  >
                    <p className="font-semibold text-slate-900">{row.seed.name || "Missing name"}</p>
                    <p className="mt-2 text-slate-600">
                      {row.seed.category || "Missing"} · {row.seed.storeSection || "Missing"}
                    </p>
                    <p className="mt-1 text-slate-500">{row.seed.preferredStore || "Any store"}</p>
                    <p className="mt-1 text-slate-500">Default qty: {row.seed.amountDefault || "None"}</p>
                    <p className="mt-1 text-slate-500">
                      {[
                        row.seed.defaultLocation,
                        row.seed.defaultWall,
                        row.seed.defaultShelf,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "No destination"}
                    </p>
                    <p className="mt-2 text-xs font-medium">
                      {row.warnings.length > 0 ? (
                        <span className="text-amber-800">{row.warnings.join("; ")}</span>
                      ) : (
                        <span className="text-emerald-800">Ready</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <WorkspaceTableWrap className="hidden bg-slate-50/80 md:block">
              <table className={cn(workspaceTableClassName, "min-w-[900px]")}>
                <thead>
                  <tr>
                    <th className="px-3 py-2">Item name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Store section</th>
                    <th className="px-3 py-2">Preferred store</th>
                    <th className="px-3 py-2">Amount default</th>
                    <th className="px-3 py-2">Destination</th>
                    <th className="px-3 py-2">Status / warning</th>
                  </tr>
                </thead>
                <tbody>
                  {groceryImportPreview.map((row) => (
                    <tr
                      className="border-t border-slate-200 bg-slate-50"
                      key={row.rowNumber}
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.seed.name || "Missing name"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.category || "Missing"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.storeSection || "Missing"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.preferredStore || "None"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.amountDefault || "None"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {[
                          row.seed.defaultLocation,
                          row.seed.defaultWall,
                          row.seed.defaultShelf,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </td>
                      <td className="px-3 py-2">
                        {row.warnings.length > 0 ? (
                          <span className="text-amber-800">
                            {row.warnings.join("; ")}
                          </span>
                        ) : (
                          <span className="text-emerald-800">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WorkspaceTableWrap>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Paste CSV text to preview grocery library items before importing.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={validGroceryRows.length === 0}
              onClick={importStagedGroceries}
              variant="primary"
            >
              Import valid grocery items
            </Button>
            <Button onClick={() => setGroceryCsvText("")} variant="secondary">
              Clear staging
            </Button>
          </div>
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light"
          title="Household Inventory Import Staging"
          eyebrow="Review before import"
          action={
            inventoryImportPreview.length > 0 ? (
              <Badge tone={validInventoryRows.length > 0 ? "green" : "amber"}>
                {validInventoryRows.length} valid / {inventoryImportPreview.length} rows
              </Badge>
            ) : null
          }
        />
        <div className="space-y-4">
          <SettingsField label="Paste CSV">
            <Textarea
              placeholder="Paste inventory CSV text here. Expected headers can include name, quantity, unit, category, storage area, wall, shelf, expiry date, staple, minimum, tags, notes."
              value={inventoryCsvText}
              onChange={(event) => setInventoryCsvText(event.target.value)}
            />
          </SettingsField>

          {inventoryImportPreview.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {inventoryImportPreview.map((row) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm"
                    key={row.rowNumber}
                  >
                    <p className="font-semibold text-slate-900">{row.seed.name || "Missing name"}</p>
                    <p className="mt-2 text-slate-600">
                      {row.seed.quantity}
                      {row.seed.unit ? ` ${row.seed.unit}` : ""} · {row.seed.category}
                    </p>
                    <p className="mt-1 text-slate-500">Storage: {row.seed.storageArea}</p>
                    <p className="mt-1 text-slate-500">
                      {[row.seed.pantryWall, row.seed.pantryShelf].filter(Boolean).join(" / ") ||
                        "No wall/shelf"}
                    </p>
                    <p className="mt-1 text-slate-500">
                      Expiry {row.seed.expiryDate || "None"} · Staple{" "}
                      {row.seed.isStaple ? "yes" : "no"} · Min {row.seed.minQuantity || "None"}
                    </p>
                    <p className="mt-2 text-xs font-medium">
                      {row.warnings.length > 0 ? (
                        <span className="text-amber-800">{row.warnings.join("; ")}</span>
                      ) : (
                        <span className="text-emerald-800">Ready</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <WorkspaceTableWrap className="hidden bg-slate-50/80 md:block">
              <table className={cn(workspaceTableClassName, "min-w-[980px]")}>
                <thead>
                  <tr>
                    <th className="px-3 py-2">Item name</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Storage area</th>
                    <th className="px-3 py-2">Wall / shelf</th>
                    <th className="px-3 py-2">Expiry</th>
                    <th className="px-3 py-2">Staple</th>
                    <th className="px-3 py-2">Min qty</th>
                    <th className="px-3 py-2">Status / warning</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryImportPreview.map((row) => (
                    <tr
                      className="border-t border-slate-200 bg-slate-50"
                      key={row.rowNumber}
                    >
                      <td className="px-3 py-2 text-slate-800">
                        {row.seed.name || "Missing name"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.quantity}
                        {row.seed.unit ? ` ${row.seed.unit}` : ""}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.category}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.storageArea}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {[row.seed.pantryWall, row.seed.pantryShelf]
                          .filter(Boolean)
                          .join(" / ") || "None"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.expiryDate || "None"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.isStaple ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 text-[#575757]">
                        {row.seed.minQuantity || "None"}
                      </td>
                      <td className="px-3 py-2">
                        {row.warnings.length > 0 ? (
                          <span className="text-amber-800">
                            {row.warnings.join("; ")}
                          </span>
                        ) : (
                          <span className="text-emerald-800">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </WorkspaceTableWrap>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Paste CSV text to preview household inventory items before importing.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={validInventoryRows.length === 0}
              onClick={importStagedInventory}
              variant="primary"
            >
              Import valid inventory items
            </Button>
            <Button onClick={() => setInventoryCsvText("")} variant="secondary">
              Clear staging
            </Button>
          </div>
        </div>
      </Card>
      </>
      ) : null}
    </WorkspacePageShell>
    </div>
  );
}

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
        {label}
      </span>
      {children}
    </label>
  );
}

type ChorePreviewRow = {
  rowNumber: number;
  seed: ChoreSeed & {
    frequency: TaskFrequency;
    status: TaskStatus;
  };
  assignedName: string;
  assignedMemberName: string;
  warnings: string[];
  isValid: boolean;
};

type GroceryPreviewRow = {
  rowNumber: number;
  seed: GroceryItemSeed;
  warnings: string[];
  isValid: boolean;
};

type InventoryPreviewRow = {
  rowNumber: number;
  seed: PantryItem;
  warnings: string[];
  isValid: boolean;
};

function parseChoreCsv(csvText: string, data: FamilyData): ChorePreviewRow[] {
  const rows = parseCsvRows(csvText.trim());

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const existingTitles = new Set(
    data.tasks
      .filter((task) => task.type === "chore")
      .map((task) => normalizeTitle(task.title)),
  );
  const seenTitles = new Set<string>();

  return rows.slice(1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) {
      return [];
    }

    const title = getCsvValue(row, headers, ["title", "name", "chore", "task"]);
    const normalizedTitle = normalizeTitle(title);
    const rawFrequency = getCsvValue(row, headers, ["frequency", "cadence"]);
    const frequency = normalizeChoreFrequency(rawFrequency);
    const assignedName = getCsvValue(row, headers, [
      "assigned",
      "assignee",
      "assignedto",
      "member",
      "person",
      "owner",
    ]);
    const assignedMember = data.familyMembers.find(
      (member) =>
        member.status === "active" &&
        normalizeTitle(member.name) === normalizeTitle(assignedName),
    );
    const status = normalizeChoreStatus(
      getCsvValue(row, headers, ["status", "state"]),
    );
    const nextDueDate = getCsvValue(row, headers, [
      "nextduedate",
      "nextdue",
      "duedate",
      "due",
    ]);
    const lastCompletedDate = getCsvValue(row, headers, [
      "lastcompleteddate",
      "lastcompleted",
    ]);
    const warnings: string[] = [];

    if (!title.trim()) {
      warnings.push("Missing title");
    }

    if (normalizedTitle && existingTitles.has(normalizedTitle)) {
      warnings.push("Duplicate existing chore title");
    }

    if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      warnings.push("Duplicate staged chore title");
    }

    if (!rawFrequency.trim()) {
      warnings.push("Frequency needs review; defaults to one-time");
    } else if (!frequency) {
      warnings.push("Unknown frequency");
    }

    if (assignedName && !assignedMember) {
      warnings.push("Assigned name does not match an active member");
    }

    if (nextDueDate && !isValidDateInput(nextDueDate)) {
      warnings.push("Invalid next due date");
    }

    if (lastCompletedDate && !isValidDateInput(lastCompletedDate)) {
      warnings.push("Invalid last completed date");
    }

    if (normalizedTitle) {
      seenTitles.add(normalizedTitle);
    }

    return [
      {
        rowNumber: index + 2,
        seed: {
          id: getCsvValue(row, headers, ["id"]),
          title,
          type: "chore",
          frequency: frequency ?? "one-time",
          zone: getCsvValue(row, headers, ["zone", "area"]),
          room: getCsvValue(row, headers, ["room"]),
          category: getCsvValue(row, headers, ["category", "group"]),
          assignedMemberId: assignedMember?.id ?? "",
          status,
          priority: normalizeChorePriority(
            getCsvValue(row, headers, ["priority"]),
          ),
          nextDueDate,
          lastCompletedDate,
          notes: getCsvValue(row, headers, ["notes", "note", "details"]),
          source: "import",
          sourceSystem: "notion-chores",
        },
        assignedName,
        assignedMemberName: assignedMember ? assignedMember.name : "",
        warnings,
        isValid:
          Boolean(title.trim()) &&
          warnings.every(
            (warning) => warning === "Frequency needs review; defaults to one-time",
          ),
      },
    ];
  });
}

function parseGroceryCsv(
  csvText: string,
  data: FamilyData,
): GroceryPreviewRow[] {
  const rows = parseCsvRows(csvText.trim());

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const existingNames = new Set(
    data.groceryItems.map((item) => normalizeTitle(item.name)),
  );
  const seenNames = new Set<string>();

  return rows.slice(1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) {
      return [];
    }

    const name = getCsvValue(row, headers, [
      "name",
      "item",
      "groceryitem",
      "grocery",
    ]);
    const normalizedName = normalizeTitle(name);
    const category = getCsvValue(row, headers, ["category", "group"]);
    const rawStoreSection = getCsvValue(row, headers, [
      "storesection",
      "section",
      "aisle",
    ]);
    const storeSection = normalizeStoreSection(rawStoreSection);
    const rawLocation = getCsvValue(row, headers, [
      "defaultlocation",
      "location",
      "destination",
    ]);
    const defaultLocation = normalizePantryLocation(rawLocation);
    const defaultWall = normalizePantryWall(
      getCsvValue(row, headers, ["defaultwall", "wall"]),
    );
    const defaultShelf = normalizePantryShelf(
      getCsvValue(row, headers, ["defaultshelf", "shelf"]),
    );
    const warnings: string[] = [];

    if (!name.trim()) {
      warnings.push("Missing item name");
    }

    if (normalizedName && existingNames.has(normalizedName)) {
      warnings.push("Duplicate existing grocery item");
    }

    if (normalizedName && seenNames.has(normalizedName)) {
      warnings.push("Duplicate staged grocery item");
    }

    if (!category.trim()) {
      warnings.push("Missing category");
    }

    if (!rawStoreSection.trim()) {
      warnings.push("Missing store section");
    } else if (!storeSection) {
      warnings.push("Unknown store section");
    }

    if (normalizedName) {
      seenNames.add(normalizedName);
    }

    return [
      {
        rowNumber: index + 2,
        seed: {
          id: getCsvValue(row, headers, ["id"]),
          name,
          category,
          storeSection: storeSection ?? "aisles",
          preferredStore: getCsvValue(row, headers, [
            "preferredstore",
            "store",
          ]),
          amountDefault: getCsvValue(row, headers, [
            "amountdefault",
            "amount",
            "quantity",
          ]),
          defaultLocation: defaultLocation ?? "Pantry",
          defaultWall,
          defaultShelf,
          notes: getCsvValue(row, headers, ["notes", "note", "details"]),
          source: "import",
          sourceSystem: "grocery-staging",
        },
        warnings,
        isValid:
          Boolean(name.trim()) &&
          Boolean(category.trim()) &&
          Boolean(storeSection) &&
          !existingNames.has(normalizedName) &&
          !warnings.some((warning) => warning.includes("Duplicate staged")),
      },
    ];
  });
}

function parseInventoryCsv(
  csvText: string,
  data: FamilyData,
): InventoryPreviewRow[] {
  const rows = parseCsvRows(csvText.trim());

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const existingNames = new Set(
    data.pantry.map((item) => normalizeTitle(item.name)),
  );
  const seenNames = new Set<string>();

  return rows.slice(1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) {
      return [];
    }

    const name = getCsvValue(row, headers, [
      "name",
      "item",
      "fooditem",
      "inventoryitem",
    ]);
    const normalizedName = normalizeTitle(name);
    const quantity = getCsvValue(row, headers, [
      "quantity",
      "amount",
      "count",
    ]);
    const rawStorageArea = getCsvValue(row, headers, [
      "storagearea",
      "storage",
      "location",
      "area",
    ]);
    const storageArea = normalizeStorageArea(rawStorageArea);
    const rawWall = getCsvValue(row, headers, ["pantrywall", "wall"]);
    const rawShelf = getCsvValue(row, headers, ["pantryshelf", "shelf"]);
    const pantryWall = normalizeInventoryWall(rawWall);
    const pantryShelf = normalizeInventoryShelf(rawShelf);
    const expiryDate = getCsvValue(row, headers, [
      "expirydate",
      "expiration",
      "expires",
    ]);
    const warnings: string[] = [];

    if (!name.trim()) {
      warnings.push("Missing item name");
    }

    if (normalizedName && existingNames.has(normalizedName)) {
      warnings.push("Duplicate existing inventory item");
    }

    if (normalizedName && seenNames.has(normalizedName)) {
      warnings.push("Duplicate staged inventory item");
    }

    if (!rawStorageArea.trim() || !storageArea) {
      warnings.push("Unknown or blank storage area");
    }

    if (quantity.trim() && Number.isNaN(Number.parseFloat(quantity))) {
      warnings.push("Quantity cannot be read");
    }

    if (storageArea === "Pantry" && rawWall.trim() && !pantryWall) {
      warnings.push("Invalid pantry wall");
    }

    if (storageArea === "Pantry" && rawShelf.trim() && !pantryShelf) {
      warnings.push("Invalid pantry shelf");
    }

    if (expiryDate && !isValidDateInput(expiryDate)) {
      warnings.push("Invalid date");
    }

    if (normalizedName) {
      seenNames.add(normalizedName);
    }

    const now = new Date().toISOString();
    const resolvedStorageArea = storageArea ?? "Pantry";
    const isPantry = resolvedStorageArea === "Pantry";

    return [
      {
        rowNumber: index + 2,
        seed: {
          id: getCsvValue(row, headers, ["id"]) || crypto.randomUUID(),
          name,
          quantity: quantity || "1",
          unit: getCsvValue(row, headers, ["unit"]),
          category: getCsvValue(row, headers, ["category"]) || "Grocery",
          storageArea: resolvedStorageArea,
          location: resolvedStorageArea,
          pantryWall: isPantry ? pantryWall ?? "Wall 1" : undefined,
          pantryShelf: isPantry ? pantryShelf ?? "Shelf 1" : undefined,
          wall: isPantry ? pantryWall ?? "Wall 1" : undefined,
          shelf: isPantry ? pantryShelf ?? "Shelf 1" : undefined,
          status: "Stocked",
          expiryDate,
          notes: getCsvValue(row, headers, ["notes", "note", "details"]),
          isStaple: normalizeBoolean(
            getCsvValue(row, headers, ["isstaple", "staple"]),
          ),
          minQuantity: getCsvValue(row, headers, [
            "minquantity",
            "minimum",
            "reorderpoint",
          ]),
          tags: getCsvValue(row, headers, ["tags"])
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          source: "import",
          sourceSystem: "inventory-staging",
          createdAt: now,
          lastUpdated: now,
        },
        warnings,
        isValid:
          Boolean(name.trim()) &&
          warnings.every(
            (warning) =>
              warning !== "Duplicate existing inventory item" &&
              warning !== "Duplicate staged inventory item" &&
              warning !== "Unknown or blank storage area" &&
              warning !== "Invalid pantry wall" &&
              warning !== "Invalid pantry shelf" &&
              warning !== "Invalid date" &&
              warning !== "Quantity cannot be read" &&
              warning !== "Missing item name",
          ),
      },
    ];
  });
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let isQuoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && isQuoted && nextChar === '"') {
      currentCell += '"';
      index += 1;
    } else if (char === '"') {
      isQuoted = !isQuoted;
    } else if (char === "," && !isQuoted) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  currentRow.push(currentCell.trim());
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => cell.trim()));
}

function getCsvValue(row: string[], headers: string[], aliases: string[]) {
  const index = headers.findIndex((header) => aliases.includes(header));
  return index >= 0 ? row[index] ?? "" : "";
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function normalizeChoreFrequency(value: string) {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "daily" ||
    normalized === "weekly" ||
    normalized === "monthly"
  ) {
    return normalized;
  }

  if (normalized === "quarterly" || normalized === "quaternary") {
    return "quarterly";
  }

  return undefined;
}

function normalizeChoreStatus(value: string): TaskStatus {
  return value === "Today" ||
    value === "In Progress" ||
    value === "Done" ||
    value === "Not Started"
    ? value
    : "Not Started";
}

function normalizeChorePriority(value: string) {
  return value === "Low" || value === "Medium" || value === "High"
    ? value
    : "Medium";
}

function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return (
    date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
  );
}

function normalizeStoreSection(value: string): StoreSection | undefined {
  const normalized = normalizeHeader(value);
  return storeSections.find((section) => normalizeHeader(section) === normalized);
}

function normalizePantryLocation(value: string): PantryLocation | undefined {
  const normalized = normalizeHeader(value);
  return pantryLocations.find((location) => normalizeHeader(location) === normalized);
}

function normalizePantryWall(value: string): PantryWall | undefined {
  const normalized = normalizeHeader(value);
  return pantryWalls.find((wall) => normalizeHeader(wall) === normalized);
}

function normalizePantryShelf(value: string): PantryShelf | undefined {
  const normalized = normalizeHeader(value);
  return pantryShelves.find((shelf) => normalizeHeader(shelf) === normalized);
}

function normalizeStorageArea(value: string): PantryLocation | undefined {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return undefined;
  }

  if (normalized.includes("familyroom") && normalized.includes("freezer")) {
    return "Family Room Freezer";
  }

  if (normalized.includes("laundry") && normalized.includes("fridge")) {
    return "Laundry Room Fridge";
  }

  if (normalized.includes("laundry") && normalized.includes("freezer")) {
    return "Laundry Room Freezer";
  }

  if (normalized.includes("kitchen") && normalized.includes("freezer")) {
    return "Kitchen Freezer";
  }

  if (normalized.includes("kitchen") && normalized.includes("fridge")) {
    return "Kitchen Fridge";
  }

  if (normalized.includes("cabinet")) {
    return "Kitchen Cabinets";
  }

  if (normalized.includes("pantry")) {
    return "Pantry";
  }

  if (normalized.includes("freezer")) {
    return "Kitchen Freezer";
  }

  if (normalized.includes("fridge") || normalized.includes("refrigerator")) {
    return "Kitchen Fridge";
  }

  return pantryLocations.find(
    (location) => normalizeHeader(location) === normalized,
  );
}

function normalizeInventoryWall(value: string): PantryWall | undefined {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return undefined;
  }

  const wallNumber = /^wall?([1-4])$|^([1-4])$/.exec(normalized);

  if (wallNumber) {
    return `Wall ${wallNumber[1] ?? wallNumber[2]}` as PantryWall;
  }

  return pantryWalls.find((wall) => normalizeHeader(wall) === normalized);
}

function normalizeInventoryShelf(value: string): PantryShelf | undefined {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return undefined;
  }

  const shelfNumber = /^shelf?([1-5])$|^([1-5])$/.exec(normalized);

  if (shelfNumber) {
    return `Shelf ${shelfNumber[1] ?? shelfNumber[2]}` as PantryShelf;
  }

  return pantryShelves.find((shelf) => normalizeHeader(shelf) === normalized);
}

function normalizeBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" ||
    normalized === "yes" ||
    normalized === "y" ||
    normalized === "1" ||
    normalized === "checked";
}

function kioskDefaultViewLabel(view: KioskDefaultView): string {
  const labels: Record<KioskDefaultView, string> = {
    dashboard: "Overview (clock & welcome)",
    today: "Today's priorities",
    chores: "Chores due today",
    shopping: "Shopping & inventory",
    calendar: "Upcoming plans",
  };
  return labels[view];
}

function kitchenWallDisplayLabel(device: KitchenWallDisplayDevice): string {
  const labels: Record<KitchenWallDisplayDevice, string> = {
    surface_pro: "Surface Pro",
    ipad: "iPad",
    iphone: "iPhone",
    android_phone: "Android phone",
  };
  return labels[device];
}

function kitchenWallDisplayHint(device: KitchenWallDisplayDevice): string {
  const hints: Record<KitchenWallDisplayDevice, string> = {
    surface_pro:
      "Landscape wall mount or easel works well. Edge or Chrome fullscreen keeps chrome minimal.",
    ipad:
      "Common kitchen size — consider Guided Access or a dedicated browser profile for a calmer kiosk.",
    iphone:
      "Small screen — enable Large text under Appearance and favor the Kiosk page for big tap targets.",
    android_phone:
      "Use fullscreen browser where available; Large text under Appearance helps at arm’s length.",
  };
  return hints[device];
}

function getLatestActivityDate(
  activityLog: FamilyData["activityLog"] | undefined,
) {
  const latest = [...(activityLog ?? [])]
    .map((activity) => new Date(activity.createdAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];

  return latest ? new Date(latest).toISOString().slice(0, 10) : "None";
}

function DataHealthTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-[#ededed] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#1f1f1f]">{value}</p>
    </div>
  );
}

function getLocalStorageStatus() {
  if (typeof window === "undefined") {
    return "Unavailable";
  }

  try {
    const testKey = "familysite-491:storage-test";
    window.localStorage.setItem(testKey, "ok");
    window.localStorage.removeItem(testKey);
    return "OK";
  } catch {
    return "Error";
  }
}

function getBackupToolsStatus() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "Unavailable";
  }

  return typeof Blob !== "undefined" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function"
    ? "Available"
    : "Unavailable";
}

function getImportCandidate(
  value: unknown,
):
  | { ok: true; data: unknown; wasWrapped: boolean }
  | { ok: false; error: string } {
  if (!isRecord(value)) {
    return {
      ok: false,
      error:
        "That paste doesn’t look like a JSON object. Copy the entire Export Backup file (including the outer { … } braces).",
    };
  }

  const wasWrapped = isRecord(value.data);
  const candidate = wasWrapped ? value.data : value;

  if (!isRecord(candidate) || !looksLikeFamilyData(candidate)) {
    return {
      ok: false,
      error:
        "That JSON doesn’t look like a FamilySite backup. It should include admin settings and a member list. Export a fresh backup from this app and paste the whole file.",
    };
  }

  return {
    ok: true,
    data: candidate,
    wasWrapped,
  };
}

function looksLikeFamilyData(value: Record<string, unknown>) {
  if (!isRecord(value.adminSettings)) {
    return false;
  }

  const hasRoster =
    Array.isArray(value.familyMembers) || Array.isArray(value.members);

  return hasRoster;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
