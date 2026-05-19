import { useEffect, useMemo, type ReactNode } from "react";
import type {
  FamilyHubChoreRow,
  FamilyHubEventRow,
  FamilyHubPantryRow,
} from "../lib/familyHubDashboardData";
import { buildFamilyHubDashboardModel } from "../lib/familyHubDashboardData";
import {
  FAMILY_HUB_ANALYTICS_SURFACE,
  trackFamilyHubDashboardView,
  trackFamilyHubSectionOpen,
} from "../lib/familyHubDashboardAnalytics";
import { buildPersonalizedHomeGreeting } from "../lib/kioskGreeting";
import { getAppDisplayName } from "../lib/customization";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { findMemberById } from "../lib/utils";
import { KioskPageTitle } from "../components/layout/KioskPageTitle";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { KioskCard } from "../components/cards/Card";
import "../components/cards/kiosk.css";
import { SectionShell } from "../components/layout/SectionShell";
import { GhostButton } from "../components/ui/GhostButton";
import { WidgetCard, WidgetHeader, WidgetPageShell } from "../components/widgets";
import { TodayOverview } from "../components/familyHub/TodayOverview";
import { FamilyStatusGrid } from "../components/familyHub/FamilyStatusGrid";
import { SmartSuggestions } from "../components/familyHub/SmartSuggestions";
import { QuickLaunchPanel } from "../components/familyHub/QuickLaunchPanel";
import "../components/familyHub/family-hub-dashboard.css"; /* member grid */
import type { PageProps } from "./pageTypes";

export type FamilyHubDashboardProps = Pick<
  PageProps,
  | "data"
  | "navigateWithinApp"
  | "onOpenPantry"
  | "onOpenTasks"
  | "onOpenCalendar"
  | "onOpenMemberDashboard"
> & {
  greeting?: string;
};

function ListPanel({
  emoji,
  title,
  subtitle,
  sectionId,
  onOpen,
  openLabel,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  sectionId: string;
  onOpen: () => void;
  openLabel: string;
  children: ReactNode;
}) {
  return (
    <WidgetCard
      aria-labelledby={`fh-hub-${sectionId}`}
      header={
        <WidgetHeader
          emoji={emoji}
          title={title}
          subtitle={subtitle}
          titleId={`fh-hub-${sectionId}`}
          actions={
            <GhostButton
              type="button"
              onClick={() => {
                trackFamilyHubSectionOpen(sectionId);
                onOpen();
              }}
            >
              {openLabel}
            </GhostButton>
          }
        />
      }
    >
      {children}
    </WidgetCard>
  );
}

function PantryList({ rows, emptyText }: { rows: FamilyHubPantryRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="fh-widget-empty">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <KioskCard
          key={row.id}
          category="pantry"
          title={row.name}
          subtitle={row.detail}
          emoji={row.emoji}
          badge={<span className="fh-kiosk-card__badge">{row.badge}</span>}
          analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
        />
      ))}
    </div>
  );
}

function ChoreList({ rows, emptyText }: { rows: FamilyHubChoreRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="fh-widget-empty">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <KioskCard
          key={row.id}
          category="chores"
          tone={row.overdue ? "warning" : undefined}
          title={row.title}
          subtitle={`${row.assigneeLabel} · ${row.dueLabel}`}
          emoji={row.emoji}
          analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
        />
      ))}
    </div>
  );
}

function EventList({ rows, emptyText }: { rows: FamilyHubEventRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="fh-widget-empty">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <KioskCard
          key={row.id}
          category="events"
          title={row.title}
          subtitle={row.when}
          emoji={row.emoji}
          badge={<span className="fh-kiosk-card__badge">{row.category}</span>}
          analyticsSurface={FAMILY_HUB_ANALYTICS_SURFACE}
        />
      ))}
    </div>
  );
}

export function FamilyHubDashboard({
  data,
  navigateWithinApp,
  onOpenPantry,
  onOpenTasks,
  onOpenCalendar,
  onOpenMemberDashboard,
  greeting: greetingProp,
}: FamilyHubDashboardProps) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const model = useMemo(
    () => buildFamilyHubDashboardModel(data, todayIso),
    [data, todayIso],
  );
  const kioskShell = useKioskShell();

  const sessionMemberId = resolveSessionMemberIdForUi(data);
  const activeMember = sessionMemberId ? findMemberById(data, sessionMemberId) : undefined;
  const greeting =
    greetingProp ??
    (activeMember
      ? buildPersonalizedHomeGreeting(activeMember.name.trim().split(/\s+/)[0] || activeMember.name)
      : "Family command center");

  const householdName = getAppDisplayName(data.adminSettings);

  useEffect(() => {
    trackFamilyHubDashboardView(householdName);
  }, [householdName]);

  function go(href: string, fallback?: () => void) {
    if (navigateWithinApp) {
      navigateWithinApp(href);
      return;
    }
    fallback?.();
  }

  return (
    <WidgetPageShell>
      {kioskShell ? (
        <KioskPageTitle
          eyebrow="Family Hub"
          title={householdName}
          description="Pantry, chores, members, calendar, and analytics in one command center."
        />
      ) : null}

      <QuickLaunchPanel onAction={(_id, href) => go(href, onOpenPantry)} />

      <TodayOverview overview={model.overview} householdName={householdName} greeting={greeting} />

      <SmartSuggestions
        suggestions={model.suggestions}
        onNavigate={(href) => go(href)}
      />

      <SectionShell columns={2}>
        <div className="space-y-5">
          <ListPanel
            emoji="⏳"
            title="Expiring food"
            subtitle="Use-first items from your pantry"
            sectionId="expiring"
            openLabel="Pantry"
            onOpen={() => go("/pantry?view=pantry", onOpenPantry)}
          >
            <PantryList rows={model.expiringFood} emptyText="Nothing expiring soon." />
          </ListPanel>

          <ListPanel
            emoji="📦"
            title="Low-stock pantry"
            subtitle="Items running low or out"
            sectionId="low_stock"
            openLabel="Pantry"
            onOpen={() => go("/pantry?view=pantry", onOpenPantry)}
          >
            <PantryList rows={model.lowStock} emptyText="All stocked up." />
          </ListPanel>

          <ListPanel
            emoji="🧹"
            title="Today's chores"
            subtitle="Due today and overdue"
            sectionId="chores_today"
            openLabel="Chores"
            onOpen={() => go("/tasks", onOpenTasks)}
          >
            <ChoreList rows={model.choresToday} emptyText="Nothing due right now." />
          </ListPanel>
        </div>

        <div className="space-y-5">
          <FamilyStatusGrid
            members={model.memberStatuses}
            onOpenMember={(id) => {
              if (onOpenMemberDashboard) {
                onOpenMemberDashboard(id);
                return;
              }
              go(`/family/${id}`);
            }}
          />

          <ListPanel
            emoji="📅"
            title="Upcoming events"
            subtitle="Calendar and planner"
            sectionId="calendar"
            openLabel="Calendar"
            onOpen={() => go("/calendar", onOpenCalendar)}
          >
            <EventList rows={model.upcomingEvents} emptyText="No upcoming events." />
          </ListPanel>
        </div>
      </SectionShell>
    </WidgetPageShell>
  );
}
