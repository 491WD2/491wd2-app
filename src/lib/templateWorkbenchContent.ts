/**
 * Catalog of template / demo references for the Template Workbench.
 * Static HTML entries point at `public/template-workbench/`. Sneat demos are generated into
 * `public/template-workbench/sneat/html/` (see `scripts/build-sneat-template-workbench.mjs`). React entries document
 * in-repo SmartHR-style surfaces.
 */

import sneatWorkbenchCatalogJson from "./sneatWorkbenchCatalog.json";
import {
  TEMPLATE_WORKBENCH_CATEGORY_ORDER,
  type TemplateWorkbenchCategory,
  type TemplateWorkbenchItem,
} from "./templateWorkbenchTypes";

export {
  TEMPLATE_WORKBENCH_CATEGORY_ORDER,
  type TemplateWorkbenchCategory,
  type TemplateWorkbenchItem,
  type TemplateWorkbenchPreviewMode,
} from "./templateWorkbenchTypes";

const _TEMPLATE_WORKBENCH_LOCAL: TemplateWorkbenchItem[] = [
  {
    id: "tw-pantry-main",
    title: "Pantry Manager — main application",
    category: "Pantry Candidate Layouts",
    subcategory: "Inventory shell",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/index.html",
    publicPath: "public/template-workbench/html/pantry-index.html",
    iframeSrc: "/template-workbench/html/pantry-index.html",
    previewMode: "static-iframe",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description:
      "Original Pantry Tracker web UI: top chrome, tabs, tables, modals, theme toggle, and client-side scripts bundled with static assets.",
    bestFor:
      "Choosing a dense list/table + tab shell before translating patterns into React (e.g. Pantry inventory).",
    relatedBuilderComponents: ["table", "tabs", "buttons", "modals", "badges"],
    tags: [
      "Pantry List Candidate",
      "Tables",
      "Application Pages",
      "Advanced UI Source",
    ],
    notes:
      "Closest in-repo HTML to an “employees list” style data table. Pair with Sneat `tables-basic.html` in the workbench for Bootstrap-dense tables.",
  },
  {
    id: "tw-pantry-settings",
    title: "Pantry Manager — settings",
    category: "Forms",
    subcategory: "Grouped fields",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/settings.html",
    publicPath: "public/template-workbench/html/pantry-settings.html",
    iframeSrc: "/template-workbench/html/pantry-settings.html",
    previewMode: "static-iframe",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Static settings-style page with labeled inputs, sections, and instructional copy blocks.",
    bestFor: "Form density, section headings, and field grouping references.",
    relatedBuilderComponents: ["form-field", "inputs", "typography"],
    tags: ["Forms", "Base UI"],
    notes: "Use as a plain HTML reference for form layout rhythm.",
  },
  {
    id: "tw-pantry-backup",
    title: "Pantry Manager — backup & restore",
    category: "Application Pages",
    subcategory: "Two-column actions",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/backup.html",
    publicPath: "public/template-workbench/html/pantry-backup.html",
    iframeSrc: "/template-workbench/html/pantry-backup.html",
    previewMode: "static-iframe",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description:
      "Side-by-side action panels for download/upload flows. Contains a Jinja placeholder in the upstream file; static preview shows literal braces.",
    bestFor: "Action-oriented dual-column layouts and primary CTA placement.",
    relatedBuilderComponents: ["buttons", "cards", "alerts"],
    tags: ["Application Pages", "Forms"],
    notes: "Server endpoints in the original Flask app do not run in static preview.",
  },
  {
    id: "tw-react-smarthr-table",
    title: "SmarthrTable (React)",
    category: "Tables",
    subcategory: "SmartHR data table",
    originalPath: "src/components/smarthr/SmarthrTable.tsx",
    publicPath: "src/components/smarthr/SmarthrTable.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description:
      "Household React table primitives (wrap, thead/tbody, row/cell classes) aligned with SmartHR token comments in the codebase.",
    bestFor: "Pantry inventory tables, member lists, and any tabular SmartHR-styled surface.",
    relatedBuilderComponents: ["table"],
    tags: ["Pantry List Candidate", "Tables"],
    notes: "No standalone employees.html in repo; this is the primary table style source in React.",
  },
  {
    id: "tw-react-smarthr-card",
    title: "SmarthrCard (React)",
    category: "Card Layouts",
    subcategory: "White elevated cards",
    originalPath: "src/components/smarthr/SmarthrCard.tsx",
    publicPath: "src/components/smarthr/SmarthrCard.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Card shell and header patterns used across dashboard and settings-style views.",
    bestFor: "Notes-style tiles, pantry item cards, and dashboard modules.",
    relatedBuilderComponents: ["card"],
    tags: ["Pantry Card Candidate", "Cards"],
    notes:
      "Use when you want notes-style card rhythm in React; Sneat `cards-basic.html` covers Bootstrap card grids in the workbench iframe.",
  },
  {
    id: "tw-react-smarthr-empty-state",
    title: "SmarthrEmptyState (React)",
    category: "Card Layouts",
    subcategory: "Zero-state panel",
    originalPath: "src/components/smarthr/SmarthrEmptyState.tsx",
    publicPath: "src/components/smarthr/SmarthrEmptyState.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Centered empty state inside a SmartHR card with optional action.",
    bestFor: "Placeholder panes when lists are empty.",
    relatedBuilderComponents: ["card", "buttons"],
    tags: ["Pantry Card Candidate", "Cards", "Base UI"],
    notes: "Pairs well with tables for first-use experiences.",
  },
  {
    id: "tw-react-smarthr-dashboard-grid",
    title: "SmarthrDashboardGrid (React)",
    category: "Dashboards",
    subcategory: "Responsive grid",
    originalPath: "src/components/smarthr/SmarthrDashboardGrid.tsx",
    publicPath: "src/components/smarthr/SmarthrDashboardGrid.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "12-column style dashboard grid with span controls for large breakpoints.",
    bestFor: "Home / dashboard tile placement comparable to hr-dashboard layouts.",
    relatedBuilderComponents: ["grid", "card"],
    tags: ["Dashboard", "Card Layouts"],
    notes: "React counterpart to static dashboards; Sneat `dashboard-analytics.html` is available as an iframe preview.",
  },
  {
    id: "tw-react-smarthr-page-shell",
    title: "SmarthrPageShell (React)",
    category: "Layout Systems",
    subcategory: "Page canvas",
    originalPath: "src/components/smarthr/SmarthrPageShell.tsx",
    publicPath: "src/components/smarthr/SmarthrPageShell.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Full-height page wash and main column padding used by SmartHR-styled routes.",
    bestFor: "Choosing default app shell padding and background for inner pages.",
    relatedBuilderComponents: ["offcanvas", "layout"],
    tags: ["Navigation", "Layout Systems"],
    notes: "Referenced from layout docs as SmarthrPageShell; Sneat ships several `layout-*.html` iframe examples under template-workbench.",
  },
  {
    id: "tw-react-smarthr-page-header",
    title: "SmarthrPageHeader (React)",
    category: "Sidebar / Navigation",
    subcategory: "Page header / breadcrumb host",
    originalPath: "src/components/smarthr/SmarthrPageHeader.tsx",
    publicPath: "src/components/smarthr/SmarthrPageHeader.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "White header card with orange accent rail and title stack.",
    bestFor: "Top-of-page hierarchy similar to CRM module headers.",
    relatedBuilderComponents: ["breadcrumb", "typography"],
    tags: ["Navigation", "Application Pages"],
    notes: "Compose with SmarthrPageShell for admin-style inner pages.",
  },
  {
    id: "tw-react-smarthr-badge",
    title: "SmarthrBadge (React)",
    category: "Base UI",
    subcategory: "Pills / tones",
    originalPath: "src/components/smarthr/SmarthrBadge.tsx",
    publicPath: "src/components/smarthr/SmarthrBadge.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Compact pill badges with tone variants for light surfaces.",
    bestFor: "Status chips on lists and cards.",
    relatedBuilderComponents: ["badges"],
    tags: ["Alert Variant Source", "Base UI"],
    notes: "For full alert/toast matrices combine UI Builder variants with Sneat `ui-alerts.html` / `ui-toasts.html` iframes.",
  },
  {
    id: "tw-react-smarthr-modal",
    title: "SmarthrModal (React)",
    category: "Advanced UI",
    subcategory: "Modal dialog",
    originalPath: "src/components/smarthr/SmarthrModal.tsx",
    publicPath: "src/components/smarthr/SmarthrModal.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Modal shell for confirmations and forms on SmartHR pages.",
    bestFor: "Dialog framing distinct from generic ui-modals.html demos.",
    relatedBuilderComponents: ["modals"],
    tags: ["Advanced UI Source", "Forms"],
    notes: "Pair with UI Builder modal variants for pixel tuning.",
  },
  {
    id: "tw-react-smarthr-tabs",
    title: "SmarthrTabs (React)",
    category: "Base UI",
    subcategory: "Segmented tabs",
    originalPath: "src/components/smarthr/SmarthrTabs.tsx",
    publicPath: "src/components/smarthr/SmarthrTabs.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Inset tab rail with gradient active segment (Settings-style).",
    bestFor: "Section switching without a full static ui-tabs.html pack.",
    relatedBuilderComponents: ["tabs"],
    tags: ["Base UI", "Navigation"],
    notes: "Builder exposes additional tab visual variants; Sneat `ui-tabs.html` shows Bootstrap tabs/pills in context.",
  },
  {
    id: "tw-react-smarthr-fields",
    title: "SmarthrInput / Select / Textarea (React)",
    category: "Forms",
    subcategory: "Field primitives",
    originalPath: "src/components/smarthr/SmarthrFields.tsx",
    publicPath: "src/components/smarthr/SmarthrFields.tsx",
    iframeSrc: null,
    previewMode: "react-only",
    assetsLoadCorrectly: true,
    showInWorkbench: true,
    description: "Shared input, select, and textarea classes for SmartHR forms.",
    bestFor: "Consistent form controls across Pantry and Settings flows.",
    relatedBuilderComponents: ["form-field", "inputs"],
    tags: ["Forms", "Base UI"],
    notes: "Use alongside pantry-settings.html for HTML vs React comparison.",
  },
];

