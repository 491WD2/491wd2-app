import { cn } from "../../lib/utils";

/** Primary elevated surface — modules, filters, content panels */
export const wrkPanelClassName =
  "rounded-[28px] border border-white/[0.16] bg-[linear-gradient(140deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035)_46%,rgba(255,255,255,0.065)),radial-gradient(circle_at_92%_0%,rgba(125,249,255,0.14),transparent_14rem),rgba(7,12,29,0.74)] shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_34px_rgba(125,249,255,0.055),inset_0_1px_0_rgba(255,255,255,0.13)] backdrop-blur-xl";

/** Header band inside module page hero */
export const wrkHeroBandClassName =
  "border-b border-white/[0.12] bg-[radial-gradient(circle_at_86%_18%,rgba(125,249,255,0.18),transparent_17rem),radial-gradient(circle_at_18%_0%,rgba(255,122,223,0.12),transparent_16rem),linear-gradient(165deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.025)_58%)]";

/** Left accent rail (visual hierarchy) */
export const wrkAccentRailClassName = "h-10 w-1 shrink-0 rounded-full bg-cyan-300/75 shadow-[0_0_22px_rgba(125,249,255,0.34)]";

/** Scroll shell for data tables */
export const wrkTableWrapClassName =
  "overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-[24px] border border-white/[0.16] bg-white/[0.06] shadow-[0_18px_48px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl";

/** Dense database / product table */
export const wrkTableClassName = cn(
  "w-full border-collapse text-left text-sm text-slate-100",
  "[&_thead]:border-b [&_thead]:border-white/[0.12] [&_thead]:bg-white/[0.06]",
  "[&_thead]:text-[0.68rem] [&_thead]:font-bold [&_thead]:uppercase [&_thead]:tracking-[0.14em] [&_thead]:text-cyan-100/75",
  "[&_th]:px-4 [&_th]:py-3",
  "[&_td]:align-middle [&_td]:px-4 [&_td]:py-3",
  "[&_tbody>tr]:border-t [&_tbody>tr]:border-white/[0.08]",
  "[&_tbody>tr]:transition-colors [&_tbody>tr]:duration-150",
  "[&_tbody>tr:hover]:bg-white/[0.055]",
  "[&_tbody>tr]:motion-row",
);

export const wrkEyebrowClassName =
  "text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/75";

export const wrkPageTitleClassName =
  "text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]";

export const wrkSupportingTextClassName =
  "text-sm leading-relaxed text-slate-200";

/** Compact KPI / metric cell */
export const wrkMetricCellClassName =
  "rounded-2xl border border-white/[0.14] bg-white/[0.055] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl";

/** Dashboard & hub module launcher tile */
export const wrkModuleTileClassName =
  "group flex flex-col rounded-[24px] border border-white/[0.16] bg-white/[0.075] p-4 text-left shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/[0.1] hover:shadow-[0_24px_58px_rgba(0,0,0,0.42),0_0_30px_rgba(125,249,255,0.08)]";

/** Operational summary inner list row */
export const wrkOpsRowClassName =
  "flex min-h-12 gap-3 border-b border-white/[0.08] px-4 py-3 text-slate-100 last:border-b-0 transition hover:bg-white/[0.055]";

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
