/**
 * Category visuals for calendar activities on SmartHR light surfaces.
 * Maps {@link PlannerEvent} categories to display tokens — not stored on events.
 */

export type ActivityCategoryVisual = {
  /** Event pill / block */
  block: string;
  /** Small dot (member/category hint) */
  dot: string;
  /** Chip on list rows */
  chip: string;
};

const DEFAULT_VISUAL: ActivityCategoryVisual = {
  block: "border border-slate-200 bg-slate-100 text-slate-800",
  dot: "bg-slate-500",
  chip: "border border-slate-200 bg-slate-50 text-slate-700",
};

/** Semantic groups: household, kitchen/cleaning, shopping, school/work, personal, urgent */
const MAP: Record<string, ActivityCategoryVisual> = {
  Family: {
    block: "border border-slate-200 bg-slate-100 text-slate-800",
    dot: "bg-slate-500",
    chip: "border border-slate-200 bg-slate-50 text-slate-700",
  },
  Other: {
    block: "border border-slate-200 bg-slate-50 text-slate-800",
    dot: "bg-slate-400",
    chip: "border border-slate-200 bg-slate-50 text-slate-700",
  },
  Church: {
    block: "border border-slate-200 bg-slate-50 text-slate-800",
    dot: "bg-slate-400",
    chip: "border border-slate-200 bg-slate-50 text-slate-700",
  },
  School: {
    block: "border border-sky-200 bg-sky-50 text-sky-950",
    dot: "bg-sky-500",
    chip: "border border-sky-200 bg-sky-50 text-sky-900",
  },
  Work: {
    block: "border border-sky-200 bg-sky-50 text-sky-950",
    dot: "bg-sky-500",
    chip: "border border-sky-200 bg-sky-50 text-sky-900",
  },
  Sports: {
    block: "border border-amber-200 bg-amber-50 text-amber-950",
    dot: "bg-amber-500",
    chip: "border border-amber-200 bg-amber-50 text-amber-900",
  },
  Errand: {
    block: "border border-orange-200 bg-orange-50 text-orange-950",
    dot: "bg-[#F26522]",
    chip: "border border-orange-200 bg-orange-50 text-orange-900",
  },
  Medical: {
    block: "border border-rose-200 bg-rose-50 text-rose-950",
    dot: "bg-rose-500",
    chip: "border border-rose-200 bg-rose-50 text-rose-900",
  },
  Social: {
    block: "border border-violet-200 bg-violet-50 text-violet-950",
    dot: "bg-violet-500",
    chip: "border border-violet-200 bg-violet-50 text-violet-900",
  },
  Personal: {
    block: "border border-violet-200 bg-violet-50 text-violet-950",
    dot: "bg-violet-500",
    chip: "border border-violet-200 bg-violet-50 text-violet-900",
  },
};

export function getActivityCategoryVisual(category: string): ActivityCategoryVisual {
  const key = category.trim();
  return MAP[key] ?? DEFAULT_VISUAL;
}

export function getActivityCategoryVisualForEvent(event: { category: string }): ActivityCategoryVisual {
  return getActivityCategoryVisual(String(event.category));
}
