/**
 * Friendly household storage zones for Pantry AdminUX UI.
 * Maps onto existing PantryItem location fields (no schema rename).
 */
import type { PantryItem } from "../data/familyData";
import { DEMO_ZONE_TO_LOCATION, type DemoPantryZone } from "../data/demoPantryInventory";

export const PANTRY_STORAGE_ZONES: readonly DemoPantryZone[] = [
  "Fridge 1",
  "Fridge 2",
  "Freezer 1",
  "Freezer 2",
  "Freezer 3",
  "Kitchen Pantry",
] as const;

export type PantryStorageZoneAccent =
  | "cyan"
  | "sky"
  | "indigo"
  | "violet"
  | "blue"
  | "teal";

export const PANTRY_ZONE_ACCENTS: Record<DemoPantryZone, PantryStorageZoneAccent> = {
  "Fridge 1": "cyan",
  "Fridge 2": "sky",
  "Freezer 1": "indigo",
  "Freezer 2": "violet",
  "Freezer 3": "blue",
  "Kitchen Pantry": "teal",
};

export const PANTRY_ZONE_ICONS: Record<DemoPantryZone, string> = {
  "Fridge 1": "🧊",
  "Fridge 2": "🧊",
  "Freezer 1": "❄️",
  "Freezer 2": "❄️",
  "Freezer 3": "❄️",
  "Kitchen Pantry": "🫙",
};

/** Resolve a pantry row to a friendly zone label when it matches demo / detail fields. */
export function resolvePantryStorageZone(item: PantryItem): DemoPantryZone | null {
  const cold = (item.coldLocationDetail ?? item.locationDetail ?? "").trim();
  const pantryNote = (item.pantryLocationNote ?? "").trim();
  const tagHit = item.tags?.find((t) =>
    PANTRY_STORAGE_ZONES.some((z) => t.toLowerCase().includes(z.toLowerCase().replace(/\s+/g, "-"))),
  );

  for (const zone of PANTRY_STORAGE_ZONES) {
    if (cold === zone || pantryNote === zone) {
      return zone;
    }
    const map = DEMO_ZONE_TO_LOCATION[zone];
    if (map.coldDetail && cold === map.coldDetail) {
      return zone;
    }
    if (map.pantryNote && pantryNote === map.pantryNote) {
      return zone;
    }
    if (item.storageArea === map.location && (cold === map.coldDetail || pantryNote === map.pantryNote)) {
      return zone;
    }
  }

  if (tagHit) {
    const match = PANTRY_STORAGE_ZONES.find((z) =>
      tagHit.toLowerCase().includes(z.toLowerCase().replace(/\s+/g, "-")),
    );
    if (match) {
      return match;
    }
  }

  return null;
}

export function itemMatchesStorageZone(item: PantryItem, zone: DemoPantryZone | "all"): boolean {
  if (zone === "all") {
    return true;
  }
  const resolved = resolvePantryStorageZone(item);
  if (resolved === zone) {
    return true;
  }
  const map = DEMO_ZONE_TO_LOCATION[zone];
  if (item.storageArea !== map.location) {
    return false;
  }
  if (map.coldDetail) {
    const cold = (item.coldLocationDetail ?? item.locationDetail ?? "").trim();
    return cold === map.coldDetail || cold === zone;
  }
  if (map.pantryNote) {
    const note = (item.pantryLocationNote ?? "").trim();
    return note === map.pantryNote || note === zone;
  }
  return true;
}

function isLow(item: PantryItem): boolean {
  if (item.status === "Low") {
    return true;
  }
  const qty = Number.parseFloat(String(item.quantity ?? "").trim());
  const min = Number.parseFloat(String(item.minQuantity ?? "").trim());
  return Number.isFinite(qty) && Number.isFinite(min) && qty > 0 && qty <= min;
}

export type PantryZoneSummary = {
  zone: DemoPantryZone;
  count: number;
  low: number;
  out: number;
  accent: PantryStorageZoneAccent;
  icon: string;
};

export function summarizePantryByZone(items: PantryItem[]): PantryZoneSummary[] {
  const active = items.filter((p) => p && !p.inactiveInInventory);
  return PANTRY_STORAGE_ZONES.map((zone) => {
    const inZone = active.filter((item) => itemMatchesStorageZone(item, zone));
    return {
      zone,
      count: inZone.length,
      low: inZone.filter((i) => isLow(i)).length,
      out: inZone.filter((i) => i.status === "Out").length,
      accent: PANTRY_ZONE_ACCENTS[zone],
      icon: PANTRY_ZONE_ICONS[zone],
    };
  });
}
