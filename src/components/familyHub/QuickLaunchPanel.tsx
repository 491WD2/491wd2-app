import { ArrowRight, CalendarPlus, ClipboardList, Package, ScanBarcode } from "lucide-react";
import { trackFamilyHubQuickAction } from "../../lib/familyHubDashboardAnalytics";
import { cn } from "../../lib/utils";
import { WidgetCard, WidgetGrid, WidgetHeader } from "../widgets";
import "../cards/kiosk.css";

export type QuickLaunchActionId = "scan_food" | "add_chore" | "add_event" | "open_pantry";

export type QuickLaunchPanelProps = {
  onAction: (actionId: QuickLaunchActionId, href: string) => void;
};

const ACTIONS: Array<{
  id: QuickLaunchActionId;
  label: string;
  description: string;
  href: string;
  icon: typeof ScanBarcode;
  tone: "green" | "blue" | "purple" | "amber";
}> = [
  {
    id: "scan_food",
    label: "Scan food",
    description: "Add inventory with barcode scan",
    href: "/pantry?view=pantry",
    icon: ScanBarcode,
    tone: "green",
  },
  {
    id: "add_chore",
    label: "Add chore",
    description: "Create a new household task",
    href: "/quick-add?type=chore&title=New%20chore",
    icon: ClipboardList,
    tone: "blue",
  },
  {
    id: "add_event",
    label: "Add event",
    description: "Put a plan on the calendar",
    href: "/quick-add?type=event&title=New%20event",
    icon: CalendarPlus,
    tone: "purple",
  },
  {
    id: "open_pantry",
    label: "Open pantry",
    description: "Review stock and reminders",
    href: "/pantry?view=pantry",
    icon: Package,
    tone: "amber",
  },
];

export function QuickLaunchPanel({ onAction }: QuickLaunchPanelProps) {
  return (
    <WidgetCard
      className="fh-family-hub__quick-card fh-family-hub__surface-card"
      aria-label="Quick actions"
      header={
        <WidgetHeader
          emoji="⚡"
          title="Quick launch"
          subtitle="Scan, add, or jump to a module"
        />
      }
    >
      <WidgetGrid columns={4} className="fh-widget-grid--module-cards fh-family-hub__module-shortcuts">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <button
                type="button"
                className={cn("fh-module-card", `fh-module-card--${action.tone}`)}
                onClick={() => {
                  trackFamilyHubQuickAction(action.id);
                  onAction(action.id, action.href);
                }}
              >
                <span className="fh-module-card__icon" aria-hidden>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span className="fh-module-card__copy">
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </span>
                <span className="fh-module-card__arrow" aria-hidden>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </li>
          );
        })}
      </WidgetGrid>
    </WidgetCard>
  );
}
