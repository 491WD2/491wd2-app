import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { KioskPageTitle } from "../components/layout/KioskPageTitle";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { WidgetPageShell } from "../components/widgets";
import { ChoreNavTabs } from "../components/chores/ChoreNavTabs";
import { ChoreOfflineBanner } from "../components/chores/ChoreOfflineBanner";
import { ChoreTabPanel } from "../components/chores/ChoreTabPanel";
import { ChoreReminderStack } from "../components/chores/ChoreReminderStack";
import { ChoreToastStack } from "../components/chores/ChoreToastStack";
import { useChoreOnboarding } from "../hooks/useChoreOnboarding";
import { ChoreShellProvider, useChoreShell } from "../context/ChoreShellContext";
import { choreClasses, choreCn } from "../lib/choreUi";
import {
  isAnalyticsConsoleOpen,
  setAnalyticsConsoleOpen,
  trackAnalyticsConsoleToggle,
  trackChoreAssign,
  trackKioskPageView,
} from "../lib/kioskAnalytics";
import type { ChoreShellTab } from "../lib/choreTheme";
import {
  CHORE_NOTES_STORAGE_KEY,
  CHORE_STATE_STORAGE_KEY,
  MEMBER_SCHEDULES_STORAGE_KEY,
  type ChoreTask,
} from "../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../types/chore";
const ChoreAnalyticsAgent = lazy(() =>
  import("../components/chores/ChoreAnalyticsAgent").then((m) => ({
    default: m.ChoreAnalyticsAgent,
  })),
);

const ChoreEditModal = lazy(() =>
  import("../components/chores/ChoreEditModal").then((m) => ({
    default: m.ChoreEditModal,
  })),
);

const ChoreOnboardingTour = lazy(() =>
  import("../components/chores/ChoreOnboardingTour").then((m) => ({
    default: m.ChoreOnboardingTour,
  })),
);

const ChoresHomeView = lazy(() =>
  import("./chores/ChoresHomeView").then((m) => ({ default: m.ChoresHomeView })),
);

const ChoresDashboardView = lazy(() =>
  import("./chores/ChoresDashboardView").then((m) => ({ default: m.ChoresDashboardView })),
);

const ChoresScheduleView = lazy(() =>
  import("./chores/ChoresScheduleView").then((m) => ({ default: m.ChoresScheduleView })),
);

const ChoresUserView = lazy(() =>
  import("./chores/ChoresUserView").then((m) => ({ default: m.ChoresUserView })),
);

function ChoreTabFallback() {
  return (
    <p className="wd-chore-hh__empty" role="status">
      Loading…
    </p>
  );
}

