import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type CalendarUpcomingCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenCalendar: () => void;
};

export function CalendarUpcomingCard({
  model,
  go,
  onOpenCalendar,
}: CalendarUpcomingCardProps) {
  const { miniMonth, miniMonthWeekdayLabels, upcomingAgendaHeading, upcomingRows } = model;

  const openCalendar = () => go("/calendar", onOpenCalendar);

  return (
    <section className="dashboard-preview__card" aria-label="Calendar and upcoming events">
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div>
          <h2 className="dashboard-preview__section-title">Calendar</h2>
          <p className="dashboard-preview__meta">Household schedule</p>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={openCalendar}>
          Open calendar
        </button>
      </header>

      <div className="dashboard-preview__calendar-upcoming-body">
        <div className="dashboard-preview__mini-month" aria-label={`${miniMonth.monthLabel} mini calendar`}>
          <p className="dashboard-preview__mini-month-label">{miniMonth.monthLabel}</p>
          <div className="dashboard-preview__mini-month-weekdays">
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

        <div className="dashboard-preview__upcoming">
          <h3 className="dashboard-preview__subsection-title">{upcomingAgendaHeading}</h3>
          {upcomingRows.length === 0 ? (
            <p className="dashboard-preview__placeholder">No upcoming events on the planner.</p>
          ) : (
            <ul className="dashboard-preview__list">
              {upcomingRows.map((row) => (
                <li key={row.id}>
                  <button type="button" className="dashboard-preview__row" onClick={openCalendar}>
                    <span className="dashboard-preview__row-dot" aria-hidden="true" />
                    <span className="dashboard-preview__row-main">
                      <span className="dashboard-preview__row-title">{row.title}</span>
                      <span className="dashboard-preview__row-meta">{row.meta}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
