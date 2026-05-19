import type { ReactNode } from "react";
import type { ChoreFlowHubId } from "../../types/chore";
import type { ChoreHubCategoryStats } from "../../types/chore";
import { hubStatusLabel } from "../../lib/cleaningData";

export type ChoreFlowHubCardConfig = {
  id: ChoreFlowHubId;
  title: string;
  subtitle: string;
  path: string;
  icon: ChoreFlowIconId;
};

export type ChoreFlowIconId = ChoreFlowHubId;

export const CHORE_HUB_SESSION_KEY = "491wd-chore-flow-selection";

export const CHORE_FLOW_HUB_CARDS: ChoreFlowHubCardConfig[] = [
  {
    id: "today",
    title: "Today",
    subtitle: "Due today and overdue — start here",
    path: "/cleaning/today",
    icon: "today",
  },
  {
    id: "this-week",
    title: "This Week",
    subtitle: "Chores scheduled in the next seven days",
    path: "/cleaning/this-week",
    icon: "this-week",
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "See what is scheduled by date",
    path: "/cleaning/calendar",
    icon: "calendar",
  },
  {
    id: "unscheduled",
    title: "Unscheduled",
    subtitle: "Tasks without a date — assign when ready",
    path: "/cleaning/unscheduled",
    icon: "unscheduled",
  },
  {
    id: "archive",
    title: "Archive",
    subtitle: "Completed and archived household tasks",
    path: "/cleaning/archive",
    icon: "archive",
  },
  {
    id: "weekly-reset",
    title: "Weekly Reset",
    subtitle: "Fix overdue dates and missing assignees",
    path: "/cleaning/weekly-reset",
    icon: "weekly-reset",
  },
  {
    id: "rotation",
    title: "Rotation Mapping",
    subtitle: "Kitchen and bathroom — assign adults",
    path: "/cleaning/rotation",
    icon: "rotation",
  },
];

/** @deprecated Use CHORE_FLOW_HUB_CARDS */
export const CHORE_HUB_CARDS = CHORE_FLOW_HUB_CARDS;

export function hubCardForPage(pageId: string) {
  return CHORE_FLOW_HUB_CARDS.find((card) => card.id === pageId);
}

const FLOW_HUB_IDS: ChoreFlowHubId[] = [
  "today",
  "this-week",
  "calendar",
  "unscheduled",
  "archive",
  "weekly-reset",
  "rotation",
];

export function isChoreFlowHubId(page: string): page is ChoreFlowHubId {
  return FLOW_HUB_IDS.includes(page as ChoreFlowHubId);
}

export function hubCardStatusLabel(stats: ChoreHubCategoryStats) {
  return hubStatusLabel(stats);
}

export function ChoreHubIcon({ icon }: { icon: ChoreFlowIconId }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<ChoreFlowIconId, ReactNode> = {
    today: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    "this-week": (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="M8 14h3M13 14h3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v3M16 2v3" />
        <path d="M8 13h2M14 13h2M8 17h2" />
      </>
    ),
    unscheduled: (
      <>
        <path d="M4 6h16M4 12h10M4 18h6" />
        <path d="M16 16l4 4M20 16l-4 4" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16v14H4z" />
        <path d="M8 7V5h8v2M10 11h4" />
      </>
    ),
    "weekly-reset": (
      <>
        <path d="M12 4v4M12 16v4M4.9 7.1l2.8 2.8M16.3 14.1l2.8 2.8M4 12h4M16 12h4" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    rotation: (
      <>
        <path d="M7 8h10M7 12h10M7 16h6" />
        <path d="M4 4l3 3-3 3M20 20l-3-3 3-3" />
      </>
    ),
  };

  return (
    <span className="wd-chore-kiosk-hub__icon" aria-hidden>
      <svg {...common}>{paths[icon]}</svg>
    </span>
  );
}
