import type { FamilyMember, MessageBoardColorKey, MessageBoardPriority } from "../data/familyData";

const COLOR_KEYS: readonly MessageBoardColorKey[] = [
  "slate",
  "blue",
  "sky",
  "teal",
  "green",
  "amber",
  "orange",
  "rose",
  "purple",
  "pink",
] as const;

/** Default category label → color key (fallback when item has no/invalid colorKey). */
export const defaultCategoryColorKeyByLabel: Record<string, MessageBoardColorKey> = {
  General: "slate",
  Reminder: "blue",
  Kitchen: "sky",
  Shopping: "teal",
  Cleaning: "green",
  Calendar: "amber",
  School: "orange",
  Medical: "rose",
  Bills: "purple",
  Important: "pink",
  "Family Update": "slate",
};

export const categoryColorMap: Record<
  MessageBoardColorKey,
  { chip: string; border: string; softBg: string }
> = {
  slate: {
    chip: "border-slate-200/90 bg-slate-100/90 text-slate-800",
    border: "border-slate-200",
    softBg: "bg-slate-50/90",
  },
  blue: {
    chip: "border-blue-200/90 bg-blue-50/95 text-blue-900",
    border: "border-blue-200/80",
    softBg: "bg-blue-50/80",
  },
  sky: {
    chip: "border-sky-200/90 bg-sky-50/95 text-sky-950",
    border: "border-sky-200/80",
    softBg: "bg-sky-50/80",
  },
  teal: {
    chip: "border-orange-200/90 bg-orange-50/95 text-orange-950",
    border: "border-orange-200/80",
    softBg: "bg-orange-50/80",
  },
  green: {
    chip: "border-emerald-200/90 bg-emerald-50/95 text-emerald-950",
    border: "border-emerald-200/80",
    softBg: "bg-emerald-50/80",
  },
  amber: {
    chip: "border-amber-200/90 bg-amber-50/95 text-amber-950",
    border: "border-amber-200/80",
    softBg: "bg-amber-50/80",
  },
  orange: {
    chip: "border-orange-200/90 bg-orange-50/95 text-orange-950",
    border: "border-orange-200/80",
    softBg: "bg-orange-50/80",
  },
  rose: {
    chip: "border-rose-200/90 bg-rose-50/95 text-rose-950",
    border: "border-rose-200/80",
    softBg: "bg-rose-50/80",
  },
  purple: {
    chip: "border-violet-200/90 bg-violet-50/95 text-violet-950",
    border: "border-violet-200/80",
    softBg: "bg-violet-50/80",
  },
  pink: {
    chip: "border-fuchsia-200/90 bg-fuchsia-50/95 text-fuchsia-950",
    border: "border-fuchsia-200/80",
    softBg: "bg-fuchsia-50/80",
  },
};

export function normalizeColorKey(value: unknown): MessageBoardColorKey {
  if (typeof value === "string" && (COLOR_KEYS as readonly string[]).includes(value)) {
    return value as MessageBoardColorKey;
  }
  return "slate";
}

export function getCategoryColorClasses(colorKey: MessageBoardColorKey): string {
  return categoryColorMap[normalizeColorKey(colorKey)].chip;
}

/** Resolve chip classes from stored color key or category label defaults. */
export function getCategoryChipClasses(
  categoryLabel: string,
  colorKey: MessageBoardColorKey,
): string {
  const key = normalizeColorKey(colorKey);
  if (key !== "slate") {
    return getCategoryColorClasses(key);
  }
  const fromLabel = defaultCategoryColorKeyByLabel[categoryLabel.trim()];
  if (fromLabel) {
    return getCategoryColorClasses(fromLabel);
  }
  return getCategoryColorClasses("slate");
}

const PRIORITY_CHIP: Record<MessageBoardPriority, string> = {
  low: "border-slate-200/90 bg-slate-50/90 text-slate-700",
  normal: "border-slate-200/90 bg-white text-slate-700",
  important: "border-amber-200/90 bg-amber-50/90 text-amber-950",
  urgent: "border-rose-300/90 bg-rose-50/95 text-rose-950",
};

export function getPriorityColorClasses(priority: MessageBoardPriority): string {
  return `border ${PRIORITY_CHIP[priority] ?? PRIORITY_CHIP.normal} font-semibold`;
}

const MEMBER_THEME_CHIP: Record<string, string> = {
  blue: "border-sky-200 bg-sky-50 text-sky-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  purple: "border-violet-200 bg-violet-50 text-violet-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  orange: "border-orange-200 bg-orange-50 text-orange-950",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  slate: "border-slate-200 bg-slate-100 text-slate-800",
};

export function getMemberColorClasses(member: FamilyMember): string {
  return `border ${MEMBER_THEME_CHIP[member.colorTheme] ?? MEMBER_THEME_CHIP.slate}`;
}

/** Task / chore priority chip (maps app Priority to soft chips). */
export function getTaskPriorityChipClass(priority: string): string {
  const p = priority.trim().toLowerCase();
  if (p === "high") {
    return "border border-amber-200/90 bg-amber-50/90 text-amber-950 font-semibold";
  }
  if (p === "medium") {
    return "border border-sky-200/90 bg-sky-50/90 text-sky-950 font-semibold";
  }
  return "border border-slate-200/90 bg-slate-50/90 text-slate-700 font-semibold";
}

export function getTaskStatusChipClass(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "done" || s === "completed") {
    return "border border-emerald-200/90 bg-emerald-50/90 text-emerald-950 font-semibold";
  }
  if (s === "waiting review") {
    return "border border-violet-200/90 bg-violet-50/90 text-violet-950 font-semibold";
  }
  if (s === "today" || s === "in progress") {
    return "border border-sky-200/90 bg-sky-50/90 text-sky-950 font-semibold";
  }
  if (s === "skipped" || s === "snoozed") {
    return "border border-slate-200/90 bg-slate-100/90 text-slate-700 font-semibold";
  }
  if (s === "overdue" || s === "not started") {
    return "border border-orange-200/90 bg-orange-50/90 text-orange-950 font-semibold";
  }
  return "border border-slate-200/90 bg-white text-slate-800 font-semibold";
}

export function getTaskFrequencyChipClass(frequency: string, isOneTime: boolean): string {
  if (isOneTime || frequency === "as-needed") {
    return "border border-slate-200/90 bg-slate-50/90 text-slate-700 font-semibold";
  }
  return "border border-orange-200/90 bg-orange-50/90 text-orange-950 font-semibold";
}

export function getShoppingStoreSectionChipClass(section: string): string {
  const s = section.trim().toLowerCase();
  if (s === "produce") return getCategoryColorClasses("green");
  if (s === "meat" || s === "dairy") return getCategoryColorClasses("rose");
  if (s === "frozen") return getCategoryColorClasses("sky");
  if (s === "household") return getCategoryColorClasses("amber");
  if (s === "checkout") return getCategoryColorClasses("slate");
  return getCategoryColorClasses("teal");
}

export function getPantryStockChipClass(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "low") {
    return "border border-amber-200/90 bg-amber-50/90 text-amber-950 font-semibold";
  }
  if (s === "out") {
    return "border border-rose-200/90 bg-rose-50/90 text-rose-950 font-semibold";
  }
  return "border border-emerald-200/90 bg-emerald-50/90 text-emerald-950 font-semibold";
}

export function getKitchenDayChipClass(): string {
  return "border border-orange-200/90 bg-orange-50/90 text-orange-950 font-semibold";
}

export function getKitchenMemberChipClass(member: FamilyMember): string {
  return `inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${getMemberColorClasses(member)}`;
}
