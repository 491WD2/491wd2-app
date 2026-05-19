import { memo, useMemo, type CSSProperties } from "react";
import { ChoreAiSuggestions } from "../../components/chores/ChoreAiSuggestions";
import { ChorePredictiveSchedule } from "../../components/chores/ChorePredictiveSchedule";
import { ChorePersonalGreeting } from "../../components/chores/ChorePersonalGreeting";
import { ChoreCtaButton } from "../../components/chores/ChoreCtaButton";
import { ChoreStatCard } from "../../components/chores/ChoreStatCard";
import { ChoreStatusBadge } from "../../components/chores/ChoreStatusBadge";
import { ChoreViewHeader } from "../../components/chores/ChoreViewHeader";
import { useChoreShell } from "../../context/ChoreShellContext";
import { useKioskPageView } from "../../hooks/useKioskPageView";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { useHouseholdChoreStore } from "../../lib/choreData";
import { CHORE_MEMBER_COLORS } from "../../lib/choreTheme";
import { choreSummaryCounts } from "../../lib/choreScheduleUtils";
import { choreClasses, choreCn, choreLayout } from "../../lib/choreUi";
import type { ChoreShellTab } from "../../lib/choreTheme";
import type { HouseholdMember } from "../../types/chore";

const MINI_LIST_MAX = 5;

export type ChoresDashboardViewProps = {
  onGoToSchedule?: () => void;
  onNavigateTab?: (tab: ChoreShellTab) => void;
  onFocusMember?: (member: HouseholdMember) => void;
};

/** Household metrics and per-member today snapshot — live with store updates. */
export const ChoresDashboardView = memo(function ChoresDashboardView({
  onGoToSchedule,
  onNavigateTab,
  onFocusMember,
}: ChoresDashboardViewProps) {
  const { schedule, today, predictiveSchedule, reminderPrefs, setReminderPrefs } =
    useChoreShell();
  const { definitions, checklists } = useHouseholdChoreStore();
  useKioskPageView("chores:dashboard");
  const weekCounts = useMemo(() => choreSummaryCounts(schedule.thisWeek), [schedule.thisWeek]);
  const monthCounts = useMemo(() => choreSummaryCounts(schedule.thisMonth), [schedule.thisMonth]);

  return (
    <div className={choreLayout.viewGrid}>
      <ChorePersonalGreeting variant="dashboard" />

      <ChoreViewHeader
        title="Household dashboard"
        subtitle={`Live overview for ${today} — updates when chores are completed.`}
        actions={
          onGoToSchedule ? (
            <ChoreCtaButton variant="primary" onClick={onGoToSchedule}>
              Open schedule
            </ChoreCtaButton>
          ) : null
        }
      />

      <ChoreAiSuggestions onNavigateTab={onNavigateTab} onFocusMember={onFocusMember} />

      <ChorePredictiveSchedule
        report={predictiveSchedule}
        prefs={reminderPrefs}
        onPrefsChange={setReminderPrefs}
        onNavigateTab={onNavigateTab}
        onFocusTask={(taskId) => {
          trackInteraction("chores:dashboard", "predictive_task", { taskId });
          onNavigateTab?.("home");
        }}
      />

      <div className={choreLayout.stats}>
        <ChoreStatCard
          label="Today"
          value={schedule.today.length}
          hint={`${weekCounts.done} done this week`}
          accent="violet"
        />
        <ChoreStatCard
          label="This week"
          value={schedule.thisWeek.length}
          hint={`${weekCounts.overdue} overdue`}
          accent="coral"
        />
        <ChoreStatCard
          label="This month"
          value={schedule.thisMonth.length}
          hint={`${monthCounts.todo} open`}
          accent="magenta"
        />
        <ChoreStatCard
          label="Definitions"
          value={definitions.length}
          hint={`${checklists.length} checklists`}
          accent="yellow"
        />
      </div>

      <div className={choreClasses.dashboardGrid}>
        {schedule.memberSchedules.map((member) => {
          const accent = CHORE_MEMBER_COLORS[member.memberName];
          const preview = member.todaySchedule.slice(0, MINI_LIST_MAX);
          const extra = member.todaySchedule.length - preview.length;
          return (
            <article
              key={member.memberName}
              className={choreCn(
                choreClasses.memberPanel,
                onFocusMember && "wd-chore-hh__member-panel--clickable",
              )}
              style={accent ? ({ "--member-accent": accent } as CSSProperties) : undefined}
              role={onFocusMember ? "button" : undefined}
              tabIndex={onFocusMember ? 0 : undefined}
              onClick={
                onFocusMember
                  ? () => {
                      trackInteraction("chores:dashboard", "member_card_click", {
                        member: member.memberName,
                      });
                      onFocusMember(member.memberName as HouseholdMember);
                    }
                  : undefined
              }
              onKeyDown={
                onFocusMember
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onFocusMember(member.memberName as HouseholdMember);
                      }
                    }
                  : undefined
              }
              aria-label={
                onFocusMember ? `View ${member.memberName} on Users tab` : undefined
              }
            >
              <header>
                <h3>{member.memberName}</h3>
                <span className="wd-chore-hh__member-count">{member.todaySchedule.length} today</span>
              </header>
              <p className="wd-chore-hh__member-rooms">
                Month rooms: {member.cleaningThisMonth.join(", ") || "—"}
              </p>
              <ul className="wd-chore-hh__mini-list">
                {preview.length === 0 ? (
                  <li className="wd-chore-hh__empty-inline">No tasks today</li>
                ) : (
                  preview.map((task) => (
                    <li key={task.id}>
                      <span>{task.title}</span>
                      <ChoreStatusBadge status={task.status} />
                    </li>
                  ))
                )}
              </ul>
              {extra > 0 ? <p className="wd-chore-hh__hint">+{extra} more</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
});
