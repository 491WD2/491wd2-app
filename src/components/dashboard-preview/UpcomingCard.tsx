import { Clock3 } from "lucide-react";
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
  const { upcomingSelection } = model;
  const openCalendar = () => go("/calendar", onOpenCalendar);
  const visibleRows = upcomingSelection.rows;

  return (
    <section className="dp-widget dp-widget--upcoming" aria-label="Upcoming events">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--upcoming" aria-hidden="true">
            <Clock3 />
          </span>
          <div>
            <h2 className="dp-widget__title">Upcoming</h2>
            <p className="dp-widget__meta">{upcomingSelection.heading}</p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={openCalendar}>
          View all
        </button>
      </header>

      {visibleRows.length === 0 ? (
        <p className="dp-empty">{upcomingSelection.emptyLabel}</p>
      ) : (
        <ul className="dp-agenda">
          {visibleRows.map((row) => {
            const dateBlock = formatDateBlock(row.date);
            return (
              <li key={row.id}>
                <button type="button" className="dp-agenda__row" onClick={openCalendar}>
                  <span className="dp-agenda__date" aria-hidden="true">
                    <span className="dp-agenda__day">{dateBlock.day}</span>
                    <span className="dp-agenda__month">{dateBlock.month}</span>
                  </span>
                  <span className="dp-agenda__marker" aria-hidden="true" />
                  <span className="dp-agenda__copy">
                    <span className="dp-agenda__title">{row.title}</span>
                    {row.meta ? <span className="dp-agenda__meta">{row.meta}</span> : null}
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
