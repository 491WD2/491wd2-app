/**
 * Internal Backend Console navigation metadata (no server — admin-style UI shell only).
 */

import { uiComponents, type UiCategory } from "./uiBuilderLayout";

export const BACKEND_CONSOLE_ACTIVE_VIEW_KEY = "491wd-backend-console-active-view";
export const BACKEND_CONSOLE_EXPANDED_GROUPS_KEY = "491wd-backend-console-expanded-groups";
export const BACKEND_CONSOLE_SIDEBAR_COLLAPSED_KEY = "491wd-backend-console-sidebar-collapsed";

/** Views that map to existing page components. */
export type BackendConsoleWiredView =
  | "build-page-wizard"
  | "ui-builder"
  | "page-composer"
  | "saved-preview"
  | "help-center"
  | "layout-choices"
  | "reference-pages"
  | "template-workbench"
  | "builder-demo-lab";

export type BackendConsoleNavItem = {
  id: string;
  label: string;
  description: string;
  /** Short helper line under the sidebar label when the rail is expanded. */
  sidebarHint?: string;
  /** When set, main panel renders the existing page for this id. */
  wired?: BackendConsoleWiredView;
  /**
   * When set, Backend Console opens UI Builder with this palette filter (canvas layout untouched).
   * Sidebar can stay on this item’s id while the builder is shown.
   */
  uiBuilderPalette?: { category: UiCategory; definitionId: string };
};

export type BackendConsoleNavGroup = {
  groupId: string;
  label: string;
  items: BackendConsoleNavItem[];
};

/** Base UI palette order (matches Sneat-style catalog). Definition ids must exist in `uiComponents`. */
const BASE_UI_DEFINITION_ORDER = [
  "alerts",
  "accordion",
  "avatar",
  "badges",
  "breadcrumb",
  "buttons",
  "button-group",
  "card",
  "carousel",
  "collapse",
  "dropdowns",
  "ratio",
  "grid",
  "images",
  "links",
  "list-groups",
  "modals",
  "offcanvas",
  "pagination",
  "placeholders",
  "popovers",
  "progress",
  "spinner",
  "tabs",
  "toasts",
  "tooltips",
  "typography",
] as const;

const ADVANCED_UI_DEFINITION_ORDER = ["dragula", "clipboard", "sweet-alerts", "lightbox", "scrollbar"] as const;

function catalogNavItem(prefix: "base-ui" | "advanced-ui", definitionId: string): BackendConsoleNavItem {
  const def = uiComponents.find((c) => c.id === definitionId);
  const label = def?.name ?? definitionId;
  const category: UiCategory = def?.category ?? (prefix === "base-ui" ? "Base UI" : "Advanced UI");
  return {
    id: `${prefix}-${definitionId}`,
    label,
    description: def?.description ?? `UI Builder palette entry: ${label}.`,
    uiBuilderPalette: { category, definitionId },
  };
}

export const BACKEND_CONSOLE_NAV_GROUPS: BackendConsoleNavGroup[] = [
  {
    groupId: "build-tools",
    label: "Build Tools",
    items: [
      {
        id: "build-page-wizard",
        label: "Build a Page",
        sidebarHint: "Start here",
        description:
          "Guided workflow to pick a page type, choose a style source, and copy a focused build plan prompt.",
        wired: "build-page-wizard",
      },
      {
        id: "builder-demo-lab",
        label: "Demo Lab",
        description:
          "Learn how to choose a template source, build UI sections, compose a page, and preview or apply it — static walkthrough.",
        wired: "builder-demo-lab",
      },
      {
        id: "ui-builder",
        label: "UI Builder",
        description: "Drag-and-drop canvas, inspector, import/export, apply, and React export.",
        wired: "ui-builder",
      },
      {
        id: "page-composer",
        label: "Page Composer",
        description:
          "Arrange saved UI Builder sections onto target pages. Persists per page in localStorage (491wd-page-composer-layouts).",
        wired: "page-composer",
      },
      {
        id: "template-workbench",
        label: "Template Workbench",
        description: "Live template iframe previews and style planning (reference-only).",
        wired: "template-workbench",
      },
    ],
  },
  {
    groupId: "advanced-reference",
    label: "Advanced / Reference",
    items: [
      {
        id: "saved-preview",
        label: "Saved UI Preview",
        description: "Read-only preview of the layout stored under 491wd-ui-builder-layout.",
        wired: "saved-preview",
      },
      {
        id: "reference-pages",
        label: "Reference Pages",
        description: "Screenshots and HTML demo references from public/reference-pages.",
        wired: "reference-pages",
      },
      {
        id: "layout-choices",
        label: "Layout Choices",
        description: "Catalog of pages, shells, previews, and export paths.",
        wired: "layout-choices",
      },
    ],
  },
  {
    groupId: "base-ui",
    label: "Base UI",
    items: BASE_UI_DEFINITION_ORDER.map((definitionId) => catalogNavItem("base-ui", definitionId)),
  },
  {
    groupId: "advanced-ui",
    label: "Advanced UI",
    items: ADVANCED_UI_DEFINITION_ORDER.map((definitionId) => catalogNavItem("advanced-ui", definitionId)),
  },
  {
    groupId: "ui-interface",
    label: "UI Interface",
    items: [
      {
        id: "ui-forms",
        label: "Forms",
        description: "Form layouts, validation patterns, and field systems.",
      },
      {
        id: "ui-tables",
        label: "Tables",
        description: "Table density, sorting, and data grid references.",
      },
      {
        id: "ui-charts",
        label: "Charts",
        description: "Analytics charts and dashboard visualizations.",
      },
      {
        id: "ui-icons",
        label: "Icons",
        description: "Icon sets, sizing, and usage guidelines.",
      },
    ],
  },
  {
    groupId: "documentation",
    label: "Documentation",
    items: [
      {
        id: "help-center",
        label: "Help Center",
        description: "In-app documentation hub: guides, reference, troubleshooting.",
        wired: "help-center",
      },
      {
        id: "doc-release-notes",
        label: "Release Notes",
        description: "Version history and shipped changes.",
      },
      {
        id: "doc-user-guides",
        label: "User Guides",
        description: "End-user oriented walkthroughs.",
      },
      {
        id: "doc-admin-guides",
        label: "Admin Guides",
        description: "Household admin and configuration guides.",
      },
      {
        id: "doc-api-internal",
        label: "API / Internal Docs",
        description: "Internal APIs, keys, and integration notes (frontend-only app: no live API here).",
      },
      {
        id: "doc-workflows",
        label: "Workflow Tutorials",
        description: "Step-by-step operational workflows.",
      },
    ],
  },
  {
    groupId: "planning",
    label: "Planning",
    items: [
      {
        id: "pantry-style-sources",
        label: "Pantry Style Sources",
        description: "Map Pantry-facing styles from Template Workbench and notes. Use Template Workbench → My Picks.",
      },
      {
        id: "chosen-style-sources",
        label: "Chosen Style Sources",
        description: "Summary of chosen style assignments lives in Template Workbench when My Picks is active.",
      },
      {
        id: "builder-tasks",
        label: "Builder Tasks",
        description: "Copy builder prompts from Template Workbench or track tasks externally.",
      },
    ],
  },
  {
    groupId: "system",
    label: "System",
    items: [
      {
        id: "sys-checkpoints",
        label: "Checkpoints",
        description: "Save and restore internal workspace checkpoints.",
      },
      {
        id: "sys-export-tools",
        label: "Export Tools",
        description: "Bulk export and packaging utilities.",
      },
      {
        id: "sys-settings",
        label: "Settings",
        description: "Backend console preferences and defaults.",
      },
    ],
  },
];

