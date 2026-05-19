/**
 * Layout catalog content for the Layout Choices explorer (UI + docs).
 * Keep in sync with docs/layout-choices.md when adding or renaming entries.
 */

export type LayoutChoiceCategory =
  | "app-pages"
  | "builder-layouts"
  | "preview-layouts"
  | "applied-layouts"
  | "documentation-help"
  | "export-generated-layouts";

export type LayoutChoice = {
  id: string;
  name: string;
  category: LayoutChoiceCategory;
  /** Primary source file */
  path: string;
  purpose: string;
  whenToUse: string;
  mainSections: string[];
  features: string[];
  howToView: string;
  /** True if reachable in the running app without importing the file manually */
  visibleInApp: boolean;
  relatedFiles: string[];
  nextAction: string;
};

export const TEMPLATE_WORKBENCH_BACKEND_VIEW_ID = "template-workbench";

const BACKEND_VIEW_BY_CHOICE_ID: Partial<Record<string, string>> = {
  "layout-choices-page": "layout-choices",
  "ui-builder-page": "ui-builder",
  "ui-builder-component-preview-cards": "ui-builder",
  "ui-builder-layout-lib": "ui-builder",
  "ui-layout-renderer": "saved-preview",
  "canvas-preview-grid": "saved-preview",
  "help-center-page": "help-center",
  "help-center-content": "help-center",
};

const MY_BUILD_ROUTE_BY_CHOICE_ID: Partial<Record<string, string>> = {
  "my-build-currentbuild": "/",
  "app-shell": "/",
  "dashboard-page": "/",
  "family-members": "/family",
  "tasks-page": "/tasks",
  "kitchen-checklist": "/kitchen",
  "kitchen-schedule": "/kitchen-schedule",
  "pets-page": "/pets",
  "hidden-module-placeholder": "/projects",
  "pantry-page": "/pantry",
  "shopping-page": "/shopping",
  "calendar-page": "/calendar",
  "messages-page": "/messages",
  "notifications-page": "/notifications",
  "subscriptions-page": "/subscriptions",
  "settings-page": "/settings",
  "quick-add-page": "/quick-add",
  "kiosk-page": "/kiosk",
  "login-page": "/cloud-login",
  "module-gate": "/settings",
  "page-section-shell": "/",
  "dashboard-layout-controls": "/",
  "appearance-layout-editor": "/settings",
};

export type LayoutChoiceAction =
  | { kind: "backend-view"; viewId: string; buttonLabel: string }
  | { kind: "template-workbench"; buttonLabel: string }
  | { kind: "my-build-route"; route: string; buttonLabel: string }
  | { kind: "detail"; buttonLabel: string };

export function getLayoutChoiceLabels(choice: LayoutChoice): string[] {
  const labels: string[] = ["Catalog item"];
  if (choice.visibleInApp) {
    labels.push("In-app reachable");
  }
  if (isLayoutChoiceBackendConsoleSurface(choice)) {
    labels.push("Opens in Backend Console");
  }
  if (layoutChoiceHasWorkbenchPreview(choice)) {
    labels.push("Visual preview available in Template Workbench");
  }
  return labels;
}

function isLayoutChoiceBackendConsoleSurface(choice: LayoutChoice): boolean {
  if (
    choice.category === "builder-layouts" ||
    choice.category === "preview-layouts" ||
    choice.category === "export-generated-layouts"
  ) {
    return true;
  }
  if (choice.id === "layout-choices-page" || choice.id === "help-center-page" || choice.id === "help-center-content") {
    return true;
  }
  const howToView = choice.howToView.toLowerCase();
  return (
    howToView.includes("top tab → ui builder") ||
    howToView.includes("top tab → saved ui preview") ||
    howToView.includes("top tab → help center") ||
    howToView.includes("top tab → layout choices") ||
    howToView.includes("backend console")
  );
}

export function layoutChoiceHasWorkbenchPreview(choice: LayoutChoice): boolean {
  if (choice.category === "preview-layouts" || choice.category === "export-generated-layouts") {
    return false;
  }
  if (choice.id === "pantry-page") {
    return true;
  }
  const hay = [choice.name, choice.purpose, choice.howToView, choice.nextAction, ...choice.relatedFiles]
    .join(" ")
    .toLowerCase();
  return hay.includes("template workbench") || hay.includes("sneat") || hay.includes("template-workbench");
}

