import type { PantryUsageStore } from "../types/pantryInsights";

export const PANTRY_USAGE_STORAGE_KEY = "familysite-491:pantry-usage-patterns";

function itemKey(name: string, category: string): string {
  return `${category.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

export function loadPantryUsageStore(): PantryUsageStore {
  if (typeof window === "undefined") {
    return { version: 1, byItemKey: {} };
  }
  try {
    const raw = window.localStorage.getItem(PANTRY_USAGE_STORAGE_KEY);
    if (!raw) {
      return { version: 1, byItemKey: {} };
    }
    const parsed = JSON.parse(raw) as PantryUsageStore;
    if (parsed.version === 1 && parsed.byItemKey) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return { version: 1, byItemKey: {} };
}

export function savePantryUsageStore(store: PantryUsageStore): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PANTRY_USAGE_STORAGE_KEY, JSON.stringify(store));
}

export function recordPantryItemUsed(name: string, category: string): void {
  const store = loadPantryUsageStore();
  const key = itemKey(name, category);
  const prev = store.byItemKey[key];
  store.byItemKey[key] = {
    usedCount: (prev?.usedCount ?? 0) + 1,
    lastUsedAt: new Date().toISOString(),
  };
  savePantryUsageStore(store);
}

export function getUsageScore(name: string, category: string): number {
  const key = itemKey(name, category);
  return loadPantryUsageStore().byItemKey[key]?.usedCount ?? 0;
}
