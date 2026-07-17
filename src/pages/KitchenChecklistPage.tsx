import { ArrowLeft, CheckCircle2, ClipboardList, ListChecks, StickyNote, Table2, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { KitchenDutyCompletion, KitchenChecklistItem } from "../data/familyData";
import { Button } from "../components/ui/Button";
import { KitchenTaskNotesDrawer } from "../components/kitchen/KitchenTaskNotesDrawer";
import { WorkspacePageShell } from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  kitchenDutyRelatedNotificationId,
} from "../lib/kitchenDuty";
import {
  kitchenChecklistProgressVisible,
  markAllVisibleKitchenChecklistForDate,
  resetKitchenChecklistCheckedForDate,
  toggleKitchenChecklistItemForDate,
  visibleKitchenChecklistItems,
} from "../lib/kitchenChecklistDisplay";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { getMemberColor } from "../lib/memberColors";
import { cn, findMemberById, getMemberFullName } from "../lib/utils";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import type { PageProps } from "./pageTypes";
import "../styles/guided-kiosk.css";

/** SmartHR light — warm accents (no teal/cyan). */
const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const CARD_SHELL =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#575757] shadow-sm hover:bg-[#f8f9fa]";

const TASK_ACCENTS = [
  {
    square:
      "bg-gradient-to-br from-[#FF6F28] to-[#FF5325] shadow-inner shadow-orange-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-orange-50/90 via-white to-[#f8f9fa]",
  },
  {
    square: "bg-violet-500 shadow-inner shadow-violet-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-violet-50/90 via-white to-[#f8f9fa]",
  },
  {
    square: "bg-amber-500 shadow-inner shadow-amber-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-amber-50/90 via-white to-[#f8f9fa]",
  },
  {
    square: "bg-emerald-500 shadow-inner shadow-emerald-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-emerald-50/90 via-white to-[#f8f9fa]",
  },
  {
    square: "bg-indigo-500 shadow-inner shadow-indigo-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-indigo-50/90 via-white to-[#f8f9fa]",
  },
  {
    square: "bg-rose-500 shadow-inner shadow-rose-900/25",
    cardBorder: "border-[#ededed]",
    wash: "from-rose-50/90 via-white to-[#f8f9fa]",
  },
] as const;

