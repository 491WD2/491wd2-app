import { CalendarDays, ListChecks, Refrigerator, ShoppingCart } from "lucide-react";
import type { FamilyData, PlannerEvent, Task } from "../../data/familyData";
import {
  compareChoresForDashboardMemberView,
  plannerEventVisibleForMemberView,
  type DashboardViewMemberId,
} from "../../lib/dashboardCommandCenterFilters";
import { addDaysToIso } from "../../lib/dashboardWeek";
import { getChoreDueDate, isChoreDone } from "../../lib/choreTrackerUtils";
import {
  SMARTHR_DASH_BACKUP_CALLOUT_TEXT,
  SMARTHR_DASH_KICKER,
  SMARTHR_DASH_LINK_ACCENT,
  SMARTHR_DASH_METRIC_VALUE_DEFAULT,
  SMARTHR_HUB_ASSIGNMENT_META,
  SMARTHR_HUB_METRIC_ICON,
  SMARTHR_HUB_WEEKLY_WELL,
  SMARTHR_LABEL,
  SMARTHR_TITLE,
} from "../../lib/smarthrUi";
import { isInventoryLowStock } from "../../pages/inventory/inventoryUtils";
import { cn } from "../../lib/utils";
import { hubCardClass } from "./hub/dashboardHubTokens";

type Props = {
  data: FamilyData;
  todayIso: string;
  dashboardViewMemberId: DashboardViewMemberId;
  navigateWithinApp?: (href: string) => void;
};

function openChores(navigateWithinApp?: (href: string) => void) {
  navigateWithinApp?.("/tasks#chore-tracker");
}

export function DashboardWeeklyResetCard({
  data,
  todayIso,
  dashboardViewMemberId,
  navigateWithinApp,
}: Props) {
  const weekEnd = addDaysToIso(todayIso, 7);
  const upcomingChores: Task[] = [];
  for (const t of data.tasks) {
    if (t.type !== "chore" || isChoreDone(t)) {
      continue;
    }
    const due = getChoreDueDate(t);
    if (due > todayIso && due <= weekEnd) {
      upcomingChores.push(t);
    }
  }
  upcomingChores.sort((a, b) =>
    compareChoresForDashboardMemberView(a, b, dashboardViewMemberId, (x, y) =>
      getChoreDueDate(x).localeCompare(getChoreDueDate(y)) || x.title.localeCompare(y.title),
    ),
  );

  const upcomingEvents: PlannerEvent[] = [];
  for (const e of data.planner) {
    if (e.date <= todayIso || e.date > weekEnd) {
      continue;
    }
    if (!plannerEventVisibleForMemberView(e, dashboardViewMemberId)) {
      continue;
    }
    upcomingEvents.push(e);
  }
  upcomingEvents.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const shoppingNeed = data.shopping.filter((s) => !s.purchased).length;
  let pantryLow = 0;
  for (const p of data.pantry) {
    if (p.inactiveInInventory) {
      continue;
    }
    if (p.status === "Low" || p.status === "Out" || isInventoryLowStock(p)) {
      pantryLow += 1;
    }
  }

  return (
    <section aria-labelledby="weekly-reset-title" className={hubCardClass}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="weekly-reset-title" className={SMARTHR_DASH_KICKER}>
            Weekly reset
          </h2>
          <p className={cn("mt-1 text-[15px] font-semibold leading-snug", SMARTHR_TITLE)}>
            Next seven days — chores, pantry, shopping, calendar
          </p>
        </div>
        <button
          type="button"
          className={cn(SMARTHR_DASH_LINK_ACCENT, "mt-2 shrink-0 text-left sm:mt-0 sm:text-right")}
          onClick={() => navigateWithinApp?.("/calendar")}
        >
          Open calendar
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={SMARTHR_HUB_WEEKLY_WELL}>
          <div className={cn("flex items-center gap-2", SMARTHR_LABEL)}>
            <ListChecks className={SMARTHR_HUB_METRIC_ICON} aria-hidden />
            Upcoming chores
          </div>
          <p className={cn("mt-2", SMARTHR_DASH_METRIC_VALUE_DEFAULT)}>{upcomingChores.length}</p>
          <button type="button" className={cn(SMARTHR_DASH_LINK_ACCENT, "mt-2 block text-left")} onClick={() => openChores(navigateWithinApp)}>
            View tracker
          </button>
          {upcomingChores.length > 0 ? (
            <ul className={cn("mt-2 max-h-28 space-y-1 overflow-y-auto leading-snug", SMARTHR_DASH_BACKUP_CALLOUT_TEXT)}>
              {upcomingChores.slice(0, 5).map((t) => (
                <li key={t.id} className="truncate">
                  {t.title} · {getChoreDueDate(t)}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn("mt-2 text-[13px]", SMARTHR_HUB_ASSIGNMENT_META)}>None in the next week.</p>
          )}
        </div>

        <div className={SMARTHR_HUB_WEEKLY_WELL}>
          <div className={cn("flex items-center gap-2", SMARTHR_LABEL)}>
            <Refrigerator className={SMARTHR_HUB_METRIC_ICON} aria-hidden />
            Pantry low / out
          </div>
          <p className={cn("mt-2", SMARTHR_DASH_METRIC_VALUE_DEFAULT)}>{pantryLow}</p>
          <button type="button" className={cn(SMARTHR_DASH_LINK_ACCENT, "mt-2 block text-left")} onClick={() => navigateWithinApp?.("/pantry")}>
            Open pantry
          </button>
        </div>

        <div className={SMARTHR_HUB_WEEKLY_WELL}>
          <div className={cn("flex items-center gap-2", SMARTHR_LABEL)}>
            <ShoppingCart className={SMARTHR_HUB_METRIC_ICON} aria-hidden />
            Shopping needs
          </div>
          <p className={cn("mt-2", SMARTHR_DASH_METRIC_VALUE_DEFAULT)}>{shoppingNeed}</p>
          <button type="button" className={cn(SMARTHR_DASH_LINK_ACCENT, "mt-2 block text-left")} onClick={() => navigateWithinApp?.("/shopping")}>
            Open shopping
          </button>
        </div>

        <div className={SMARTHR_HUB_WEEKLY_WELL}>
          <div className={cn("flex items-center gap-2", SMARTHR_LABEL)}>
            <CalendarDays className={SMARTHR_HUB_METRIC_ICON} aria-hidden />
            Calendar
          </div>
          <p className={cn("mt-2", SMARTHR_DASH_METRIC_VALUE_DEFAULT)}>{upcomingEvents.length}</p>
          <p className={cn("mt-2 text-[13px]", SMARTHR_HUB_ASSIGNMENT_META)}>Events after today through {weekEnd}</p>
          {upcomingEvents.length > 0 ? (
            <ul className={cn("mt-2 max-h-28 space-y-1 overflow-y-auto leading-snug", SMARTHR_DASH_BACKUP_CALLOUT_TEXT)}>
              {upcomingEvents.slice(0, 5).map((e) => (
                <li key={e.id} className="truncate">
                  {e.date} {e.time} · {e.title}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
