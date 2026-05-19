import type { FamilyMember } from "../../data/familyData";
import type { PlannerBoardItem } from "../../types/calendarPlanner";
import { getMemberInitials, getMemberFullName, cn } from "../../lib/utils";
import { resolveMemberTheme } from "../../lib/memberTheme";

export type MemberScheduleStripProps = {
  members: FamilyMember[];
  items: PlannerBoardItem[];
  memberFilter: string | "all";
  onMemberFilter: (memberId: string | "all") => void;
};

export function MemberScheduleStrip({
  members,
  items,
  memberFilter,
  onMemberFilter,
}: MemberScheduleStripProps) {
  const active = members.filter((m) => m.status === "active" || m.status === "away");

  return (
    <section className="fh-cal-planner__panel" aria-label="Member assignments">
      <div className="fh-cal-planner__panel-head">
        <h2 className="fh-cal-planner__panel-title">👤 Member assignments</h2>
      </div>
      <div className="fh-cal-planner__panel-body">
        <div className="fh-cal-planner__member-strip">
          <button
            type="button"
            className={cn(
              "fh-cal-planner__member-pill",
              memberFilter === "all" && "fh-cal-planner__member-pill--active",
            )}
            onClick={() => onMemberFilter("all")}
          >
            <p className="text-sm font-extrabold text-slate-900">Everyone</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{items.length} items</p>
          </button>
          {active.map((member) => {
            const count = items.filter((i) => i.memberIds.includes(member.id)).length;
            const theme = resolveMemberTheme(member.colorTheme);
            return (
              <button
                key={member.id}
                type="button"
                className={cn(
                  "fh-cal-planner__member-pill",
                  memberFilter === member.id && "fh-cal-planner__member-pill--active",
                )}
                onClick={() => onMemberFilter(member.id)}
              >
                <span
                  className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    background: `color-mix(in srgb, ${theme.accent} 14%, white)`,
                    color: theme.accent,
                  }}
                  aria-hidden
                >
                  {getMemberInitials(member)}
                </span>
                <p className="text-sm font-extrabold text-slate-900">{getMemberFullName(member)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{count} assigned</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
