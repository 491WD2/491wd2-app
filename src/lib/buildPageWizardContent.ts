import type {
  BuildPageEditIntentOption,
  BuildPageEditProfile,
  BuildPageProgressRoadmap,
  BuildPageShapeOption,
  BuildPageToolCard,
  BuildPageTypeId,
  BuildPageTypeOption,
  BuildPageWizardStep,
} from "../types/buildPageWizard";

export type BuildPageEditFileStatus = "existing" | "planned";

export type BuildPageEditFileEntry = {
  label: string;
  path: string;
  status: BuildPageEditFileStatus;
};

export type BuildPageEditFileMap = {
  pageId: BuildPageTypeId;
  built: boolean;
  availabilityNote?: string;
  entries: BuildPageEditFileEntry[];
};

export const BUILD_PAGE_EDIT_FILE_MAPS: BuildPageEditFileMap[] = [
  {
    pageId: "home",
    built: true,
    entries: [
      { label: "Source file", path: "src/pages/HomeDashboardPage.tsx", status: "existing" },
      { label: "Data file", path: "src/lib/homeDashboardData.ts", status: "existing" },
      { label: "Types", path: "src/types/homeDashboard.ts", status: "existing" },
      { label: "Styles", path: "src/ui-builder.css, wd-home*", status: "existing" },
    ],
  },
  {
    pageId: "pantry",
    built: true,
    entries: [
      { label: "Page file", path: "src/pages/PantryPage.tsx", status: "existing" },
      { label: "Table/list file", path: "src/pages/PantryTabPage.tsx", status: "existing" },
      { label: "Data file", path: "src/lib/pantryData.ts", status: "existing" },
      { label: "Types", path: "src/types/pantry.ts", status: "existing" },
      { label: "Styles", path: "src/ui-builder.css, wd-pantry*", status: "existing" },
    ],
  },
  {
    pageId: "shopping",
    built: true,
    availabilityNote: "Shopping page files exist. Dedicated data and types modules are still planned.",
    entries: [
      { label: "Page file", path: "src/pages/ShoppingPage.tsx", status: "existing" },
      { label: "Views", path: "src/pages/shopping/ShoppingViews.tsx", status: "existing" },
      { label: "Utils", path: "src/pages/shopping/shoppingUtils.ts", status: "existing" },
      { label: "Data file (planned)", path: "src/lib/shoppingData.ts", status: "planned" },
      { label: "Types (planned)", path: "src/types/shopping.ts", status: "planned" },
    ],
  },
  {
    pageId: "tasks",
    built: true,
    entries: [
      { label: "Page file", path: "src/pages/TasksPage.tsx", status: "existing" },
    ],
  },
  {
    pageId: "calendar",
    built: true,
    entries: [
      { label: "Page file", path: "src/pages/CalendarPage.tsx", status: "existing" },
      { label: "Activity styles", path: "src/lib/calendarActivityStyles.ts", status: "existing" },
      { label: "Notifications", path: "src/lib/calendarTodayNotifications.ts", status: "existing" },
    ],
  },
  {
    pageId: "messages",
    built: true,
    entries: [
      { label: "Page file", path: "src/pages/MessagesPage.tsx", status: "existing" },
      { label: "Utils", path: "src/lib/messageBoardUtils.ts", status: "existing" },
    ],
  },
  {
    pageId: "notes",
    built: false,
    availabilityNote: "Notes page is not built yet. Use the planned paths below as the starting scaffold.",
    entries: [
      { label: "Page file (planned)", path: "src/pages/NotesPage.tsx", status: "planned" },
      { label: "Data file (planned)", path: "src/lib/notesData.ts", status: "planned" },
      { label: "Types (planned)", path: "src/types/notes.ts", status: "planned" },
    ],
  },
  {
    pageId: "custom",
    built: false,
    availabilityNote: "Custom pages are planned per module. Start from the shell paths below when you add one.",
    entries: [
      { label: "Page file (planned)", path: "src/pages/CustomPage.tsx", status: "planned" },
      { label: "Data file (planned)", path: "src/lib/customPageData.ts", status: "planned" },
      { label: "Types (planned)", path: "src/types/customPage.ts", status: "planned" },
    ],
  },
];

