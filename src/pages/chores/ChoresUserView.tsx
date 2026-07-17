import { memo, useCallback, useEffect, useState, type CSSProperties } from "react";
import { ChoreMemberChip } from "../../components/chores/ChoreMemberChip";
import { ChorePanel } from "../../components/chores/ChorePanel";
import { ChoreTaskList } from "../../components/chores/ChoreTaskList";
import { ChoreViewHeader } from "../../components/chores/ChoreViewHeader";
import { useChoreShell } from "../../context/ChoreShellContext";
import { useKioskPageView } from "../../hooks/useKioskPageView";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../../types/chore";
import { CHORE_MEMBER_COLORS } from "../../lib/choreTheme";
import { choreLayout } from "../../lib/choreUi";

/** Per-member tasks and monthly room assignments. */
import type { ChoreTask } from "../../types/cleaning";

export type ChoresUserViewProps = {
  onEditTask: (task: ChoreTask) => void;
  focusMember?: HouseholdMember | null;
};

/** Per-member tasks and monthly room assignments. */
export const ChoresUserView = memo(function ChoresUserView({
  onEditTask,
  focusMember,
}: ChoresUserViewProps) {
  const { schedule } = useChoreShell();
  const [selected, setSelected] = useState<HouseholdMember>(focusMember ?? HOUSEHOLD_MEMBERS[0]);

  useEffect(() => {
    if (focusMember) {
      setSelected(focusMember);
    }
  }, [focusMember]);

  useKioskPageView("chores:users", { member: selected });

  const memberRow = schedule.memberSchedules.find((m) => m.memberName === selected);

  const handleMemberSelect = useCallback((member: HouseholdMember) => {
    trackInteraction("chores:users", "member_select", { member });
    setSelected(member);
  }, []);

  return (
    <div className={choreLayout.viewGrid}>
      <ChoreViewHeader
        title="Users"
        subtitle="Household members and today's assignments."
      />

      <div className="wd-chore-hh__member-row" role="list" aria-label="Household members">
        {HOUSEHOLD_MEMBERS.map((member) => (
          <ChoreMemberChip
            key={member}
            member={member}
            selected={selected === member}
            onSelect={() => handleMemberSelect(member)}
          />
        ))}
      </div>

      <section
        className="wd-chore-hh__user-hero wd-chore-hh__user-hero--animated"
        style={{ "--member-accent": CHORE_MEMBER_COLORS[selected] ?? "#735DFF" } as CSSProperties}
      >
        <h3 className="wd-chore-hh__user-hero-name">{selected}</h3>
        <p>{memberRow?.todaySchedule.length ?? 0} tasks today</p>
      </section>

      <ChorePanel title={`Today — ${selected}`} id="chores-user-today">
        <ChoreTaskList
          tasks={memberRow?.todaySchedule ?? []}
          surface="chores:users"
          enableSwipeDone
          onEdit={onEditTask}
          emptyMessage="No tasks assigned today."
        />
      </ChorePanel>

      <ChorePanel title="This month — rooms">
        <p className="wd-chore-hh__member-rooms-text">
          {memberRow?.cleaningThisMonth.join(", ") || "No room assignments yet."}
        </p>
      </ChorePanel>
    </div>
  );
});
