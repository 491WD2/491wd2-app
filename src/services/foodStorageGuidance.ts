/**
 * Client-side rotation and shelf-life guidance only — not medical or safety guarantees.
 * Prefer inspecting packaging and following trusted food safety sources.
 */
import type {
  FoodStorageCategory,
  PantryItem,
  RotationStatus,
  StorageClass,
} from "../data/familyData";
import { effectiveBestByDate } from "../lib/inventoryDates";

export type FoodStorageClassification = {
  suggestedStorageClass: StorageClass;
  /** Short rationale for UI hints. */
  rationale: string;
};

/** Starter estimates (months) — user can override via `estimatedShelfLifeMonths`. */
const CATEGORY_DEFAULT_MONTHS: Partial<Record<FoodStorageCategory, number>> = {
  canned_vegetables: 15,
  canned_fruit: 15,
  canned_meat: 36,
  grains: 240,
  pasta: 36,
  oats: 24,
  beans_legumes: 36,
  potatoes: 24,
  dairy_powder: 24,
  baking: 18,
  oils_fats: 12,
  water: 240,
  comfort_food: 24,
  household_supply: 36,
  other: 18,
};

/** High-acid canned foods: best quality often roughly 12–18 months. */
const HIGH_ACID_CAN_MONTHS = 15;
/** Low-acid canned foods: best quality often roughly 2–5 years when packaging stays sound. */
const LOW_ACID_CAN_MONTHS_MIN = 24;
const LOW_ACID_CAN_MONTHS_MAX = 60;

