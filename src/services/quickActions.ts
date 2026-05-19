/** Supported quick-action types for /quick-add deep links (Siri Shortcuts, QR, etc.). */
export type QuickActionType =
  | "grocery"
  | "task"
  | "chore"
  | "event"
  | "note"
  | "message"
  | "pantry";

const ALLOWED_PARAM_KEYS = new Set(["type", "name", "title", "date", "time", "body"]);

export const QUICK_ADD_PATH = "/quick-add";

const MAX_TEXT_LEN = 200;

export type QuickAction =
  | { type: "grocery"; name: string }
  | { type: "task"; title: string }
  | { type: "chore"; title: string }
  | { type: "event"; title: string; date?: string; time?: string }
  | { type: "note"; title: string }
  | { type: "message"; title: string; body?: string }
  | { type: "pantry"; name: string };

export type ParseQuickActionResult =
  | { ok: true; action: QuickAction }
  | { ok: false; errors: string[] };

function clampText(raw: string, label: string): { value: string; error?: string } {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length > MAX_TEXT_LEN) {
    return {
      value: trimmed.slice(0, MAX_TEXT_LEN),
      error: `${label} must be at most ${MAX_TEXT_LEN} characters.`,
    };
  }
  return { value: trimmed };
}

/** Return unknown query keys (excluding empty values). */
export function getUnknownQuickActionKeys(searchParams: URLSearchParams): string[] {
  const unknown: string[] = [];
  searchParams.forEach((value, key) => {
    if (value === "" || value == null) {
      return;
    }
    if (!ALLOWED_PARAM_KEYS.has(key)) {
      unknown.push(key);
    }
  });
  return unknown;
}

/**
 * Parse /quick-add query string into a structured action.
 * Rejects unknown parameters. Does not validate required fields — use {@link validateQuickAction}.
 */
export function parseQuickActionSearchParams(
  searchParams: URLSearchParams,
): ParseQuickActionResult {
  const unknown = getUnknownQuickActionKeys(searchParams);
  if (unknown.length > 0) {
    return {
      ok: false,
      errors: [`Remove unsupported parameters: ${unknown.sort().join(", ")}.`],
    };
  }

  const typeRaw = (searchParams.get("type") ?? "").trim().toLowerCase();
  if (!typeRaw) {
    return { ok: false, errors: ["Missing required parameter: type."] };
  }

  if (typeRaw === "grocery") {
    const nameRaw = searchParams.get("name") ?? "";
    const { value, error } = clampText(nameRaw, "Name");
    if (error) {
      return { ok: false, errors: [error] };
    }
    return { ok: true, action: { type: "grocery", name: value } };
  }

  if (typeRaw === "task") {
    const titleRaw = searchParams.get("title") ?? searchParams.get("name") ?? "";
    const { value, error } = clampText(titleRaw, "Title");
    if (error) {
      return { ok: false, errors: [error] };
    }
    return { ok: true, action: { type: "task", title: value } };
  }

  if (typeRaw === "chore") {
    const titleRaw = searchParams.get("title") ?? searchParams.get("name") ?? "";
    const { value, error } = clampText(titleRaw, "Title");
    if (error) {
      return { ok: false, errors: [error] };
    }
    return { ok: true, action: { type: "chore", title: value } };
  }

  if (typeRaw === "message") {
    const titleRaw = searchParams.get("title") ?? searchParams.get("name") ?? "";
    const { value: title, error: titleErr } = clampText(titleRaw, "Title");
    if (titleErr) {
      return { ok: false, errors: [titleErr] };
    }
    const bodyRaw = searchParams.get("body") ?? "";
    const { value: body, error: bodyErr } = clampText(bodyRaw, "Message body");
    if (bodyErr) {
      return { ok: false, errors: [bodyErr] };
    }
    return { ok: true, action: { type: "message", title, body: body || undefined } };
  }

  if (typeRaw === "pantry") {
    const nameRaw = searchParams.get("name") ?? "";
    const { value, error } = clampText(nameRaw, "Name");
    if (error) {
      return { ok: false, errors: [error] };
    }
    return { ok: true, action: { type: "pantry", name: value } };
  }

  if (typeRaw === "event") {
    const titleRaw = searchParams.get("title") ?? searchParams.get("name") ?? "";
    const { value: title, error: titleErr } = clampText(titleRaw, "Title");
    if (titleErr) {
      return { ok: false, errors: [titleErr] };
    }
    const dateRaw = (searchParams.get("date") ?? "").trim();
    const timeRaw = (searchParams.get("time") ?? "").trim();
    let date: string | undefined;
    if (dateRaw) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
        return { ok: false, errors: ["Date must be YYYY-MM-DD."] };
      }
      date = dateRaw;
    }
    let time: string | undefined;
    if (timeRaw) {
      if (!/^\d{1,2}:\d{2}$/.test(timeRaw)) {
        return { ok: false, errors: ["Time must be HH:mm (24-hour)."] };
      }
      const [h, m] = timeRaw.split(":");
      time = `${h!.padStart(2, "0")}:${m}`;
    }
    return { ok: true, action: { type: "event", title, date, time } };
  }

  if (typeRaw === "note") {
    const titleRaw = searchParams.get("title") ?? searchParams.get("name") ?? "";
    const { value, error } = clampText(titleRaw, "Title");
    if (error) {
      return { ok: false, errors: [error] };
    }
    return { ok: true, action: { type: "note", title: value } };
  }

  return {
    ok: false,
    errors: [
      `Unknown type "${typeRaw}". Use grocery, task, chore, event, note, message, or pantry.`,
    ],
  };
}

