import { memo, useMemo } from "react";
import { ChoreAiSuggestions } from "../../components/chores/ChoreAiSuggestions";
import { ChorePersonalGreeting } from "../../components/chores/ChorePersonalGreeting";
import { ChoreCtaButton } from "../../components/chores/ChoreCtaButton";
import { ChorePanel } from "../../components/chores/ChorePanel";
import { ChoreStatCard } from "../../components/chores/ChoreStatCard";
import { ChoreTaskList } from "../../components/chores/ChoreTaskList";
import { ChoreViewHeader } from "../../components/chores/ChoreViewHeader";
import { useChoreShell } from "../../context/ChoreShellContext";
import { useKioskPageView } from "../../hooks/useKioskPageView";
import { choreSummaryCounts } from "../../lib/choreScheduleUtils";
import { choreClasses, choreLayout } from "../../lib/choreUi";
import type { ChoreShellTab } from "../../lib/choreTheme";
import type { ChoreTask } from "../../types/cleaning";
import type { HouseholdMember } from "../../types/chore";

export type ChoresHomeViewProps = {
  onEditTask: (task: ChoreTask) => void;
  onGoToSchedule?: () => void;
  onGoToUsers?: () => void;
  onNavigateTab?: (tab: ChoreShellTab) => void;
  onFocusMember?: (member: HouseholdMember) => void;
};

/** Today overview: stats, AI suggestions, and completable task list. */
export const ChoresHomeView = memo(function ChoresHomeView({
  onEditTask,
  onGoToSchedule,
  onGoToUsers,
  onNavigateTab,
  onFocusMember,
}: ChoresHomeViewProps) {
  const { today, schedule } = useChoreShell();
  const counts = useMemo(() => choreSummaryCounts(schedule.today), [schedule.today]);
  useKioskPageView("chores:home", { taskCount: schedule.today.length });

  const scrollToTask = (taskId: string) => {
    document.getElementById(`chore-task-${taskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className={choreLayout.viewGrid}>
      <ChorePersonalGreeting variant="home" />

      <ChoreViewHeader
        title="Today"
        subtitle={
          <>
            {today} · Kitchen duty: <strong>{schedule.kitchenDutyToday ?? "—"}</strong>
          </>
        }
        actions={
          <>
            {onGoToSchedule ? (
              <ChoreCtaButton variant="accent" onClick={onGoToSchedule}>
                Assign & schedule
              </ChoreCtaButton>
            ) : null}
            {onGoToUsers ? (
              <ChoreCtaButton variant="ghost" onClick={onGoToUsers}>
                View by member
              </ChoreCtaButton>
            ) : null}
          </>
        }
      />

      <ChoreAiSuggestions
        onNavigateTab={onNavigateTab}
        onFocusMember={onFocusMember}
        onFocusTask={scrollToTask}
      />

      <div className={choreLayout.stats}>
        <ChoreStatCard label="Due today" value={counts.total} accent="violet" />
        <ChoreStatCard label="Done" value={counts.done} accent="yellow" />
        <ChoreStatCard label="Still open" value={counts.todo} accent="coral" />
        <ChoreStatCard label="Overdue" value={counts.overdue} accent="magenta" />
      </div>

      <ChorePanel
        id="chores-today-list"
        data-chore-tour="today-tasks"
        title={`Today's tasks (${schedule.today.length})`}
        action={
          counts.todo > 0 ? (
            <span className={choreClasses.panelBadge}>{counts.todo} open</span>
          ) : null
        }
      >
        <ChoreTaskList
          tasks={schedule.today}
          surface="chores:home"
          enableSwipeDone
          onEdit={onEditTask}
          emptyMessage="No chores scheduled for today. Check the week on Schedule."
        />
      </ChorePanel>
    </div>
  );
});