export const BUILD_PAGE_EDIT_INTENT_OPTIONS: BuildPageEditIntentOption[] = [
  { id: "change-layout", label: "Change layout", promptLabel: "Change layout" },
  { id: "edit-cards-sections", label: "Edit cards/sections", promptLabel: "Edit cards/sections" },
  { id: "edit-text", label: "Edit text", promptLabel: "Edit text" },
  { id: "edit-table-list", label: "Edit table/list", promptLabel: "Edit table/list" },
  { id: "edit-colors-style", label: "Edit colors/style", promptLabel: "Edit colors/style" },
  { id: "add-section", label: "Add a section", promptLabel: "Add a section" },
  { id: "remove-section", label: "Remove a section", promptLabel: "Remove a section" },
];

export const BUILD_PAGE_EDIT_PROFILES: BuildPageEditProfile[] = [
  {
    pageId: "home",
    pagePurpose: "Household landing hub with quick actions into live modules.",
    currentLayoutType: "Dashboard card grid with compact quick-action tiles",
    editableAreas: [
      "quick action cards",
      "household snapshot",
      "recommended next",
      "recent activity",
      "card order",
      "card labels/text",
    ],
    suggestedEditActions: [
      "Reorder quick action cards",
      "Refresh household snapshot copy",
      "Tune recommended-next module links",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Page Composer", backendViewId: "page-composer" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "pantry",
    pagePurpose: "Inventory register with filters, table-first line items, and status counts.",
    currentLayoutType: "Invoice-style document panel with metadata, filters, and table list",
    editableAreas: [
      "table columns",
      "card view",
      "filters",
      "status badges",
      "sample data",
      "invoice/list styling",
      "actions",
    ],
    suggestedEditActions: [
      "Adjust table columns and density",
      "Refine filter chips and status badges",
      "Polish invoice metadata strip and row actions",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Page Composer", backendViewId: "page-composer" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "shopping",
    pagePurpose: "Purchasing list with categories, purchased filters, and pantry handoff.",
    currentLayoutType: "Checklist table with grouped categories and action bar",
    editableAreas: ["checklist sections", "item rows", "categories", "priority badges"],
    suggestedEditActions: [
      "Group checklist sections by category",
      "Tune purchased filters and row actions",
      "Adjust priority badge styling",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Page Composer", backendViewId: "page-composer" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "tasks",
    pagePurpose: "Household chores and cleaning workflows with assignment cues.",
    currentLayoutType: "Task board or checklist with status badges and due filters",
    editableAreas: ["task cards", "status columns", "assignees", "due dates"],
    suggestedEditActions: [
      "Refine task card density and badges",
      "Adjust status columns or board lanes",
      "Clarify assignee and due-date cues",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Page Composer", backendViewId: "page-composer" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "calendar",
    pagePurpose: "Shared household schedule with month grid and event list.",
    currentLayoutType: "Calendar grid with event sidebar or agenda list",
    editableAreas: ["month grid", "upcoming events", "filter chips", "event cards", "add-event actions"],
    suggestedEditActions: [
      "Tune month grid spacing and event chips",
      "Refresh upcoming-events sidebar",
      "Adjust filter chips and add-event affordances",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "messages",
    pagePurpose: "Household message board with threads and composer area.",
    currentLayoutType: "Split inbox with thread list and message detail",
    editableAreas: ["thread list", "message detail", "composer", "unread badges", "household filters"],
    suggestedEditActions: [
      "Improve thread list density and unread badges",
      "Polish message detail and composer layout",
      "Tune household filter chips",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "notes",
    pagePurpose: "Shared notes or docs surface with readable document layout.",
    currentLayoutType: "Document-style page with title, metadata, and body sections",
    editableAreas: ["document header", "metadata row", "note body", "tag badges", "related links"],
    suggestedEditActions: [
      "Refresh document header and metadata row",
      "Improve note body typography and spacing",
      "Tune tag badges and related links",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
  {
    pageId: "custom",
    pagePurpose: "A new module or internal page not covered by the household presets.",
    currentLayoutType: "Simple admin page shell with one primary content panel",
    editableAreas: ["page header", "primary content panel", "secondary actions", "empty state", "help hints"],
    suggestedEditActions: [
      "Clarify page header and primary panel hierarchy",
      "Add or remove secondary actions",
      "Improve empty state and help hints",
    ],
    relatedTools: [
      { label: "UI Builder", backendViewId: "ui-builder" },
      { label: "Page Composer", backendViewId: "page-composer" },
      { label: "Template Workbench", backendViewId: "template-workbench" },
    ],
  },
];

export const BUILD_PAGE_SIMPLE_PATH = {
  title: "The simple way to build",
  steps: [
    "Choose the page",
    "Pick a style source",
    "Copy the build plan",
    "Let Cursor build the first version",
    "Review and refine",
  ],
} as const;

export const BUILD_PAGE_TOOL_CARDS: BuildPageToolCard[] = [
  {
    id: "build-page",
    title: "Build a Page",
    summary: "Start here. Pick a page type, copy a build plan, and know which tool to open next.",
    startHere: true,
  },
  {
    id: "template-workbench",
    title: "Template Workbench",
    summary: "Choose visual examples and preview Sneat, Pantry, and admin-style HTML references.",
    backendViewId: "template-workbench",
  },
  {
    id: "ui-builder",
    title: "UI Builder",
    summary: "Build reusable sections on the canvas, then export or apply them.",
    backendViewId: "ui-builder",
  },
  {
    id: "page-composer",
    title: "Page Composer",
    summary: "Place saved UI Builder sections onto target pages such as Pantry.",
    backendViewId: "page-composer",
  },
  {
    id: "saved-preview",
    title: "Saved UI Preview",
    summary: "Review the layout stored in localStorage before applying it to My Build.",
    backendViewId: "saved-preview",
  },
  {
    id: "my-build",
    title: "My Build",
    summary: "The final user-facing household app. Build in Backend Console, review in My Build.",
  },
];

export const BUILD_PAGE_PROGRESS_ROADMAP: BuildPageProgressRoadmap = {
  currentLabel: "Pantry is started",
  upcoming: [
    { label: "Suggested next: Shopping List", pageId: "shopping" },
    { label: "Then: Chores / Tasks", pageId: "tasks" },
    { label: "Then: Calendar", pageId: "calendar" },
    { label: "Then: Messages / Notes", pageId: "messages" },
  ],
};

export const BUILD_PAGE_SHAPE_OPTIONS: BuildPageShapeOption[] = [
  {
    id: "list-table",
    label: "A list/table page",
    recommendedLayout: "Table-first list with filters, metadata strip, and compact row actions",
    bestSourceStyle: "Pantry or Shopping List invoice/table references in Template Workbench",
    matchPageId: "pantry",
  },
  {
    id: "card-page",
    label: "A card page",
    recommendedLayout: "Card grid with short descriptions and quick actions",
    bestSourceStyle: "Sneat cards basic and notes/card references",
    matchPageId: "notes",
  },
  {
    id: "form-page",
    label: "A form page",
    recommendedLayout: "Single-column form with grouped fields and clear submit actions",
    bestSourceStyle: "Sneat form references and compact admin inputs",
    matchPageId: "custom",
  },
  {
    id: "dashboard",
    label: "A dashboard page",
    recommendedLayout: "Dashboard card grid with summary tiles and module shortcuts",
    bestSourceStyle: "Home dashboard cards and Sneat admin dashboard references",
    matchPageId: "home",
  },
  {
    id: "task-board",
    label: "A task board",
    recommendedLayout: "Kanban or checklist board with status badges and assignment cues",
    bestSourceStyle: "Dragula / task board references and Sneat badges",
    matchPageId: "tasks",
  },
  {
    id: "notes-page",
    label: "A notes page",
    recommendedLayout: "Notes grid or document list with readable metadata",
    bestSourceStyle: "Notes grid and document panel references",
    matchPageId: "notes",
  },
];

export const BUILD_PAGE_WIZARD_STEPS: BuildPageWizardStep[] = [
  {
    number: 1,
    title: "What are you building?",
    summary: "Pick the household page you want to shape in My Build.",
  },
  {
    number: 2,
    title: "Pick a visual style",
    summary: "Use Template Workbench to preview Sneat, Pantry, and admin-style references.",
  },
  {
    number: 3,
    title: "Choose starting sections",
    summary: "Sketch the first UI Builder blocks and Page Composer placements for that page.",
  },
  {
    number: 4,
    title: "Create build plan",
    summary: "Copy a focused prompt that keeps My Build user-facing and Backend Console internal.",
  },
];

export const BUILD_PAGE_TYPE_OPTIONS: BuildPageTypeOption[] = [
  {
    id: "home",
    title: "Home",
    description: "Household landing hub with quick actions into live modules.",
    recommendedLayout: "Dashboard card grid with compact quick-action tiles",
    bestSourceStyle: "Sneat admin cards + My Build home quick actions",
    recommendedSourceExamples: ["Sneat cards basic", "My Build home dashboard", "Smarthr dashboard cards"],
    suggestedSections: ["Greeting header", "Quick action cards", "Module shortcuts", "Status summary strip"],
  },
  {
    id: "pantry",
    title: "Pantry",
    description: "Inventory register with filters, table-first line items, and status counts.",
    recommendedLayout: "Invoice-style document panel with metadata, filters, and table list",
    bestSourceStyle: "Pantry invoice/order-sheet references in Template Workbench",
    recommendedSourceExamples: ["Pantry invoice list", "Sneat tables", "Admin document panels"],
    suggestedSections: ["Page header", "Inventory metadata strip", "Status summary", "Filter sidebar", "Item table"],
  },
  {
    id: "shopping",
    title: "Shopping List",
    description: "Purchasing list with categories, purchased filters, and pantry handoff.",
    recommendedLayout: "Checklist table with grouped categories and action bar",
    bestSourceStyle: "Sneat list groups + shopping list references",
    recommendedSourceExamples: ["Sneat list groups", "Shopping list references", "Compact action buttons"],
    suggestedSections: ["List header", "Category groups", "Purchased filter", "Add item row", "Pantry link"],
  },
  {
    id: "tasks",
    title: "Chores / Tasks",
    description: "Household chores and cleaning workflows with assignment cues.",
    recommendedLayout: "Task board or checklist with status badges and due filters",
    bestSourceStyle: "Sneat badges + task table references",
    recommendedSourceExamples: ["Sneat badges", "Task table demos", "Kanban / dragula references"],
    suggestedSections: ["Task summary strip", "Filter toolbar", "Task list or board", "Assignment badges", "Empty state"],
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Shared household schedule with month grid and event list.",
    recommendedLayout: "Calendar grid with event sidebar or agenda list",
    bestSourceStyle: "Sneat calendar / planner references",
    recommendedSourceExamples: ["Calendar planner references", "Sneat tabs", "Event list groups"],
    suggestedSections: ["Calendar header", "Month grid", "Upcoming events", "Filter chips", "Add event action"],
  },
  {
    id: "messages",
    title: "Messages",
    description: "Household message board with threads and composer area.",
    recommendedLayout: "Split inbox with thread list and message detail",
    bestSourceStyle: "Sneat list groups + message thread references",
    recommendedSourceExamples: ["Message thread references", "Sneat cards", "Composer patterns"],
    suggestedSections: ["Thread list", "Message detail", "Composer", "Unread badges", "Household filters"],
  },
  {
    id: "notes",
    title: "Notes",
    description: "Shared notes or docs surface with readable document layout.",
    recommendedLayout: "Document-style page with title, metadata, and body sections",
    bestSourceStyle: "Notion-like or admin document references",
    recommendedSourceExamples: ["Typography references", "Sneat cards", "Document panel layouts"],
    suggestedSections: ["Document header", "Metadata row", "Note body", "Tag badges", "Related links"],
  },
  {
    id: "custom",
    title: "Custom Page",
    description: "A new module or internal page not covered by the presets above.",
    recommendedLayout: "Start from a simple admin page shell with one primary content panel",
    bestSourceStyle: "Pick one Template Workbench source and stay consistent",
    recommendedSourceExamples: ["Sneat cards basic", "Smarthr page shell", "Reference Pages screenshots"],
    suggestedSections: ["Page header", "Primary content panel", "Secondary actions", "Empty state", "Help hints"],
  },
];

export const BUILD_PAGE_WIZARD_BACKEND_VIEWS = {
  templateWorkbench: "template-workbench",
  uiBuilder: "ui-builder",
  pageComposer: "page-composer",
  savedPreview: "saved-preview",
} as const;

export function resolveBuildPageRecommendation(
  page: BuildPageTypeOption,
  shape: BuildPageShapeOption | null,
): Pick<BuildPageTypeOption, "recommendedLayout" | "bestSourceStyle"> {
  if (!shape || shape.matchPageId !== page.id) {
    return {
      recommendedLayout: page.recommendedLayout,
      bestSourceStyle: page.bestSourceStyle,
    };
  }

  return {
    recommendedLayout: shape.recommendedLayout,
    bestSourceStyle: shape.bestSourceStyle,
  };
}

export function formatBuildPlanPrompt(
  page: BuildPageTypeOption,
  shape: BuildPageShapeOption | null = null,
): string {
  const recommendation = resolveBuildPageRecommendation(page, shape);
  const sectionLines = page.suggestedSections.map((section) => `- ${section}`).join("\n");
  const shapeLine = shape ? `Building shape: ${shape.label}.` : null;
  return [
    `Build the ${page.title} page for the 491WD household app.`,
    shapeLine,
    `Use ${recommendation.recommendedLayout} as the layout direction.`,
    `Use ${recommendation.bestSourceStyle} for visual style references in Template Workbench.`,
    "Suggested sections:",
    sectionLines,
    "",
    "Rules:",
    "- Build frontend-only in React + TypeScript.",
    "- Use wd-* CSS classes.",
    "- Match the chosen source style: spacing, cards, tables, badges, buttons, and typography.",
    "- Keep My Build user-facing.",
    "- Keep Backend Console internal.",
    "- Run npm run build and fix errors.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function findBuildPageEditProfile(pageId: BuildPageTypeOption["id"]): BuildPageEditProfile {
  return (
    BUILD_PAGE_EDIT_PROFILES.find((profile) => profile.pageId === pageId) ??
    BUILD_PAGE_EDIT_PROFILES[BUILD_PAGE_EDIT_PROFILES.length - 1]!
  );
}

export function findBuildPageEditFileMap(pageId: BuildPageTypeOption["id"]): BuildPageEditFileMap {
  return (
    BUILD_PAGE_EDIT_FILE_MAPS.find((map) => map.pageId === pageId) ??
    BUILD_PAGE_EDIT_FILE_MAPS[BUILD_PAGE_EDIT_FILE_MAPS.length - 1]!
  );
}

export function getPrimaryEditFilePaths(map: BuildPageEditFileMap): string[] {
  const existing = map.entries.filter((entry) => entry.status === "existing");
  if (existing.length > 0) {
    return existing.map((entry) => entry.path);
  }
  return map.entries.map((entry) => entry.path);
}

export function formatEditFileLocations(page: BuildPageTypeOption, map: BuildPageEditFileMap): string {
  const statusLine = map.built
    ? "Status: Live page files are in the repo."
    : "Status: Not built yet — planned paths only.";
  const entryLines = map.entries.map((entry) => {
    const suffix = entry.status === "planned" ? " (planned)" : "";
    return `- ${entry.label}: ${entry.path}${suffix}`;
  });
  return [
    `Where to edit — ${page.title}`,
    statusLine,
    map.availabilityNote,
    "",
    ...entryLines,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatTargetedEditPrompt(
  page: BuildPageTypeOption,
  map: BuildPageEditFileMap,
  intent: BuildPageEditIntentOption,
): string {
  const primaryFiles = getPrimaryEditFilePaths(map).map((path) => `- ${path}`).join("\n");
  const scaffoldNote = map.built
    ? null
    : "Note: Page not built yet — scaffold the planned paths before editing layout or copy.";
  return [
    `Edit ${page.title}.`,
    "Primary files:",
    primaryFiles,
    scaffoldNote,
    "",
    "Task:",
    intent.promptLabel,
    "",
    "Rules:",
    "- Make the smallest safe change.",
    "- Preserve current behavior.",
    "- Use existing data/types where possible.",
    "- Use wd-* CSS classes.",
    "- Run npm run build.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatEditPagePrompt(
  page: BuildPageTypeOption,
  editProfile: BuildPageEditProfile,
  intent: BuildPageEditIntentOption,
): string {
  const editableAreas = editProfile.editableAreas.join(", ");
  return [
    `Edit the ${page.title} page in the 491WD React/Vite app.`,
    `Current layout: ${editProfile.currentLayoutType}.`,
    `Requested edit: ${intent.promptLabel}.`,
    `Editable areas: ${editableAreas}.`,
    "",
    "Rules:",
    "- Preserve existing working behavior.",
    "- Do not modify Backend Console unless requested.",
    "- Keep My Build user-facing.",
    "- Use wd-* CSS classes.",
    "- Keep styling consistent with current page.",
    "- Run npm run build and fix errors.",
  ].join("\n");
}