/** Field-level validation for a parsed action (required fields). */
export function validateQuickAction(action: QuickAction): string[] {
  const errors: string[] = [];
  switch (action.type) {
    case "grocery":
      if (!action.name.trim()) {
        errors.push("Grocery name is required.");
      }
      break;
    case "task":
      if (!action.title.trim()) {
        errors.push("Task title is required.");
      }
      break;
    case "chore":
      if (!action.title.trim()) {
        errors.push("Chore name is required.");
      }
      break;
    case "event":
      if (!action.title.trim()) {
        errors.push("Event title is required.");
      }
      break;
    case "note":
      if (!action.title.trim()) {
        errors.push("Note title is required.");
      }
      break;
    case "message":
      if (!action.title.trim()) {
        errors.push("Message title is required.");
      }
      break;
    case "pantry":
      if (!action.name.trim()) {
        errors.push("Pantry item name is required.");
      }
      break;
  }
  return errors;
}

function applyQuickActionParams(u: URL, action: QuickAction) {
  u.searchParams.set("type", action.type);
  switch (action.type) {
    case "grocery":
      u.searchParams.set("name", action.name);
      break;
    case "task":
      u.searchParams.set("title", action.title);
      break;
    case "chore":
      u.searchParams.set("title", action.title);
      break;
    case "message":
      u.searchParams.set("title", action.title);
      if (action.body) {
        u.searchParams.set("body", action.body);
      }
      break;
    case "pantry":
      u.searchParams.set("name", action.name);
      break;
    case "event":
      u.searchParams.set("title", action.title);
      if (action.date) {
        u.searchParams.set("date", action.date);
      }
      if (action.time) {
        u.searchParams.set("time", action.time);
      }
      break;
    case "note":
      u.searchParams.set("title", action.title);
      break;
    default: {
      const _e: never = action;
      throw new Error(`applyQuickActionParams: ${String(_e)}`);
    }
  }
}

/** Path + query only, e.g. `/quick-add?type=grocery&name=Milk` — for SPA navigation. */
export function buildQuickActionHref(action: QuickAction): string {
  const u = new URL(QUICK_ADD_PATH, "http://_");
  applyQuickActionParams(u, action);
  return `${u.pathname}${u.search}`;
}

export function buildQuickActionUrl(origin: string, action: QuickAction): string {
  const u = new URL(
    QUICK_ADD_PATH,
    origin.endsWith("/") ? origin.slice(0, -1) : origin,
  );
  applyQuickActionParams(u, action);
  return u.toString();
}

export function getQuickActionPreviewText(action: QuickAction): string {
  switch (action.type) {
    case "grocery":
      return `Add grocery: ${action.name || "(name needed)"}`;
    case "task":
      return `Add task: ${action.title || "(title needed)"}`;
    case "chore":
      return `Add chore: ${action.title || "(title needed)"}`;
    case "event": {
      const when = [action.date, action.time].filter(Boolean).join(" at ");
      return when
        ? `Add event: ${action.title || "(title needed)"} — ${when}`
        : `Add event: ${action.title || "(title needed)"}`;
    }
    case "note":
      return `Add note: ${action.title || "(title needed)"}`;
    case "message":
      return action.body?.trim()
        ? `Post message: ${action.title || "(title needed)"} — ${action.body.trim()}`
        : `Post message: ${action.title || "(title needed)"}`;
    case "pantry":
      return `Add pantry item: ${action.name || "(name needed)"}`;
    default: {
      const _n: never = action;
      return String(_n);
    }
  }
}

export function buildAbsoluteAppUrl(origin: string, path: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