export function KitchenChecklistPage({
  data,
  setData,
  onOpenDashboard,
  navigateWithinApp,
  restrictChildNavigation,
}: PageProps) {
  const today = new Date().toISOString().slice(0, 10);
  const titleId = useId();

  const todayKitchenDay = getTodayKitchenWeekdayLocal();
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule.weekdays.find((w) => w.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;

  const kitchenCompletedToday = isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, today);

  const friendlyToday = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(`${today}T12:00:00`));
  }, [today]);

  const visibleChecklist = useMemo(
    () => visibleKitchenChecklistItems(data.kitchenChecklist),
    [data.kitchenChecklist],
  );

  const checklistProgress = useMemo(
    () => kitchenChecklistProgressVisible(data.kitchenChecklist, today),
    [data.kitchenChecklist, today],
  );

  const [notesSession, setNotesSession] = useState<{
    item: KitchenChecklistItem;
    key: number;
  } | null>(null);
  const [showFullKitchen, setShowFullKitchen] = useState(false);
  const [guidedFlow, setGuidedFlow] = useState<"assignment" | "checklist" | null>(null);
  const [guidedMessage, setGuidedMessage] = useState<string | null>(null);
  useDrawerEscape(Boolean(notesSession), () => setNotesSession(null));

  function toggleKitchenChecklistItem(itemId: string) {
    setData((current) => ({
      ...current,
      kitchenChecklist: toggleKitchenChecklistItemForDate(current.kitchenChecklist, itemId, today),
    }));
  }

  function toggleKitchenTodayDone() {
    if (!todayKitchenDay || !kitchenTodayMember) {
      return;
    }
    const now = new Date().toISOString();
    const relatedId = kitchenDutyRelatedNotificationId(today);
    const activeMemberId =
      data.adminSettings.activePreferencesMemberId ??
      data.familyMembers.find((m) => m.status === "active")?.id;

    setData((current) => {
      const existing = current.kitchenDutyCompletions.find((c) => c.dutyDate === today);
      if (existing) {
        const nextCompletions = current.kitchenDutyCompletions.filter((c) => c.id !== existing.id);
        const dates = new Set(current.kitchenSchedule.completedDates ?? []);
        dates.delete(today);
        return createActivity(
          {
            ...current,
            kitchenDutyCompletions: nextCompletions,
            kitchenSchedule: {
              ...current.kitchenSchedule,
              completedDates: [...dates].sort(),
              kitchenDutyReminderIssuedForDate: undefined,
              updatedAt: now,
            },
          },
          {
            type: "updated",
            entityType: "data",
            entityId: "kitchen-schedule",
            entityTitle: "Kitchen schedule",
            message: "Kitchen duty marked not complete for today.",
          },
        );
      }

      const completion: KitchenDutyCompletion = {
        id: crypto.randomUUID(),
        dayKey: todayKitchenDay,
        dutyDate: today,
        memberId: kitchenTodayMember.id,
        completedAt: now,
        completedByMemberId: activeMemberId,
        createdAt: now,
      };
      const dates = new Set(current.kitchenSchedule.completedDates ?? []);
      dates.add(today);
      const notifications = current.notifications.map((n) =>
        n.type === "kitchen_duty" && n.relatedEntityId === relatedId && !n.dismissedAt
          ? { ...n, dismissedAt: now }
          : n,
      );

      return createActivity(
        {
          ...current,
          kitchenDutyCompletions: [...current.kitchenDutyCompletions, completion],
          kitchenSchedule: {
            ...current.kitchenSchedule,
            completedDates: [...dates].sort(),
            updatedAt: now,
          },
          notifications,
        },
        {
          type: "completed",
          entityType: "data",
          entityId: completion.id,
          entityTitle: "Kitchen duty",
          message: "Completed kitchen duty.",
          memberId: activeMemberId,
        },
      );
    });
    setGuidedMessage(kitchenCompletedToday ? "Kitchen duty marked not complete." : "Kitchen duty marked complete.");
  }

  function markAllChecklistDone() {
    setData((current) => ({
      ...current,
      kitchenChecklist: markAllVisibleKitchenChecklistForDate(current.kitchenChecklist, today),
    }));
    setGuidedMessage("All visible kitchen tasks marked done.");
  }

  function resetChecklistToday() {
    setData((current) => ({
      ...current,
      kitchenChecklist: resetKitchenChecklistCheckedForDate(current.kitchenChecklist, today),
    }));
    setGuidedMessage("Kitchen checklist reset for today.");
  }

  const notesDrawer = notesSession ? (
    <KitchenTaskNotesDrawer
      key={notesSession.key}
      item={notesSession.item}
      titleIdBase={titleId}
      setData={setData}
      onClose={() => setNotesSession(null)}
    />
  ) : null;

  function renderKitchenFlowSheet() {
    if (!guidedFlow) {
      return null;
    }

    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setGuidedFlow(null)}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kitchen-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Kitchen station</p>
              <h2 id="kitchen-flow-title">
                {guidedFlow === "assignment" ? "Today’s assignment" : "Kitchen checklist"}
              </h2>
              <p>Make one kitchen choice, then continue to the next popup or completion.</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close kitchen flow"
              onClick={() => setGuidedFlow(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {guidedFlow === "assignment" ? (
            <div className="wd-guided-kiosk__confirm">
              <article className="wd-guided-kiosk__summary-card">
                <div>
                  <p className="wd-guided-kiosk__eyebrow">Assigned today</p>
                  <h3>{kitchenTodayMember ? getMemberFullName(kitchenTodayMember) : "No kitchen duty assigned today."}</h3>
                </div>
                <dl>
                  <div>
                    <dt>Date</dt>
                    <dd>{friendlyToday}</dd>
                  </div>
                  <div>
                    <dt>Checklist</dt>
                    <dd>{checklistProgress.completed}/{checklistProgress.total}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{kitchenCompletedToday ? "Complete" : "Open"}</dd>
                  </div>
                </dl>
              </article>
              {todayKitchenDay && kitchenTodayMember ? (
                <button type="button" className="wd-guided-kiosk__primary" onClick={toggleKitchenTodayDone}>
                  {kitchenCompletedToday ? "Undo complete" : "Mark complete"}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="wd-guided-kiosk__chooser" role="list" aria-label="Kitchen checklist items">
              {visibleChecklist.length === 0 ? (
                <p className="wd-guided-kiosk__empty">No checklist tasks to show.</p>
              ) : (
                visibleChecklist.map((item) => {
                  const checked = item.checkedDate === today;
                  return (
                    <div key={item.id} className="wd-guided-kiosk__chooser-row">
                      <span>
                        <strong>{item.label}</strong>
                        <small>{checked ? "Done today" : "Open today"}</small>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="wd-guided-kiosk__secondary"
                          onClick={() =>
                            setNotesSession({
                              item,
                              key: Date.now(),
                            })
                          }
                        >
                          Notes
                        </button>
                        <button
                          type="button"
                          className="wd-guided-kiosk__primary"
                          onClick={() => toggleKitchenChecklistItem(item.id)}
                        >
                          {checked ? "Undo" : "Done"}
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!showFullKitchen) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--kitchen">
        <section className="wd-guided-kiosk__hero" aria-labelledby="kitchen-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Kitchen station</p>
            <h1 id="kitchen-kiosk-title">What kitchen step?</h1>
            <p>Choose the assignment or checklist, then finish one step at a time.</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{friendlyToday}</span>
            <span>{checklistProgress.completed}/{checklistProgress.total} done</span>
            <span>{kitchenCompletedToday ? "Duty complete" : "Duty open"}</span>
          </div>
        </section>

        {guidedMessage ? (
          <section className="wd-guided-kiosk__complete" role="status">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p>{guidedMessage}</p>
            <button type="button" onClick={() => setGuidedMessage(null)}>
              Continue
            </button>
          </section>
        ) : null}

        <section className="wd-guided-kiosk__actions-grid" aria-label="Kitchen actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => setGuidedFlow("assignment")}>
            <span className="wd-guided-kiosk__action-icon"><ClipboardList className="h-5 w-5" aria-hidden /></span>
            <span><strong>Today’s duty</strong><small>Review and mark complete</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("checklist")}>
            <span className="wd-guided-kiosk__action-icon"><ListChecks className="h-5 w-5" aria-hidden /></span>
            <span><strong>Checklist</strong><small>Tap each kitchen task</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={markAllChecklistDone}>
            <span className="wd-guided-kiosk__action-icon"><CheckCircle2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Mark all done</strong><small>Complete visible tasks</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={resetChecklistToday}>
            <span className="wd-guided-kiosk__action-icon"><StickyNote className="h-5 w-5" aria-hidden /></span>
            <span><strong>Reset today</strong><small>Clear today’s checks</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullKitchen(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Advanced checklist</strong><small>Open detailed list</small></span>
          </button>
        </section>

        {renderKitchenFlowSheet()}
        {notesDrawer}
      </div>
    );
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        tone="light"
        className={cn(
          "flex flex-col gap-6 pb-10 pt-0 lg:gap-8 px-[15px] sm:px-[30px]",
          DS_MAIN_COLUMN,
        )}
      >
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            {onOpenDashboard ? (
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-11 shrink-0 text-sm", btnSecondaryLight)}
                onClick={() => onOpenDashboard()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Home
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className={cn("min-h-11 shrink-0 text-sm", btnSecondaryLight)}
              onClick={() => setShowFullKitchen(false)}
            >
              Kiosk station
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                Kitchen checklist
              </p>
              <h1 id={titleId} className="mt-1 text-2xl font-bold tracking-tight text-[#1f1f1f] sm:text-3xl">
                Kitchen Checklist
              </h1>
              <p className="mt-1 text-sm text-[#575757]">{friendlyToday}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {navigateWithinApp && !restrictChildNavigation ? (
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-11 text-xs font-semibold sm:text-sm", btnSecondaryLight)}
                onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
              >
                Edit schedule
              </Button>
            ) : null}
          </div>
        </div>

        <header
          className={cn(CARD_SHELL, "p-5 sm:p-6")}
          style={
            kitchenTodayMember
              ? { borderLeftWidth: 4, borderLeftColor: getMemberColor(kitchenTodayMember) }
              : undefined
          }
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#637381]">
                Today&apos;s assignment
              </p>
              <p className="text-xl font-semibold text-[#1f1f1f] sm:text-2xl">
                {kitchenTodayMember ? getMemberFullName(kitchenTodayMember) : "No kitchen duty assigned today."}
              </p>
              <p className="text-sm text-[#575757]">
                Progress{" "}
                <span className="font-semibold tabular-nums text-[#F26522]">
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm font-medium text-[#575757]">
                Checklist{" "}
                <span className="tabular-nums text-[#1f1f1f]">
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              </p>
              {todayKitchenDay && kitchenTodayMember ? (
                <Button
                  type="button"
                  variant={kitchenCompletedToday ? "secondary" : "primary"}
                  className="min-h-12 min-w-[11rem] px-6 text-base font-semibold"
                  onClick={toggleKitchenTodayDone}
                >
                  {kitchenCompletedToday ? "Undo complete" : "Mark complete"}
                </Button>
              ) : (
                <p className="text-sm text-[#637381]">No kitchen duty assigned today.</p>
              )}
            </div>
          </div>
          {visibleChecklist.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#ededed] pt-4">
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-10 text-sm font-semibold", btnSecondaryLight)}
                onClick={markAllChecklistDone}
              >
                Mark all done
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-10 text-sm font-semibold text-[#637381]"
                onClick={resetChecklistToday}
              >
                Reset today
              </Button>
            </div>
          ) : null}
        </header>

        <section aria-labelledby="kitchen-tasks-heading" className="min-w-0 space-y-4">
            <h2 id="kitchen-tasks-heading" className="sr-only">
              Task checklist
            </h2>
            <ul className="space-y-3">
              {visibleChecklist.length === 0 ? (
                <li className={cn(CARD_SHELL, "px-4 py-6 text-center text-sm text-[#637381]")}>
                  No checklist tasks to show. If this list was cleared, import a backup or add rows from Cleaning →
                  Kitchen.
                </li>
              ) : null}
              {visibleChecklist.map((item, index) => {
                const accent = TASK_ACCENTS[index % TASK_ACCENTS.length];
                const checked = item.checkedDate === today;
                return (
                  <li key={item.id}>
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[8px] border bg-gradient-to-br p-4 pr-4 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-5",
                        accent.cardBorder,
                        accent.wash,
                      )}
                    >
                      <div className="flex min-h-[44px] items-stretch gap-3 sm:gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] sm:h-16 sm:w-16",
                            accent.square,
                          )}
                          aria-hidden
                        />
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-6 w-6 shrink-0 rounded-md border-[#ededed] bg-white accent-[#F26522]"
                              checked={checked}
                              onChange={() => toggleKitchenChecklistItem(item.id)}
                            />
                            <span className="text-lg font-semibold uppercase tracking-wide text-[#1f1f1f] sm:text-xl">
                              {item.label}
                            </span>
                          </label>
                          <button
                            type="button"
                            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[8px] border border-[#ededed] bg-white px-4 text-xs font-bold uppercase tracking-wide text-[#575757] shadow-sm transition hover:bg-[#f8f9fa] sm:ml-2"
                            onClick={() =>
                              setNotesSession({
                                item,
                                key: Date.now(),
                              })
                            }
                          >
                            Notes
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
        </section>
      </div>

      {notesDrawer}
      </WorkspacePageShell>
    </div>
  );
}
