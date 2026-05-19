import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import {
  SMARTHR_HUB_CHEVRON_BTN,
  SMARTHR_HUB_DAY_CAPTION,
  SMARTHR_HUB_DAY_CELL,
  SMARTHR_HUB_DAY_CELL_IDLE,
  SMARTHR_HUB_DAY_CELL_SELECTED,
  SMARTHR_HUB_DAY_NUM_IDLE,
  SMARTHR_HUB_DAY_NUM_SELECTED,
  SMARTHR_HUB_MONTH_LABEL,
} from "../../../lib/smarthrUi";
import { cn } from "../../../lib/utils";
import { hubCardClass, hubCardTitleClass, hubDashWidgetIconClass, hubMutedClass } from "./dashboardHubTokens";

export type HubWeekDay = {
  iso: string;
  weekdayShort: string;
  dayNum: number;
  pill: string;
  /** Member-focused view: emphasize days that match the selected person. */
  dayTone?: "default" | "focus" | "muted";
};

export function DashboardHubWeekCard({
  days,
  selectedIso,
  monthTitle,
  onPrevWeek,
  onNextWeek,
  onSelectDay,
}: {
  days: HubWeekDay[];
  selectedIso: string;
  monthTitle: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectDay?: (iso: string) => void;
}) {
  return (
    <section className={hubCardClass} aria-labelledby="hub-week-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={hubDashWidgetIconClass} aria-hidden>
            <CalendarRange className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <h2 id="hub-week-title" className={hubCardTitleClass}>
            This Week
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous week"
            className={SMARTHR_HUB_CHEVRON_BTN}
            onClick={onPrevWeek}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className={SMARTHR_HUB_MONTH_LABEL}>{monthTitle}</span>
          <button
            type="button"
            aria-label="Next week"
            className={SMARTHR_HUB_CHEVRON_BTN}
            onClick={onNextWeek}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {days.map((d) => {
          const sel = d.iso === selectedIso;
          const tone = d.dayTone ?? "default";
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => onSelectDay?.(d.iso)}
              className={cn(
                SMARTHR_HUB_DAY_CELL,
                sel ? SMARTHR_HUB_DAY_CELL_SELECTED : SMARTHR_HUB_DAY_CELL_IDLE,
                tone === "muted" && !sel && "opacity-55",
                tone === "focus" && !sel && "ring-1 ring-[#FE9F43]/35",
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", hubMutedClass)}>{d.weekdayShort}</span>
              <span
                className={cn(
                  "text-[18px] font-bold tabular-nums leading-tight",
                  sel ? SMARTHR_HUB_DAY_NUM_SELECTED : SMARTHR_HUB_DAY_NUM_IDLE,
                )}
              >
                {d.dayNum}
              </span>
              <span className={SMARTHR_HUB_DAY_CAPTION}>{d.pill}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