export function resolveLayoutChoiceAction(choice: LayoutChoice): LayoutChoiceAction {
  const backendViewId = BACKEND_VIEW_BY_CHOICE_ID[choice.id];
  if (backendViewId) {
    return {
      kind: "backend-view",
      viewId: backendViewId,
      buttonLabel: "Open in Backend Console",
    };
  }

  if (layoutChoiceHasWorkbenchPreview(choice)) {
    return {
      kind: "template-workbench",
      buttonLabel: "Open Template Workbench",
    };
  }

  const route = MY_BUILD_ROUTE_BY_CHOICE_ID[choice.id];
  if (route && choice.visibleInApp) {
    return {
      kind: "my-build-route",
      route,
      buttonLabel: "Prepare My Build route",
    };
  }

  return {
    kind: "detail",
    buttonLabel: "View details",
  };
}

export const LAYOUT_CATEGORY_LABELS: Record<LayoutChoiceCategory, string> = {
  "app-pages": "App Pages",
  "builder-layouts": "Builder Layouts",
  "preview-layouts": "Preview Layouts",
  "applied-layouts": "Applied Layouts",
  "documentation-help": "Documentation / Help",
  "export-generated-layouts": "Export / Generated Layouts",
};

export const LAYOUT_FILTER_OPTIONS: Array<{
  id: "all" | LayoutChoiceCategory;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "app-pages", label: "App Pages" },
  { id: "builder-layouts", label: "Builder Layouts" },
  { id: "preview-layouts", label: "Preview Layouts" },
  { id: "applied-layouts", label: "Applied Layouts" },
  { id: "documentation-help", label: "Documentation / Help" },
  { id: "export-generated-layouts", label: "Export / Generated Layouts" },
];