const SNEAT_TEMPLATE_WORKBENCH_ITEMS = sneatWorkbenchCatalogJson as TemplateWorkbenchItem[];

export const TEMPLATE_WORKBENCH_ITEMS: TemplateWorkbenchItem[] = [
  ..._TEMPLATE_WORKBENCH_LOCAL,
  ...SNEAT_TEMPLATE_WORKBENCH_ITEMS,
];

export const TEMPLATE_WORKBENCH_CATALOG = TEMPLATE_WORKBENCH_ITEMS.filter((i) => i.showInWorkbench);

/** Validate workbench paths (browser-safe URLs vs repo paths). */
export function auditTemplateWorkbenchItemPaths(item: TemplateWorkbenchItem): string[] {
  const issues: string[] = [];
  if (item.thumbnailSrc) {
    if (!item.thumbnailSrc.startsWith("/")) {
      issues.push(`thumbnailSrc must be a site-root path starting with / (got ${item.thumbnailSrc})`);
    }
  }
  if (item.previewMode === "react-only") {
    if (item.iframeSrc != null) {
      issues.push("react-only entries must use iframeSrc: null");
    }
    if (!item.publicPath.startsWith("src/")) {
      issues.push(`React-only publicPath should be under src/ (got ${item.publicPath})`);
    }
    return issues;
  }
  if (item.iframeSrc) {
    if (!item.iframeSrc.startsWith("/template-workbench/")) {
      issues.push(`iframeSrc must start with /template-workbench/ (got ${item.iframeSrc})`);
    }
  }
  if (item.publicPath.startsWith("public/")) {
    if (!item.publicPath.startsWith("public/template-workbench/")) {
      issues.push(`Bundled static publicPath must be under public/template-workbench/ (got ${item.publicPath})`);
    }
  } else if (!item.publicPath.startsWith("src/")) {
    issues.push(`publicPath must be public/template-workbench/... or src/... (got ${item.publicPath})`);
  }
  return issues;
}

