export const TEMPLATE_WORKBENCH_CATEGORY_ORDER = [
  "Dashboards",
  "CRM Module Pages",
  "Application Pages",
  "People / Employee Pages",
  "Pantry Candidate Layouts",
  "Base UI",
  "Advanced UI",
  "Forms",
  "Tables",
  "Layout Systems",
  "Card Layouts",
  "Sidebar / Navigation",
  "Other",
] as const;

export type TemplateWorkbenchCategory = (typeof TEMPLATE_WORKBENCH_CATEGORY_ORDER)[number];

export type TemplateWorkbenchPreviewMode = "static-iframe" | "react-only";

export type TemplateWorkbenchItem = {
  id: string;
  title: string;
  category: TemplateWorkbenchCategory;
  subcategory: string;
  originalPath: string;
  /** Repo-relative path: `public/...` for static assets or `src/...` for React sources. */
  publicPath: string;
  /** Site-root URL for iframe when static HTML is present. */
  iframeSrc: string | null;
  /** Optional raster preview under `public/` (site-root URL, e.g. `/template-workbench/thumbs/foo.png`). */
  thumbnailSrc?: string | null;
  previewMode: TemplateWorkbenchPreviewMode;
  /** Whether linked CSS/JS load when served from Vite `public/`. */
  assetsLoadCorrectly: boolean;
  showInWorkbench: boolean;
  description: string;
  bestFor: string;
  relatedBuilderComponents: string[];
  tags: string[];
  /** Static catalog notes (user planning notes use localStorage). */
  notes: string;
};
