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
    <section
      className="dashboard-preview__card dashboard-preview__card--calendar-primary"
      aria-label="Calendar"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <span className="dashboard-preview__card-accent dashboard-preview__card-accent--calendar" aria-hidden="true" />
          <div>
            <h2 className="dashboard-preview__section-title">Calendar</h2>
            <p className="dashboard-preview__meta">
              {todayEventCount === 1 ? "1 event today" : `${todayEventCount} events today`}
            </p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={openCalendar}>
          Open calendar
        </button>
      </header>

      <div className="dashboard-preview__calendar-panel dashboard-preview__calendar-panel--primary">
        <div className="dashboard-preview__mini-month" aria-label={`${miniMonth.monthLabel} mini calendar`}>
          <p className="dashboard-preview__mini-month-label">{miniMonth.monthLabel}</p>
          <div className="dashboard-preview__mini-month-weekdays" aria-hidden="true">
            {miniMonthWeekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="dashboard-preview__mini-month-grid">
            {miniMonth.weeks.flat().map((day) => (
              <button
                key={day.iso}
                type="button"
                className={[
                  "dashboard-preview__mini-month-day",
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
      </div>
    </section>
  );
}
