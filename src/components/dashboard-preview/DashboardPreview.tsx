import { useEffect, useState } from "react";
import { useDashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import "../../styles/dashboard-preview/dashboard-preview.css";
import { CalendarUpcomingCard } from "./CalendarUpcomingCard";
import { DashboardIntroHeader } from "./DashboardIntroHeader";
import { DashboardPreviewShell } from "./DashboardPreviewShell";
import { FamilyAccessStrip } from "./FamilyAccessStrip";
import { MessagesNotificationsCard } from "./MessagesNotificationsCard";
import { PantryAlertsCard } from "./PantryAlertsCard";
import { QuickAddPanel } from "./QuickAddPanel";
import { ShoppingCard } from "./ShoppingCard";
import { SpotlightPanel } from "./SpotlightPanel";
import { TodaySnapshot } from "./TodaySnapshot";
import type { DashboardPreviewProps } from "./types";

/**
 * Dashboard preview — editorial asymmetric layout with live household data.
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
      <DashboardIntroHeader model={model} />

      <div className="dashboard-preview__main-split">
        <div className="dashboard-preview__main-col dashboard-preview__main-col--left">
          <div className="dashboard-preview__summary-band" aria-label="Household summary">
            <FamilyAccessStrip
              model={model}
              go={go}
              onOpenMemberDashboard={onOpenMemberDashboard}
            />
            <TodaySnapshot model={model} />
          </div>

          <QuickAddPanel
            go={go}
            onOpenShopping={onOpenShopping}
            onOpenTasks={onOpenTasks}
            onOpenCalendar={onOpenCalendar}
          />

          <ShoppingCard
            data={data}
            model={model}
            setData={setData}
            go={go}
            onOpenShopping={onOpenShopping}
            variant="primary"
          />

          <PantryAlertsCard
            model={model}
            go={go}
            onOpenPantry={onOpenPantry}
            onOpenCalendar={onOpenCalendar}
            onOpenTasks={onOpenTasks}
            onOpenShopping={onOpenShopping}
          />

          <CalendarUpcomingCard model={model} go={go} onOpenCalendar={onOpenCalendar} />
        </div>

        <div className="dashboard-preview__main-col dashboard-preview__main-col--right">
          <SpotlightPanel
            model={model}
            go={go}
            onOpenTasks={onOpenTasks}
            onOpenShopping={onOpenShopping}
            onOpenCalendar={onOpenCalendar}
            onOpenPantry={onOpenPantry}
          />

          <MessagesNotificationsCard model={model} go={go} />
        </div>
      </div>
    </DashboardPreviewShell>
  );
}