for (const item of TEMPLATE_WORKBENCH_ITEMS) {
  const problems = auditTemplateWorkbenchItemPaths(item);
  if (problems.length > 0 && typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.warn(`[template-workbench] catalog path issue: ${item.id}`, problems);
  }
}

const tagSet = new Set<string>();
for (const item of TEMPLATE_WORKBENCH_CATALOG) {
  for (const t of item.tags) {
    tagSet.add(t);
  }
}

export const TEMPLATE_WORKBENCH_ALL_TAGS = [...tagSet].sort((a, b) => a.localeCompare(b));

export type TemplateWorkbenchFilterId = "all" | TemplateWorkbenchCategory | "my-candidates";

export const TEMPLATE_WORKBENCH_CATEGORY_FILTERS: { id: TemplateWorkbenchFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "my-candidates", label: "My Candidates" },
  ...TEMPLATE_WORKBENCH_CATEGORY_ORDER.map((c) => ({ id: c, label: c })),
];

export function matchesWorkbenchSearch(item: TemplateWorkbenchItem, q: string): boolean {
  if (!q.trim()) {
    return true;
  }
  const s = q.trim().toLowerCase();
  const hay = [
    item.title,
    item.description,
    item.bestFor,
    item.subcategory,
    item.category,
    item.originalPath,
    item.publicPath,
    item.thumbnailSrc ?? "",
    ...item.tags,
    ...item.relatedBuilderComponents,
    item.notes,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function itemMatchesTags(item: TemplateWorkbenchItem, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) {
    return true;
  }
  return selectedTags.some((t) => item.tags.includes(t));
}
