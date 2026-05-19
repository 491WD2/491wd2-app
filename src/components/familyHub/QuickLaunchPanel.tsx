import { CalendarPlus, ClipboardList, Package, ScanBarcode } from "lucide-react";
import { trackFamilyHubQuickAction } from "../../lib/familyHubDashboardAnalytics";
import { ActionTile, WidgetCard, WidgetGrid, WidgetHeader } from "../widgets";

export type QuickLaunchActionId = "scan_food" | "add_chore" | "add_event" | "open_pantry";

export type QuickLaunchPanelProps = {
  onAction: (actionId: QuickLaunchActionId, href: string) => void;
};

const ACTIONS: Array<{
  id: QuickLaunchActionId;
  label: string;
  href: string;
  icon: typeof ScanBarcode;
  accent?: boolean;
}> = [
  {
    id: "scan_food",
    label: "Scan food",
    href: "/pantry?view=pantry",
    icon: ScanBarcode,
    accent: true,
  },
  {
    id: "add_chore",
    label: "Add chore",
    href: "/quick-add?type=chore&title=New%20chore",
    icon: ClipboardList,
  },
  {
    id: "add_event",
    label: "Add event",
    href: "/quick-add?type=event&title=New%20event",
    icon: CalendarPlus,
  },
  {
    id: "open_pantry",
    label: "Open pantry",
    href: "/pantry?view=pantry",
    icon: Package,
  },
];

export function QuickLaunchPanel({ onAction }: QuickLaunchPanelProps) {
  return (
    <WidgetCard
      aria-label="Quick actions"
      header={
        <WidgetHeader
          emoji="⚡"
          title="Quick launch"
          subtitle="Scan, add, or jump to a module"
        />
      }
    >
      <WidgetGrid columns={4}>
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <ActionTile
                accent={action.accent}
                label={action.label}
                icon={<Icon className="h-7 w-7" strokeWidth={2.25} />}
                onClick={() => {
                  trackFamilyHubQuickAction(action.id);
                  onAction(action.id, action.href);
                }}
              />
            </li>
          );
        })}
      </WidgetGrid>
    </WidgetCard>
  );
}
