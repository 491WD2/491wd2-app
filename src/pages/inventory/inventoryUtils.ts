import type {
  GroceryItem,
  PantryItem,
  PantryLocation,
  PantryStorageType,
  StockStatus,
  StorageClass,
} from "../../data/familyData";
import { effectiveBestByDate } from "../../lib/inventoryDates";
import { getRotationStatus } from "../../services/foodStorageGuidance";

export { effectiveBestByDate } from "../../lib/inventoryDates";

export const inventoryFilterOptions = [
  "all",
  "low-stock",
  "expiring",
  "staples",
] as const;

export type InventoryFilterOption = (typeof inventoryFilterOptions)[number];

export type OpenFilteredInventory = (updates: {
  storageArea?: string;
  locationDetail?: string;
  category?: string;
  source?: string;
  status?: InventoryFilterOption;
  searchText?: string;
}) => void;

export function isKitchenStorage(storageArea: PantryLocation) {
  return storageArea === "Kitchen Cabinets";
}

export function isColdStorage(storageArea: PantryLocation) {
  return (
    storageArea === "Kitchen Fridge" ||
    storageArea === "Kitchen Freezer" ||
    storageArea === "Laundry Room Fridge" ||
    storageArea === "Laundry Room Freezer" ||
    storageArea === "Family Room Freezer"
  );
}

