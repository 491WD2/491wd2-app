import { cn } from "../../lib/utils";

/** Primary elevated surface — modules, filters, content panels */
export const wrkPanelClassName =
  "rounded-lg border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/[0.04]";

/** Header band inside module page hero */
export const wrkHeroBandClassName =
  "border-b border-slate-200/80 bg-[linear-gradient(165deg,rgba(59,130,246,0.07)_0%,transparent_48%),linear-gradient(180deg,#fafaf9_0%,#f4f4f5_100%)]";

/** Left accent rail (visual hierarchy) */
export const wrkAccentRailClassName = "h-9 w-0.5 shrink-0 rounded-full bg-blue-600/55";

/** Scroll shell for data tables */
export const wrkTableWrapClassName =
  "overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-md border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(15,23,42,0.04)]";

/** Dense database / product table */
export const wrkTableClassName = cn(
  "w-full border-collapse text-left text-sm text-slate-800",
  "[&_thead]:border-b [&_thead]:border-slate-200 [&_thead]:bg-slate-50",
  "[&_thead]:text-[0.625rem] [&_thead]:font-semibold [&_thead]:uppercase [&_thead]:tracking-[0.12em] [&_thead]:text-slate-600",
  "[&_th]:px-3.5 [&_th]:py-2.5",
  "[&_td]:align-middle [&_td]:px-3.5 [&_td]:py-2.5",
  "[&_tbody>tr]:border-t [&_tbody>tr]:border-slate-100",
  "[&_tbody>tr]:transition-colors [&_tbody>tr]:duration-150",
  "[&_tbody>tr:hover]:bg-slate-50",
  "[&_tbody>tr]:motion-row",
);

export const wrkEyebrowClassName =
  "text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-600";

export const wrkPageTitleClassName =
  "text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.75rem]";

export const wrkSupportingTextClassName =
  "text-sm leading-relaxed text-slate-600";

/** Compact KPI / metric cell */
export const wrkMetricCellClassName =
  "rounded-md border border-slate-200 bg-slate-50/90 px-3 py-2.5 shadow-sm";

/** Dashboard & hub module launcher tile */
export const wrkModuleTileClassName =
  "group flex flex-col rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-md";

/** Operational summary inner list row */
export const wrkOpsRowClassName =
  "flex min-h-11 gap-3 border-b border-slate-100 px-3.5 py-2.5 last:border-b-0 transition hover:bg-slate-50/90";

/** Muted member accent borders (dashboard cards) */
export const wrkMemberAccentLeft: Record<string, string> = {
  blue: "border-l-[3px] border-l-blue-500/50",
  green: "border-l-[3px] border-l-emerald-500/45",
  emerald: "border-l-[3px] border-l-emerald-500/45",
  purple: "border-l-[3px] border-l-violet-500/48",
  violet: "border-l-[3px] border-l-violet-500/48",
  amber: "border-l-[3px] border-l-amber-500/45",
  orange: "border-l-[3px] border-l-orange-500/42",
  rose: "border-l-[3px] border-l-rose-500/45",
  slate: "border-l-[3px] border-l-slate-400/50",
};
