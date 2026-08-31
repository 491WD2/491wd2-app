import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type UpcomingCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenCalendar: () => void;
};

function formatDateBlock(dateIso: string): { day: string; month: string } {
  const date = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { day: "—", month: "" };
  }
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString(undefined, { month: "short" }),
  };
}

export function UpcomingCard({ model, go, onOpenCalendar }: UpcomingCardProps) {
  const { upcomingAgendaHeading, upcomingRows } = model;
  const openCalendar = () => go("/calendar", onOpenCalendar);
  const visibleRows = upcomingRows.slice(0, 6);

  return (
    <section
      className="dashboard-preview__card dashboard-preview__card--upcoming"
      aria-label="Upcoming events"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <span className="dashboard-preview__card-accent dashboard-preview__card-accent--upcoming" aria-hidden="true" />
          <div>
            <h2 className="dashboard-preview__section-title">Upcoming</h2>
            <p className="dashboard-preview__meta">{upcomingAgendaHeading}</p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={openCalendar}>
          View all
        </button>
      </header>

      {visibleRows.length === 0 ? (
        <p className="dashboard-preview__placeholder">No upcoming events on the planner.</p>
      ) : (
        <ul className="dashboard-preview__upcoming-agenda">
          {visibleRows.map((row) => {
            const dateBlock = formatDateBlock(row.date);
            return (
              <li key={row.id}>
                <button type="button" className="dashboard-preview__upcoming-row" onClick={openCalendar}>
                  <span className="dashboard-preview__upcoming-date" aria-hidden="true">
                    <span className="dashboard-preview__upcoming-date-day">{dateBlock.day}</span>
                    <span className="dashboard-preview__upcoming-date-month">{dateBlock.month}</span>
                  </span>
                  <span className="dashboard-preview__upcoming-dot" aria-hidden="true" />
                  <span className="dashboard-preview__upcoming-copy">
                    <span className="dashboard-preview__upcoming-title">{row.title}</span>
                    <span className="dashboard-preview__upcoming-meta">{row.meta}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
