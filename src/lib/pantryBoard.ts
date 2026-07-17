import {
  FOOD_STORAGE_LOCATIONS,
  getInventoryExpiryStatus,
  parseInventoryDate,
  type FoodInventoryItem,
  type FoodInventoryItemSource,
  type FoodStorageLocation,
} from "../types/inventory";
import type { PantryBoardChip, PantryBoardSectionId } from "../types/pantryBoard";
import { PANTRY_BOARD_SECTIONS } from "../types/pantryBoard";

const LOW_STOCK_QTY = 2;
const RECENT_DAYS = 7;

const STAPLE_CATEGORIES = new Set([
  "dry goods",
  "bakery",
  "general",
  "canned",
  "pantry",
  "grains",
]);

const SNACK_CATEGORIES = new Set(["snacks", "snack", "treats", "chips", "candy"]);

const MEAL_CATEGORIES = new Set([
  "prepared",
  "meals",
  "meal",
  "leftovers",
  "ready",
  "deli",
]);

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
  }
  return 1;
}

function normalizeLocation(value: unknown): FoodStorageLocation {
  return FOOD_STORAGE_LOCATIONS.includes(value as FoodStorageLocation)
    ? (value as FoodStorageLocation)
    : "pantry";
}

function normalizeSource(value: unknown): FoodInventoryItemSource {
  return value === "scan" ? "scan" : "manual";
}

function fallbackInventoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeInventoryItem(item: Partial<FoodInventoryItem>): FoodInventoryItem {
  const now = new Date().toISOString();
  const updatedAt = normalizeString(item.updatedAt, now);
  const category = normalizeString(item.category, "General") || "General";

  return {
    id: normalizeString(item.id) || fallbackInventoryId(),
    name: normalizeString(item.name, "Pantry item") || "Pantry item",
    quantity: normalizeQuantity(item.quantity),
    unit: normalizeString(item.unit, "ea") || "ea",
    expiryDate: normalizeString(item.expiryDate),
    location: normalizeLocation(item.location),
    category,
    updatedAt,
    createdAt: normalizeString(item.createdAt, updatedAt) || updatedAt,
    imageUrl: normalizeString(item.imageUrl) || null,
    barcode: normalizeString(item.barcode) || null,
    source: normalizeSource(item.source),
  };
}

export function isLowStockItem(item: FoodInventoryItem): boolean {
  return item.quantity > 0 && item.quantity <= LOW_STOCK_QTY;
}

export function isUseFirstItem(item: FoodInventoryItem): boolean {
  const status = getInventoryExpiryStatus(item.expiryDate);
  return status === "soon";
}

export function isExpiredItem(item: FoodInventoryItem): boolean {
  return getInventoryExpiryStatus(item.expiryDate) === "expired";
}

export function isRecentlyAddedItem(item: FoodInventoryItem, now = new Date()): boolean {
  const created = item.createdAt ?? item.updatedAt;
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) {
    return false;
  }
  const diff = now.getTime() - d.getTime();
  return diff <= RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export function isPantryStapleItem(item: FoodInventoryItem): boolean {
  if (item.location !== "pantry") {
    return false;
  }
  const cat = item.category.trim().toLowerCase();
  if (SNACK_CATEGORIES.has(cat) || MEAL_CATEGORIES.has(cat)) {
    return false;
  }
  if (STAPLE_CATEGORIES.has(cat)) {
    return true;
  }
  const exp = parseInventoryDate(item.expiryDate);
  if (!exp) {
    return true;
  }
  const today = new Date();
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > 30;
}

export function isSnackItem(item: FoodInventoryItem): boolean {
  const cat = item.category.trim().toLowerCase();
  return SNACK_CATEGORIES.has(cat) || cat.includes("snack");
}

export function isMealsReadyItem(item: FoodInventoryItem): boolean {
  const cat = item.category.trim().toLowerCase();
  return MEAL_CATEGORIES.has(cat) || cat.includes("meal") || cat.includes("leftover");
}

export function itemInSection(item: FoodInventoryItem, sectionId: PantryBoardSectionId): boolean {
  switch (sectionId) {
    case "expiring_soon":
      return isUseFirstItem(item) && !isExpiredItem(item);
    case "low_stock":
      return isLowStockItem(item);
    case "recently_added":
      return isRecentlyAddedItem(item);
    case "pantry_staples":
      return isPantryStapleItem(item);
    case "fridge":
      return item.location === "fridge";
    case "freezer":
      return item.location === "freezer";
    case "snacks":
      return isSnackItem(item);
    case "meals_ready":
      return isMealsReadyItem(item);
    default:
      return false;
  }
}

export function matchesPantryBoardChip(item: FoodInventoryItem, chip: PantryBoardChip): boolean {
  switch (chip) {
    case "all":
      return true;
    case "use_first":
      return isUseFirstItem(item);
    case "low_stock":
      return isLowStockItem(item);
    case "expired":
      return isExpiredItem(item);
    case "pantry":
      return item.location === "pantry";
    case "fridge":
      return item.location === "fridge";
    case "freezer":
      return item.location === "freezer";
    case "scanned":
      return item.source === "scan" || Boolean(item.barcode?.trim());
    default:
      return true;
  }
}

export function groupItemsForBoard(
  items: FoodInventoryItem[],
  chip: PantryBoardChip,
): Record<PantryBoardSectionId, FoodInventoryItem[]> {
  const filtered = items.filter((i) => matchesPantryBoardChip(i, chip));
  const result = Object.fromEntries(
    PANTRY_BOARD_SECTIONS.map((s) => [s.id, [] as FoodInventoryItem[]]),
  ) as Record<PantryBoardSectionId, FoodInventoryItem[]>;

  for (const item of filtered) {
    for (const section of PANTRY_BOARD_SECTIONS) {
      if (itemInSection(item, section.id)) {
        result[section.id].push(item);
      }
    }
  }

  return result;
}

export function boardEmptyStateForChip(chip: PantryBoardChip): {
  title: string;
  hint: string;
} | null {
  switch (chip) {
    case "expired":
      return {
        title: "No expired items",
        hint: "Great job — nothing past date on the board.",
      };
    case "low_stock":
      return {
        title: "No low-stock items",
        hint: "Quantities look healthy right now.",
      };
    case "scanned":
      return {
        title: "No scanned items yet",
        hint: "Tap Scan in the header to add products via barcode.",
      };
    default:
      return null;
  }
}
