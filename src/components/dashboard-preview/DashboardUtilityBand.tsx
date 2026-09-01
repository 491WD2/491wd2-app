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
  const { clock, kitchenAssigned, kitchenComplete, openChoreCount, shoppingCount, todayEventCount } = model;

  const kitchenLabel = kitchenComplete ? "Kitchen complete" : kitchenAssigned ? "Kitchen assigned" : "Kitchen";

  return (
    <header className="dp-band dashboard-preview__utility-band" aria-label="Dashboard utility band">
      <div className="dp-band__clock">
        <p className="dp-band__time" aria-live="polite">
          {clock.time}
        </p>
        <p className="dp-band__date">{clock.dateLine}</p>
      </div>

      <QuickAddPanel
        go={go}
        onOpenShopping={onOpenShopping}
        onOpenTasks={onOpenTasks}
        onOpenCalendar={onOpenCalendar}
      />

      <div className="dp-band__status" aria-label="Household status">
        <div className="dp-band__chips">
          <button type="button" className="dp-chip dp-chip--kitchen" onClick={() => go("/tasks", onOpenTasks)}>
            {kitchenLabel}
          </button>
          <button type="button" className="dp-chip dp-chip--chores" onClick={() => go("/tasks", onOpenTasks)}>
            {openChoreCount} chore{openChoreCount === 1 ? "" : "s"}
          </button>
          <button type="button" className="dp-chip dp-chip--shopping" onClick={() => go("/shopping", onOpenShopping)}>
            {shoppingCount} shopping
          </button>
          <button type="button" className="dp-chip dp-chip--events" onClick={() => go("/calendar", onOpenCalendar)}>
            {todayEventCount} event{todayEventCount === 1 ? "" : "s"}
          </button>
        </div>
        <div className="dp-band__weather" aria-label="Weather unavailable">
          <CloudOff className="dp-band__weather-icon" aria-hidden="true" />
          <span>Forecast unavailable</span>
        </div>
      </div>
    </header>
  );
}