function parseYmd(dateStr?: string): Date | undefined {
  if (!dateStr?.trim()) {
    return undefined;
  }
  const d = new Date(`${dateStr.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

function inferAcidityHint(category?: FoodStorageCategory, packageType?: string): "high" | "low" | "unknown" {
  const pkg = (packageType ?? "").toLowerCase();
  const cat = category ?? "other";
  if (
    pkg.includes("tomato") ||
    pkg.includes("pickle") ||
    pkg.includes("citrus") ||
    cat === "canned_fruit"
  ) {
    return "high";
  }
  if (
    cat === "canned_vegetables" ||
    cat === "canned_meat" ||
    cat === "beans_legumes"
  ) {
    return "low";
  }
  return "unknown";
}

/** High-level grouping for planning buckets. */
export function classifyFoodStorageItem(item: PantryItem): FoodStorageClassification {
  const cat = item.foodStorageCategory;
  const area = (item.storageArea ?? "").toLowerCase();

  if (item.storageClass) {
    return {
      suggestedStorageClass: item.storageClass,
      rationale: "Uses your saved storage class.",
    };
  }

  if (cat === "water") {
    return {
      suggestedStorageClass: "emergency",
      rationale: "Water is typically tracked as preparedness supply.",
    };
  }

  if (cat === "household_supply" || item.itemType === "household") {
    return {
      suggestedStorageClass: "household_supply",
      rationale: "Household essentials and non-food supplies.",
    };
  }

  if (
    cat &&
    ["grains", "beans_legumes", "pasta", "oats", "potatoes", "dairy_powder"].includes(cat)
  ) {
    return {
      suggestedStorageClass: "long_term_storage",
      rationale: "Dry staples are commonly rotated as longer-term storage.",
    };
  }

  if (area.includes("freezer") || area.includes("fridge")) {
    return {
      suggestedStorageClass: "everyday",
      rationale: "Cold storage usually covers everyday rotation.",
    };
  }

  return {
    suggestedStorageClass: "everyday",
    rationale: "Default everyday pantry rotation.",
  };
}

/**
 * Estimated shelf-life window in months (guidance).
 * Uses category defaults, can acidity hints, or user override.
 */
export function estimateShelfLife(item: PantryItem): { months: number; notes: string } {
  if (
    typeof item.estimatedShelfLifeMonths === "number" &&
    Number.isFinite(item.estimatedShelfLifeMonths) &&
    item.estimatedShelfLifeMonths > 0
  ) {
    return {
      months: item.estimatedShelfLifeMonths,
      notes: "Uses your estimated shelf-life override.",
    };
  }

  if (typeof item.longTermShelfLifeYears === "number" && item.longTermShelfLifeYears > 0) {
    return {
      months: Math.round(item.longTermShelfLifeYears * 12),
      notes: "Converted from your long-term storage year estimate.",
    };
  }

  const cat = item.foodStorageCategory ?? "other";
  const pkg = item.packageType ?? "";
  const acidity = inferAcidityHint(cat, pkg);

  if ((pkg.toLowerCase().includes("can") || cat.startsWith("canned_")) && acidity === "high") {
    return {
      months: HIGH_ACID_CAN_MONTHS,
      notes:
        "High-acid canned foods are often at best quality for roughly 12–18 months (guidance only).",
    };
  }

  if ((pkg.toLowerCase().includes("can") || cat.startsWith("canned_")) && acidity === "low") {
    return {
      months: Math.round((LOW_ACID_CAN_MONTHS_MIN + LOW_ACID_CAN_MONTHS_MAX) / 2),
      notes:
        "Low-acid canned foods often stay at best quality for roughly 2–5 years when cans remain sound.",
    };
  }

  const base = CATEGORY_DEFAULT_MONTHS[cat] ?? CATEGORY_DEFAULT_MONTHS.other ?? 18;
  let notes =
    "Based on category defaults — adjust if your packaging or storage conditions differ.";

  if (
    ["grains", "beans_legumes", "pasta", "oats", "potatoes"].includes(cat) &&
    item.storageClass === "long_term_storage"
  ) {
    notes =
      "Properly packaged dry staples may remain usable for many years when kept cool, dry, and pest-free — inspect before use.";
  }

  return { months: base, notes };
}

export function getRotationStatus(item: PantryItem, now = new Date()): RotationStatus {
  const can = item.canCondition ?? "good";
  if (can === "swollen" || can === "leaking") {
    return "discard_if_damaged";
  }

  const best = parseYmd(effectiveBestByDate(item));
  const opened = parseYmd(item.openedDate);

  if (can === "rusted" || can === "dented") {
    if (best && best < now) {
      return "inspect_before_use";
    }
    return "inspect_before_use";
  }

  if (best) {
    const msLeft = best.getTime() - now.getTime();
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);

    if (daysLeft < 0) {
      return opened ? "inspect_before_use" : "past_best_quality";
    }
    if (daysLeft <= 14) {
      return "rotate_soon";
    }
    if (daysLeft <= 60) {
      return "use_first";
    }
  }

  const est = estimateShelfLife(item);
  const purchase = parseYmd(item.purchaseDate);
  if (purchase && est.months > 0) {
    const ageMonths = monthsBetween(purchase, now);
    if (ageMonths > est.months + 1) {
      return "past_best_quality";
    }
    if (ageMonths > est.months * 0.85) {
      return "rotate_soon";
    }
  }

  return "fresh";
}

export function getFoodSafetyNotice(item: PantryItem): string {
  const lines: string[] = [
    "Dates and shelf-life hints are for planning — inspect packaging before use.",
    "If anything looks or smells off, don’t use it.",
  ];

  const can = item.canCondition ?? "good";
  if (can === "swollen" || can === "leaking") {
    lines.push(
      "Discard if the can is swollen, leaking, badly rusted, or severely dented — do not taste to check.",
    );
  } else {
    lines.push(
      "Discard cans that are swollen, leaking, badly rusted, or severely dented.",
    );
  }

  const best = parseYmd(effectiveBestByDate(item));
  if (best && best < new Date()) {
    lines.push("Past printed date: quality may decline — inspect before use.");
  }

  return lines.join(" ");
}

export function getLongTermStorageLabel(item: PantryItem): string {
  const c = classifyFoodStorageItem(item);
  switch (c.suggestedStorageClass) {
    case "long_term_storage":
      return "Long-term staples";
    case "three_month_supply":
      return "Three-month usable foods";
    case "emergency":
      return "Preparedness / water";
    case "household_supply":
      return "Household essentials";
    default:
      return "Everyday pantry";
  }
}

export function getCanInspectionWarning(item: PantryItem): string | undefined {
  const can = item.canCondition ?? "good";
  if (can === "good" || can === "unknown") {
    return undefined;
  }
  if (can === "swollen" || can === "leaking") {
    return "Packaging damage suggests discarding — do not consume from swollen or leaking cans.";
  }
  if (can === "rusted" || can === "dented") {
    return "Inspect carefully along seams; discard if deeply dented on seams or ends, badly rusted, or compromised.";
  }
  return undefined;
}

/** Combined planner-facing classification for badges. */
export function summarizeRotationGuidance(item: PantryItem) {
  return {
    status: getRotationStatus(item),
    shelfLife: estimateShelfLife(item),
    safety: getFoodSafetyNotice(item),
    longTerm: getLongTermStorageLabel(item),
    canWarning: getCanInspectionWarning(item),
  };
}
