import { useEffect, useState } from "react";
import { useDashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import "../../styles/dashboard-preview/dashboard-preview.css";
import { CalendarUpcomingCard } from "./CalendarUpcomingCard";
import { DashboardPreviewShell } from "./DashboardPreviewShell";
import { DashboardStatusHeader } from "./DashboardStatusHeader";
import { FamilyAccessStrip } from "./FamilyAccessStrip";
import { KitchenChoresCard } from "./KitchenChoresCard";
import { MessagesNotificationsCard } from "./MessagesNotificationsCard";
import { PantryAlertsCard } from "./PantryAlertsCard";
import { QuickAddPanel } from "./QuickAddPanel";
import { ShoppingCard } from "./ShoppingCard";
import { TodaySnapshot } from "./TodaySnapshot";
import type { DashboardPreviewProps } from "./types";

/**
 * Dashboard preview — live household data wired to the visual experiment shell.
 */
export function DashboardPreview({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenShopping,
  onOpenCalendar,
  onOpenTasks,
  onOpenMemberDashboard,
}: DashboardPreviewProps) {
  const [now, setNow] = useState(() => new Date());
  const model = useDashboardPreviewModel(data, now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  function go(href: string, fallback?: () => void) {
    navigateWithinApp(href);
    fallback?.();
  }

  return (
    <DashboardPreviewShell>
      <DashboardStatusHeader
        model={model}
        go={go}
        onOpenTasks={onOpenTasks}
        onOpenShopping={onOpenShopping}
      />

      <FamilyAccessStrip model={model} go={go} onOpenMemberDashboard={onOpenMemberDashboard} />

      <section className="dashboard-preview__region" aria-label="Household tools">
        <div className="dashboard-preview__tools-row">
          <QuickAddPanel
            go={go}
            onOpenShopping={onOpenShopping}
            onOpenTasks={onOpenTasks}
            onOpenCalendar={onOpenCalendar}
          />
          <TodaySnapshot model={model} />
        </div>
      </section>

      <section className="dashboard-preview__region" aria-label="Household overview">
        <div className="dashboard-preview__household-grid">
          <div className="dashboard-preview__utility" aria-label="Tasks and storage">
            <KitchenChoresCard
              data={data}
              model={model}
              now={now}
              setData={setData}
              go={go}
              onOpenTasks={onOpenTasks}
            />
            <ShoppingCard
              data={data}
              model={model}
              setData={setData}
              go={go}
              onOpenShopping={onOpenShopping}
            />
            <PantryAlertsCard
              model={model}
              go={go}
              onOpenPantry={onOpenPantry}
              onOpenCalendar={onOpenCalendar}
              onOpenTasks={onOpenTasks}
              onOpenShopping={onOpenShopping}
            />
          </div>

          <div className="dashboard-preview__information" aria-label="Schedule and messages">
            <CalendarUpcomingCard model={model} go={go} onOpenCalendar={onOpenCalendar} />
            <MessagesNotificationsCard model={model} go={go} />
          </div>
        </div>
      </section>
    </DashboardPreviewShell>
  );
}
