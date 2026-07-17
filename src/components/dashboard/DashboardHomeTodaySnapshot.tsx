import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  ListChecks,
  Refrigerator,
  ShoppingCart,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  SMARTHR_DASH_ATTENTION_DETAIL,
  SMARTHR_DASH_BACKUP_CALLOUT,
  SMARTHR_DASH_BACKUP_CALLOUT_BTN,
  SMARTHR_DASH_BACKUP_CALLOUT_TEXT,
  SMARTHR_DASH_GLANCE_SECTION,
  SMARTHR_DASH_KICKER,
  SMARTHR_DASH_METRIC_VALUE_ATTENTION,
  SMARTHR_DASH_METRIC_VALUE_DEFAULT,
  SMARTHR_DASH_WELL_METRIC,
  SMARTHR_DASH_WELL_METRIC_BUTTON,
  SMARTHR_TITLE,
} from "../../lib/smarthrUi";

type Props = {
  /** Household or member-scoped alert count (deduped). */
  snapshotNotificationCount: number;
  shoppingNeedCount: number;
  todayEventCount: number;
  pantryAttentionCount: number;
  /** Open chores due today. */
  choresDueTodayCount: number;
  /** Open chores with due date before today. */
  choresOverdueCount: number;
  /** Planner events with date after today through the next 7 days (member-scoped). */
  upcomingEventCount: number;
  navigateWithinApp?: (href: string) => void;
  restrictChildNavigation?: boolean;
};

/**
 * Metrics + backup strip — date/time and compact Quick Add live in {@link DashboardHomeTopBar}.
 */
export function DashboardHomeTodaySnapshot({
  snapshotNotificationCount,
  shoppingNeedCount,
  todayEventCount,
  pantryAttentionCount,
  choresDueTodayCount,
  choresOverdueCount,
  upcomingEventCount,
  navigateWithinApp,
  restrictChildNavigation,
}: Props) {
  function MetricCard({
    icon,
    label,
    value,
    onClick,
    valueTone,
    detail,
  }: {
    icon: ReactNode;
    label: string;
    value: string | number;
    onClick?: () => void;
    valueTone?: "default" | "attention";
    detail?: string;
  }) {
    const inner = (
      <>
        <div className={cn("flex items-center gap-1.5", SMARTHR_DASH_KICKER)}>
          {icon}
          {label}
        </div>
        <p className={valueTone === "attention" ? SMARTHR_DASH_METRIC_VALUE_ATTENTION : SMARTHR_DASH_METRIC_VALUE_DEFAULT}>
          {value}
        </p>
        {detail ? <p className={SMARTHR_DASH_ATTENTION_DETAIL}>{detail}</p> : null}
      </>
    );

    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={SMARTHR_DASH_WELL_METRIC_BUTTON}>
          {inner}
        </button>
      );
    }

    return <div className={SMARTHR_DASH_WELL_METRIC}>{inner}</div>;
  }

  return (
    <section aria-label="Today at a glance" className={SMARTHR_DASH_GLANCE_SECTION}>
      <h2 className="sr-only">Today at a glance</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-2.5">
        <MetricCard
          icon={<Bell className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          label="Notifications"
          value={snapshotNotificationCount}
          valueTone={snapshotNotificationCount > 0 ? "attention" : "default"}
          onClick={
            navigateWithinApp
              ? () => {
                  navigateWithinApp("/#home-notifications");
                  window.requestAnimationFrame(() =>
                    document
                      .getElementById("home-notifications")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  );
                }
              : undefined
          }
        />
        <MetricCard
          icon={<ListChecks className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          label="Chores today"
          value={choresDueTodayCount}
          valueTone={choresDueTodayCount > 0 || choresOverdueCount > 0 ? "attention" : "default"}
          detail={choresOverdueCount > 0 ? `${choresOverdueCount} overdue` : undefined}
          onClick={navigateWithinApp ? () => navigateWithinApp("/tasks#chore-tracker") : undefined}
        />
        <MetricCard
          icon={<ShoppingCart className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          label="To buy"
          value={shoppingNeedCount}
          onClick={navigateWithinApp ? () => navigateWithinApp("/shopping") : undefined}
        />
        <MetricCard
          icon={<CalendarDays className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          label="Calendar"
          value={
            upcomingEventCount > 0
              ? `${todayEventCount} today · ${upcomingEventCount} soon`
              : `${todayEventCount} today`
          }
          onClick={navigateWithinApp ? () => navigateWithinApp("/calendar") : undefined}
        />
        <MetricCard
          icon={<Refrigerator className="h-3.5 w-3.5 opacity-80" aria-hidden />}
          label="Pantry low/out"
          value={pantryAttentionCount}
          valueTone={pantryAttentionCount > 0 ? "attention" : "default"}
          onClick={navigateWithinApp ? () => navigateWithinApp("/pantry") : undefined}
        />
      </div>

      {!restrictChildNavigation && navigateWithinApp ? (
        <div className={SMARTHR_DASH_BACKUP_CALLOUT}>
          <p className={SMARTHR_DASH_BACKUP_CALLOUT_TEXT}>
            <span className={cn("font-semibold", SMARTHR_TITLE)}>Backup &amp; Data</span> — export or import your
            household file so nothing is trapped on one device.
          </p>
          <button type="button" className={SMARTHR_DASH_BACKUP_CALLOUT_BTN} onClick={() => navigateWithinApp("/settings#backup_data")}>
            Open Backup &amp; Data
          </button>
        </div>
      ) : null}
    </section>
  );
}
