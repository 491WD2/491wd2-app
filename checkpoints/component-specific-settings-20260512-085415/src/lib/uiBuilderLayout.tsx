import { createElement, type ReactElement } from "react";

export const LAYOUT_STORAGE_KEY = "491wd-ui-builder-layout";
export const APPLIED_LAYOUT_STORAGE_KEY = "491wd-applied-ui-layout";
export const CANVAS_ITEM_DRAG_TYPE = "application/x-491wd-canvas-item";
export const PALETTE_DRAG_TYPE = "component-definition";

export type UiCategory = "Base UI" | "Advanced UI";

export type UiComponentDefinition = {
  id: string;
  name: string;
  category: UiCategory;
  description: string;
  defaultTitle: string;
  defaultBody: string;
  accent: string;
};

export type CanvasSettingsValue = string | number | boolean | string[];

export type CanvasSettings = Record<string, CanvasSettingsValue>;

export type CanvasComponent = {
  instanceId: string;
  definitionId: string;
  title: string;
  body: string;
  accent: string;
  size: "compact" | "normal" | "wide";
  settings?: CanvasSettings;
};

export const CANVAS_SIZES = new Set<CanvasComponent["size"]>(["compact", "normal", "wide"]);

function isValidSettingsValue(v: unknown): v is CanvasSettingsValue {
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return true;
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return true;
  return false;
}

function validateSettingsObject(o: unknown): o is CanvasSettings {
  if (o === undefined) return true;
  if (o === null || typeof o !== "object" || Array.isArray(o)) return false;
  return Object.values(o as Record<string, unknown>).every(isValidSettingsValue);
}

export function validateCanvasPayload(data: unknown): data is CanvasComponent[] {
  if (!Array.isArray(data)) return false;
  for (const row of data) {
    if (!row || typeof row !== "object") return false;
    const o = row as Record<string, unknown>;
    if (typeof o.instanceId !== "string" || !o.instanceId) return false;
    if (typeof o.definitionId !== "string" || !o.definitionId) return false;
    if (!uiComponents.some((c) => c.id === o.definitionId)) return false;
    if (typeof o.title !== "string") return false;
    if (typeof o.body !== "string") return false;
    if (typeof o.accent !== "string") return false;
    if (typeof o.size !== "string" || !CANVAS_SIZES.has(o.size as CanvasComponent["size"])) return false;
    if ("settings" in o && o.settings !== undefined && !validateSettingsObject(o.settings)) return false;
  }
  return true;
}

