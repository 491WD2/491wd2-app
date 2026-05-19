/**
 * Creates an Instacart shopping list link via Instacart Developer Platform.
 * INSTACART_API_KEY is server-only — never prefixed with VITE_.
 */

type NetlifyHandlerEvent = {
  httpMethod?: string;
  body?: string | null;
};

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

const DEFAULT_BASE = "https://connect.instacart.com";

function connectBaseUrl(): string {
  const raw = process.env.INSTACART_CONNECT_BASE_URL?.trim();
  return raw || DEFAULT_BASE;
}

function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  const map: Record<string, string> = {
    bag: "bag",
    bags: "bag",
    box: "box",
    can: "can",
    carton: "carton",
    bunch: "bunch",
    each: "each",
    gallon: "gallon",
    lb: "lb",
    oz: "oz",
    pack: "pack",
    package: "pack",
  };
  return map[u] ?? u || "each";
}

function mapIncomingLineItem(raw: Record<string, unknown>): Record<string, unknown> | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) {
    return null;
  }

  let quantity = 1;
  if (typeof raw.quantity === "number" && Number.isFinite(raw.quantity) && raw.quantity > 0) {
    quantity = raw.quantity;
  } else if (raw.quantity !== undefined && raw.quantity !== null) {
    const parsed = parseFloat(String(raw.quantity));
    if (Number.isFinite(parsed) && parsed > 0) {
      quantity = parsed;
    }
  }

  const unitRaw = typeof raw.unit === "string" ? raw.unit.trim() : "";
  const unit = normalizeUnit(unitRaw || "each");

  const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
  const barcode = typeof raw.barcode === "string" ? raw.barcode.trim() : "";

  const lineItem: Record<string, unknown> = {
    name,
    line_item_measurements: [{ quantity, unit }],
  };

  if (/^\d{8,14}$/.test(barcode)) {
    lineItem.upcs = [barcode];
  }

  if (brand && !lineItem.upcs) {
    lineItem.filters = { brand_filters: [brand] };
  }

  return lineItem;
}

export const handler = async (event: NetlifyHandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, code: "method_not_allowed", message: "Use POST with JSON body." });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(event.body ?? "{}") as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, code: "invalid_json", message: "Request body must be JSON." });
  }

  if (parsed.ping === true) {
    const connected = Boolean(process.env.INSTACART_API_KEY?.trim());
    return json(200, { ok: true, connected });
  }

  const apiKey = process.env.INSTACART_API_KEY?.trim();
  if (!apiKey) {
    return json(200, {
      ok: false,
      code: "missing_api_key",
      message: "Instacart is not connected yet.",
    });
  }

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : "Shopping list";

  const rawItems = parsed.line_items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return json(400, {
      ok: false,
      code: "empty_list",
      message: "Your shopping list is empty.",
    });
  }

  const line_items: Record<string, unknown>[] = [];
  for (const row of rawItems) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const mapped = mapIncomingLineItem(row as Record<string, unknown>);
    if (mapped) {
      line_items.push(mapped);
    }
  }

  if (line_items.length === 0) {
    return json(400, {
      ok: false,
      code: "empty_list",
      message: "Your shopping list is empty.",
    });
  }

  const url = `${connectBaseUrl().replace(/\/$/, "")}/idp/v1/products/products_link`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        link_type: "shopping_list",
        line_items,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(200, {
      ok: false,
      code: "network_error",
      message: "We could not create the Instacart list right now.",
      detail: msg.slice(0, 200),
    });
  }

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const hint =
      data && typeof data.message === "string"
        ? data.message
        : text.slice(0, 240);
    return json(200, {
      ok: false,
      code: "instacart_http_error",
      message: "We could not create the Instacart list right now.",
      detail: hint,
    });
  }

  const linkUrl =
    data && typeof data.products_link_url === "string"
      ? data.products_link_url.trim()
      : "";

  if (!linkUrl) {
    return json(200, {
      ok: false,
      code: "no_url",
      message: "Instacart did not return a shopping link.",
    });
  }

  return json(200, {
    ok: true,
    products_link_url: linkUrl,
  });
};