export const LAYOUT_CHOICES: LayoutChoice[] = [
  {
    id: "integrated-shell",
    name: "491WD integrated tool shell",
    category: "app-pages",
    path: "src/App.tsx",
    purpose: "Top-level wrapper with tab switcher routing between My Build, UI Builder, previews, help, and layout catalog.",
    whenToUse: "Whenever you need the outer chrome that hosts multiple tool surfaces in one SPA.",
    mainSections: ["IntegratedSwitcher", "AppRoutes", "HelpModeProvider"],
    features: ["Sticky tab bar", "View switching without full reload", "Shared providers"],
    howToView: "Open the app root — the switcher is always at the top.",
    visibleInApp: true,
    relatedFiles: ["src/main.tsx", "src/ui-builder.css"],
    nextAction: "Use the top tabs to jump between workspaces.",
  },
  {
    id: "my-build-currentbuild",
    name: "My Build (CurrentBuild)",
    category: "app-pages",
    path: "src/CurrentBuild.tsx",
    purpose:
      "Lazy-loaded household application: URL-driven routes, AppShell wrapper, Suspense fallbacks, and all module pages mounted from one route switch.",
    whenToUse: "Primary household workspace when the My Build tab is active (above AppliedUiSection in App).",
    mainSections: ["AppShell", "parsePath routing", "ModuleGate wrappers", "Lazy page components"],
    features: ["History API navigation", "Module visibility", "Kiosk, login, and full-screen routes"],
    howToView: "Top tab → My Build; use the sidebar and in-app URLs.",
    visibleInApp: true,
    relatedFiles: ["src/App.tsx", "src/components/layout/AppShell.tsx", "src/components/layout/shellRoutes.ts"],
    nextAction: "Navigate modules from the shell to see each routed layout.",
  },
  {
    id: "layout-choices-page",
    name: "Layout Choices",
    category: "documentation-help",
    path: "src/pages/LayoutChoicesPage.tsx",
    purpose:
      "Searchable visual catalog of layouts, shells, builder and preview surfaces, with paths and how to open each.",
    whenToUse: "Orientation and documentation when you need to find where a layout lives in the tree.",
    mainSections: ["Hero", "Search and filters", "Card grid", "Detail panel"],
    features: ["Category filters", "Client-side search", "Data from layoutChoicesContent.ts"],
    howToView: "Backend Console → Build Tools → Layout Choices.",
    visibleInApp: true,
    relatedFiles: ["src/lib/layoutChoicesContent.ts", "docs/layout-choices.md", "src/ui-builder.css"],
    nextAction: "Select a card to read purpose, related files, and next steps.",
  },
  {
    id: "app-shell",
    name: "Original household app shell (AppShell)",
    category: "app-pages",
    path: "src/components/layout/AppShell.tsx",
    purpose: "Primary household experience chrome: sidebar navigation, header, module labels, and outlet for routed pages.",
    whenToUse: "All in-app household routes render inside this shell except kiosk-style full screens that bypass chrome where configured.",
    mainSections: ["Sidebar", "Main content region", "Mobile nav patterns"],
    features: ["Route-aware nav", "Kiosk entry", "Module visibility hooks", "Dashboard header context"],
    howToView: "My Build tab → navigate with sidebar or URLs such as /, /settings, /calendar.",
    visibleInApp: true,
    relatedFiles: ["src/components/layout/shellRoutes.ts", "src/CurrentBuild.tsx"],
    nextAction: "Pick a module from the sidebar to see this shell wrapping each page.",
  },
  {
    id: "module-gate",
    name: "ModuleGate",
    category: "app-pages",
    path: "src/components/layout/ModuleGate.tsx",
    purpose: "Guards module content when a feature is hidden in admin settings, with consistent locked-state layout.",
    whenToUse: "Wrap gated modules (dashboard, pantry, tasks, etc.) behind visibility flags.",
    mainSections: ["Locked overlay", "Children outlet"],
    features: ["Admin module visibility", "Links to dashboard and settings"],
    howToView: "My Build → disable a module in Settings → open that route to see the gate.",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Toggle module visibility under Settings and revisit the route.",
  },
  {
    id: "app-loading",
    name: "AppLoading (Suspense fallback)",
    category: "app-pages",
    path: "src/components/layout/AppLoading.tsx",
    purpose: "Lightweight loading surface while lazy route chunks load inside AppShell.",
    whenToUse: "Shown automatically during Suspense for CurrentBuild lazy pages.",
    mainSections: ["Centered spinner / message"],
    features: ["Route transition feedback"],
    howToView: "Throttle network in devtools and change routes in My Build to catch the fallback.",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Slow network while navigating between heavy pages.",
  },
  {
    id: "dashboard-page",
    name: "DashboardPage (home)",
    category: "app-pages",
    path: "src/pages/DashboardPage.tsx",
    purpose: "Household home dashboard with cards, shortcuts, and personalized header context.",
    whenToUse: "Default landing after login for the household workspace.",
    mainSections: ["Hero / greeting", "Module tiles", "Notifications snapshot"],
    features: ["Deep links to tasks, pantry, shopping, calendar", "Layout controls panel"],
    howToView: "My Build → open Home (/) from the sidebar.",
    visibleInApp: true,
    relatedFiles: ["src/components/dashboard/DashboardLayoutControls.tsx"],
    nextAction: "Use Home as the hub for other modules.",
  },
  {
    id: "family-members",
    name: "FamilyMembersPage",
    category: "app-pages",
    path: "src/pages/FamilyMembersPage.tsx",
    purpose: "Roster list and entry points into per-member dashboards.",
    whenToUse: "Navigate to /family without a member id segment.",
    mainSections: ["Member list", "Actions to member dashboard"],
    features: ["Member selection", "Tasks/calendar shortcuts"],
    howToView: "My Build → Members → /family",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Pick a member to open MemberDashboardPage.",
  },
  {
    id: "member-dashboard",
    name: "MemberDashboardPage",
    category: "app-pages",
    path: "src/pages/MemberDashboardPage.tsx",
    purpose: "Per-member household dashboard with tasks, calendar, and messages entry.",
    whenToUse: "Route /family/:memberId from the roster.",
    mainSections: ["Member summary", "Widgets", "Back to roster"],
    features: ["Scoped actions for one member"],
    howToView: "My Build → /family/<memberId>",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open a member from FamilyMembersPage.",
  },
  {
    id: "tasks-page",
    name: "TasksPage (cleaning)",
    category: "app-pages",
    path: "src/pages/TasksPage.tsx",
    purpose: "Household cleaning / task workflows with navigation hooks.",
    whenToUse: "Primary tasks module from sidebar.",
    mainSections: ["Task lists", "Scheduling affordances"],
    features: ["ModuleGate wrapper", "Child navigation restrictions when applicable"],
    howToView: "My Build → /tasks",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Use the Cleaning nav item.",
  },
  {
    id: "kitchen-checklist",
    name: "KitchenChecklistPage",
    category: "app-pages",
    path: "src/pages/KitchenChecklistPage.tsx",
    purpose: "Kitchen assignment checklist distinct from general cleaning tasks.",
    whenToUse: "Deep link and sidebar entry for kitchen assignments.",
    mainSections: ["Checklist UI", "Navigation to dashboard"],
    features: ["Shares tasks module gate key in routing"],
    howToView: "My Build → /kitchen",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open Kitchen Assignments from the shell.",
  },
  {
    id: "kitchen-schedule",
    name: "KitchenSchedulePage",
    category: "app-pages",
    path: "src/pages/KitchenSchedulePage.tsx",
    purpose: "Scheduled kitchen work surface with calendar-style affordances.",
    whenToUse: "Kitchen schedule route from shell.",
    mainSections: ["Schedule grid or list", "Navigation"],
    features: ["ModuleGate (tasks visibility)"],
    howToView: "My Build → /kitchen-schedule",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Use Kitchen Schedule in the sidebar.",
  },
  {
    id: "pets-page",
    name: "PetsPage",
    category: "app-pages",
    path: "src/pages/PetsPage.tsx",
    purpose: "Pets module for household pet records and care.",
    whenToUse: "Sidebar / More menu route /pets.",
    mainSections: ["Pet list", "Detail panels"],
    features: ["Always available route (no ModuleGate in CurrentBuild)"],
    howToView: "My Build → /pets",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open Pets from the shell navigation.",
  },
  {
    id: "hidden-module-placeholder",
    name: "HiddenModulePage (projects & docs routes)",
    category: "app-pages",
    path: "src/pages/HiddenModulePage.tsx",
    purpose: "Placeholder layout for legacy or disabled shortcuts (e.g. projects, docs) with safe navigation home.",
    whenToUse: "CurrentBuild maps /projects and /docs to this instead of full ProjectsPage/DocsPage.",
    mainSections: ["Title", "Actions to home and settings"],
    features: ["Simple centered message", "Escape hatches"],
    howToView: "My Build → /projects or /docs",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx", "src/pages/ProjectsPage.tsx", "src/pages/DocsPage.tsx"],
    nextAction: "Wire full pages if you want real workspace/notes instead of the placeholder.",
  },
  {
    id: "pantry-page",
    name: "PantryPage",
    category: "app-pages",
    path: "src/pages/PantryPage.tsx",
    purpose: "Pantry and inventory management with search synced from URL.",
    whenToUse: "Household inventory module.",
    mainSections: ["Inventory grid", "Shopping cross-links"],
    features: ["ModuleGate", "Search query from location"],
    howToView: "My Build → /pantry",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open Pantry & Inventory from the sidebar.",
  },
  {
    id: "shopping-page",
    name: "ShoppingPage",
    category: "app-pages",
    path: "src/pages/ShoppingPage.tsx",
    purpose: "Shopping list with pantry cross-navigation.",
    whenToUse: "Primary shopping module.",
    mainSections: ["List", "Purchased filters", "Pantry handoff"],
    features: ["ModuleGate", "URL search segment support"],
    howToView: "My Build → /shopping",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Use Shopping from the sidebar.",
  },
  {
    id: "calendar-page",
    name: "CalendarPage (planner alias)",
    category: "app-pages",
    path: "src/pages/CalendarPage.tsx",
    purpose: "Household calendar; /planner paths resolve to the same active route in CurrentBuild.",
    whenToUse: "Calendar and planner deep links share this page.",
    mainSections: ["Calendar grid", "Events"],
    features: ["ModuleGate", "Planner redirect in parsePath"],
    howToView: "My Build → /calendar or /planner",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Navigate via Calendar in the sidebar or planner URL.",
  },
  {
    id: "messages-page",
    name: "MessagesPage",
    category: "app-pages",
    path: "src/pages/MessagesPage.tsx",
    purpose: "Household messaging surface.",
    whenToUse: "Messages module from shell.",
    mainSections: ["Thread list", "Composer patterns"],
    features: ["Direct route without ModuleGate in CurrentBuild"],
    howToView: "My Build → /messages",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open Messages from the sidebar.",
  },
  {
    id: "notifications-page",
    name: "NotificationsPage",
    category: "app-pages",
    path: "src/pages/NotificationsPage.tsx",
    purpose: "Notification center with deduped household alerts.",
    whenToUse: "Bell / notifications route.",
    mainSections: ["Feed", "Dismiss actions"],
    features: ["ModuleGate using dashboard visibility key"],
    howToView: "My Build → /notifications",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx", "src/lib/householdNotify.ts"],
    nextAction: "Open Notifications from the shell.",
  },
  {
    id: "subscriptions-page",
    name: "SubscriptionsPage",
    category: "app-pages",
    path: "src/pages/SubscriptionsPage.tsx",
    purpose: "Track subscriptions and related household billing hints.",
    whenToUse: "Subscriptions route from shell.",
    mainSections: ["List", "Detail drawers"],
    features: ["No ModuleGate in CurrentBuild"],
    howToView: "My Build → /subscriptions",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Open Subscriptions from the sidebar.",
  },
  {
    id: "settings-page",
    name: "SettingsPage",
    category: "app-pages",
    path: "src/pages/SettingsPage.tsx",
    purpose: "Admin and household settings including modules, appearance, and data source.",
    whenToUse: "Any settings management flow.",
    mainSections: ["Tabs / sections", "AppearanceLayoutEditor"],
    features: ["Deep links via navigateWithinApp", "Module toggles"],
    howToView: "My Build → /settings",
    visibleInApp: true,
    relatedFiles: ["src/components/settings/AppearanceLayoutEditor.tsx"],
    nextAction: "Use Settings from the sidebar.",
  },
  {
    id: "quick-add-page",
    name: "QuickAddPage",
    category: "app-pages",
    path: "src/pages/QuickAddPage.tsx",
    purpose: "Fast capture flows for shopping, tasks, or pantry from a dedicated route.",
    whenToUse: "Deep link /quick-add with optional query parameters.",
    mainSections: ["Forms", "Return to dashboard"],
    features: ["locationSearch integration"],
    howToView: "My Build → /quick-add",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Bookmark or link to /quick-add from dashboards.",
  },
  {
    id: "kiosk-page",
    name: "KioskPage",
    category: "app-pages",
    path: "src/pages/KioskPage.tsx",
    purpose: "Large-touch kiosk home with greeting and module launchers.",
    whenToUse: "When kiosk mode is enabled in admin settings.",
    mainSections: ["Greeting", "Launcher grid"],
    features: ["navigateToRoute integration", "openAppHref"],
    howToView: "My Build → enable kiosk in settings → /kiosk",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx", "src/lib/kioskGreeting.ts"],
    nextAction: "Enable kiosk mode then open /kiosk.",
  },
  {
    id: "login-page",
    name: "LoginPage (cloud login)",
    category: "app-pages",
    path: "src/pages/LoginPage.tsx",
    purpose: "Account or cloud login surface separate from legacy PIN routes.",
    whenToUse: "Shell action opens /cloud-login.",
    mainSections: ["Form", "Back to app"],
    features: ["onBack to household shell"],
    howToView: "My Build → trigger login from AppShell or visit /cloud-login",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Use the login affordance in the shell header area.",
  },
  {
    id: "not-found-page",
    name: "NotFoundPage",
    category: "app-pages",
    path: "src/pages/NotFoundPage.tsx",
    purpose: "404-style recovery with paths back to dashboard and settings.",
    whenToUse: "Unknown first path segment in parsePath.",
    mainSections: ["Message", "Recovery buttons"],
    features: ["ShellRoute not-found"],
    howToView: "My Build → visit a bogus path like /this-route-does-not-exist",
    visibleInApp: true,
    relatedFiles: ["src/CurrentBuild.tsx"],
    nextAction: "Hit an unknown URL under My Build.",
  },
  {
    id: "projects-page-unused",
    name: "ProjectsPage (file only)",
    category: "app-pages",
    path: "src/pages/ProjectsPage.tsx",
    purpose: "Full workspace/projects layout as originally authored — not currently mounted from CurrentBuild.",
    whenToUse: "Reference or future wiring if /projects should show real content again.",
    mainSections: ["Project columns", "Task boards"],
    features: ["Rich workspace UI"],
    howToView: "Not routed — import into CurrentBuild or replace HiddenModulePage mapping.",
    visibleInApp: false,
    relatedFiles: ["src/pages/HiddenModulePage.tsx", "src/CurrentBuild.tsx"],
    nextAction: "Swap HiddenModulePage for ProjectsPage on route projects if desired.",
  },
  {
    id: "docs-page-unused",
    name: "DocsPage (file only)",
    category: "app-pages",
    path: "src/pages/DocsPage.tsx",
    purpose: "Notes/docs module page — not currently mounted; /docs uses HiddenModulePage.",
    whenToUse: "Future notes module or reference implementation.",
    mainSections: ["Docs list", "Editor patterns"],
    features: ["PageProps data wiring"],
    howToView: "Not routed — wire in CurrentBuild for /docs.",
    visibleInApp: false,
    relatedFiles: ["src/pages/HiddenModulePage.tsx"],
    nextAction: "Replace HiddenModulePage with DocsPage on /docs when ready.",
  },
  {
    id: "planner-page-unused",
    name: "PlannerPage (file only)",
    category: "app-pages",
    path: "src/pages/PlannerPage.tsx",
    purpose: "Standalone planner page — routing sends /planner to CalendarPage instead.",
    whenToUse: "Alternate planner UX if you split from calendar.",
    mainSections: ["Planner-specific layout"],
    features: ["Calendar data hooks"],
    howToView: "Not routed — /planner opens CalendarPage today.",
    visibleInApp: false,
    relatedFiles: ["src/pages/CalendarPage.tsx", "src/CurrentBuild.tsx"],
    nextAction: "Change parsePath / route switch if planner should differ from calendar.",
  },
  {
    id: "page-section-shell-removed",
    name: "PageSectionShell (removed)",
    category: "app-pages",
    path: "src/components/layout/PageSectionShell.tsx",
    purpose: "Former collapsible section wrapper; removed with legacy DashboardPriorityLoop.",
    whenToUse: "N/A — use DashboardLayoutControls + hub cards on DashboardPage instead.",
    mainSections: [],
    features: [],
    howToView: "Not in app — see DashboardPage hub cards (Pantry, Shopping, Week, Activity).",
    visibleInApp: false,
    relatedFiles: ["src/pages/DashboardPage.tsx", "src/components/dashboard/DashboardLayoutControls.tsx"],
    nextAction: "Use hub cards or Settings appearance editor for layout changes.",
  },
  {
    id: "dashboard-layout-controls",
    name: "DashboardLayoutControls",
    category: "app-pages",
    path: "src/components/dashboard/DashboardLayoutControls.tsx",
    purpose: "Dashboard-specific layout density and card ordering controls.",
    whenToUse: "Home dashboard personalization.",
    mainSections: ["Control strip", "Layout presets"],
    features: ["Persists via household data patterns"],
    howToView: "My Build → Home → layout controls on DashboardPage.",
    visibleInApp: true,
    relatedFiles: ["src/pages/DashboardPage.tsx"],
    nextAction: "Adjust layout from the dashboard toolbar.",
  },
  {
    id: "appearance-layout-editor",
    name: "AppearanceLayoutEditor",
    category: "app-pages",
    path: "src/components/settings/AppearanceLayoutEditor.tsx",
    purpose: "Settings tab for theme, density, and visual layout preferences.",
    whenToUse: "Household appearance customization.",
    mainSections: ["Theme tokens", "Preview", "Toggles"],
    features: ["Integrates with UiCustomizationContext / app theme"],
    howToView: "My Build → Settings → appearance section hosting this editor.",
    visibleInApp: true,
    relatedFiles: ["src/pages/SettingsPage.tsx", "src/context/UiCustomizationContext.tsx"],
    nextAction: "Open Settings and find the appearance layout area.",
  },
  {
    id: "page-header-ui",
    name: "PageHeader (ui)",
    category: "app-pages",
    path: "src/components/ui/PageHeader.tsx",
    purpose: "Generic titled page header primitive for consistent page starts.",
    whenToUse: "New pages that need title + actions row.",
    mainSections: ["Title", "Description slot", "Actions"],
    features: ["Composable header"],
    howToView: "No current imports in src — add to a page to preview.",
    visibleInApp: false,
    relatedFiles: ["src/lib/smarthrUi.ts"],
    nextAction: "Import into a new or existing page.",
  },
  {
    id: "smarthr-page-shell-removed",
    name: "SmarthrPageShell (removed)",
    category: "app-pages",
    path: "src/components/smarthr/SmarthrPageShell.tsx",
    purpose: "Former admin page shell; component tree removed. Class tokens live in smarthrUi.ts.",
    whenToUse: "Use PageHeader + existing dashboard shells instead.",
    mainSections: [],
    features: [],
    howToView: "Not in app — styling helpers remain in src/lib/smarthrUi.ts.",
    visibleInApp: false,
    relatedFiles: ["src/lib/smarthrUi.ts"],
    nextAction: "Apply smarthrUi class helpers on new pages if needed.",
  },
  {
    id: "smarthr-page-header-removed",
    name: "SmarthrPageHeader (removed)",
    category: "app-pages",
    path: "src/components/smarthr/SmarthrPageHeader.tsx",
    purpose: "Former Smarthr header component; removed with smarthr/ tree.",
    whenToUse: "Use src/components/ui/PageHeader.tsx instead.",
    mainSections: [],
    features: [],
    howToView: "Not in app.",
    visibleInApp: false,
    relatedFiles: ["src/components/ui/PageHeader.tsx", "src/lib/smarthrUi.ts"],
    nextAction: "Compose PageHeader on new views.",
  },
  {
    id: "notion-page-workspace",
    name: "NotionPage workspace primitives",
    category: "app-pages",
    path: "src/components/workspace/NotionPage.tsx",
    purpose: "Notion-like document layout: cover, title, subtitle, actions, body.",
    whenToUse: "Long-form doc or wiki-style inner layouts.",
    mainSections: ["NotionPageCover", "NotionPageHeader", "Body"],
    features: ["Composable blocks"],
    howToView: "No imports in app pages today — compose in a new screen.",
    visibleInApp: false,
    relatedFiles: [],
    nextAction: "Import NotionPage into a docs or notes surface.",
  },
  {
    id: "ui-builder-page",
    name: "UiBuilderPage",
    category: "builder-layouts",
    path: "src/UiBuilderPage.tsx",
    purpose: "Full-screen UI Builder: component palette, 12-col canvas, inspector, import/export, apply, React export modal.",
    whenToUse: "Authoring and editing saved canvas layouts.",
    mainSections: ["wd-app-shell grid", "Sidebar palette", "Canvas", "Inspector", "Export modal"],
    features: [
      "Drag-drop",
      "491wd-ui-builder-layout persistence",
      "Per-component style variants (settings.variant)",
      "Variants palette tab + Add variant example",
      "generateExportedUiLayoutTsx",
    ],
    howToView: "Top tab → UI Builder",
    visibleInApp: true,
    relatedFiles: ["src/lib/uiBuilderLayout.tsx", "src/lib/componentVariantOptions.ts", "src/ui-builder.css"],
    nextAction: "Switch to the UI Builder tab.",
  },
  {
    id: "ui-builder-component-preview-cards",
    name: "UI Builder — component preview cards (canvas)",
    category: "builder-layouts",
    path: "src/UiBuilderPage.tsx",
    purpose:
      "Each canvas row renders an inline preview via renderPreview (from uiBuilderLayout), approximating the final card before export or apply.",
    whenToUse: "While editing the builder canvas (distinct from the read-only Saved UI Preview tab grid).",
    mainSections: ["Canvas grid cells", "renderPreview output", "Row inspector"],
    features: ["Accent from row settings", "Grid span presets", "Interactive builder (not pointer-locked)"],
    howToView: "Top tab → UI Builder → inspect components on the canvas.",
    visibleInApp: true,
    relatedFiles: ["src/lib/uiBuilderLayout.tsx", "src/UiBuilderPage.tsx"],
    nextAction: "Add or select a canvas row to see its preview card update.",
  },
  {
    id: "ui-builder-layout-lib",
    name: "uiBuilderLayout (data + preview helpers)",
    category: "builder-layouts",
    path: "src/lib/uiBuilderLayout.tsx",
    purpose: "Starter canvas, serialization helpers, and renderPreview wiring for palette items.",
    whenToUse: "Any code that hydrates or validates the builder canvas model.",
    mainSections: ["createStarterCanvas", "catalog metadata", "preview render hooks"],
    features: ["Aligns with localStorage key used by preview/applied sections"],
    howToView: "Indirectly via UI Builder or Saved UI Preview; open file in editor.",
    visibleInApp: true,
    relatedFiles: ["src/UiBuilderPage.tsx"],
    nextAction: "Edit starter layout or catalog entries here.",
  },
  {
    id: "ui-layout-renderer",
    name: "UiLayoutRenderer (Saved UI Preview tab)",
    category: "preview-layouts",
    path: "src/components/UiLayoutRenderer.tsx",
    purpose: "Read-only full-page preview of the saved builder layout from storage.",
    whenToUse: "Validate what is stored before applying to My Build.",
    mainSections: ["Hero", "CanvasPreviewGrid"],
    features: ["localStorage load", "wd-ui-preview-root styling"],
    howToView: "Top tab → Saved UI Preview",
    visibleInApp: true,
    relatedFiles: ["src/components/CanvasPreviewGrid.tsx", "src/lib/uiBuilderLayout.tsx"],
    nextAction: "Open Saved UI Preview tab.",
  },
  {
    id: "canvas-preview-grid",
    name: "CanvasPreviewGrid",
    category: "preview-layouts",
    path: "src/components/CanvasPreviewGrid.tsx",
    purpose: "12-column read-only card grid for each canvas component using renderPreview.",
    whenToUse: "Shared by Saved UI Preview and Applied UI sections.",
    mainSections: ["Grid", "Per-card preview iframe"],
    features: ["Read-only pointer events", "Responsive col spans"],
    howToView: "Saved UI Preview tab or scroll to Applied section under My Build.",
    visibleInApp: true,
    relatedFiles: ["src/components/UiLayoutRenderer.tsx", "src/components/AppliedUiSection.tsx"],
    nextAction: "Save a layout in UI Builder then preview here.",
  },
  {
    id: "applied-ui-section",
    name: "AppliedUiSection (My Build)",
    category: "applied-layouts",
    path: "src/components/AppliedUiSection.tsx",
    purpose: "Embeds the applied builder layout under the main household app on My Build.",
    whenToUse: "After Apply to My Build from the UI Builder.",
    mainSections: ["Section heading", "CanvasPreviewGrid from applied storage key"],
    features: ["Separate storage bucket from raw saved preview"],
    howToView: "My Build tab → scroll below CurrentBuild after applying a layout.",
    visibleInApp: true,
    relatedFiles: ["src/App.tsx", "src/components/CanvasPreviewGrid.tsx"],
    nextAction: "Apply a layout from UI Builder, return to My Build.",
  },
  {
    id: "help-center-page",
    name: "HelpCenterPage",
    category: "documentation-help",
    path: "src/pages/HelpCenterPage.tsx",
    purpose: "In-app documentation: search, filters, TOC, article reader for static help content.",
    whenToUse: "Onboarding, release notes, troubleshooting without network.",
    mainSections: ["Toolbar", "TOC sidebar", "Article panel"],
    features: ["Client-side search", "Category filters"],
    howToView: "Top tab → Help Center",
    visibleInApp: true,
    relatedFiles: ["src/lib/helpCenterContent.ts", "src/ui-builder.css"],
    nextAction: "Open Help Center tab.",
  },
  {
    id: "help-center-content",
    name: "helpCenterContent (static articles)",
    category: "documentation-help",
    path: "src/lib/helpCenterContent.ts",
    purpose: "Structured article data backing HelpCenterPage.",
    whenToUse: "Adding or editing help topics.",
    mainSections: ["Article groups", "Paragraph blocks", "Cross-links to builder flows"],
    features: ["Type-safe article model"],
    howToView: "Rendered inside Help Center tab when selecting articles.",
    visibleInApp: true,
    relatedFiles: ["src/pages/HelpCenterPage.tsx"],
    nextAction: "Edit articles in this file.",
  },
  {
    id: "generate-exported-ui-layout",
    name: "generateExportedUiLayoutTsx",
    category: "export-generated-layouts",
    path: "src/lib/generateExportedUiLayoutTsx.ts",
    purpose: "Builds standalone TSX string for ExportedUiLayout with embedded EXPORTED_ITEMS and render helpers.",
    whenToUse: "Export React Code action in UI Builder.",
    mainSections: ["String template", "Standalone renderPreview clone", "Default export component"],
    features: ["No app imports in output", "Matches canvas at export time"],
    howToView: "UI Builder → Export React Code → inspect modal source.",
    visibleInApp: true,
    relatedFiles: ["src/UiBuilderPage.tsx"],
    nextAction: "Export from UI Builder and copy TSX.",
  },
  {
    id: "exported-ui-layout-component",
    name: "ExportedUiLayout (generated React layout)",
    category: "export-generated-layouts",
    path: "Generated TSX (from src/lib/generateExportedUiLayoutTsx.ts)",
    purpose:
      "Standalone default-export component emitted by Export React Code: embedded EXPORTED_ITEMS array and preview render helpers with no imports from this app.",
    whenToUse: "Shipping the current canvas as a portable React file outside this project.",
    mainSections: ["EXPORTED_ITEMS", "renderExportedPreview helpers", "ExportedUiLayout root"],
    features: ["Portable bundle", "Matches export-time canvas", "React types only"],
    howToView: "UI Builder → Export React Code → read or copy TSX from the modal.",
    visibleInApp: true,
    relatedFiles: ["src/lib/generateExportedUiLayoutTsx.ts", "src/UiBuilderPage.tsx"],
    nextAction: "Export and paste into your target codebase.",
  },
];
