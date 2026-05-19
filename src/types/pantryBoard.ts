import type { FoodInventoryItem } from "./inventory";

/** Top filter chips on the pantry command board. */
export type PantryBoardChip =
  | "all"
  | "use_first"
  | "low_stock"
  | "expired"
  | "pantry"
  | "fridge"
  | "freezer"
  | "scanned";

export type PantryBoardSectionId =
  | "expiring_soon"
  | "low_stock"
  | "recently_added"
  | "pantry_staples"
  | "fridge"
  | "freezer"
  | "snacks"
  | "meals_ready";

export type PantryBoardSectionConfig = {
  id: PantryBoardSectionId;
  title: string;
  emoji: string;
  description: string;
  emptyTitle: string;
  emptyHint: string;
};

export const PANTRY_BOARD_SECTIONS: PantryBoardSectionConfig[] = [
  {
    id: "expiring_soon",
    title: "Expiring Soon",
    emoji: "⏰",
    description: "Use these first",
    emptyTitle: "Nothing expiring soon",
    emptyHint: "You're in good shape for the next few days.",
  },
  {
    id: "low_stock",
    title: "Low Stock",
    emoji: "📉",
    description: "Running low",
    emptyTitle: "No low-stock items",
    emptyHint: "Quantities look healthy across the board.",
  },
  {
    id: "recently_added",
    title: "Recently Added",
    emoji: "✨",
    description: "Last 7 days",
    emptyTitle: "No recent additions",
    emptyHint: "Scan or add items to see them here.",
  },
  {
    id: "pantry_staples",
    title: "Pantry Staples",
    emoji: "🫙",
    description: "Dry goods & shelf-stable",
    emptyTitle: "No pantry staples",
    emptyHint: "Add pasta, rice, cans, and other shelf items.",
  },
  {
    id: "fridge",
    title: "Fridge",
    emoji: "🧊",
    description: "Cold storage",
    emptyTitle: "Fridge is empty",
    emptyHint: "Move or add chilled items here.",
  },
  {
    id: "freezer",
    title: "Freezer",
    emoji: "❄️",
    description: "Frozen goods",
    emptyTitle: "Freezer is empty",
    emptyHint: "Stock frozen meals and ingredients.",
  },
  {
    id: "snacks",
    title: "Snacks",
    emoji: "🍿",
    description: "Quick bites",
    emptyTitle: "No snacks on the board",
    emptyHint: "Tag items as Snacks to fill this lane.",
  },
  {
    id: "meals_ready",
    title: "Meals Ready",
    emoji: "🍱",
    description: "Prepared & leftovers",
    emptyTitle: "No ready meals",
    emptyHint: "Add prepared meals or leftovers when you have them.",
  },
];

export const PANTRY_BOARD_CHIPS: { id: PantryBoardChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "use_first", label: "Expiring Soon" },
  { id: "low_stock", label: "Low Stock" },
  { id: "expired", label: "Expired" },
  { id: "pantry", label: "Pantry" },
  { id: "fridge", label: "Fridge" },
  { id: "freezer", label: "Freezer" },
  { id: "scanned", label: "Scanned Items" },
];

export type PantryBoardItem = FoodInventoryItem & {
  useFirst?: boolean;
};
