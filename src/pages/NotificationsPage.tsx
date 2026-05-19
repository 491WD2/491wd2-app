import { ArrowLeft, ListChecks } from "lucide-react";
import { useMemo } from "react";
import { HouseholdAlertsPanel } from "../components/dashboard/HouseholdAlertsPanel";
import { Button } from "../components/ui/Button";
import { WorkspacePageShell, WorkspaceRoutedSection } from "../components/workspace/ModuleWorkspace";
import { countActiveNotificationsForDashboardInbox } from "../lib/dashboardCommandCenterFilters";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { getChoreDueDate, isChoreDone } from "../lib/choreTrackerUtils";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const btnSecondary =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa]";

export function NotificationsPage({
  data,
  setData,
  onOpenDashboard,
  navigateWithinApp,
}: PageProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sessionMemberId = resolveSessionMemberIdForUi(data);

  const activeCount = useMemo(
    () =>
      countActiveNotificationsForDashboardInbox(
        data.notifications,
        "session",
        sessionMemberId,
        undefined,
      ),
    [data.notifications, sessionMemberId],
  );

  const choresDueToday = useMemo(
    () =>
      data.tasks.filter(
        (t) => t.type === "chore" && !isChoreDone(t) && getChoreDueDate(t) === today,
      ).length,
    [data.tasks, today],
  );
  const choresOverdue = useMemo(
    () =>
      data.tasks.filter(
        (t) => t.type === "chore" && !isChoreDone(t) && getChoreDueDate(t) < today,
      ).length,
    [data.tasks, today],
  );

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        tone="light"
        className={cn("flex flex-col gap-5 px-[15px] pb-10 pt-0 sm:px-[30px] md:pb-10", DS_MAIN_COLUMN)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenDashboard ? (
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-10", btnSecondary)}
                onClick={() => onOpenDashboard()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Home
              </Button>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Household</p>
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] sm:text-2xl">Notifications</h1>
              <p className="mt-1 text-sm text-[#575757]">
                {activeCount} active alert{activeCount === 1 ? "" : "s"} for you
              </p>
            </div>
          </div>
          {navigateWithinApp ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-10 text-sm font-semibold", btnSecondary)}
                onClick={() => navigateWithinApp("/settings#notifications")}
              >
                Notification settings
              </Button>
            </div>
          ) : null}
        </div>

        <WorkspaceRoutedSection flush title="Chore alerts">
          <div className="rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_6px_15px_rgba(36,37,38,0.06)] sm:p-5">
            <p className="text-sm text-[#575757]">
              Open chores due today: <span className="font-semibold text-[#1f1f1f]">{choresDueToday}</span>
              {choresOverdue > 0 ? (
                <>
                  {" "}
                  · Overdue: <span className="font-semibold text-[#c2410c]">{choresOverdue}</span>
                </>
              ) : null}
            </p>
            {navigateWithinApp ? (
              <Button
                type="button"
                variant="secondary"
                className={cn("mt-3 min-h-10", btnSecondary)}
                onClick={() => navigateWithinApp("/tasks#chore-tracker")}
              >
                <ListChecks className="mr-2 h-4 w-4" aria-hidden />
                Open chore tracker
              </Button>
            ) : null}
          </div>
        </WorkspaceRoutedSection>

        <WorkspaceRoutedSection flush title="In-app alerts">
          <HouseholdAlertsPanel
            data={data}
            setData={setData}
            currentMemberId={sessionMemberId}
            premiumDark={false}
            maxItems={80}
            inboxMode="session"
            className="rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_6px_15px_rgba(36,37,38,0.06)] sm:p-5"
          />
        </WorkspaceRoutedSection>
      </WorkspacePageShell>
    </div>
  );
}
