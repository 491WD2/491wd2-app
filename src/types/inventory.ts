/**
 * Food inventory dashboard — domain types (localStorage-backed).
 * @see src/hooks/useInventory.ts
 * @see src/pages/FoodInventoryDashboard.tsx
 */

/** Primary storage columns shown on the dashboard. */
export type FoodStorageLocation = "pantry" | "fridge" | "freezer";

export const FOOD_STORAGE_LOCATIONS: readonly FoodStorageLocation[] = [
  "pantry",
  "fridge",
  "freezer",
] as const;

export type InventorySortKey = "name" | "quantity" | "expiryDate";

export type InventorySortDirection = "asc" | "desc";

/** Visual urgency derived from `expiryDate` (YYYY-MM-DD). */
export type InventoryExpiryStatus = "ok" | "soon" | "expired";

export type FoodInventoryItemSource = "manual" | "scan";

export type FoodInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  /** ISO date YYYY-MM-DD */
  expiryDate: string;
  location: FoodStorageLocation;
  category: string;
  /** ISO datetime — last mutation */
  updatedAt: string;
  /** ISO datetime — first added (defaults to updatedAt) */
  createdAt?: string;
  imageUrl?: string | null;
  barcode?: string | null;
  source?: FoodInventoryItemSource;
};

export type FoodInventoryPersistedState = {
  version: 1;
  items: FoodInventoryItem[];
};

export type InventoryLocationMeta = {
  id: FoodStorageLocation;
  label: string;
  /** Tailwind background token for section shell */
  surfaceClass: string;
  /** Accent for header badge */
  accentClass: string;
  borderClass: string;
};

export const INVENTORY_LOCATION_META: Record<FoodStorageLocation, InventoryLocationMeta> = {
  pantry: {
    id: "pantry",
    label: "Pantry",
    surfaceClass: "bg-[#f5f0e8]",
    accentClass: "bg-[#e8dcc8] text-[#5c4a32]",
    borderClass: "border-[#e0d4c0]",
  },
  fridge: {
    id: "fridge",
    label: "Fridge",
    surfaceClass: "bg-[#eef6fc]",
    accentClass: "bg-[#cfe8f7] text-[#1e4a66]",
    borderClass: "border-[#c5dff0]",
  },
  freezer: {
    id: "freezer",
    label: "Freezer",
    surfaceClass: "bg-[#f3f0fa]",
    accentClass: "bg-[#e2d9f5] text-[#4a3868]",
    borderClass: "border-[#d4c8eb]",
  },
};

export type InventoryFilterPreset = "all" | "expiring" | "expired";

export const INVENTORY_NEAR_EXPIRY_DAYS = 3;

/** Parse YYYY-MM-DD at local midnight for stable comparisons. */
export function parseInventoryDate(iso: string): Date | null {
  const trimmed = iso.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function getInventoryExpiryStatus(
  expiryDate: string,
  now = new Date(),
  soonDays = INVENTORY_NEAR_EXPIRY_DAYS,
): InventoryExpiryStatus {
  const exp = parseInventoryDate(expiryDate);
  if (!exp) {
    return "ok";
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const diffMs = expDay.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 0) {
    return "expired";
  }
  if (diffDays <= soonDays) {
    return "soon";
  }
  return "ok";
}

export function formatInventoryExpiryLabel(expiryDate: string): string {
  const d = parseInventoryDate(expiryDate);
  if (!d) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
