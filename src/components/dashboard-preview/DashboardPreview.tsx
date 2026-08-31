import { useEffect, useState } from "react";
import { useDashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import "../../styles/dashboard-preview/dashboard-preview.css";
import { CalendarCard } from "./CalendarCard";
import { ChoresCard } from "./ChoresCard";
import { DashboardPreviewShell } from "./DashboardPreviewShell";
import { DashboardUtilityBand } from "./DashboardUtilityBand";
import { FamilyAccessStrip } from "./FamilyAccessStrip";
import { MessagesNotificationsCard } from "./MessagesNotificationsCard";
import { PantryAlertsCard } from "./PantryAlertsCard";
import { ShoppingCard } from "./ShoppingCard";
import { UpcomingCard } from "./UpcomingCard";
import type { DashboardPreviewProps } from "./types";

/**
 * Dashboard preview — six-widget desktop grid with compact utility band.
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
      <DashboardUtilityBand
        model={model}
        go={go}
        onOpenShopping={onOpenShopping}
        onOpenTasks={onOpenTasks}
        onOpenCalendar={onOpenCalendar}
      />

      <div className="dashboard-preview__six-grid" aria-label="Primary dashboard widgets">
        <ShoppingCard
          data={data}
          model={model}
          setData={setData}
          go={go}
          onOpenShopping={onOpenShopping}
          variant="primary"
        />
        <CalendarCard model={model} go={go} onOpenCalendar={onOpenCalendar} />
        <UpcomingCard model={model} go={go} onOpenCalendar={onOpenCalendar} />
        <PantryAlertsCard
          model={model}
          go={go}
          onOpenPantry={onOpenPantry}
          onOpenCalendar={onOpenCalendar}
          onOpenTasks={onOpenTasks}
          onOpenShopping={onOpenShopping}
        />
        <ChoresCard
          data={data}
          model={model}
          setData={setData}
          go={go}
          onOpenTasks={onOpenTasks}
        />
        <MessagesNotificationsCard model={model} go={go} />
      </div>

      <FamilyAccessStrip
        model={model}
        go={go}
        onOpenMemberDashboard={onOpenMemberDashboard}
      />
    </DashboardPreviewShell>
  );
}