function RawChoreScheduleVerification() {
  const { schedule } = useChoreShell();
  const openTasks = schedule.today.filter((task) => task.status !== "Done");
  const suppressedTasks = schedule.today.filter((task) => task.suppressedByKitchenDuty);
  const kitchenRotation = schedule.thisWeek.filter((task) => task.isKitchenDuty);

  return (
    <section
      className="rounded-[24px] border border-white/[0.14] bg-white/[0.055] p-4 text-slate-100 shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl sm:p-5"
      aria-label="Raw chore schedule verification"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[0.68rem] font-black uppercase tracking-[0.16em] text-cyan-100/75">
            Raw schedule verification
          </p>
          <h2 className="m-0 mt-1 text-xl font-black tracking-tight text-white">
            Today, kitchen priority, and member boards
          </h2>
        </div>
        <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-sm font-bold text-cyan-50">
          Kitchen duty: {schedule.kitchenDutyToday ?? "Unassigned"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/[0.1] bg-black/15 p-3">
          <h3 className="m-0 text-sm font-black text-white">Tasks today</h3>
          <div className="mt-3 grid gap-2">
            {openTasks.slice(0, 18).map((task) => (
              <div key={`${task.id}-${task.dueDate}`} className="rounded-xl border border-white/[0.1] bg-white/[0.055] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{task.title}</strong>
                  <span className="text-xs font-bold text-cyan-100/75">{task.assignedTo || "Unassigned"}</span>
                </div>
                <p className="m-0 mt-1 text-xs font-semibold text-slate-300/75">
                  {task.room} · {task.frequency} · {task.status}
                  {task.suppressedByKitchenDuty ? ` · ${task.skippedReason}` : ""}
                </p>
              </div>
            ))}
          </div>
          {suppressedTasks.length > 0 ? (
            <p className="m-0 mt-3 text-xs font-bold text-amber-100/80">
              {suppressedTasks.length} chore(s) moved/skipped because kitchen duty has priority.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-black/15 p-3">
          <h3 className="m-0 text-sm font-black text-white">Kitchen rotation schedule</h3>
          <div className="mt-3 grid gap-2">
            {kitchenRotation.map((task) => (
              <div key={`${task.id}-${task.dueDate}`} className="rounded-xl border border-emerald-200/20 bg-emerald-200/10 p-3">
                <strong>{task.dueDate}</strong>
                <p className="m-0 mt-1 text-xs font-semibold text-emerald-50/80">
                  {task.assignedTo || "Unassigned"} · {task.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.1] bg-black/15 p-3">
          <h3 className="m-0 text-sm font-black text-white">Checklists and photo examples</h3>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0">
            {schedule.checklists.map((checklist) => (
              <li key={checklist.id} className="rounded-xl border border-white/[0.1] bg-white/[0.045] p-3">
                <strong>{checklist.title}</strong>
                <p className="m-0 mt-1 text-xs text-slate-300/75">
                  {checklist.room} · {checklist.items.length} steps · {checklist.photoExamples.length} photo slot(s)
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-black/15 p-3">
          <h3 className="m-0 text-sm font-black text-white">Member message boards</h3>
          <div className="mt-3 grid gap-2">
            {HOUSEHOLD_MEMBERS.map((member) => {
              const board = schedule.memberSchedules.find((entry) => entry.memberName === member);
              return (
                <div key={member} className="rounded-xl border border-white/[0.1] bg-white/[0.045] p-3">
                  <strong>{member}</strong>
                  <p className="m-0 mt-1 text-xs text-slate-300/75">
                    Today: {board?.todaySchedule.length ?? 0} · Month: {board?.monthlySchedule.length ?? 0} · Rooms:{" "}
                    {board?.cleaningThisMonth.join(", ") || "None"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-black/15 p-3">
          <h3 className="m-0 text-sm font-black text-white">localStorage keys</h3>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-xs font-bold text-slate-200/80">
            <li>{CHORE_STATE_STORAGE_KEY}</li>
            <li>{MEMBER_SCHEDULES_STORAGE_KEY}</li>
            <li>{CHORE_NOTES_STORAGE_KEY}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function analyticsConsoleDefaultOpen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("analytics") === "1") {
    return true;
  }
  return isAnalyticsConsoleOpen();
}

function ChoresPageInner(_props?: {
  onNavigate?: (path: string) => void;
  sidebarCollapsed?: boolean;
}) {
  const [tab, setTab] = useState<ChoreShellTab>("home");
  const [editTask, setEditTask] = useState<ChoreTask | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(analyticsConsoleDefaultOpen);
  const analyticsAiDefault = useMemo(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return new URLSearchParams(window.location.search).get("analytics") === "1";
  }, []);
  const [focusMember, setFocusMember] = useState<HouseholdMember | null>(null);
  const [onboardingScheduleMode, setOnboardingScheduleMode] = useState<"week" | "assign" | null>(null);
  const onboarding = useChoreOnboarding();
  const {
    markDone,
    skipTask,
    setAssignment,
    setImprovementNote,
    schedulePulse,
    reminders,
    dismissReminder,
    findTaskById,
  } = useChoreShell();

  useEffect(() => {
    trackKioskPageView("chores:app");
  }, []);

  useEffect(() => {
    if (!onboarding.active || !onboarding.step) {
      setOnboardingScheduleMode(null);
      return;
    }
    if (onboarding.step.tab) {
      setTab(onboarding.step.tab);
    }
    if (onboarding.step.tab === "schedule") {
      setOnboardingScheduleMode(onboarding.step.openAssignBoard ? "assign" : "week");
    } else {
      setOnboardingScheduleMode(null);
    }
  }, [onboarding.active, onboarding.step, onboarding.stepIndex]);

  const openEdit = useCallback((task: ChoreTask) => setEditTask(task), []);
  const openTaskFromReminder = useCallback(
    (taskId: string) => {
      const task = findTaskById(taskId);
      if (task) {
        setEditTask(task);
      }
    },
    [findTaskById],
  );
  const closeEdit = useCallback(() => setEditTask(null), []);

  const goToSchedule = useCallback(() => setTab("schedule"), []);
  const goToUsers = useCallback(() => setTab("user"), []);
  const navigateTab = useCallback(
    (t: ChoreShellTab) => {
      if (!onboarding.active) {
        setTab(t);
      }
    },
    [onboarding.active],
  );
  const handleTabChange = useCallback(
    (t: ChoreShellTab) => {
      if (!onboarding.active) {
        setTab(t);
      }
    },
    [onboarding.active],
  );
  const handleFocusMember = useCallback((member: HouseholdMember) => {
    setFocusMember(member);
    setTab("user");
  }, []);

  const toggleAnalytics = useCallback(() => {
    setShowAnalytics((open) => {
      const next = !open;
      setAnalyticsConsoleOpen(next);
      trackAnalyticsConsoleToggle(next);
      return next;
    });
  }, []);

  const handleSave = useCallback(
    (taskId: string, assignee: HouseholdMember | "", note: string) => {
      if (assignee) {
        trackChoreAssign(taskId, assignee, "chores:edit-modal", "modal");
      }
      setAssignment(taskId, assignee);
      setImprovementNote(taskId, note);
    },
    [setAssignment, setImprovementNote],
  );

  const showAnalyticsToggle = showAnalytics;

  const kioskShell = useKioskShell();
  useEffect(() => {
    if (!kioskShell) {
      return;
    }
    kioskShell.setActions({
      searchPlaceholder: "Search chores…",
      showScan: false,
      showAdd: true,
      addLabel: "Add chore",
      onAdd: () => setTab("schedule"),
    });
    return () => kioskShell.clearActions();
  }, [kioskShell]);

  const pageBody = (
    <div className={choreCn("wd-chore-hh", schedulePulse && choreClasses.shellSynced)}>
      <a href="#chore-main" className="wd-chore-hh__skip-link">
        Skip to chore content
      </a>
      <ChoreToastStack />
      <ChoreReminderStack
        reminders={reminders}
        onDismiss={dismissReminder}
        onOpenTask={openTaskFromReminder}
      />
      <ChoreOfflineBanner />
      {kioskShell ? (
        <KioskPageTitle
          eyebrow="Household schedule"
          title="Chores"
          description="Real-time schedules, smart suggestions, and touch-friendly controls."
          className="px-4 pt-4 sm:px-6"
        />
      ) : null}
      <header className={kioskShell ? "wd-chore-hh__hero wd-chore-hh__hero--compact" : "wd-chore-hh__hero"}>
        <div className="wd-chore-hh__hero-glow" aria-hidden />
        <div className="wd-chore-hh__hero-inner">
          {!kioskShell ? (
            <>
              <p className="wd-chore-hh__eyebrow">Household schedule</p>
              <h1>Chores</h1>
              <p className="wd-chore-hh__hero-sub">
                Real-time schedules, smart suggestions, and touch-friendly controls.
              </p>
            </>
          ) : null}
          <div className="wd-chore-hh__hero-tools">
            <button
              type="button"
              className="wd-chore-hh__tour-toggle"
              onClick={() => onboarding.startTour(true)}
              aria-label="Start chore kiosk tour"
            >
              Tour
            </button>
            {showAnalyticsToggle ? (
              <button
                type="button"
                className="wd-chore-hh__analytics-toggle"
                onClick={toggleAnalytics}
                aria-expanded={showAnalytics}
                aria-controls="chore-analytics-panel"
                aria-label={showAnalytics ? "Hide analytics console" : "Show analytics console"}
              >
                {showAnalytics ? "Hide analytics" : "Analytics"}
              </button>
            ) : null}
          </div>
        </div>
        <ChoreNavTabs active={tab} onChange={handleTabChange} tourActive={onboarding.active} />
      </header>

      {onboarding.active && onboarding.step ? (
        <Suspense fallback={null}>
          <ChoreOnboardingTour
            active={onboarding.active}
            step={onboarding.step}
            stepIndex={onboarding.stepIndex}
            stepCount={onboarding.stepCount}
            isLastStep={onboarding.isLastStep}
            onNext={onboarding.nextStep}
            onBack={onboarding.prevStep}
            onSkip={onboarding.dismissTour}
          />
        </Suspense>
      ) : null}

      {showAnalytics ? (
        <Suspense
          fallback={
            <p className="wd-chore-hh__empty wd-chore-hh__empty--inline" role="status">
              Loading analytics…
            </p>
          }
        >
          <div id="chore-analytics-panel">
            <ChoreAnalyticsAgent
              onClose={toggleAnalytics}
              defaultAiInsights={analyticsAiDefault}
            />
          </div>
        </Suspense>
      ) : null}

      <RawChoreScheduleVerification />

      <main id="chore-main" className="wd-chore-hh__content">
        <ChoreTabPanel tabKey={tab}>
          <Suspense fallback={<ChoreTabFallback />}>
            {tab === "home" ? (
              <ChoresHomeView
                onEditTask={openEdit}
                onGoToSchedule={goToSchedule}
                onGoToUsers={goToUsers}
                onNavigateTab={navigateTab}
                onFocusMember={handleFocusMember}
              />
            ) : null}
            {tab === "dashboard" ? (
              <ChoresDashboardView
                onGoToSchedule={goToSchedule}
                onNavigateTab={navigateTab}
                onFocusMember={handleFocusMember}
              />
            ) : null}
            {tab === "schedule" ? (
              <ChoresScheduleView
                onEditTask={openEdit}
                onboardingScheduleMode={onboarding.active ? onboardingScheduleMode : null}
                onboardingLocked={onboarding.active}
              />
            ) : null}
            {tab === "user" ? (
              <ChoresUserView onEditTask={openEdit} focusMember={focusMember} />
            ) : null}
          </Suspense>
        </ChoreTabPanel>
      </main>

      {editTask !== null ? (
        <Suspense fallback={null}>
          <ChoreEditModal
            task={editTask}
            open
            onClose={closeEdit}
            onSave={handleSave}
            onMarkDone={markDone}
            onSkip={skipTask}
          />
        </Suspense>
      ) : null}
    </div>
  );

  return kioskShell ? (
    <WidgetPageShell className="!min-h-0 !p-0 !bg-transparent">{pageBody}</WidgetPageShell>
  ) : (
    pageBody
  );
}

export function ChoresPage(props?: {
  onNavigate?: (path: string) => void;
  sidebarCollapsed?: boolean;
}) {
  return (
    <ChoreShellProvider>
      <ChoresPageInner {...props} />
    </ChoreShellProvider>
  );
}
