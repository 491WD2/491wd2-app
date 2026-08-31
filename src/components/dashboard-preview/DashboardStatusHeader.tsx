import { CloudOff } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type DashboardStatusHeaderProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenTasks?: () => void;
  onOpenShopping: () => void;
};

export function DashboardStatusHeader({
  model,
  go,
  onOpenTasks,
  onOpenShopping,
}: DashboardStatusHeaderProps) {
  const { greeting, clock, kitchenStatus, openChoreCount, shoppingCount } = model;

  return (
    <header className="dashboard-preview__status" aria-label="Household status header">
      <div className="dashboard-preview__status-col">
        <p className="dashboard-preview__status-label">{greeting}</p>
        <p className="dashboard-preview__status-time" aria-live="polite">
          {clock.time}
        </p>
        <p className="dashboard-preview__status-sub">{clock.dateLine}</p>
      </div>

      <div className="dashboard-preview__status-col">
        <div className="dashboard-preview__weather-unavailable" aria-label="Weather unavailable">
          <CloudOff className="dashboard-preview__weather-icon" aria-hidden="true" />
          <p className="dashboard-preview__status-sub">Local forecast unavailable</p>
        </div>
      </div>

      <div className="dashboard-preview__status-col">
        <div className="dashboard-preview__status-chips">
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
            {openChoreCount} chore{openChoreCount === 1 ? "" : "s"} open
          </button>
          <button
            type="button"
            className="dashboard-preview__chip dashboard-preview__chip--shopping"
            onClick={() => go("/shopping", onOpenShopping)}
          >
            {shoppingCount} shopping
          </button>
        </div>
      </div>
    </header>
  );
}