const DEFAULT_ACTIVE_VIEW: BackendConsoleWiredView = "ui-builder";

const DEFAULT_EXPANDED: Record<string, boolean> = {
  "build-tools": true,
  "advanced-reference": false,
  "base-ui": false,
  "advanced-ui": false,
  "ui-interface": false,
  documentation: false,
  planning: false,
  system: false,
};

export function getDefaultActiveView(): string {
  return DEFAULT_ACTIVE_VIEW;
}

export function loadBackendConsoleActiveView(): string {
  try {
    const raw = localStorage.getItem(BACKEND_CONSOLE_ACTIVE_VIEW_KEY);
    if (!raw) {
      return DEFAULT_ACTIVE_VIEW;
    }
    if (ALL_KNOWN_ITEM_IDS.has(raw)) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_ACTIVE_VIEW;
}

export function saveBackendConsoleActiveView(id: string): void {
  try {
    localStorage.setItem(BACKEND_CONSOLE_ACTIVE_VIEW_KEY, id);
  } catch {
    /* ignore */
  }
}

const ALL_KNOWN_ITEM_IDS = new Set<string>();
for (const g of BACKEND_CONSOLE_NAV_GROUPS) {
  for (const it of g.items) {
    ALL_KNOWN_ITEM_IDS.add(it.id);
  }
}

export function loadBackendConsoleExpandedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BACKEND_CONSOLE_EXPANDED_GROUPS_KEY);
    if (!raw) {
      return { ...DEFAULT_EXPANDED };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_EXPANDED };
    }
    const o = parsed as Record<string, unknown>;
    const out: Record<string, boolean> = { ...DEFAULT_EXPANDED };
    for (const k of Object.keys(DEFAULT_EXPANDED)) {
      if (typeof o[k] === "boolean") {
        out[k] = o[k];
      }
    }
    return out;
  } catch {
    return { ...DEFAULT_EXPANDED };
  }
}

export function saveBackendConsoleExpandedGroups(expanded: Record<string, boolean>): void {
  try {
    localStorage.setItem(BACKEND_CONSOLE_EXPANDED_GROUPS_KEY, JSON.stringify(expanded));
  } catch {
    /* ignore */
  }
}

export function loadBackendConsoleSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(BACKEND_CONSOLE_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveBackendConsoleSidebarCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) {
      localStorage.setItem(BACKEND_CONSOLE_SIDEBAR_COLLAPSED_KEY, "true");
    } else {
      localStorage.removeItem(BACKEND_CONSOLE_SIDEBAR_COLLAPSED_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function findNavItem(viewId: string): BackendConsoleNavItem | undefined {
  for (const g of BACKEND_CONSOLE_NAV_GROUPS) {
    const hit = g.items.find((i) => i.id === viewId);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

/** Group + item for breadcrumbs and main header context. */
export function findNavLocation(viewId: string): { group: BackendConsoleNavGroup; item: BackendConsoleNavItem } | undefined {
  for (const g of BACKEND_CONSOLE_NAV_GROUPS) {
    const hit = g.items.find((i) => i.id === viewId);
    if (hit) {
      return { group: g, item: hit };
    }
  }
  return undefined;
}

export function findNavGroupIdForItem(viewId: string): string | undefined {
  return findNavLocation(viewId)?.group.groupId;
}
