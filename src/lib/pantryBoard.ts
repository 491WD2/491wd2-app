import {
  getInventoryExpiryStatus,
  parseInventoryDate,
  type FoodInventoryItem,
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

export function normalizeInventoryItem(item: FoodInventoryItem): FoodInventoryItem {
  return {
    ...item,
    imageUrl: item.imageUrl ?? null,
    barcode: item.barcode ?? null,
    source: item.source ?? "manual",
    createdAt: item.createdAt ?? item.updatedAt,
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
