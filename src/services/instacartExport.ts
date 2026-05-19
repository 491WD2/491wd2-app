import type { AdminSettings, ShoppingItem } from "../data/familyData";

const supportedUnitMap: Record<string, string> = {
  bag: "bag",
  bags: "bag",
  box: "box",
  boxes: "box",
  bunch: "bunch",
  bunches: "bunch",
  can: "can",
  cans: "can",
  carton: "carton",
  cartons: "carton",
  each: "each",
  gallon: "gallon",
  gallons: "gallon",
  gal: "gallon",
  lb: "lb",
  lbs: "lb",
  oz: "oz",
  pack: "pack",
  packs: "pack",
  package: "pack",
  packages: "pack",
};

export type InstacartExportOptions = {
  listTitle?: string;
  preferredStoreName?: string;
  preferredZipCode?: string;
};

export type InstacartLineItem = {
  name: string;
  quantity: string;
  unit?: string;
  barcode?: string;
  brand?: string;
  storeSection?: string;
  preferredStore?: string;
  notes?: string;
  displayText: string;
  warnings: string[];
};

export type InstacartShoppingListPayload = {
  provider: "instacart";
  listTitle: string;
  createdAt: string;
  itemCount: number;
  preferredStoreName?: string;
  preferredZipCode?: string;
  items: InstacartLineItem[];
};

export function buildInstacartLineItems(
  shoppingItems: ShoppingItem[],
): InstacartLineItem[] {
  return shoppingItems.map((item) => {
    const rawName = item.name.trim();
    const parsed = parseQuantityAndUnit(rawName);
    const displayName = (parsed.name || rawName).trim() || rawName;

    const qtyFromField = item.quantity?.trim() ?? "";
    const quantity = qtyFromField || parsed.quantity || "";
    const finalQuantity = quantity || "1";

    const unitFromField = item.unit?.trim() ?? "";
    const unitRaw =
      unitFromField || (parsed.unit ? parsed.unit.trim() : "") || "";
    const unit = normalizeInstacartUnit(unitRaw);

    const warnings: string[] = [];
    if (!qtyFromField && !parsed.quantity) {
      warnings.push("Missing quantity; using 1 for export.");
    }
    if (!unitRaw) {
      warnings.push("Missing unit.");
    } else {
      const unsupported = getUnsupportedUnitWarning(unitRaw);
      if (unsupported) {
        warnings.push(unsupported);
      }
    }

    const brandPrefix = item.brand ? `${item.brand} ` : "";
    const unitSuffix = unit ? ` ${unit}` : unitRaw ? ` ${unitRaw}` : "";

    const storeSection = item.storeSection?.trim() || undefined;
    const preferredStore = item.preferredStore?.trim() || undefined;
    const notes = item.notes?.trim() || undefined;

    return {
      name: displayName,
      quantity: finalQuantity,
      unit: unit || unitRaw || undefined,
      barcode: item.barcode?.trim() || undefined,
      brand: item.brand?.trim() || undefined,
      storeSection,
      preferredStore,
      notes,
      displayText: `${finalQuantity}${unitSuffix} ${brandPrefix}${displayName}`.trim(),
      warnings,
    };
  });
}

export function buildInstacartShoppingListPayload(
  shoppingItems: ShoppingItem[],
  options: InstacartExportOptions = {},
): InstacartShoppingListPayload {
  const items = buildInstacartLineItems(shoppingItems);

  // Future serverless function should call Instacart Developer Platform Create
  // Shopping List Page with API key stored server-side.
  return {
    provider: "instacart",
    listTitle: options.listTitle || "FamilySite Shopping List",
    createdAt: new Date().toISOString(),
    itemCount: items.length,
    preferredStoreName: options.preferredStoreName || undefined,
    preferredZipCode: options.preferredZipCode || undefined,
    items,
  };
}

export function normalizeInstacartUnit(unit?: string) {
  if (!unit) {
    return undefined;
  }

  return supportedUnitMap[unit.trim().toLowerCase()];
}

export function getUnsupportedUnitWarning(unit?: string) {
  if (!unit || normalizeInstacartUnit(unit)) {
    return "";
  }

  return `Unsupported unit "${unit}" may need review.`;
}

export function buildPlainTextShoppingList(
  lineItems: InstacartLineItem[],
  options?: {
    listTitle?: string;
    preferredStoreName?: string;
    preferredZipCode?: string;
  },
) {
  const title = options?.listTitle || "FamilySite Shopping List";
  const headerLines = [
    title,
    options?.preferredStoreName
      ? `Store: ${options.preferredStoreName}`
      : "",
    options?.preferredZipCode ? `ZIP: ${options.preferredZipCode}` : "",
    "",
  ];

  const bodyLines = lineItems.map((item) => {
    const warnSuffix =
      item.warnings.length > 0 ? ` [${item.warnings.join(" ")}]` : "";
    return `- ${item.displayText}${warnSuffix}`;
  });

  return [...headerLines, ...bodyLines].filter(Boolean).join("\n");
}

export function buildPlainTextInstacartList(
  payload: InstacartShoppingListPayload,
) {
  return buildPlainTextShoppingList(payload.items, {
    listTitle: payload.listTitle,
    preferredStoreName: payload.preferredStoreName,
    preferredZipCode: payload.preferredZipCode,
  });
}

export function getInstacartExportOptions(settings: AdminSettings) {
  return {
    preferredStoreName: settings.instacart.preferredStoreName,
    preferredZipCode: settings.instacart.preferredZipCode,
  };
}

function parseQuantityAndUnit(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s*x)?\s*([a-zA-Z]+)?\s+(.+)$/);

  if (!match) {
    return {
      quantity: "",
      unit: "",
      name: trimmed,
    };
  }

  return {
    quantity: match[1] ?? "",
    unit: match[2] ?? "",
    name: match[3]?.trim() || trimmed,
  };
}
