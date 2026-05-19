import type { FamilyMember } from "../../data/familyData";
import { cn, getMemberFullName, getMemberInitials } from "../../lib/utils";
import { resolveMemberTheme } from "../../lib/memberTheme";

export type MemberHeroCardProps = {
  member: FamilyMember;
  displayName: string;
  dateLabel: string;
  dueTodayCount: number;
  overdueCount: number;
  completedWeekCount: number;
  streakDays: number;
};

export function MemberHeroCard({
  member,
  displayName,
  dateLabel,
  dueTodayCount,
  overdueCount,
  completedWeekCount,
  streakDays,
}: MemberHeroCardProps) {
  const theme = resolveMemberTheme(member.colorTheme);

  return (
    <header className={cn("fh-member-hero bg-gradient-to-br", theme.hero)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="fh-member-hero__avatar"
            style={{ background: `color-mix(in srgb, ${theme.accent} 18%, white)` }}
            aria-hidden
          >
            {getMemberInitials(member)}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Member dashboard
            </p>
            <h1 className="fh-member-hero__name text-slate-950">
              {displayName || getMemberFullName(member)}
            </h1>
            {member.nickname ? (
              <p className="mt-1 text-lg font-semibold text-slate-600">{member.nickname}</p>
            ) : null}
            <p className="fh-member-hero__meta">{dateLabel}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill emoji="☀️" label="Today" value={dueTodayCount} />
          <StatPill emoji="⚠️" label="Overdue" value={overdueCount} />
          <StatPill emoji="✅" label="This week" value={completedWeekCount} />
          <StatPill
            emoji="🔥"
            label="Streak"
            value={streakDays}
            suffix={streakDays === 1 ? " day" : " days"}
          />
        </div>
      </div>
    </header>
  );
}

function StatPill({
  emoji,
  label,
  value,
  suffix = "",
}: {
  emoji: string;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-[16px] border-2 border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
      <span className="text-xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
        {value}
        {suffix ? <span className="text-sm font-bold text-slate-500">{suffix}</span> : null}
      </p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
