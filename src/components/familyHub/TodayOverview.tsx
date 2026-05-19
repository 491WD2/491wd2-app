import { KioskCardGrid, KioskStatCard } from "../cards/Card";
import "../cards/kiosk.css";
import type { FamilyHubTodayOverview } from "../../lib/familyHubDashboardData";
import { FAMILY_HUB_ANALYTICS_SURFACE } from "../../lib/familyHubDashboardAnalytics";
import { WidgetCard, WidgetHeader } from "../widgets";

export type TodayOverviewProps = {
  overview: FamilyHubTodayOverview;
  householdName: string;
  greeting: string;
};

export function TodayOverview({ overview, householdName, greeting }: TodayOverviewProps) {
  return (
    <WidgetCard
      aria-label="Today's overview"
      header={
        <WidgetHeader
          emoji="☀️"
          title={greeting}
          subtitle={`${householdName} · ${overview.dateLabel}`}
        />
      }
    >
      <KioskCardGrid columns={4} aria-label="Today at a glance">
        <li>
          <KioskStatCard
            label="Chores today"
            value={overview.choresDueToday}
            emoji="🧹"
            category="chores"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            label="Overdue"
            value={overview.choresOverdue}
            emoji="⚠️"
            category="chores"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            label="Expiring"
            value={overview.expiringFood}
            emoji="⏳"
            category="pantry"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            label="Low stock"
            value={overview.lowStock}
            emoji="📦"
            category="pantry"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
      </KioskCardGrid>
      <KioskCardGrid columns={3} className="mt-4" aria-label="Household pulse">
        <li>
          <KioskStatCard
            label="Events ahead"
            value={overview.upcomingEvents}
            emoji="📅"
            category="events"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
            label="Shopping list"
            value={overview.shoppingOpen}
            emoji="🛒"
            category="events"
            analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
          />
        </li>
        <li>
          <KioskStatCard
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
