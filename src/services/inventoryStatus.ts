/**
 * Inventory presentation status — guidance only (no “safe to eat” claims).
 */
import type { PantryItem } from "../data/familyData";
import { effectiveBestByDate } from "../lib/inventoryDates";
import { isInventoryOverstock, isUseSoonCandidate } from "../pages/inventory/inventoryUtils";
import { getRotationStatus } from "./foodStorageGuidance";

export type InventoryDateStatus =
  | "fresh"
  | "use_soon"
  | "past_printed_date"
  | "past_recommended_shelf_life"
  | "inspect_before_use";

/** Resolved recommended shelf-life window (months). */
export function getRecommendedMonthsResolved(item: PantryItem): number | undefined {
  return item.recommendedShelfLifeMonths ?? item.estimatedShelfLifeMonths;
}

export type RecommendedShelfLifeKind = "within_guidance" | "past_recommended" | "unknown";

export function getRecommendedShelfLifeStatus(item: PantryItem): RecommendedShelfLifeKind {
  const months = getRecommendedMonthsResolved(item);
  const anchor = item.openedDate ?? item.purchaseDate;
  if (!months || months <= 0 || !anchor?.trim()) {
    return "unknown";
  }
  const start = new Date(`${anchor.trim()}T12:00:00`);
  if (Number.isNaN(start.getTime())) {
    return "unknown";
  }
  const elapsedMonths =
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return elapsedMonths > months ? "past_recommended" : "within_guidance";
}

export function getInventoryDateStatus(item: PantryItem): InventoryDateStatus {
  const best = effectiveBestByDate(item);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (best?.trim()) {
    const d = new Date(`${best.trim()}T00:00:00`);
    if (!Number.isNaN(d.getTime()) && d < today) {
      return "past_printed_date";
    }
  }

  const shelfRec = getRecommendedShelfLifeStatus(item);
  if (shelfRec === "past_recommended") {
    return "past_recommended_shelf_life";
  }

  const rs = getRotationStatus(item);
  if (rs === "inspect_before_use") {
    return "inspect_before_use";
  }
  if (
    rs === "use_first" ||
    rs === "rotate_soon" ||
    rs === "past_best_quality"
  ) {
    return "use_soon";
  }

  return "fresh";
}

export function getInventoryStatusLabel(item: PantryItem): string {
  if (item.status === "Out") {
    return "Out";
  }
  if (item.status === "Low") {
    return "Low";
  }
  const ds = getInventoryDateStatus(item);
  switch (ds) {
    case "past_printed_date":
      return "Past printed date";
    case "past_recommended_shelf_life":
      return "Past storage guidance window";
    case "inspect_before_use":
      return "Inspect before use";
    case "use_soon":
      return "Use soon";
    default:
      if (isInventoryOverstock(item)) {
        return "Overstock · use up";
      }
      return "Still within date window";
  }
}

export type InventoryStatusPresentation = {
  ringClass: string;
  borderClass: string;
  chipBgClass: string;
  chipTextClass: string;
};

export function getInventoryStatusColor(item: PantryItem): InventoryStatusPresentation {
  if (item.status === "Out") {
    return {
      ringClass: "ring-rose-200/90",
      borderClass: "border-rose-200",
      chipBgClass: "bg-rose-50",
      chipTextClass: "text-rose-950",
    };
  }
  if (item.status === "Low") {
    return {
      ringClass: "ring-amber-200/90",
      borderClass: "border-amber-200",
      chipBgClass: "bg-amber-50",
      chipTextClass: "text-amber-950",
    };
  }

  const ds = getInventoryDateStatus(item);
  if (ds === "past_printed_date") {
    return {
      ringClass: "ring-purple-200/90",
      borderClass: "border-purple-200",
      chipBgClass: "bg-purple-50",
      chipTextClass: "text-purple-950",
    };
  }
  if (ds === "past_recommended_shelf_life") {
    return {
      ringClass: "ring-orange-200/90",
      borderClass: "border-orange-200",
      chipBgClass: "bg-orange-50",
      chipTextClass: "text-orange-950",
    };
  }
  if (ds === "inspect_before_use" || ds === "use_soon") {
    return {
      ringClass: "ring-amber-200/90",
      borderClass: "border-amber-200",
      chipBgClass: "bg-amber-50",
      chipTextClass: "text-amber-950",
    };
  }

  if (isInventoryOverstock(item)) {
    return {
      ringClass: "ring-violet-200/90",
      borderClass: "border-violet-200",
      chipBgClass: "bg-violet-50",
      chipTextClass: "text-violet-950",
    };
  }

  return {
    ringClass: "ring-[#ededed]",
    borderClass: "border-[#ededed]",
    chipBgClass: "bg-[#f8f9fa]",
    chipTextClass: "text-[#575757]",
  };
}

/** Single headline status for chips (stock + date guidance). */
export function getInventoryStatusSummary(item: PantryItem): string {
  return getInventoryStatusLabel(item);
}

/** Surface “use up” recipe prompts for overstocks, rotation pressure, or marked items. */
export function shouldSuggestRecipeIdeas(item: PantryItem): boolean {
  if (item.useSoonMarked) {
    return true;
  }
  if (getInventoryDateStatus(item) === "past_printed_date") {
    return true;
  }
  return isInventoryOverstock(item) || isUseSoonCandidate(item);
}
