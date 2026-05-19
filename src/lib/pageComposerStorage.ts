import type { CanvasComponent } from "./uiBuilderLayout";
import { validateCanvasPayload } from "./uiBuilderLayout";

export const PAGE_COMPOSER_STORAGE_KEY = "491wd-page-composer-layouts";

export const PAGE_COMPOSER_PAGE_IDS = ["pantry"] as const;

export type PageComposerPageId = (typeof PAGE_COMPOSER_PAGE_IDS)[number];

export type PageComposerLayout = {
  pageId: string;
  sections: CanvasComponent[];
};

type StoreRootV1 = {
  version: 1;
  layouts: PageComposerLayout[];
};

export const PAGE_COMPOSER_UPDATED_EVENT = "491wd-page-composer-updated";

function dispatchUpdated(pageId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(PAGE_COMPOSER_UPDATED_EVENT, { detail: { pageId } }));
}

function parseRoot(raw: string | null): StoreRootV1 {
  if (raw === null || raw === "") {
    return { version: 1, layouts: [] };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { version: 1, layouts: [] };
    }
    const layoutsUnknown = (parsed as { layouts?: unknown }).layouts;
    if (!Array.isArray(layoutsUnknown)) {
      return { version: 1, layouts: [] };
    }
    const byPage = new Map<string, PageComposerLayout>();
    for (const row of layoutsUnknown) {
      if (!row || typeof row !== "object") {
        continue;
      }
      const pageId = (row as { pageId?: unknown }).pageId;
      const sections = (row as { sections?: unknown }).sections;
      if (typeof pageId !== "string" || !pageId) {
        continue;
      }
      if (!validateCanvasPayload(sections)) {
        continue;
      }
      byPage.set(pageId, { pageId, sections });
    }
    return { version: 1, layouts: [...byPage.values()] };
  } catch {
    return { version: 1, layouts: [] };
  }
}

function loadRoot(): StoreRootV1 {
  try {
    return parseRoot(localStorage.getItem(PAGE_COMPOSER_STORAGE_KEY));
  } catch {
    return { version: 1, layouts: [] };
  }
}

function writeRoot(root: StoreRootV1) {
  try {
    localStorage.setItem(PAGE_COMPOSER_STORAGE_KEY, JSON.stringify(root));
  } catch {
    /* ignore */
  }
}

export function loadPageComposerLayout(pageId: string): CanvasComponent[] {
  const root = loadRoot();
  const hit = root.layouts.find((l) => l.pageId === pageId);
  return hit?.sections ?? [];
}

export function savePageComposerLayout(pageId: string, sections: CanvasComponent[]): void {
  if (!validateCanvasPayload(sections)) {
    return;
  }
  const root = loadRoot();
  const others = root.layouts.filter((l) => l.pageId !== pageId);
  const next: StoreRootV1 = { version: 1, layouts: [...others, { pageId, sections }] };
  writeRoot(next);
  dispatchUpdated(pageId);
}

export function resetPageComposerLayout(pageId: string): void {
  savePageComposerLayout(pageId, []);
}