export function getInventoryLocationLabel(item: PantryItem) {
  if (item.storageArea === "Custom Location") {
    return item.customLocationName || "Custom Location";
  }

  if (item.storageArea === "Pantry") {
    return [
      item.storageArea,
      item.pantryWall,
      item.pantryShelf,
      item.pantryLocationNote,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return [
    item.storageArea,
    item.locationDetail ||
      item.kitchenLocationDetail ||
      item.coldLocationDetail ||
      item.customLocationName,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Display image: uploaded shelf photo → manual photo URL → catalog / barcode URL. */
export function getPantryItemDisplayImageSrc(item: PantryItem): string {
  return (
    item.productImageDataUrl?.trim() ||
    item.itemPhotoUrl?.trim() ||
    item.productImageUrl?.trim() ||
    ""
  );
}

/**
 * Shelf-style group heading (e.g. `PANTRY - Wall 1 / Shelf 3`).
 * Falls back to the full location label when wall/shelf are not set.
 */
export function getPantryShelfTableGroupLabel(item: PantryItem): string {
  const wall = item.pantryWall ?? item.wall;
  const shelf = item.pantryShelf ?? item.shelf;
  const baseName =
    item.storageArea === "Custom Location"
      ? (item.customLocationName?.trim() || "Custom location")
      : item.storageArea;
  if (wall && shelf) {
    return `${baseName.toUpperCase()} - ${wall} / ${shelf}`;
  }
  if (wall) {
    return `${baseName.toUpperCase()} - ${wall}`;
  }
  if (shelf) {
    return `${baseName.toUpperCase()} - ${shelf}`;
  }
  return getInventoryLocationLabel(item) || "Unlocated";
}

export function groupPantryItemsByShelfForTable(items: PantryItem[]): {
  label: string;
  items: PantryItem[];
}[] {
  const map = new Map<string, PantryItem[]>();
  for (const item of items) {
    const label = getPantryShelfTableGroupLabel(item);
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label)!.push(item);
  }
  const labels = [...map.keys()].sort((a, b) => {
    if (a === "Unlocated") {
      return 1;
    }
    if (b === "Unlocated") {
      return -1;
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
  return labels.map((label) => ({
    label,
    items: (map.get(label) ?? [])
      .slice()
      .sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: "base" })),
  }));
}

export function parseQuantity(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatInventoryQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export function adjustInventoryQuantity(item: PantryItem, delta: number) {
  const quantity = parseQuantity(item.quantity);

  if (quantity === undefined) {
    return undefined;
  }

  const nextQuantity = Math.max(0, quantity + delta);

  return {
    ...item,
    quantity: formatInventoryQuantity(nextQuantity),
    lastUpdated: new Date().toISOString(),
  };
}

/** Derive shelf status from numeric quantity and item thresholds. */
export function deriveStockStatusAfterQuantity(item: PantryItem, nextQty: number): StockStatus {
  if (nextQty <= 0) {
    return "Out";
  }
  const minQ = parseQuantity(item.minQuantity);
  if (minQ !== undefined && Number.isFinite(minQ) && nextQty <= minQ) {
    return "Low";
  }
  return "Stocked";
}

export type InventoryConsumePayload = {
  amountUsed: number;
  /** When true, empties the container regardless of amountUsed. */
  markFinished: boolean;
  memberId?: string;
  recipeNote?: string;
  /** Free-text note for this use/update (local-only). */
  note?: string;
  /** Forces Low status when quantity remains above minimum (explicit user intent). */
  markLow?: boolean;
  /** Required when emptying a partial-use container by subtraction (confirmation step). */
  confirmZeroPartialUse?: boolean;
};

function deriveStockStatusAfterConsume(
  item: PantryItem,
  nextQty: number,
  payload: Pick<InventoryConsumePayload, "markLow">,
): StockStatus {
  if (nextQty <= 0) {
    return "Out";
  }
  if (payload.markLow) {
    return "Low";
  }
  return deriveStockStatusAfterQuantity(item, nextQty);
}

/** Subtract an explicit amount used (cooking) — returns updated row or undefined if invalid. */
export function applyConsumedQuantity(
  item: PantryItem,
  amountUsed: number,
  opts?: Pick<InventoryConsumePayload, "confirmZeroPartialUse" | "markLow">,
): PantryItem | undefined {
  const quantity = parseQuantity(item.quantity);
  if (quantity === undefined || amountUsed <= 0) {
    return undefined;
  }
  const nextQuantity = Math.max(0, quantity - amountUsed);
  if (
    nextQuantity === 0 &&
    item.itemUseType === "partial_use" &&
    !opts?.confirmZeroPartialUse
  ) {
    return undefined;
  }
  const status = deriveStockStatusAfterConsume(item, nextQuantity, {
    markLow: opts?.markLow ?? false,
  });
  return {
    ...item,
    quantity: formatInventoryQuantity(nextQuantity),
    status,
    lastUpdated: new Date().toISOString(),
  };
}

/** True when subtracting would empty the row on a partial-use item without “finished” — needs confirmation. */
export function consumeNeedsPartialZeroConfirm(
  item: PantryItem,
  payload: InventoryConsumePayload,
): boolean {
  if (payload.markFinished || payload.confirmZeroPartialUse) {
    return false;
  }
  const q = parseQuantity(item.quantity);
  if (q === undefined || !Number.isFinite(payload.amountUsed)) {
    return false;
  }
  if (item.itemUseType !== "partial_use") {
    return false;
  }
  return q - payload.amountUsed <= 0 && payload.amountUsed > 0;
}

/** After applying consume, would we want a low/out confirmation dialog before committing? */
export function needsConsumeLowOutConfirmation(
  item: PantryItem,
  projected: PantryItem,
): boolean {
  if (item.status === "Low" || item.status === "Out") {
    return true;
  }
  return projected.status === "Low" || projected.status === "Out";
}

export function projectConsumeInventoryUpdate(
  item: PantryItem,
  payload: InventoryConsumePayload,
): PantryItem | undefined {
  return applyConsumeInventoryUpdate(item, payload);
}

/** Full use/consume flow including “finished” empty and optional audit fields (stored locally only). */
export function applyConsumeInventoryUpdate(
  item: PantryItem,
  payload: InventoryConsumePayload,
): PantryItem | undefined {
  const now = new Date().toISOString();
  if (payload.markFinished) {
    return {
      ...item,
      quantity: formatInventoryQuantity(0),
      status: "Out",
      lastConsumptionMemberId: payload.memberId,
      lastConsumptionRecipeNote: payload.recipeNote?.trim() || undefined,
      lastConsumptionNote: payload.note?.trim() || undefined,
      lastUpdated: now,
    };
  }
  const next = applyConsumedQuantity(item, payload.amountUsed, {
    confirmZeroPartialUse: payload.confirmZeroPartialUse,
    markLow: payload.markLow,
  });
  if (!next) {
    return undefined;
  }
  return {
    ...next,
    lastConsumptionMemberId: payload.memberId,
    lastConsumptionRecipeNote: payload.recipeNote?.trim() || undefined,
    lastConsumptionNote: payload.note?.trim() || undefined,
  };
}

/** Blank row for forms / scan flow — aligns with `PantryPage` defaults. */
export function createBlankPantryItem(): PantryItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "New inventory item",
    quantity: "1",
    unit: "",
    category: "Grocery",
    storageArea: "Pantry",
    location: "Pantry",
    barcode: "",
    brand: "",
    productImageUrl: "",
    locationDetail: "",
    customLocationName: "",
    kitchenLocationDetail: "",
    pantryLocationNote: "",
    coldLocationDetail: "",
    pantryWall: "Wall 1",
    pantryShelf: "Shelf 1",
    wall: "Wall 1",
    shelf: "Shelf 1",
    status: "Stocked",
    groceryItemId: "",
    expiryDate: "",
    bestByDate: "",
    notes: "",
    isStaple: false,
    minQuantity: "",
    tags: [],
    source: "manual",
    lastUpdated: now,
    createdAt: now,
  };
}

export function createPantryItemFromGroceryItem(item: GroceryItem): PantryItem {
  const now = new Date().toISOString();
  const storageArea = item.defaultLocation;

  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.amountDefault ?? "1",
    unit: "",
    category: item.category,
    storageArea,
    location: storageArea,
    barcode: item.barcode,
    brand: item.brand,
    productImageUrl: item.productImageUrl,
    lookupMetadata: item.lookupMetadata,
    locationDetail: "",
    customLocationName: "",
    kitchenLocationDetail: "",
    pantryLocationNote: "",
    coldLocationDetail: "",
    pantryWall: storageArea === "Pantry" ? item.defaultWall : undefined,
    pantryShelf: storageArea === "Pantry" ? item.defaultShelf : undefined,
    wall: storageArea === "Pantry" ? item.defaultWall : undefined,
    shelf: storageArea === "Pantry" ? item.defaultShelf : undefined,
    status: "Stocked",
    expiryDate: "",
    bestByDate: "",
    notes: item.notes ?? "",
    isStaple: false,
    minQuantity: "",
    tags: [],
    source: item.source ?? "manual",
    sourceSystem: item.sourceSystem,
    createdAt: now,
    lastUpdated: now,
  };
}

export function isInventoryLowStock(item: PantryItem) {
  if (item.status !== "Stocked") {
    return true;
  }
  const quantity = parseQuantity(item.quantity);
  const minimum = parseQuantity(item.minQuantity);
  if (quantity === undefined || !Number.isFinite(quantity)) {
    return false;
  }
  if (minimum !== undefined && Number.isFinite(minimum) && minimum > 0 && quantity <= minimum) {
    return true;
  }
  return item.isStaple && quantity <= 0;
}

export function isInventoryOverstock(item: PantryItem): boolean {
  const q = parseQuantity(item.quantity);
  if (q === undefined || !Number.isFinite(q)) {
    return false;
  }
  const max = parseQuantity(item.maxQuantity);
  const thresh = parseQuantity(item.overstockThreshold);
  if (max !== undefined && Number.isFinite(max) && max > 0 && q > max) {
    return true;
  }
  if (thresh !== undefined && Number.isFinite(thresh) && thresh > 0 && q >= thresh) {
    return true;
  }
  return false;
}

export function isInventoryExpiringSoon(item: PantryItem) {
  const dateStr = effectiveBestByDate(item);
  if (!dateStr) {
    return false;
  }

  const expiry = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threshold = new Date(today);
  threshold.setDate(threshold.getDate() + 14);

  return expiry >= today && expiry <= threshold;
}

/** Items to surface on “Use soon” home panels (guidance — not safety). */
export function isUseSoonCandidate(item: PantryItem): boolean {
  if (item.useSoonMarked) {
    return true;
  }
  if (isInventoryOverstock(item)) {
    return true;
  }
  if (isInventoryExpiringSoon(item)) {
    return true;
  }
  const rs = getRotationStatus(item);
  return (
    rs === "use_first" ||
    rs === "rotate_soon" ||
    rs === "past_best_quality" ||
    rs === "inspect_before_use"
  );
}

/** Map UI storage bucket to legacy planning class. */
export function storageClassFromPantryStorageType(
  t: PantryStorageType | undefined,
): StorageClass | undefined {
  if (!t) {
    return undefined;
  }
  switch (t) {
    case "short_term":
      return "everyday";
    case "long_term":
      return "long_term_storage";
    case "emergency":
      return "emergency";
    case "household_supply":
      return "household_supply";
    case "other":
      return "everyday";
    default:
      return undefined;
  }
}

export function pantryStorageTypeFromStorageClass(
  sc: StorageClass | undefined,
): PantryStorageType | undefined {
  if (!sc) {
    return undefined;
  }
  switch (sc) {
    case "everyday":
    case "three_month_supply":
      return "short_term";
    case "long_term_storage":
      return "long_term";
    case "emergency":
      return "emergency";
    case "household_supply":
      return "household_supply";
    default:
      return "other";
  }
}

/** Deduplicated name / brand / title hints from pantry peers in the same category (generic — not hardcoded product lists). */
export function buildPantryTypeBrandSuggestions(
  item: PantryItem,
  allItems: PantryItem[],
): string[] {
  const cat = (item.category ?? "").trim();
  const peers = allItems.filter(
    (p) =>
      p.id !== item.id &&
      !p.inactiveInInventory &&
      (cat ? (p.category ?? "").trim() === cat : true),
  );
  const out = new Set<string>();
  for (const p of peers) {
    const name = p.name?.trim();
    const brand = p.brand?.trim();
    const product = p.productName?.trim();
    if (name) {
      out.add(name);
    }
    if (brand) {
      out.add(brand);
    }
    if (product) {
      out.add(product);
    }
    if (name && brand) {
      out.add(`${name} · ${brand}`);
    }
  }
  const selfBrand = item.brand?.trim();
  const selfName = item.name?.trim();
  if (selfBrand) {
    out.add(selfBrand);
  }
  if (selfName) {
    out.add(selfName);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}
