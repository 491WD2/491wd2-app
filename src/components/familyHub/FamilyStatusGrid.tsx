import type { FamilyHubMemberStatus } from "../../lib/familyHubDashboardData";
import { FAMILY_HUB_ANALYTICS_SURFACE } from "../../lib/familyHubDashboardAnalytics";
import { getMemberInitials } from "../../lib/utils";
import { resolveMemberTheme } from "../../lib/memberTheme";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { StatusBadge, WidgetCard, WidgetHeader } from "../widgets";
import "./family-hub-dashboard.css";

export type FamilyStatusGridProps = {
  members: FamilyHubMemberStatus[];
  onOpenMember?: (memberId: string) => void;
};

export function FamilyStatusGrid({ members, onOpenMember }: FamilyStatusGridProps) {
  return (
    <WidgetCard
      aria-label="Member progress"
      header={
        <WidgetHeader
          emoji="👨‍👩‍👧‍👦"
          title="Member progress"
          subtitle="Weekly completions and open chores"
        />
      }
    >
      {members.length === 0 ? (
        <p className="fh-widget-empty">Add household members to see progress here.</p>
      ) : (
        <div className="fh-family-hub__member-grid">
          {members.map((row) => {
            const theme = resolveMemberTheme(row.member.colorTheme);
            return (
              <button
                key={row.member.id}
                type="button"
                className="fh-family-hub__member-card"
                onClick={() => {
                  trackInteraction(FAMILY_HUB_ANALYTICS_SURFACE, "card_click", {
                    section: "member",
                    memberId: row.member.id.slice(0, 24),
                  });
                  onOpenMember?.(row.member.id);
                }}
              >
                <span
                  className="fh-family-hub__member-avatar"
                  style={{
                    background: `color-mix(in srgb, ${theme.accent} 16%, white)`,
                    color: theme.accent,
                  }}
                  aria-hidden
                >
                  {getMemberInitials(row.member)}
                </span>
                <p className="fh-family-hub__member-name">{row.displayName}</p>
                <p className="fh-family-hub__member-meta">
                  {row.weeklyCompleted}/{row.weeklyTarget} this week · {row.openChores} open
                </p>
                <div className="fh-family-hub__progress-bar" aria-hidden>
                  <div
                    className="fh-family-hub__progress-fill"
                    style={{ width: `${row.weeklyPercent}%` }}
                  />
                </div>
                {row.dueToday > 0 ? (
                  <StatusBadge tone="warning" className="mt-2">
                    {row.dueToday} due today
                  </StatusBadge>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
