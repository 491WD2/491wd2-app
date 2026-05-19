import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeInventoryItem } from "../lib/pantryBoard";
import {
  FOOD_STORAGE_LOCATIONS,
  type FoodInventoryItem,
  type FoodInventoryItemSource,
  type FoodInventoryPersistedState,
  type FoodStorageLocation,
  type InventoryFilterPreset,
  type InventorySortDirection,
  type InventorySortKey,
  getInventoryExpiryStatus,
  parseInventoryDate,
} from "../types/inventory";

export const FOOD_INVENTORY_STORAGE_KEY = "familysite-491:food-inventory-dashboard";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function seedItems(): FoodInventoryItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: newId(),
      name: "Whole milk",
      quantity: 1,
      unit: "gal",
      expiryDate: "2026-05-18",
      location: "fridge",
      category: "Dairy",
      updatedAt: now,
    },
    {
      id: newId(),
      name: "Greek yogurt",
      quantity: 4,
      unit: "cups",
      expiryDate: "2026-05-20",
      location: "fridge",
      category: "Dairy",
      updatedAt: now,
    },
    {
      id: newId(),
      name: "Frozen peas",
      quantity: 2,
      unit: "bags",
      expiryDate: "2026-11-01",
      location: "freezer",
      category: "Frozen",
      updatedAt: now,
    },
    {
      id: newId(),
      name: "Pasta",
      quantity: 3,
      unit: "boxes",
      expiryDate: "2027-01-15",
      location: "pantry",
      category: "Dry goods",
      updatedAt: now,
      createdAt: now,
      source: "manual",
    },
    {
      id: newId(),
      name: "Granola bars",
      quantity: 1,
      unit: "box",
      expiryDate: "2026-09-01",
      location: "pantry",
      category: "Snacks",
      updatedAt: now,
      createdAt: now,
      source: "manual",
    },
    {
      id: newId(),
      name: "Spinach",
      quantity: 1,
      unit: "bag",
      expiryDate: "2026-05-12",
      location: "fridge",
      category: "Produce",
      updatedAt: now,
    },
  ];
}

function readPersisted(): FoodInventoryItem[] {
  if (typeof window === "undefined") {
    return seedItems();
  }
  try {
    const raw = window.localStorage.getItem(FOOD_INVENTORY_STORAGE_KEY);
    if (!raw) {
      const seeded = seedItems();
      const payload: FoodInventoryPersistedState = { version: 1, items: seeded };
      window.localStorage.setItem(FOOD_INVENTORY_STORAGE_KEY, JSON.stringify(payload));
      return seeded;
    }
    const parsed = JSON.parse(raw) as FoodInventoryPersistedState;
    if (parsed?.version === 1 && Array.isArray(parsed.items)) {
      return parsed.items.map(normalizeInventoryItem);
    }
  } catch {
    /* fall through */
  }
  return seedItems();
}

function writePersisted(items: FoodInventoryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const payload: FoodInventoryPersistedState = { version: 1, items };
  window.localStorage.setItem(FOOD_INVENTORY_STORAGE_KEY, JSON.stringify(payload));
}

export type NewFoodInventoryItemInput = {
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  location: FoodStorageLocation;
  category?: string;
  imageUrl?: string | null;
  barcode?: string | null;
  source?: FoodInventoryItemSource;
};

export type UseInventoryOptions = {
  search?: string;
  sortKey?: InventorySortKey;
  sortDirection?: InventorySortDirection;
  filterPreset?: InventoryFilterPreset;
  categoryFilter?: string | null;
};

export type UseInventoryResult = {
  items: FoodInventoryItem[];
  itemsByLocation: Record<FoodStorageLocation, FoodInventoryItem[]>;
  categories: string[];
  addItem: (input: NewFoodInventoryItemInput) => void;
  markUsed: (id: string) => void;
  moveItem: (id: string, location: FoodStorageLocation) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Omit<FoodInventoryItem, "id">>) => void;
  resetToSeed: () => void;
};

function compareItems(
  a: FoodInventoryItem,
  b: FoodInventoryItem,
  sortKey: InventorySortKey,
  sortDirection: InventorySortDirection,
): number {
  let cmp = 0;
  if (sortKey === "name") {
    cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  } else if (sortKey === "quantity") {
    cmp = a.quantity - b.quantity;
  } else {
    const da = parseInventoryDate(a.expiryDate)?.getTime() ?? 0;
    const db = parseInventoryDate(b.expiryDate)?.getTime() ?? 0;
    cmp = da - db;
  }
  return sortDirection === "asc" ? cmp : -cmp;
}

function matchesSearch(item: FoodInventoryItem, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  const q = query.trim().toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q) ||
    item.unit.toLowerCase().includes(q)
  );
}

function matchesFilter(item: FoodInventoryItem, preset: InventoryFilterPreset): boolean {
  if (preset === "all") {
    return true;
  }
  const status = getInventoryExpiryStatus(item.expiryDate);
  if (preset === "expired") {
    return status === "expired";
  }
  return status === "soon" || status === "expired";
}

export function useInventory(options: UseInventoryOptions = {}): UseInventoryResult {
  const {
    search = "",
    sortKey = "expiryDate",
    sortDirection = "asc",
    filterPreset = "all",
    categoryFilter = null,
  } = options;

  const [items, setItems] = useState<FoodInventoryItem[]>(() => readPersisted());

  useEffect(() => {
    writePersisted(items);
  }, [items]);

  const filteredSorted = useMemo(() => {
    let list = items.filter(
      (item) =>
        matchesSearch(item, search) &&
        matchesFilter(item, filterPreset) &&
        (!categoryFilter || item.category === categoryFilter),
    );
    list = [...list].sort((a, b) => compareItems(a, b, sortKey, sortDirection));
    return list;
  }, [items, search, sortKey, sortDirection, filterPreset, categoryFilter]);

  const itemsByLocation = useMemo(() => {
    const map: Record<FoodStorageLocation, FoodInventoryItem[]> = {
      pantry: [],
      fridge: [],
      freezer: [],
    };
    for (const loc of FOOD_STORAGE_LOCATIONS) {
      map[loc] = filteredSorted.filter((i) => i.location === loc);
    }
    return map;
  }, [filteredSorted]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category.trim()) {
        set.add(item.category);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const addItem = useCallback((input: NewFoodInventoryItemInput) => {
    const now = new Date().toISOString();
    const next: FoodInventoryItem = normalizeInventoryItem({
      id: newId(),
      name: input.name.trim(),
      quantity: Math.max(0, input.quantity),
      unit: input.unit.trim() || "ea",
      expiryDate: input.expiryDate,
      location: input.location,
      category: input.category?.trim() || "General",
      updatedAt: now,
      createdAt: now,
      imageUrl: input.imageUrl ?? null,
      barcode: input.barcode ?? null,
      source: input.source ?? "manual",
    });
    setItems((prev) => [...prev, next]);
  }, []);

  const markUsed = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) {
            return item;
          }
          const quantity = Math.max(0, item.quantity - 1);
          return { ...item, quantity, updatedAt: new Date().toISOString() };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const moveItem = useCallback((id: string, location: FoodStorageLocation) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, location, updatedAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Omit<FoodInventoryItem, "id">>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? normalizeInventoryItem({
              ...item,
              ...patch,
              updatedAt: new Date().toISOString(),
            })
          : item,
      ),
    );
  }, []);

  const resetToSeed = useCallback(() => {
    setItems(seedItems());
  }, []);

  return {
    items,
    itemsByLocation,
    categories,
    addItem,
    markUsed,
    moveItem,
    removeItem,
    updateItem,
    resetToSeed,
  };
}
