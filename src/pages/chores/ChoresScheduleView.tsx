import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { ChorePanel } from "../../components/chores/ChorePanel";
import { ChoreTaskList } from "../../components/chores/ChoreTaskList";
import { ChoreViewHeader } from "../../components/chores/ChoreViewHeader";
import { useChoreShell } from "../../context/ChoreShellContext";
import { useKioskPageView } from "../../hooks/useKioskPageView";
import { trackInteraction, trackKioskEvent } from "../../lib/kioskAnalytics";
import {
  addDaysIso,
  buildWeekTaskMap,
  formatChoreDayLabel,
  getWeekDates,
} from "../../lib/choreScheduleUtils";
import { choreClasses, choreCn, choreCtaClass, choreLayout, choreTw } from "../../lib/choreUi";
import type { ChoreTask } from "../../types/cleaning";
import type { HouseholdMember } from "../../types/chore";

const ChoreDragBoard = lazy(() =>
  import("../../components/chores/ChoreDragBoard").then((m) => ({
    default: m.ChoreDragBoard,
  })),
);

export type ChoresScheduleViewProps = {
  onEditTask: (task: ChoreTask) => void;
  onboardingScheduleMode?: "week" | "assign" | null;
  onboardingLocked?: boolean;
};

/** Week picker + assign board with drag-drop and live task sync. */
export const ChoresScheduleView = memo(function ChoresScheduleView({
  onEditTask,
  onboardingScheduleMode,
  onboardingLocked,
}: ChoresScheduleViewProps) {
  const { today, schedule, choreState, choreNotes, setAssignment } = useChoreShell();
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today);
  const [mode, setMode] = useState<"week" | "assign">("week");

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const weekMap = useMemo(
    () => buildWeekTaskMap(weekDates, choreState, choreNotes),
    [weekDates, choreState, choreNotes],
  );
  const dayTasks = weekMap[selectedDay] ?? [];
  useKioskPageView("chores:schedule", { mode });

  useEffect(() => {
    if (onboardingScheduleMode === "assign") {
      setMode("assign");
    } else if (onboardingScheduleMode === "week") {
      setMode("week");
    }
  }, [onboardingScheduleMode]);

  const setScheduleMode = (next: "week" | "assign") => {
    if (onboardingLocked) {
      return;
    }
    trackKioskEvent({
      category: "page",
      action: "schedule_mode",
      surface: "chores:schedule",
      metadata: { mode: next },
    });
    setMode(next);
  };

  return (
    <div className={choreLayout.viewGrid}>
      <ChoreViewHeader
        title="Schedule"
        subtitle="Live week view — completions sync across tabs instantly."
        stacked={false}
        actions={
          <div className="wd-chore-hh__schedule-toolbar">
            <div className="wd-chore-hh__seg" role="tablist" aria-label="Schedule mode" data-chore-tour="schedule-mode">
              <button
                type="button"
                role="tab"
                id="chore-schedule-tab-week"
                aria-selected={mode === "week"}
                aria-controls="chore-schedule-panel-week"
                className={choreCn(
                  mode === "week" ? choreClasses.segBtnActive : choreClasses.segBtn,
                  choreTw.focusRing,
                )}
                onClick={() => setScheduleMode("week")}
              >
                Week
              </button>
              <button
                type="button"
                role="tab"
                id="chore-schedule-tab-assign"
                aria-selected={mode === "assign"}
                aria-controls="chore-schedule-panel-assign"
                className={choreCn(
                  mode === "assign" ? choreClasses.segBtnActive : choreClasses.segBtn,
                  choreTw.focusRing,
                )}
                onClick={() => setScheduleMode("assign")}
              >
                Assign
              </button>
            </div>
            {mode === "week" ? (
              <div className="wd-chore-hh__week-nav">
                <button
                  type="button"
                  className={choreCn(choreCtaClass("ghost"), choreTw.focusRing)}
                  aria-label="Previous week"
                  onClick={() => setWeekAnchor(addDaysIso(weekAnchor, -7))}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  className={choreCn(choreCtaClass("ghost"), choreTw.focusRing)}
                  aria-label="Jump to current week"
                  onClick={() => {
                    trackInteraction("chores:schedule", "week_nav", { direction: "this_week" });
                    setWeekAnchor(today);
                    setSelectedDay(today);
                  }}
                >
                  This week
                </button>
                <button
                  type="button"
                  className={choreCn(choreCtaClass("ghost"), choreTw.focusRing)}
                  aria-label="Next week"
                  onClick={() => {
                    trackInteraction("chores:schedule", "week_nav", { direction: "next" });
                    setWeekAnchor(addDaysIso(weekAnchor, 7));
                  }}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </div>
        }
      />

      {mode === "assign" ? (
        <div
          id="chore-schedule-panel-assign"
          className="wd-chore-hh__assign-wrap"
          role="tabpanel"
          aria-labelledby="chore-schedule-tab-assign"
        >
          <p className="wd-chore-hh__assign-hint">
            Drag tasks from the pool into a column. Touch and hold, then drop on a name.
          </p>
          <Suspense
            fallback={
              <p className="wd-chore-hh__empty" role="status">
                Loading assign board…
              </p>
            }
          >
            <ChoreDragBoard
              tasks={schedule.today}
              onAssign={(taskId, member) => setAssignment(taskId, member as HouseholdMember)}
              onEdit={onEditTask}
            />
          </Suspense>
        </div>
      ) : (
        <div
          id="chore-schedule-panel-week"
          role="tabpanel"
          aria-labelledby="chore-schedule-tab-week"
        >
          <div className="wd-chore-hh__week-strip" role="tablist" aria-label="Week days">
            {weekDates.map((iso) => {
              const count = weekMap[iso]?.length ?? 0;
              const active = iso === selectedDay;
              return (
                <button
                  key={iso}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={choreCn(
                    active ? choreClasses.dayPillActive : choreClasses.dayPill,
                    choreTw.focusRing,
                  )}
                  aria-label={`${formatChoreDayLabel(iso, today)}, ${count} tasks`}
                  onClick={() => {
                    trackInteraction("chores:schedule", "day_select", { day: iso, taskCount: count });
                    setSelectedDay(iso);
                  }}
                >
                  <span className="wd-chore-hh__day-pill-label">{formatChoreDayLabel(iso, today)}</span>
                  <span className="wd-chore-hh__day-pill-count" aria-hidden>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <ChorePanel title={formatChoreDayLabel(selectedDay, today)} id="chores-day-tasks">
            <ChoreTaskList
              tasks={dayTasks}
              surface="chores:schedule"
              onEdit={onEditTask}
              emptyMessage="No tasks on this day."
            />
          </ChorePanel>
        </div>
      )}
    </div>
  );
});
