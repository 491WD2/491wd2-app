import { CloudOff } from "lucide-react";
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
  const { greeting, clock, kitchenStatus, openChoreCount, shoppingCount, todayEventCount } =
    model;

  return (
    <header className="dashboard-preview__utility-band" aria-label="Dashboard utility band">
      <div className="dashboard-preview__utility-datetime">
        <p className="dashboard-preview__utility-greeting">{greeting}</p>
        <p className="dashboard-preview__utility-time" aria-live="polite">
          {clock.time}
        </p>
        <p className="dashboard-preview__utility-date">{clock.dateLine}</p>
      </div>

      <div className="dashboard-preview__utility-status" aria-label="Household status">
        <div className="dashboard-preview__utility-chips">
          <button
            type="button"
            className="dashboard-preview__chip dashboard-preview__chip--kitchen"
            onClick={() => go("/tasks", onOpenTasks)}
          >
            Kitchen · {kitchenStatus}
          </button>
          <button
            type="button"
            className="dashboard-preview__chip dashboard-preview__chip--calendar"
            onClick={() => go("/tasks", onOpenTasks)}
          >
            {openChoreCount} chore{openChoreCount === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            className="dashboard-preview__chip dashboard-preview__chip--shopping"
            onClick={() => go("/shopping", onOpenShopping)}
          >
            {shoppingCount} shopping
          </button>
          <button
            type="button"
            className="dashboard-preview__chip dashboard-preview__chip--message"
            onClick={() => go("/calendar", onOpenCalendar)}
          >
            {todayEventCount} event{todayEventCount === 1 ? "" : "s"}
          </button>
        </div>
        <QuickAddPanel
          go={go}
          onOpenShopping={onOpenShopping}
          onOpenTasks={onOpenTasks}
          onOpenCalendar={onOpenCalendar}
        />
      </div>

      <div className="dashboard-preview__utility-weather" aria-label="Weather unavailable">
        <CloudOff className="dashboard-preview__weather-icon" aria-hidden="true" />
        <p className="dashboard-preview__utility-weather-text">Local forecast unavailable</p>
      </div>
    </header>
  );
}
