import { KioskCardGrid, KioskStatCard } from "../cards/Card";
import "../cards/kiosk.css";
import type { FamilyHubTodayOverview } from "../../lib/familyHubDashboardData";
import { FAMILY_HUB_ANALYTICS_SURFACE } from "../../lib/familyHubDashboardAnalytics";
import { WidgetCard } from "../widgets";

export type TodayOverviewProps = {
  overview: FamilyHubTodayOverview;
  householdName: string;
};

export function TodayOverview({ overview, householdName }: TodayOverviewProps) {
  return (
    <WidgetCard className="fh-family-hub__today-card fh-family-hub__surface-card" aria-label="Today's overview">
      <div className="fh-family-hub__snapshot-head">
        <div>
          <p className="fh-family-hub__snapshot-eyebrow">Today snapshot</p>
          <h2>Household pulse</h2>
        </div>
        <p>{householdName} · {overview.dateLabel}</p>
      </div>
      <KioskCardGrid columns={4} className="fh-family-hub__snapshot-grid" aria-label="Today at a glance">
        <li>
          <KioskStatCard
            className="fh-family-hub__stat-card"
            label="Chores today"
            value={overview.choresDueToday}
            emoji="🧹"
            category="chores"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            className="fh-family-hub__stat-card"
            label="Overdue"
            value={overview.choresOverdue}
            emoji="⚠️"
            category="chores"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            className="fh-family-hub__stat-card"
            label="Shopping list"
            value={overview.shoppingOpen}
            emoji="🛒"
            category="events"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            className="fh-family-hub__stat-card"
            label="Events ahead"
            value={overview.upcomingEvents}
            emoji="📅"
            category="events"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            className="fh-family-hub__stat-card"
            label="Alerts"
            value={overview.notifications}
            emoji="🔔"
            category="events"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
      </KioskCardGrid>
    </WidgetCard>
  );
}
