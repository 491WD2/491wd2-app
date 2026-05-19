/** localStorage keys for Template Workbench (491WD). */
export const TEMPLATE_WORKBENCH_STORAGE = {
  selected: "491wd-template-workbench-selected",
  notes: "491wd-template-workbench-notes",
  candidates: "491wd-template-workbench-candidates",
  marked: "491wd-template-workbench-marked",
} as const;

export type TemplateWorkbenchUseCaseKey =
  | "pantry"
  | "dashboard"
  | "alerts"
  | "buttons"
  | "cards"
  | "tables"
  | "lists"
  | "forms"
  | "dragDrop"
  | "notes"
  | "navigation";

export const TEMPLATE_WORKBENCH_USE_CASES: { key: TemplateWorkbenchUseCaseKey; label: string }[] = [
  { key: "pantry", label: "Pantry" },
  { key: "dashboard", label: "Dashboard" },
  { key: "alerts", label: "Alerts" },
  { key: "buttons", label: "Buttons" },
  { key: "cards", label: "Cards" },
  { key: "tables", label: "Tables" },
  { key: "lists", label: "Lists" },
  { key: "forms", label: "Forms" },
  { key: "dragDrop", label: "Drag/drop" },
  { key: "notes", label: "Notes" },
  { key: "navigation", label: "Navigation" },
];

export type TemplateWorkbenchCandidatesMap = Record<string, Partial<Record<TemplateWorkbenchUseCaseKey, boolean>>>;

/** Serialized shape in `491wd-template-workbench-candidates` (per template id → use-case keys). */
export type TemplateWorkbenchCandidatesSerialized = Record<string, TemplateWorkbenchUseCaseKey[]>;

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSelectedTemplateId(): string | null {
  return localStorage.getItem(TEMPLATE_WORKBENCH_STORAGE.selected);
}

export function saveSelectedTemplateId(id: string | null): void {
  if (id == null || id === "") {
    localStorage.removeItem(TEMPLATE_WORKBENCH_STORAGE.selected);
  } else {
    localStorage.setItem(TEMPLATE_WORKBENCH_STORAGE.selected, id);
  }
}

export function loadNotesMap(): Record<string, string> {
  return safeParseJson(localStorage.getItem(TEMPLATE_WORKBENCH_STORAGE.notes), {});
}

export function saveNotesMap(map: Record<string, string>): void {
  localStorage.setItem(TEMPLATE_WORKBENCH_STORAGE.notes, JSON.stringify(map));
}

const USE_CASE_KEY_SET = new Set<string>(TEMPLATE_WORKBENCH_USE_CASES.map((u) => u.key));

function normalizeCandidatesEntry(
  val: unknown,
): Partial<Record<TemplateWorkbenchUseCaseKey, boolean>> | undefined {
  if (val == null) {
    return undefined;
  }
  if (Array.isArray(val)) {
    const out: Partial<Record<TemplateWorkbenchUseCaseKey, boolean>> = {};
    for (const k of val) {
      if (typeof k === "string" && USE_CASE_KEY_SET.has(k)) {
        out[k as TemplateWorkbenchUseCaseKey] = true;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  if (typeof val === "object") {
    const row = val as Record<string, unknown>;
    const out: Partial<Record<TemplateWorkbenchUseCaseKey, boolean>> = {};
    for (const key of USE_CASE_KEY_SET) {
      if (row[key] === true) {
        out[key as TemplateWorkbenchUseCaseKey] = true;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return undefined;
}

export function loadCandidatesMap(): TemplateWorkbenchCandidatesMap {
  const raw = safeParseJson<Record<string, unknown>>(
    localStorage.getItem(TEMPLATE_WORKBENCH_STORAGE.candidates),
    {},
  );
  const out: TemplateWorkbenchCandidatesMap = {};
  for (const [id, val] of Object.entries(raw)) {
    const norm = normalizeCandidatesEntry(val);
    if (norm) {
      out[id] = norm;
    }
  }
  return out;
}

export function saveCandidatesMap(map: TemplateWorkbenchCandidatesMap): void {
  const serial: Record<string, TemplateWorkbenchUseCaseKey[]> = {};
  for (const [id, row] of Object.entries(map)) {
    if (!row) {
      continue;
    }
    const keys: TemplateWorkbenchUseCaseKey[] = [];
    for (const { key } of TEMPLATE_WORKBENCH_USE_CASES) {
      if (row[key]) {
        keys.push(key);
      }
    }
    if (keys.length > 0) {
      serial[id] = keys;
    }
  }
  localStorage.setItem(TEMPLATE_WORKBENCH_STORAGE.candidates, JSON.stringify(serial));
}

export function hasUseCaseAssignments(itemId: string, map: TemplateWorkbenchCandidatesMap): boolean {
  const row = map[itemId];
  if (!row) {
    return false;
  }
  return Object.values(row).some(Boolean);
}

export function loadMarkedIds(): string[] {
  return safeParseJson(localStorage.getItem(TEMPLATE_WORKBENCH_STORAGE.marked), []);
}

export function saveMarkedIds(ids: string[]): void {
  localStorage.setItem(TEMPLATE_WORKBENCH_STORAGE.marked, JSON.stringify(ids));
}
