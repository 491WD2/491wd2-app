import { ArrowLeft, Bell, ListChecks, Settings, Table2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { HouseholdAlertsPanel } from "../components/dashboard/HouseholdAlertsPanel";
import { Button } from "../components/ui/Button";
import { WorkspacePageShell, WorkspaceRoutedSection } from "../components/workspace/ModuleWorkspace";
import { countActiveNotificationsForDashboardInbox } from "../lib/dashboardCommandCenterFilters";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { getChoreDueDate, isChoreDone } from "../lib/choreTrackerUtils";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn } from "../lib/utils";
import type { PageProps } from "./pageTypes";
import "../styles/guided-kiosk.css";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const btnSecondary =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa]";

type NotificationsGuidedFlow = "alerts" | "chores";

export function NotificationsPage({
  data,
  setData,
  onOpenDashboard,
  navigateWithinApp,
}: PageProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sessionMemberId = resolveSessionMemberIdForUi(data);
  const [showFullNotifications, setShowFullNotifications] = useState(false);
  const [guidedFlow, setGuidedFlow] = useState<NotificationsGuidedFlow | null>(null);

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

  function renderNotificationsFlowSheet() {
    if (!guidedFlow) {
      return null;
    }

    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setGuidedFlow(null)}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Notification station</p>
              <h2 id="notifications-flow-title">
                {guidedFlow === "alerts" ? "Review alerts" : "Chore alerts"}
              </h2>
              <p>{guidedFlow === "alerts" ? "Review active household alerts in one focused panel." : "Check chore urgency, then jump to the chore tracker if needed."}</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close notification flow"
              onClick={() => setGuidedFlow(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {guidedFlow === "alerts" ? (
            <HouseholdAlertsPanel
              data={data}
              setData={setData}
              currentMemberId={sessionMemberId}
              premiumDark
              maxItems={12}
              inboxMode="session"
              className="rounded-[18px] border border-white/15"
            />
          ) : (
            <div className="wd-guided-kiosk__confirm">
              <article className="wd-guided-kiosk__summary-card">
                <div>
                  <p className="wd-guided-kiosk__eyebrow">Cleaning</p>
                  <h3>Chore status</h3>
                </div>
                <dl>
                  <div>
                    <dt>Due today</dt>
                    <dd>{choresDueToday}</dd>
                  </div>
                  <div>
                    <dt>Overdue</dt>
                    <dd>{choresOverdue}</dd>
                  </div>
                  <div>
                    <dt>Route</dt>
                    <dd>Cleaning</dd>
                  </div>
                </dl>
              </article>
              {navigateWithinApp ? (
                <button
                  type="button"
                  className="wd-guided-kiosk__primary"
                  onClick={() => navigateWithinApp("/tasks#chore-tracker")}
                >
                  Open chore tracker
                </button>
              ) : null}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!showFullNotifications) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--notifications">
        <section className="wd-guided-kiosk__hero" aria-labelledby="notifications-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Notification station</p>
            <h1 id="notifications-kiosk-title">What alert step?</h1>
            <p>Review household alerts one step at a time, then jump only where action is needed.</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{activeCount} active</span>
            <span>{choresDueToday} chores today</span>
            <span>{choresOverdue} overdue</span>
          </div>
        </section>

        <section className="wd-guided-kiosk__actions-grid" aria-label="Notification actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => setGuidedFlow("alerts")}>
            <span className="wd-guided-kiosk__action-icon"><Bell className="h-5 w-5" aria-hidden /></span>
            <span><strong>Review alerts</strong><small>Open focused alert inbox</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("chores")}>
            <span className="wd-guided-kiosk__action-icon"><ListChecks className="h-5 w-5" aria-hidden /></span>
            <span><strong>Chore alerts</strong><small>Due and overdue summary</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => navigateWithinApp?.("/settings#notifications")}>
            <span className="wd-guided-kiosk__action-icon"><Settings className="h-5 w-5" aria-hidden /></span>
            <span><strong>Alert settings</strong><small>Open settings section</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullNotifications(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Advanced inbox</strong><small>Show all alert panels</small></span>
          </button>
        </section>

        {renderNotificationsFlowSheet()}
      </div>
    );
  }

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
                onClick={() => setShowFullNotifications(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Kiosk station
              </Button>
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
