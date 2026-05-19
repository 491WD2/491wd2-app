export const REFERENCE_PAGE_CATEGORY_ORDER = [
  "CRM Module Pages",
  "Application Pages",
  "Layouts",
  "Card Layouts",
  "Sidebar Sizes",
  "Base UI",
  "Advanced UI",
  "Forms",
  "Tables",
  "Dashboards",
  "Other",
] as const;

export type ReferencePageCategory = (typeof REFERENCE_PAGE_CATEGORY_ORDER)[number];

export type ReferencePageKind = "html" | "image";

export type ReferencePageItem = {
  id: string;
  name: string;
  fileType: string;
  /** Original path in repo (not modified). */
  originalPath: string;
  /** Path under repo for the served asset (under `public/` when applicable). */
  publicPath: string;
  /** Absolute-from-site-root URL for `<img>`, links, and iframes. */
  publicUrl: string;
  kind: ReferencePageKind;
  category: ReferencePageCategory;
  whatItShows: string;
  canOpenInBrowser: boolean;
  showInGallery: boolean;
  /** For images: same as `publicUrl`; HTML entries use `null` and a placeholder tile. */
  thumbnailUrl: string | null;
};

export const REFERENCE_PAGES: ReferencePageItem[] = [
  {
    id: "pantry-main",
    name: "Pantry Manager — main interface",
    fileType: "HTML",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/index.html",
    publicPath: "public/reference-pages/html/pantry-index.html",
    publicUrl: "/reference-pages/html/pantry-index.html",
    kind: "html",
    category: "Application Pages",
    whatItShows:
      "Full-page application template: top menu, theme toggle, tabs for categories/products/backup/settings, tables, and modal hooks with original static asset wiring.",
    canOpenInBrowser: true,
    showInGallery: true,
    thumbnailUrl: null,
  },
  {
    id: "pantry-settings",
    name: "Pantry Manager — settings",
    fileType: "HTML",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/settings.html",
    publicPath: "public/reference-pages/html/pantry-settings.html",
    publicUrl: "/reference-pages/html/pantry-settings.html",
    kind: "html",
    category: "Forms",
    whatItShows: "Form-heavy settings layout with grouped fields, labels, and sample instructional copy.",
    canOpenInBrowser: true,
    showInGallery: true,
    thumbnailUrl: null,
  },
  {
    id: "pantry-backup",
    name: "Pantry Manager — backup & restore",
    fileType: "HTML",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/templates/backup.html",
    publicPath: "public/reference-pages/html/pantry-backup.html",
    publicUrl: "/reference-pages/html/pantry-backup.html",
    kind: "html",
    category: "Application Pages",
    whatItShows:
      "Two-column backup/restore section layout. Static preview shows Jinja placeholder for base path; download/upload actions require the original Flask app.",
    canOpenInBrowser: true,
    showInGallery: true,
    thumbnailUrl: null,
  },
  {
    id: "pantry-cog-svg",
    name: "Pantry Manager — settings cog icon",
    fileType: "SVG",
    originalPath: "references/pantry-tracker/pantry_tracker-main/webapp/static/images/cog.svg",
    publicPath: "public/reference-pages/pantry-tracker-webapp/static/images/cog.svg",
    publicUrl: "/reference-pages/pantry-tracker-webapp/static/images/cog.svg",
    kind: "image",
    category: "Base UI",
    whatItShows: "Small gear icon used in the Pantry top bar (vector asset).",
    canOpenInBrowser: true,
    showInGallery: true,
    thumbnailUrl: "/reference-pages/pantry-tracker-webapp/static/images/cog.svg",
  },
];

export const GALLERY_REFERENCE_PAGES = REFERENCE_PAGES.filter((p) => p.showInGallery);

export type ReferencePageFilterId = "all" | ReferencePageCategory;

export const REFERENCE_PAGE_FILTER_OPTIONS: { id: ReferencePageFilterId; label: string }[] = [
  { id: "all", label: "All" },
  ...REFERENCE_PAGE_CATEGORY_ORDER.map((c) => ({ id: c, label: c })),
];

export function matchesReferenceSearch(item: ReferencePageItem, q: string): boolean {
  if (!q.trim()) {
    return true;
  }
  const s = q.trim().toLowerCase();
  const hay = [item.name, item.originalPath, item.publicPath, item.whatItShows, item.category, item.fileType]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}
