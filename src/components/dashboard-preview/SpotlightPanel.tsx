import { CalendarDays, ChefHat, ShoppingCart, Sparkles } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type SpotlightPanelProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenTasks?: () => void;
  onOpenShopping: () => void;
  onOpenCalendar: () => void;
  onOpenPantry: () => void;
};

export function SpotlightPanel({
  model,
  go,
  onOpenTasks,
  onOpenShopping,
  onOpenCalendar,
  onOpenPantry,
}: SpotlightPanelProps) {
  const {
    kitchenName,
    kitchenComplete,
    kitchenDayLabel,
    upcomingRows,
    upcomingAgendaHeading,
    needToBuy,
    pantryModel,
    openChoreCount,
    shoppingCount,
    todayEventCount,
  } = model;

  const topShopping = needToBuy.slice(0, 2);
  const hasPantryAlerts = pantryModel.pantryAlertCount > 0;

  return (
    <aside className="dashboard-preview__spotlight" aria-label="Today's household focus">
      <div className="dashboard-preview__spotlight-glow" aria-hidden="true" />

      <header className="dashboard-preview__spotlight-head">
        <p className="dashboard-preview__spotlight-eyebrow">Today&apos;s focus</p>
        <h2 className="dashboard-preview__spotlight-title">Household pulse</h2>
      </header>

      <div className="dashboard-preview__spotlight-stats">
        <button
          type="button"
          className="dashboard-preview__spotlight-stat dashboard-preview__spotlight-stat--chores"
          onClick={() => go("/tasks", onOpenTasks)}
        >
          <Sparkles className="dashboard-preview__spotlight-stat-icon" aria-hidden="true" />
          <span className="dashboard-preview__spotlight-stat-value">{openChoreCount}</span>
          <span className="dashboard-preview__spotlight-stat-label">Chores open</span>
        </button>
        <button
          type="button"
          className="dashboard-preview__spotlight-stat dashboard-preview__spotlight-stat--events"
          onClick={() => go("/calendar", onOpenCalendar)}
        >
          <CalendarDays className="dashboard-preview__spotlight-stat-icon" aria-hidden="true" />
          <span className="dashboard-preview__spotlight-stat-value">{todayEventCount}</span>
          <span className="dashboard-preview__spotlight-stat-label">Events today</span>
        </button>
        <button
          type="button"
          className="dashboard-preview__spotlight-stat dashboard-preview__spotlight-stat--shopping"
          onClick={() => go("/shopping", onOpenShopping)}
        >
          <ShoppingCart className="dashboard-preview__spotlight-stat-icon" aria-hidden="true" />
          <span className="dashboard-preview__spotlight-stat-value">{shoppingCount}</span>
          <span className="dashboard-preview__spotlight-stat-label">Shopping</span>
        </button>
      </div>

      <div className="dashboard-preview__spotlight-block">
        <div className="dashboard-preview__spotlight-block-head">
          <ChefHat className="dashboard-preview__spotlight-block-icon" aria-hidden="true" />
          <div>
            <p className="dashboard-preview__spotlight-block-label">Kitchen today</p>
            <p className="dashboard-preview__spotlight-block-value">{kitchenName}</p>
          </div>
        </div>
        <div className="dashboard-preview__spotlight-pills">
          <span className="dashboard-preview__spotlight-pill">{kitchenDayLabel}</span>
          <span
            className={[
              "dashboard-preview__spotlight-pill",
              kitchenComplete ? "is-done" : "is-open",
            ].join(" ")}
          >
            {kitchenComplete ? "Complete" : "In progress"}
          </span>
        </div>
      </div>

      <div className="dashboard-preview__spotlight-block">
        <p className="dashboard-preview__spotlight-block-label">Up next</p>
        <p className="dashboard-preview__spotlight-block-sub">{upcomingAgendaHeading}</p>
        {upcomingRows.length === 0 ? (
          <p className="dashboard-preview__spotlight-empty">No upcoming events on the planner.</p>
        ) : (
          <ul className="dashboard-preview__spotlight-list">
            {upcomingRows.slice(0, 3).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="dashboard-preview__spotlight-row"
                  onClick={() => go("/calendar", onOpenCalendar)}
                >
                  <span className="dashboard-preview__spotlight-row-title">{row.title}</span>
                  <span className="dashboard-preview__spotlight-row-meta">{row.meta}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(topShopping.length > 0 || hasPantryAlerts) && (
        <div className="dashboard-preview__spotlight-block dashboard-preview__spotlight-block--reminders">
          <p className="dashboard-preview__spotlight-block-label">Reminders</p>
          {topShopping.length > 0 ? (
            <ul className="dashboard-preview__spotlight-reminders">
              {topShopping.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="dashboard-preview__spotlight-reminder"
                    onClick={() => go("/shopping", onOpenShopping)}
                  >
                    <ShoppingCart aria-hidden="true" />
                    <span>Buy {item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {hasPantryAlerts ? (
            <button
              type="button"
              className="dashboard-preview__spotlight-reminder dashboard-preview__spotlight-reminder--pantry"
              onClick={() => go("/pantry", onOpenPantry)}
            >
              <span>{pantryModel.pantryAlertCount} pantry alerts need attention</span>
            </button>
          ) : null}
        </div>
      )}
    </aside>
  );
}
