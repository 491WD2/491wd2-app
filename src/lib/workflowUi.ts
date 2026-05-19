/** Shared visual tokens for Shopping ↔ Inventory daily workflow (Tailwind classes). */

export const workflowStrip = {
  wrap: "rounded-[8px] border border-[#ededed] bg-gradient-to-br from-orange-50/50 via-white to-sky-50/40 p-4 shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
  title: "text-xs font-semibold uppercase tracking-[0.14em] text-slate-600",
  subtitle: "mt-1 text-xs leading-relaxed text-slate-600",
  grid: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6",
  /** Large touch targets — phone / Surface friendly */
  button:
    "flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-1 rounded-[8px] border px-2 py-2.5 text-center text-sm font-semibold shadow-sm transition active:scale-[0.99]",
} as const;

export const workflowActionClasses = {
  shoppingAdd: "border-sky-200 bg-sky-50/95 text-sky-950 hover:bg-sky-100/90",
  scan: "border-orange-200 bg-orange-50/95 text-orange-950 hover:bg-orange-100/90",
  /** Former “put away” lane — add purchased goods into inventory */
  addStock: "border-violet-200 bg-violet-50/95 text-violet-950 hover:bg-violet-100/90",
  useItem: "border-emerald-200 bg-emerald-50/95 text-emerald-950 hover:bg-emerald-100/90",
  lowOut: "border-amber-200 bg-amber-50/95 text-amber-950 hover:bg-amber-100/90",
  recipes: "border-orange-200 bg-orange-50/95 text-orange-950 hover:bg-orange-100/90",
} as const;

export const workflowCardTone = {
  needBuy: "border-sky-200/90 bg-sky-50/80",
  addStock: "border-violet-200/90 bg-violet-50/70",
  lowAuto: "border-amber-200/90 bg-amber-50/70",
  library: "border-emerald-200/90 bg-emerald-50/70",
  onHand: "border-[#ededed] bg-[#f8f9fa]",
  archived: "border-slate-300/90 bg-slate-50/90",
} as const;
