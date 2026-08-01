import type { FamilyData, PantryItem } from "../data/familyData";
import {
  getPantryItemPlaceholderEmoji,
  isInventoryLowStock,
} from "../pages/inventory/inventoryUtils";

export type FridgeFoodBar = {
  id: string;
  label: string;
  percent: number;
  tone: "green" | "purple" | "orange";
  count: number;
  total: number;
};

export type FridgeStorageChip = {
  id: string;
  name: string;
  meta: string;
  emoji: string;
};

type FoodBucket = "produce" | "dairy" | "protein" | "other";

function activePantry(data: FamilyData): PantryItem[] {
  return (data.pantry ?? []).filter((item) => item && !item.inactiveInInventory);
}

function bucketForItem(item: PantryItem): FoodBucket {
  const category = (item.category ?? "").toLowerCase();
  const name = (item.name ?? "").toLowerCase();
  const hay = `${category} ${name}`;
  if (
    hay.includes("produce") ||
    hay.includes("fruit") ||
    hay.includes("vegetable") ||
    hay.includes("veg")
  ) {
    return "produce";
  }
  if (hay.includes("dairy") || hay.includes("milk") || hay.includes("cheese") || hay.includes("yogurt")) {
    return "dairy";
  }
  if (
    hay.includes("meat") ||
    hay.includes("protein") ||
    hay.includes("deli") ||
    hay.includes("seafood") ||
    hay.includes("chicken") ||
    hay.includes("beef") ||
    hay.includes("fish")
  ) {
    return "protein";
  }
  return "other";
}

function isStocked(item: PantryItem): boolean {
  if (item.status === "Out") return false;
  if (item.status === "Low" || isInventoryLowStock(item)) return false;
  return true;
}

function barFromBucket(
  id: string,
  label: string,
  tone: FridgeFoodBar["tone"],
  items: PantryItem[],
): FridgeFoodBar {
  const total = items.length;
  if (total === 0) {
    return { id, label, percent: 0, tone, count: 0, total: 0 };
  }
  const count = items.filter(isStocked).length;
  const percent = Math.round((count / total) * 100);
  return { id, label, percent, tone, count, total };
}

/** Three “food remaining” bars from live pantry categories. */
export function buildFridgeFoodRemainingBars(data: FamilyData): FridgeFoodBar[] {
  const items = activePantry(data);
  const produce = items.filter((item) => bucketForItem(item) === "produce");
  const dairy = items.filter((item) => bucketForItem(item) === "dairy");
  const protein = items.filter((item) => bucketForItem(item) === "protein");

  // If a bucket is empty, fall back to broader pantry slices so the UI still shows signal.
  const fridgeLike = items.filter((item) => {
    const area = (item.storageArea ?? "").toLowerCase();
    return area.includes("fridge") || area.includes("pantry") || !area;
  });

  return [
    barFromBucket(
      "produce",
      "Vegetables",
      "green",
      produce.length > 0 ? produce : fridgeLike.slice(0, Math.max(3, Math.ceil(fridgeLike.length / 3))),
    ),
    barFromBucket(
      "dairy",
      "Dairy / cold",
      "purple",
      dairy.length > 0
        ? dairy
        : fridgeLike.slice(
            Math.ceil(fridgeLike.length / 3),
            Math.ceil((fridgeLike.length * 2) / 3),
          ),
    ),
    barFromBucket(
      "protein",
      "Meat / protein",
      "orange",
      protein.length > 0
        ? protein
        : fridgeLike.slice(Math.ceil((fridgeLike.length * 2) / 3)),
    ),
  ];
}

/** Storage shortcut chips from pantry rows (name + qty + emoji). */
export function buildFridgeStorageChips(data: FamilyData, limit = 8): FridgeStorageChip[] {
  return activePantry(data)
    .slice()
    .sort((a, b) => {
      const aHot =
        a.status === "Out" || a.status === "Low" || isInventoryLowStock(a) ? 0 : 1;
      const bHot =
        b.status === "Out" || b.status === "Low" || isInventoryLowStock(b) ? 0 : 1;
      if (aHot !== bHot) return aHot - bHot;
      return (a.name ?? "").localeCompare(b.name ?? "");
    })
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      name: item.name?.trim() || "Item",
      meta: [item.quantity, item.unit].filter(Boolean).join(" ") || item.status || "In stock",
      emoji: getPantryItemPlaceholderEmoji(item),
    }));
}

export function formatFridgeClock(date: Date): { time: string; dateLine: string } {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const dateLine = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
  return { time, dateLine };
}

export type FridgeMiniCalDay = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
};

/** Compact month grid for the Home calendar panel. */
export function buildFridgeMiniMonth(
  data: FamilyData,
  anchor: Date = new Date(),
): { monthLabel: string; weeks: FridgeMiniCalDay[][] } {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const todayIso = localIso(anchor);
  const eventDates = new Set(
    (data.planner ?? [])
      .filter((event) => event?.date)
      .map((event) => event.date),
  );

  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset);
  const weeks: FridgeMiniCalDay[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: FridgeMiniCalDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(gridStart);
      cell.setDate(gridStart.getDate() + w * 7 + d);
      const iso = localIso(cell);
      week.push({
        iso,
        day: cell.getDate(),
        inMonth: cell.getMonth() === month,
        isToday: iso === todayIso,
        hasEvents: eventDates.has(iso),
      });
    }
    weeks.push(week);
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(anchor);

  return { monthLabel, weeks };
}

function localIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
