import type { ReactElement } from "react";

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

export type CanvasComponent = {
  instanceId: string;
  definitionId: string;
  title: string;
  body: string;
  accent: string;
  size: "compact" | "normal" | "wide";
};

export const CANVAS_SIZES = new Set<CanvasComponent["size"]>(["compact", "normal", "wide"]);

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

export const starterCanvas: CanvasComponent[] = [
  { instanceId: "starter-card", definitionId: "card", title: "Dashboard Card", body: "Editable card based on the admin UI design.", accent: "#ef4444", size: "normal" },
  { instanceId: "starter-buttons", definitionId: "buttons", title: "Action Buttons", body: "Save Changes", accent: "#ef4444", size: "compact" },
  { instanceId: "starter-alerts", definitionId: "alerts", title: "System Alert", body: "This component can be moved, edited, duplicated, or deleted.", accent: "#f97316", size: "normal" },
  { instanceId: "starter-dragula", definitionId: "dragula", title: "Dragula Board", body: "Use this section to plan draggable workflow cards.", accent: "#6366f1", size: "wide" }
];

export function makeInstance(definition: UiComponentDefinition): CanvasComponent {
  return {
    instanceId: `${definition.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    definitionId: definition.id,
    title: definition.defaultTitle,
    body: definition.defaultBody,
    accent: definition.accent,
    size: "normal"
  };
}

export function renderPreview(type: string, item: CanvasComponent): ReactElement {
  switch (type) {
    case "alerts":
      return (
        <div className="wd-preview-alert">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </div>
      );

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

    case "badges":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-badge-row">
            <span>Active</span>
            <span>Pending</span>
            <span>Complete</span>
          </div>
        </div>
      );

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
            <button>Primary</button>
            <button>Secondary</button>
            <button>Outline</button>
          </div>
        </div>
      );

    case "button-group":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-button-group">
            <button>Day</button>
            <button>Week</button>
            <button>Month</button>
          </div>
        </div>
      );

    case "card":
      return (
        <div className="wd-preview-dashboard-card">
          <div>
            <p>Total Components</p>
            <h3>{item.title}</h3>
          </div>
          <strong>+24%</strong>
          <p>{item.body}</p>
        </div>
      );

    case "carousel":
      return (
        <div className="wd-preview-carousel">
          <div>
            <span>01</span>
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

    case "dropdowns":
      return (
        <div className="wd-preview-dropdown">
          <button>{item.title} ▾</button>
          <div>
            <span>Edit</span>
            <span>Duplicate</span>
            <span>Archive</span>
          </div>
        </div>
      );

    case "ratio":
      return (
        <div className="wd-ratio-box">
          <span>{item.title}</span>
        </div>
      );

    case "grid":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-grid-demo">
            <span>Col</span>
            <span>Col</span>
            <span>Col</span>
            <span>Col</span>
          </div>
        </div>
      );

    case "images":
      return (
        <div className="wd-image-demo">
          <div />
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </div>
      );

    case "links":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-link-row">
            <a>View Details</a>
            <a>Open Report</a>
            <a>Learn More</a>
          </div>
        </div>
      );

    case "list-groups":
      return (
        <ul className="wd-list-group">
          <li>{item.title}</li>
          <li>{item.body}</li>
          <li>Recent update completed</li>
        </ul>
      );

    case "modals":
      return (
        <div className="wd-modal-demo">
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <button>Confirm</button>
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

    case "pagination":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-pagination">
            <button>‹</button>
            <button>1</button>
            <button>2</button>
            <button>3</button>
            <button>›</button>
          </div>
        </div>
      );

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

    case "progress":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-progress">
            <span />
          </div>
          <p>{item.body}</p>
        </div>
      );

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

    case "tabs":
      return (
        <div>
          <div className="wd-tabs">
            <button>Overview</button>
            <button>Details</button>
            <button>Activity</button>
          </div>
          <p>{item.body}</p>
        </div>
      );

    case "toasts":
      return (
        <div className="wd-toast-demo">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </div>
      );

    case "tooltips":
      return (
        <div className="wd-tooltip-demo">
          <button>{item.title}</button>
          <span>{item.body}</span>
        </div>
      );

    case "typography":
      return (
        <div className="wd-type-demo">
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          <small>Caption text / label text</small>
        </div>
      );

    case "dragula":
      return (
        <div className="wd-dragula-demo">
          <div>
            <strong>Todo</strong>
            <span>{item.title}</span>
          </div>
          <div>
            <strong>Doing</strong>
            <span>{item.body}</span>
          </div>
        </div>
      );

    case "clipboard":
      return (
        <div className="wd-clipboard-demo">
          <input readOnly value={item.body} />
          <button>Copy</button>
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

    case "lightbox":
      return (
        <div>
          <h3>{item.title}</h3>
          <div className="wd-lightbox-grid">
            <span />
            <span />
            <span />
          </div>
        </div>
      );

    case "scrollbar":
      return (
        <div className="wd-scrollbar-demo">
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <p>Scrollable item one</p>
          <p>Scrollable item two</p>
          <p>Scrollable item three</p>
          <p>Scrollable item four</p>
        </div>
      );

    default:
      return (
        <div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      );
  }
}
