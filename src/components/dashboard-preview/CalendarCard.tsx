import { CalendarDays } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type CalendarCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenCalendar: () => void;
};

export function CalendarCard({ model, go, onOpenCalendar }: CalendarCardProps) {
  const { miniMonth, miniMonthWeekdayLabels, todayEventCount } = model;
  const openCalendar = () => go("/calendar", onOpenCalendar);

  return (
    <section className="dp-widget dp-widget--calendar" aria-label="Calendar">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--calendar" aria-hidden="true">
            <CalendarDays />
          </span>
          <div>
            <h2 className="dp-widget__title">Calendar</h2>
            <p className="dp-widget__meta">
              {todayEventCount === 1 ? "1 event today" : `${todayEventCount} events today`}
            </p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={openCalendar}>
          Open calendar
        </button>
      </header>

      <div className="dp-cal" aria-label={`${miniMonth.monthLabel} mini calendar`}>
        <p className="dp-cal__month">{miniMonth.monthLabel}</p>
        <div className="dp-cal__weekdays" aria-hidden="true">
          {miniMonthWeekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="dp-cal__grid">
          {miniMonth.weeks.flat().map((day) => (
            <button
              key={day.iso}
              type="button"
              className={[
                "dp-cal__day",
                day.inMonth ? "" : "is-muted",
                day.isToday ? "is-today" : "",
                day.hasEvents ? "has-events" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={openCalendar}
              aria-label={`${day.iso}${day.hasEvents ? ", has events" : ""}`}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
