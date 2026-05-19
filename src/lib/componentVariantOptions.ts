/** Style variant lists per UI Builder definition id. Sync with docs/ui-variant-inventory.md. */

export const COMPONENT_VARIANT_OPTIONS: Record<string, readonly string[]> = {
  buttons: [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "light",
    "dark",
    "outline-primary",
    "outline-secondary",
    "outline-danger",
    "rounded",
    "pill",
    "icon",
    "block",
    "small",
    "large",
  ],
  alerts: [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "light",
    "dark",
    "bordered",
    "dismissible",
    "icon",
    "neutral",
  ],
  badges: ["solid", "outline", "soft", "rounded", "pill", "status-dot"],
  card: ["basic", "shadow", "bordered", "metric", "image", "profile", "action", "horizontal"],
  modals: ["basic", "centered", "large", "small", "confirmation", "form", "danger"],
  dropdowns: ["basic", "split", "icon", "right-aligned", "dark", "grouped"],
  progress: ["basic", "striped", "animated", "stacked", "thin", "thick"],
  spinner: ["border", "grow", "small", "large", "colored"],
  tabs: ["basic", "pills", "underline", "vertical", "boxed"],
  toasts: ["basic", "success", "warning", "danger", "dark", "stacked"],
  accordion: ["basic", "flush", "bordered", "icon", "numbered"],
  avatar: ["initials", "image", "rounded", "stacked", "status"],
  breadcrumb: ["basic", "arrow", "slash", "pill", "compact"],
  "button-group": ["basic", "segmented", "vertical", "toolbar"],
  carousel: ["basic", "indicators", "controls", "caption", "card-slider"],
  collapse: ["basic", "multi", "card", "faq"],
  ratio: ["1x1", "4x3", "16x9", "21x9"],
  grid: ["2-column", "3-column", "4-column", "masonry", "responsive"],
  images: ["rounded", "circle", "thumbnail", "figure", "overlay"],
  links: ["default", "muted", "underline", "button-link", "external"],
  "list-groups": ["basic", "active", "flush", "numbered", "checkbox", "action"],
  offcanvas: ["left", "right", "top", "bottom", "filter-panel", "details-panel"],
  pagination: ["basic", "rounded", "small", "large", "simple", "with-labels"],
  placeholders: ["text", "card", "image", "paragraph", "animated"],
  popovers: ["top", "right", "bottom", "left", "rich-content"],
  tooltips: ["top", "right", "bottom", "left", "dark", "light"],
  typography: ["heading", "display", "paragraph", "quote", "list", "code"],
  dragula: ["kanban", "two-column", "task-board", "compact", "card-sort"],
  clipboard: ["input-copy", "code-copy", "button-copy", "success-state"],
  "sweet-alerts": ["success", "warning", "error", "info", "confirmation", "delete-confirm"],
  lightbox: ["gallery", "single-image", "masonry-gallery", "caption-gallery", "grid-preview"],
  scrollbar: ["vertical", "horizontal", "compact", "panel", "long-content"],
};

export function cssSafeVariant(v: string): string {
  const s = v.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  if (!s) return "default";
  if (/^[0-9]/.test(s)) return `r-${s}`;
  return s;
}

export function defaultVariantFor(definitionId: string): string {
  const list = COMPONENT_VARIANT_OPTIONS[definitionId];
  return list?.[0] ?? "default";
}

export function normalizeVariant(definitionId: string, value: unknown): string {
  const list = COMPONENT_VARIANT_OPTIONS[definitionId];
  if (!list?.length) return defaultVariantFor(definitionId);
  if (typeof value === "string" && list.includes(value)) return value;
  return list[0];
}

export function hasVariantSupport(definitionId: string): boolean {
  const list = COMPONENT_VARIANT_OPTIONS[definitionId];
  return !!list && list.length > 0;
}
