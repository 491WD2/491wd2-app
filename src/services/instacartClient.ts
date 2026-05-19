/**
 * Browser-safe Instacart helper: calls Netlify functions only.
 * Never embed Instacart API keys in frontend bundles.
 */

import {
  buildInstacartLineItems,
  normalizeInstacartUnit,
  type InstacartLineItem,
} from "./instacartExport";
import type { ShoppingItem } from "../data/familyData";

function createInstacartListUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  return `${base}/.netlify/functions/create-instacart-list`;
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** Minimal fields allowed on the wire (privacy). */
export type InstacartWireLineItem = {
  name: string;
  quantity: number;
  unit: string;
  brand?: string;
  barcode?: string;
};

export function shoppingItemsToWireLineItems(
  shoppingItems: ShoppingItem[],
): InstacartWireLineItem[] {
  const built = buildInstacartLineItems(shoppingItems);
  return built.map(wireFromExportLine);
}

function wireFromExportLine(li: InstacartLineItem): InstacartWireLineItem {
  const qty = parseFloat(String(li.quantity).replace(/,/g, ""));
  const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const unit = normalizeInstacartUnit(li.unit) || "each";
  const row: InstacartWireLineItem = {
    name: li.name,
    quantity,
    unit,
  };
  if (li.brand?.trim()) {
    row.brand = li.brand.trim();
  }
  if (li.barcode?.trim()) {
    row.barcode = li.barcode.trim();
  }
  return row;
}

export async function pingInstacartConnection(): Promise<{
  ok: boolean;
  connected: boolean;
  message?: string;
}> {
  const url = createInstacartListUrl();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ping: true }),
    });
  } catch {
    return {
      ok: false,
      connected: false,
      message: "Could not reach the Instacart helper.",
    };
  }

  const text = await res.text();
  const parsed = parseJsonSafe(text) as Record<string, unknown> | null;

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      connected: false,
      message: "Unexpected response from Instacart helper.",
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      connected: false,
      message:
        "Instacart helper was not found. Use netlify dev or deploy with netlify/functions.",
    };
  }

  const connected = parsed.connected === true;
  return { ok: parsed.ok === true, connected };
}

export type CreateInstacartListResult =
  | { ok: true; url: string }
  | { ok: false; code: string; message: string; detail?: string };

export async function createInstacartShoppingLink(options: {
  title: string;
  lineItems: InstacartWireLineItem[];
}): Promise<CreateInstacartListResult> {
  const url = createInstacartListUrl();

  if (options.lineItems.length === 0) {
    return { ok: false, code: "empty_list", message: "Your shopping list is empty." };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: options.title,
        line_items: options.lineItems,
      }),
    });
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "We could not create the Instacart list right now.",
    };
  }

  const text = await res.text();
  const parsed = parseJsonSafe(text) as Record<string, unknown> | null;

  if (parsed === null || typeof parsed !== "object") {
    return {
      ok: false,
      code: "bad_response",
      message: "We could not create the Instacart list right now.",
      detail: text.slice(0, 200),
    };
  }

  const ok = parsed.ok === true;
  if (!ok) {
    const code = typeof parsed.code === "string" ? parsed.code : "error";
    const message =
      typeof parsed.message === "string"
        ? parsed.message
        : "We could not create the Instacart list right now.";
    if (code === "missing_api_key") {
      return { ok: false, code, message: "Instacart is not connected yet." };
    }
    return {
      ok: false,
      code,
      message,
      detail: typeof parsed.detail === "string" ? parsed.detail : undefined,
    };
  }

  const link =
    typeof parsed.products_link_url === "string" ? parsed.products_link_url.trim() : "";
  if (!link) {
    return {
      ok: false,
      code: "no_url",
      message: "Instacart did not return a shopping link.",
    };
  }

  return { ok: true, url: link };
}
