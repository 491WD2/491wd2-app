import { CalendarDays, CloudOff, ListTodo, ShoppingCart, Sparkles } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import { QuickAddPanel } from "./QuickAddPanel";
import type { DashboardGo } from "./types";

type DashboardUtilityBandProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenShopping: () => void;
  onOpenTasks?: () => void;
  onOpenCalendar: () => void;
};

export function DashboardUtilityBand({
  model,
  go,
  onOpenShopping,
  onOpenTasks,
  onOpenCalendar,
}: DashboardUtilityBandProps) {
  const { greeting, clock, kitchenAssigned, kitchenComplete, openChoreCount, shoppingCount, todayEventCount } =
    model;

  const kitchenLabel = kitchenComplete
    ? "Complete"
    : kitchenAssigned
      ? "Assigned"
      : "Open";

  return (
    <header className="dashboard-preview__utility-band" aria-label="Dashboard utility band">
      <div className="dashboard-preview__hero-time-card">
        <p className="dashboard-preview__utility-greeting">{greeting}</p>
        <p className="dashboard-preview__utility-time" aria-live="polite">
          {clock.time}
        </p>
        <p className="dashboard-preview__utility-date">{clock.dateLine}</p>
      </div>

      <div className="dashboard-preview__hero-stats" aria-label="Household status">
        <button
          type="button"
          className="dashboard-preview__stat-card dashboard-preview__stat-card--kitchen"
          onClick={() => go("/tasks", onOpenTasks)}
        >
          <span className="dashboard-preview__stat-card-icon" aria-hidden="true">
            <Sparkles />
          </span>
          <span className="dashboard-preview__stat-card-copy">
            <span className="dashboard-preview__stat-card-label">Kitchen</span>
            <span className="dashboard-preview__stat-card-value">{kitchenLabel}</span>
          </span>
        </button>

        <button
          type="button"
          className="dashboard-preview__stat-card dashboard-preview__stat-card--chores"
          onClick={() => go("/tasks", onOpenTasks)}
        >
          <span className="dashboard-preview__stat-card-icon" aria-hidden="true">
            <ListTodo />
          </span>
          <span className="dashboard-preview__stat-card-copy">
            <span className="dashboard-preview__stat-card-label">Chores</span>
            <span className="dashboard-preview__stat-card-value">{openChoreCount}</span>
          </span>
        </button>

        <button
          type="button"
          className="dashboard-preview__stat-card dashboard-preview__stat-card--shopping"
          onClick={() => go("/shopping", onOpenShopping)}
        >
          <span className="dashboard-preview__stat-card-icon" aria-hidden="true">
            <ShoppingCart />
          </span>
          <span className="dashboard-preview__stat-card-copy">
            <span className="dashboard-preview__stat-card-label">Shopping</span>
            <span className="dashboard-preview__stat-card-value">{shoppingCount}</span>
          </span>
        </button>

        <button
          type="button"
          className="dashboard-preview__stat-card dashboard-preview__stat-card--events"
          onClick={() => go("/calendar", onOpenCalendar)}
        >
          <span className="dashboard-preview__stat-card-icon" aria-hidden="true">
            <CalendarDays />
          </span>
          <span className="dashboard-preview__stat-card-copy">
            <span className="dashboard-preview__stat-card-label">Events</span>
            <span className="dashboard-preview__stat-card-value">{todayEventCount}</span>
          </span>
        </button>
      </div>

      <div className="dashboard-preview__hero-side">
        <QuickAddPanel
          go={go}
          onOpenShopping={onOpenShopping}
          onOpenTasks={onOpenTasks}
          onOpenCalendar={onOpenCalendar}
        />
        <div className="dashboard-preview__utility-weather" aria-label="Weather unavailable">
          <CloudOff className="dashboard-preview__weather-icon" aria-hidden="true" />
          <p className="dashboard-preview__utility-weather-text">Forecast unavailable</p>
        </div>
      </div>
    </header>
  );
}