export function loadCanvasFromStorageKey(storageKey: string): CanvasComponent[] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null || raw === "") return null;
    const parsed: unknown = JSON.parse(raw);
    if (validateCanvasPayload(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function loadCanvasFromStorage(): CanvasComponent[] | null {
  return loadCanvasFromStorageKey(LAYOUT_STORAGE_KEY);
}

export function loadAppliedCanvasFromStorage(): CanvasComponent[] | null {
  return loadCanvasFromStorageKey(APPLIED_LAYOUT_STORAGE_KEY);
}

export function insertCanvasItemAt(
  items: CanvasComponent[],
  newItem: CanvasComponent,
  targetId: string,
  position: "before" | "after",
): CanvasComponent[] {
  const idx = items.findIndex((i) => i.instanceId === targetId);
  if (idx < 0) return [...items, newItem];
  const insertIndex = position === "before" ? idx : idx + 1;
  const next = [...items];
  next.splice(insertIndex, 0, newItem);
  return next;
}

export function reorderCanvasItems(
  items: CanvasComponent[],
  draggedId: string,
  targetId: string,
  position: "before" | "after",
): CanvasComponent[] {
  if (draggedId === targetId) return items;
  const dragged = items.find((i) => i.instanceId === draggedId);
  if (!dragged) return items;
  const without = items.filter((i) => i.instanceId !== draggedId);
  let insertIndex = without.findIndex((i) => i.instanceId === targetId);
  if (insertIndex < 0) return [...without, dragged];
  if (position === "after") insertIndex += 1;
  const next = [...without];
  next.splice(insertIndex, 0, dragged);
  return next;
}

export const uiComponents: UiComponentDefinition[] = [
  { id: "alerts", name: "Alerts", category: "Base UI", description: "Status, warning, success, and information messages.", defaultTitle: "Success Alert", defaultBody: "Your update has been saved successfully.", accent: "#ef4444" },
  { id: "accordion", name: "Accordion", category: "Base UI", description: "Stacked expandable content sections.", defaultTitle: "Accordion Section", defaultBody: "Use this area for expandable details and grouped settings.", accent: "#f97316" },
  { id: "avatar", name: "Avatar", category: "Base UI", description: "User profile images, initials, and team stacks.", defaultTitle: "Team Avatars", defaultBody: "Display users, owners, or assigned team members.", accent: "#6366f1" },
  { id: "badges", name: "Badges", category: "Base UI", description: "Small labels for status and categories.", defaultTitle: "Status Badges", defaultBody: "Active, Pending, Draft, Complete", accent: "#14b8a6" },
  { id: "breadcrumb", name: "Breadcrumb", category: "Base UI", description: "Page location and navigation hierarchy.", defaultTitle: "Breadcrumb Trail", defaultBody: "Dashboard / UI / Components", accent: "#0ea5e9" },
  { id: "buttons", name: "Buttons", category: "Base UI", description: "Primary, secondary, outline, and action buttons.", defaultTitle: "Action Buttons", defaultBody: "Save Changes", accent: "#ef4444" },
  { id: "button-group", name: "Button Group", category: "Base UI", description: "Grouped actions and segmented controls.", defaultTitle: "Button Group", defaultBody: "Day / Week / Month", accent: "#8b5cf6" },
  { id: "card", name: "Card", category: "Base UI", description: "Flexible content containers.", defaultTitle: "Dashboard Card", defaultBody: "Use cards to group metrics, forms, and content.", accent: "#f97316" },
  { id: "carousel", name: "Carousel", category: "Base UI", description: "Rotating featured panels or image slides.", defaultTitle: "Carousel Slide", defaultBody: "Feature promotions, screenshots, or onboarding steps.", accent: "#06b6d4" },
  { id: "collapse", name: "Collapse", category: "Base UI", description: "Show or hide content blocks.", defaultTitle: "Collapse Panel", defaultBody: "Expandable content is placed here.", accent: "#22c55e" },
  { id: "dropdowns", name: "Dropdowns", category: "Base UI", description: "Menus for actions and options.", defaultTitle: "Dropdown Menu", defaultBody: "Edit, Duplicate, Archive", accent: "#f59e0b" },
  { id: "ratio", name: "Ratio", category: "Base UI", description: "Responsive media aspect-ratio blocks.", defaultTitle: "Responsive Ratio", defaultBody: "16:9 media preview", accent: "#3b82f6" },
  { id: "grid", name: "Grid", category: "Base UI", description: "Responsive layout columns.", defaultTitle: "Grid Layout", defaultBody: "Arrange content into flexible columns.", accent: "#10b981" },
  { id: "images", name: "Images", category: "Base UI", description: "Responsive image blocks and thumbnails.", defaultTitle: "Image Block", defaultBody: "Upload or preview visual content.", accent: "#ec4899" },
  { id: "links", name: "Links", category: "Base UI", description: "Inline, button, and navigation links.", defaultTitle: "Useful Links", defaultBody: "View Details / Learn More / Open Report", accent: "#2563eb" },
  { id: "list-groups", name: "List Groups", category: "Base UI", description: "Stacked lists for records and menu items.", defaultTitle: "List Group", defaultBody: "Recent activity and grouped records.", accent: "#64748b" },
  { id: "modals", name: "Modals", category: "Base UI", description: "Centered dialogs and confirmations.", defaultTitle: "Confirmation Modal", defaultBody: "Are you sure you want to continue?", accent: "#ef4444" },
  { id: "offcanvas", name: "Offcanvas", category: "Base UI", description: "Sliding side panels.", defaultTitle: "Offcanvas Panel", defaultBody: "Use this for filters, details, or quick settings.", accent: "#7c3aed" },
  { id: "pagination", name: "Pagination", category: "Base UI", description: "Page navigation controls.", defaultTitle: "Pagination", defaultBody: "Previous / 1 / 2 / 3 / Next", accent: "#0f766e" },
  { id: "placeholders", name: "Placeholders", category: "Base UI", description: "Skeleton loading states.", defaultTitle: "Loading Placeholder", defaultBody: "Use while data is loading.", accent: "#94a3b8" },
  { id: "popovers", name: "Popovers", category: "Base UI", description: "Floating helper content.", defaultTitle: "Popover", defaultBody: "Helpful context appears here.", accent: "#ea580c" },
  { id: "progress", name: "Progress", category: "Base UI", description: "Progress bars and completion indicators.", defaultTitle: "Progress", defaultBody: "Project completion: 72%", accent: "#16a34a" },
  { id: "spinner", name: "Spinner", category: "Base UI", description: "Loading indicators.", defaultTitle: "Spinner", defaultBody: "Loading content...", accent: "#dc2626" },
  { id: "tabs", name: "Tabs", category: "Base UI", description: "Tabbed content sections.", defaultTitle: "Tabs", defaultBody: "Overview / Details / Activity", accent: "#4f46e5" },
  { id: "toasts", name: "Toasts", category: "Base UI", description: "Small notification messages.", defaultTitle: "Toast Notification", defaultBody: "New update available.", accent: "#0891b2" },
  { id: "tooltips", name: "Tooltips", category: "Base UI", description: "Small hover hints.", defaultTitle: "Tooltip", defaultBody: "Hover for helpful information.", accent: "#111827" },
  { id: "typography", name: "Typography", category: "Base UI", description: "Headings, paragraphs, and text styles.", defaultTitle: "Typography", defaultBody: "Clean headings, readable body copy, and labels.", accent: "#334155" },
  { id: "dragula", name: "Dragula", category: "Advanced UI", description: "Drag-and-drop style cards and lanes.", defaultTitle: "Dragula Board", defaultBody: "Move cards between workflow stages.", accent: "#ef4444" },
  { id: "clipboard", name: "Clipboard", category: "Advanced UI", description: "Copy text and values to clipboard.", defaultTitle: "Clipboard", defaultBody: "Copy this reusable value.", accent: "#0ea5e9" },
  { id: "sweet-alerts", name: "Sweet Alerts", category: "Advanced UI", description: "Enhanced alert and confirmation dialogs.", defaultTitle: "Sweet Alert", defaultBody: "Beautiful confirmation message.", accent: "#f43f5e" },
  { id: "lightbox", name: "Lightbox", category: "Advanced UI", description: "Image preview gallery style component.", defaultTitle: "Lightbox Gallery", defaultBody: "Preview images in a focused gallery.", accent: "#8b5cf6" },
  { id: "scrollbar", name: "Scrollbar", category: "Advanced UI", description: "Styled scrolling content panels.", defaultTitle: "Custom Scrollbar", defaultBody: "Scrollable content area with styled UI.", accent: "#14b8a6" }
];

/** Default `settings` merged in `makeInstance` for each definition id (optional keys). */
export const DEFAULT_COMPONENT_SETTINGS: Record<string, CanvasSettings> = {
  alerts: { variant: "success", dismissible: true },
  buttons: { primaryLabel: "Primary", secondaryLabel: "Secondary", outlineLabel: "Outline" },
  "button-group": { options: ["Day", "Week", "Month"] },
  badges: { labels: ["Active", "Pending", "Complete"] },
  card: { metricLabel: "Total Components", metricValue: "", trendLabel: "+24%" },
  carousel: { slideNumber: "01" },
  dropdowns: { menuItems: ["Edit", "Duplicate", "Archive"] },
  grid: { columns: 4 },
  images: { imageLabel: "Preview" },
  links: { labels: ["View Details", "Open Report", "Learn More"] },
  "list-groups": { items: ["Recent activity", "Grouped records", "Recent update completed"] },
  modals: { confirmLabel: "Confirm" },
  pagination: { pages: ["1", "2", "3"] },
  progress: { percent: 72 },
  tabs: { labels: ["Overview", "Details", "Activity"] },
  toasts: { timeLabel: "Just now" },
  typography: { headingLevel: 2 },
  dragula: { leftTitle: "Todo", rightTitle: "Doing" },
  clipboard: { value: "" },
  lightbox: { imageCount: 3 },
  scrollbar: { items: ["Scrollable item one", "Scrollable item two", "Scrollable item three", "Scrollable item four"] },
};

export type InspectorFieldType = "string" | "number" | "boolean" | "stringList";

export type InspectorFieldDef = {
  key: string;
  label: string;
  type: InspectorFieldType;
};

/** Dynamic inspector fields keyed by component definition id. */
export const INSPECTOR_SETTINGS_FIELDS: Partial<Record<string, InspectorFieldDef[]>> = {
  alerts: [
    { key: "variant", label: "Variant", type: "string" },
    { key: "dismissible", label: "Dismissible", type: "boolean" },
  ],
  buttons: [
    { key: "primaryLabel", label: "Primary label", type: "string" },
    { key: "secondaryLabel", label: "Secondary label", type: "string" },
    { key: "outlineLabel", label: "Outline label", type: "string" },
  ],
  "button-group": [{ key: "options", label: "Options (one per line)", type: "stringList" }],
  badges: [{ key: "labels", label: "Labels (one per line)", type: "stringList" }],
  card: [
    { key: "metricLabel", label: "Metric label", type: "string" },
    { key: "metricValue", label: "Metric value (heading)", type: "string" },
    { key: "trendLabel", label: "Trend label", type: "string" },
  ],
  carousel: [{ key: "slideNumber", label: "Slide number", type: "string" }],
  dropdowns: [{ key: "menuItems", label: "Menu items (one per line)", type: "stringList" }],
  grid: [{ key: "columns", label: "Columns", type: "number" }],
  images: [{ key: "imageLabel", label: "Image label", type: "string" }],
  links: [{ key: "labels", label: "Link labels (one per line)", type: "stringList" }],
  "list-groups": [{ key: "items", label: "List items (one per line)", type: "stringList" }],
  modals: [{ key: "confirmLabel", label: "Confirm button label", type: "string" }],
  pagination: [{ key: "pages", label: "Page labels (one per line)", type: "stringList" }],
  progress: [{ key: "percent", label: "Percent", type: "number" }],
  tabs: [{ key: "labels", label: "Tab labels (one per line)", type: "stringList" }],
  toasts: [{ key: "timeLabel", label: "Time label", type: "string" }],
  typography: [{ key: "headingLevel", label: "Heading level (1–6)", type: "number" }],
  dragula: [
    { key: "leftTitle", label: "Left column title", type: "string" },
    { key: "rightTitle", label: "Right column title", type: "string" },
  ],
  clipboard: [{ key: "value", label: "Copy value", type: "string" }],
  lightbox: [{ key: "imageCount", label: "Image count", type: "number" }],
  scrollbar: [{ key: "items", label: "Scroll items (one per line)", type: "stringList" }],
};

export function getDefaultSettingsFor(definitionId: string): CanvasSettings {
  const base = DEFAULT_COMPONENT_SETTINGS[definitionId];
  return base ? { ...base } : {};
}

export const starterCanvas: CanvasComponent[] = [
  {
    instanceId: "starter-card",
    definitionId: "card",
    title: "Dashboard Card",
    body: "Editable card based on the admin UI design.",
    accent: "#ef4444",
    size: "normal",
    settings: {
      metricLabel: "Total Components",
      metricValue: "Dashboard Card",
      trendLabel: "+24%",
    },
  },
  {
    instanceId: "starter-buttons",
    definitionId: "buttons",
    title: "Action Buttons",
    body: "Save Changes",
    accent: "#ef4444",
    size: "compact",
    settings: { primaryLabel: "Primary", secondaryLabel: "Secondary", outlineLabel: "Outline" },
  },
  {
    instanceId: "starter-alerts",
    definitionId: "alerts",
    title: "System Alert",
    body: "This component can be moved, edited, duplicated, or deleted.",
    accent: "#f97316",
    size: "normal",
    settings: { variant: "warning", dismissible: true },
  },
  {
    instanceId: "starter-dragula",
    definitionId: "dragula",
    title: "Dragula Board",
    body: "Use this section to plan draggable workflow cards.",
    accent: "#6366f1",
    size: "wide",
    settings: { leftTitle: "Todo", rightTitle: "Doing" },
  },
];

export function makeInstance(definition: UiComponentDefinition): CanvasComponent {
  const settings: CanvasSettings = { ...getDefaultSettingsFor(definition.id) };
  if (definition.id === "clipboard") {
    settings.value = definition.defaultBody;
  }
  if (definition.id === "card" && (settings.metricValue === "" || settings.metricValue === undefined)) {
    settings.metricValue = definition.defaultTitle;
  }
  return {
    instanceId: `${definition.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    definitionId: definition.id,
    title: definition.defaultTitle,
    body: definition.defaultBody,
    accent: definition.accent,
    size: "normal",
    settings,
  };
}

function readStringSetting(item: CanvasComponent, key: string, fallback: string): string {
  const v = item.settings?.[key];
  return typeof v === "string" ? v : fallback;
}

function readStringSettingNonEmpty(item: CanvasComponent, key: string, fallback: string): string {
  const v = item.settings?.[key];
  if (typeof v === "string" && v.trim() !== "") return v;
  return fallback;
}

function readNumberSetting(item: CanvasComponent, key: string, fallback: number): number {
  const v = item.settings?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function readBooleanSetting(item: CanvasComponent, key: string, fallback: boolean): boolean {
  const v = item.settings?.[key];
  return typeof v === "boolean" ? v : fallback;
}

function readStringListSetting(item: CanvasComponent, key: string, fallback: string[]): string[] {
  const v = item.settings?.[key];
  if (Array.isArray(v) && v.length > 0) return v;
  return fallback;
}

export function renderPreview(type: string, item: CanvasComponent): ReactElement {
  switch (type) {
    case "alerts": {
      const variant = readStringSetting(item, "variant", "success");
      const allowed = new Set(["success", "warning", "danger", "info", "neutral"]);
      const vClass = allowed.has(variant) ? variant : "success";
      const dismissible = readBooleanSetting(item, "dismissible", true);
      return (
        <div className={`wd-preview-alert wd-preview-alert--${vClass}`}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          {dismissible ? (
            <span className="wd-preview-alert-dismiss" aria-hidden>
              ×
            </span>
          ) : null}
        </div>
      );
    }

    case "accordion":
      return (
        <div className="wd-preview-accordion">
          <details open>
            <summary>{item.title}</summary>
            <p>{item.body}</p>
          </details>
          <details>
            <summary>More Details</summary>
            <p>Additional collapsible content.</p>
          </details>
        </div>
      );

    case "avatar":
      return (
        <div className="wd-preview-avatar">
          <div className="wd-avatar-stack">
            <span>SO</span>
            <span>AM</span>
            <span>JD</span>
          </div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      );

    case "badges": {
      const labels = readStringListSetting(item, "labels", ["Active", "Pending", "Complete"]);
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-badge-row">
            {labels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
      );
    }

    case "breadcrumb":
      return (
        <div className="wd-breadcrumb">
          <span>Dashboard</span>
          <span>UI</span>
          <strong>{item.title}</strong>
        </div>
      );

    case "buttons":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-button-row">
            <button>{readStringSetting(item, "primaryLabel", "Primary")}</button>
            <button>{readStringSetting(item, "secondaryLabel", "Secondary")}</button>
            <button>{readStringSetting(item, "outlineLabel", "Outline")}</button>
          </div>
        </div>
      );

    case "button-group": {
      const options = readStringListSetting(item, "options", ["Day", "Week", "Month"]);
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-button-group">
            {options.map((opt, i) => (
              <button key={i} type="button">
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "card":
      return (
        <div className="wd-preview-dashboard-card">
          <div>
            <p>{readStringSetting(item, "metricLabel", "Total Components")}</p>
            <h3>{readStringSettingNonEmpty(item, "metricValue", item.title)}</h3>
          </div>
          <strong>{readStringSetting(item, "trendLabel", "+24%")}</strong>
          <p>{item.body}</p>
        </div>
      );

    case "carousel":
      return (
        <div className="wd-preview-carousel">
          <div>
            <span>{readStringSetting(item, "slideNumber", "01")}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      );

    case "collapse":
      return (
        <details className="wd-preview-collapse" open>
          <summary>{item.title}</summary>
          <p>{item.body}</p>
        </details>
      );

    case "dropdowns": {
      const menuItems = readStringListSetting(item, "menuItems", ["Edit", "Duplicate", "Archive"]);
      return (
        <div className="wd-preview-dropdown">
          <button type="button">
            {item.title} ▾
          </button>
          <div>
            {menuItems.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </div>
      );
    }

    case "ratio":
      return (
        <div className="wd-ratio-box">
          <span>{item.title}</span>
        </div>
      );

    case "grid": {
      const cols = Math.min(12, Math.max(1, Math.floor(readNumberSetting(item, "columns", 4))));
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-grid-demo">
            {Array.from({ length: cols }, (_, i) => (
              <span key={i}>Col</span>
            ))}
          </div>
        </div>
      );
    }

    case "images": {
      const imageLabel = readStringSetting(item, "imageLabel", "Preview");
      return (
        <div className="wd-image-demo">
          <div>
            <span className="wd-image-demo-label">{imageLabel}</span>
          </div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      );
    }

    case "links": {
      const linkLabels = readStringListSetting(item, "labels", ["View Details", "Open Report", "Learn More"]);
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-link-row">
            {linkLabels.map((label, i) => (
              <a key={i} href="#preview" onClick={(e) => e.preventDefault()}>
                {label}
              </a>
            ))}
          </div>
        </div>
      );
    }

    case "list-groups": {
      const listItems = readStringListSetting(item, "items", [item.title, item.body, "Recent update completed"]);
      return (
        <ul className="wd-list-group">
          {listItems.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      );
    }

    case "modals":
      return (
        <div className="wd-modal-demo">
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <button type="button">{readStringSetting(item, "confirmLabel", "Confirm")}</button>
          </div>
        </div>
      );

    case "offcanvas":
      return (
        <div className="wd-offcanvas-demo">
          <aside>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </aside>
          <div />
        </div>
      );

    case "pagination": {
      const pages = readStringListSetting(item, "pages", ["1", "2", "3"]);
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-pagination">
            <button type="button">‹</button>
            {pages.map((p, i) => (
              <button key={i} type="button">
                {p}
              </button>
            ))}
            <button type="button">›</button>
          </div>
        </div>
      );
    }

    case "placeholders":
      return (
        <div className="wd-placeholder-demo">
          <span />
          <span />
          <span />
        </div>
      );

    case "popovers":
      return (
        <div className="wd-popover-demo">
          <button>{item.title}</button>
          <div>{item.body}</div>
        </div>
      );

    case "progress": {
      const pct = Math.min(100, Math.max(0, readNumberSetting(item, "percent", 72)));
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p>{item.body}</p>
        </div>
      );
    }

    case "spinner":
      return (
        <div className="wd-spinner-demo">
          <span />
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      );

    case "tabs": {
      const tabLabels = readStringListSetting(item, "labels", ["Overview", "Details", "Activity"]);
      return (
        <div>
          <div className="wd-tabs">
            {tabLabels.map((label, i) => (
              <button key={i} type="button">
                {label}
              </button>
            ))}
          </div>
          <p>{item.body}</p>
        </div>
      );
    }

    case "toasts":
      return (
        <div className="wd-toast-demo">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <small className="wd-toast-time">{readStringSetting(item, "timeLabel", "Just now")}</small>
        </div>
      );

    case "tooltips":
      return (
        <div className="wd-tooltip-demo">
          <button>{item.title}</button>
          <span>{item.body}</span>
        </div>
      );

    case "typography": {
      const level = Math.min(6, Math.max(1, Math.round(readNumberSetting(item, "headingLevel", 2))));
      const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
      const tag = headingTags[level - 1];
      return (
        <div className="wd-type-demo">
          {createElement(tag, null, item.title)}
          <p>{item.body}</p>
          <small>Caption text / label text</small>
        </div>
      );
    }

    case "dragula":
      return (
        <div className="wd-dragula-demo">
          <div>
            <strong>{readStringSetting(item, "leftTitle", "Todo")}</strong>
            <span>{item.title}</span>
          </div>
          <div>
            <strong>{readStringSetting(item, "rightTitle", "Doing")}</strong>
            <span>{item.body}</span>
          </div>
        </div>
      );

    case "clipboard":
      return (
        <div className="wd-clipboard-demo">
          <input readOnly value={readStringSetting(item, "value", item.body)} />
          <button type="button">Copy</button>
        </div>
      );

    case "sweet-alerts":
      return (
        <div className="wd-sweet-alert-demo">
          <div>!</div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <button>Okay</button>
        </div>
      );

    case "lightbox": {
      const imageCount = Math.min(12, Math.max(1, Math.floor(readNumberSetting(item, "imageCount", 3))));
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-lightbox-grid">
            {Array.from({ length: imageCount }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
      );
    }

    case "scrollbar": {
      const scrollItems = readStringListSetting(item, "items", [
        "Scrollable item one",
        "Scrollable item two",
        "Scrollable item three",
        "Scrollable item four",
      ]);
      return (
        <div className="wd-scrollbar-demo">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          {scrollItems.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      );
    }

    default:
      return (
        <div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      );
  }
}
