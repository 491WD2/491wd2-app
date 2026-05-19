import type { PantryItem } from "../data/familyData";
import { getInventoryLocationLabel } from "../pages/inventory/inventoryUtils";

export type InventoryQrLocationFilters = {
  storageArea: string;
  locationDetail?: string;
  pantryWall?: string;
  pantryShelf?: string;
};

export type ParsedInventoryQuery = {
  itemId?: string;
  location?: InventoryQrLocationFilters;
};

function clean(value?: string | null) {
  const v = (value ?? "").trim();
  return v ? v : undefined;
}

/**
 * Build a location URL to open Household Inventory filtered by storage/location.
 * Writes both the new query params (storageArea, pantryWall, pantryShelf, locationDetail)
 * and legacy params (storage, wall, shelf, detail) so older links still work.
 */
export function buildInventoryLocationUrl(
  origin: string,
  filters: InventoryQrLocationFilters,
): string {
  const u = new URL("/pantry", origin);
  u.searchParams.set("storageArea", filters.storageArea);
  u.searchParams.set("storage", filters.storageArea);
  if (filters.pantryWall) {
    u.searchParams.set("pantryWall", filters.pantryWall);
    u.searchParams.set("wall", filters.pantryWall);
  }
  if (filters.pantryShelf) {
    u.searchParams.set("pantryShelf", filters.pantryShelf);
    u.searchParams.set("shelf", filters.pantryShelf);
  }
  if (filters.locationDetail) {
    u.searchParams.set("locationDetail", filters.locationDetail);
    u.searchParams.set("detail", filters.locationDetail);
  }
  return u.toString();
}

/**
 * Build an item URL to open/highlight a specific inventory item.
 * Writes both `itemId` and legacy `item` param.
 */
export function buildInventoryItemUrl(origin: string, itemId: string): string {
  const u = new URL("/pantry", origin);
  u.searchParams.set("itemId", itemId);
  u.searchParams.set("item", itemId);
  return u.toString();
}

/**
 * Parse supported inventory query params.
 * Accepts both the new keys (itemId, storageArea, pantryWall, pantryShelf, locationDetail)
 * and legacy keys (item, storage, wall, shelf, detail, label).
 */
export function parseInventoryQueryParams(searchParams: URLSearchParams): ParsedInventoryQuery {
  const itemId = clean(searchParams.get("itemId")) ?? clean(searchParams.get("item"));
  if (itemId) {
    return { itemId };
  }

  const storageArea =
    clean(searchParams.get("storageArea")) ?? clean(searchParams.get("storage"));
  if (!storageArea) {
    return {};
  }

  const pantryWall = clean(searchParams.get("pantryWall")) ?? clean(searchParams.get("wall"));
  const pantryShelf =
    clean(searchParams.get("pantryShelf")) ?? clean(searchParams.get("shelf"));
  const locationDetail =
    clean(searchParams.get("locationDetail")) ??
    clean(searchParams.get("detail")) ??
    clean(searchParams.get("label"));

  return {
    location: {
      storageArea,
      ...(pantryWall ? { pantryWall } : {}),
      ...(pantryShelf ? { pantryShelf } : {}),
      ...(locationDetail ? { locationDetail } : {}),
    },
  };
}

export function getInventoryQrLabelText(input: {
  title?: string;
  location?: InventoryQrLocationFilters;
  item?: PantryItem;
}): string {
  const title = (input.title ?? "").trim();
  if (title) {
    return title;
  }
  if (input.item) {
    return input.item.name;
  }
  const loc = input.location;
  if (!loc) {
    return "Inventory label";
  }
  if (loc.storageArea === "Pantry") {
    return ["Pantry", loc.pantryWall, loc.pantryShelf].filter(Boolean).join(" · ");
  }
  if (loc.storageArea === "Custom Location") {
    return loc.locationDetail || "Custom location";
  }
  return [loc.storageArea, loc.locationDetail].filter(Boolean).join(" · ") || loc.storageArea;
}

/** Convenience: build a location QR URL from a pantry item row. */
export function buildInventorySpotUrlFromItem(origin: string, item: PantryItem): string {
  if (item.storageArea === "Pantry") {
    return buildInventoryLocationUrl(origin, {
      storageArea: "Pantry",
      pantryWall: item.pantryWall ?? item.wall,
      pantryShelf: item.pantryShelf ?? item.shelf,
    });
  }
  if (item.storageArea === "Custom Location") {
    return buildInventoryLocationUrl(origin, {
      storageArea: "Custom Location",
      locationDetail: getInventoryLocationLabel(item),
    });
  }
  const detail =
    item.kitchenLocationDetail || item.coldLocationDetail || item.locationDetail;
  return buildInventoryLocationUrl(origin, {
    storageArea: item.storageArea,
    ...(detail ? { locationDetail: detail } : {}),
  });
}

