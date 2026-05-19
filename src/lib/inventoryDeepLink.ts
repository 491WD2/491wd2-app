import type { PantryItem } from "../data/familyData";
import { getInventoryLocationLabel } from "../pages/inventory/inventoryUtils";

/** Narrow filter for “spot” QR codes (shelf, bin, zone). */
export type QrLocationConstraint = {
  storage: string;
  wall?: string;
  shelf?: string;
  detail?: string;
  /** Exact {@link getInventoryLocationLabel} match (e.g. custom spots). */
  label?: string;
};

export type ParsedInventoryQr = {
  itemId?: string;
  location?: QrLocationConstraint;
};

export function buildInventoryItemDeepLink(origin: string, itemId: string): string {
  const u = new URL("/pantry", origin);
  u.searchParams.set("itemId", itemId);
  u.searchParams.set("item", itemId);
  return u.toString();
}

export function buildInventoryLocationDeepLink(
  origin: string,
  loc: QrLocationConstraint,
): string {
  const u = new URL("/pantry", origin);
  u.searchParams.set("storageArea", loc.storage);
  u.searchParams.set("storage", loc.storage);
  if (loc.wall) {
    u.searchParams.set("pantryWall", loc.wall);
    u.searchParams.set("wall", loc.wall);
  }
  if (loc.shelf) {
    u.searchParams.set("pantryShelf", loc.shelf);
    u.searchParams.set("shelf", loc.shelf);
  }
  if (loc.detail) {
    u.searchParams.set("locationDetail", loc.detail);
    u.searchParams.set("detail", loc.detail);
  }
  if (loc.label) {
    u.searchParams.set("label", loc.label);
  }
  return u.toString();
}

/** Build a location URL from an existing row (for “this shelf / this bin”). */
export function locationDeepLinkFromPantryItem(origin: string, item: PantryItem): string {
  if (item.storageArea === "Pantry") {
    return buildInventoryLocationDeepLink(origin, {
      storage: "Pantry",
      wall: item.pantryWall ?? item.wall,
      shelf: item.pantryShelf ?? item.shelf,
    });
  }

  if (item.storageArea === "Custom Location") {
    return buildInventoryLocationDeepLink(origin, {
      storage: "Custom Location",
      label: getInventoryLocationLabel(item),
    });
  }

  const detail =
    item.kitchenLocationDetail || item.coldLocationDetail || item.locationDetail;
  return buildInventoryLocationDeepLink(origin, {
    storage: item.storageArea,
    ...(detail ? { detail } : {}),
  });
}

export function parseInventoryQrSearch(search: string): ParsedInventoryQr {
  if (!search || !search.startsWith("?")) {
    return {};
  }

  const p = new URLSearchParams(search.slice(1));
  const itemId = (p.get("itemId") ?? p.get("item"))?.trim();
  if (itemId) {
    return { itemId };
  }

  const storage = (p.get("storageArea") ?? p.get("storage"))?.trim();
  if (!storage) {
    return {};
  }

  const wall = (p.get("pantryWall") ?? p.get("wall"))?.trim();
  const shelf = (p.get("pantryShelf") ?? p.get("shelf"))?.trim();
  const detail = (p.get("locationDetail") ?? p.get("detail"))?.trim();
  const label = p.get("label")?.trim();

  return {
    location: {
      storage,
      ...(wall ? { wall } : {}),
      ...(shelf ? { shelf } : {}),
      ...(detail ? { detail } : {}),
      ...(label ? { label } : {}),
    },
  };
}

export function itemMatchesQrLocation(item: PantryItem, q: QrLocationConstraint): boolean {
  if (item.storageArea !== q.storage) {
    return false;
  }

  if (q.label) {
    return getInventoryLocationLabel(item) === q.label;
  }

  if (q.wall && item.storageArea === "Pantry") {
    const w = item.pantryWall ?? item.wall;
    if (w !== q.wall) {
      return false;
    }
  }

  if (q.shelf && item.storageArea === "Pantry") {
    const s = item.pantryShelf ?? item.shelf;
    if (s !== q.shelf) {
      return false;
    }
  }

  if (q.detail) {
    const matches =
      item.kitchenLocationDetail === q.detail ||
      item.coldLocationDetail === q.detail ||
      item.locationDetail === q.detail;
    if (!matches) {
      return false;
    }
  }

  return true;
}
