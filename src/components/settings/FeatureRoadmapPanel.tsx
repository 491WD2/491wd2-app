import { Badge } from "../ui/Badge";
import { Card, CardHeader } from "../ui/Card";
import {
  WorkspaceTableWrap,
  workspaceTableClassName,
} from "../workspace/ModuleWorkspace";
import { cn } from "../../lib/utils";

type RoadmapStatus =
  | "Live"
  | "Building"
  | "Planned"
  | "Later"
  | "Removed / Not needed";

type RoadmapRow = {
  feature: string;
  status: RoadmapStatus;
  description: string;
  priority: "High" | "Medium" | "Low";
  nextStep: string;
};

const ROADMAP_ROWS: RoadmapRow[] = [
  {
    feature: "Kitchen schedule",
    status: "Live",
    description:
      "Who leads dinner prep each day, today’s check-off, and closing tasks tied to your home screen.",
    priority: "High",
    nextStep: "Tune checklist wording for your household in Tasks.",
  },
  {
    feature: "Family PIN login",
    status: "Live",
    description:
      "A simple PIN on this device so younger profiles stay in kid-safe navigation.",
    priority: "High",
    nextStep: "Change PIN anytime under My settings.",
  },
  {
    feature: "Shopping list",
    status: "Live",
    description:
      "Shared groceries, quick add, purchased flow, and inventory add.",
    priority: "High",
    nextStep: "Use merge-friendly quick add when two people pick the same item.",
  },
  {
    feature: "Inventory / pantry",
    status: "Live",
    description:
      "What you have on hand, where it lives, and how full shelves are.",
    priority: "High",
    nextStep: "Add staples so low/out alerts stay meaningful.",
  },
  {
    feature: "Barcode scan / lookup",
    status: "Live",
    description:
      "Scan a package to add or match items using public product information.",
    priority: "Medium",
    nextStep: "Scan from Pantry when putting groceries away.",
  },
  {
    feature: "Low / out alerts",
    status: "Live",
    description:
      "Gentle heads-up when staples run low or need restocking.",
    priority: "High",
    nextStep: "Review Home and Notifications for what needs attention.",
  },
  {
    feature: "Activities calendar",
    status: "Live",
    description:
      "Calendar activities, who’s involved, and what’s coming up for the family.",
    priority: "Medium",
    nextStep: "Open Calendar from Home quick actions.",
  },
  {
    feature: "Pantry item photos",
    status: "Live",
    description:
      "Optional picture links on items so everyone recognizes the right jar or box.",
    priority: "Low",
    nextStep: "Paste a secure image URL on an item when helpful.",
  },
  {
    feature: "Storage location photos",
    status: "Planned",
    description:
      "Optional pictures for shelves or bins so “top shelf” means the same thing for everyone.",
    priority: "Low",
    nextStep: "We’ll add this when the basics feel rock solid.",
  },
  {
    feature: "Notifications",
    status: "Live",
    description:
      "In-app reminders for shopping, kitchen duty, inventory, and household-wide notes.",
    priority: "Medium",
    nextStep: "Dismiss what you’ve handled so the list stays tidy.",
  },
  {
    feature: "Cloud sync",
    status: "Building",
    description:
      "Optional link to a cloud household so multiple devices can experiment with the same snapshot.",
    priority: "Medium",
    nextStep: "Use Data tools when your household is ready to try cloud preview.",
  },
  {
    feature: "Instacart (future integration)",
    status: "Planned",
    description:
      "Prepare your list for handoff to grocery delivery when a secure connection is available.",
    priority: "Low",
    nextStep: "Export-friendly list tools stay local until then.",
  },
  {
    feature: "Home Assistant (future integration)",
    status: "Later",
    description:
      "Ideas for tying reminders or inventory to Home Assistant—only when it stays safe and simple.",
    priority: "Low",
    nextStep: "Settings placeholder only; no bridge required to use FamilySite.",
  },
];

function statusTone(
  status: RoadmapStatus,
): "green" | "blue" | "amber" | "neutral" | "purple" {
  switch (status) {
    case "Live":
      return "green";
    case "Building":
      return "blue";
    case "Planned":
      return "amber";
    case "Later":
      return "purple";
    case "Removed / Not needed":
      return "neutral";
  }
}

function priorityClass(p: RoadmapRow["priority"]): string {
  switch (p) {
    case "High":
      return "font-semibold text-slate-900";
    case "Medium":
      return "text-slate-800";
    default:
      return "text-slate-600";
  }
}

export function FeatureRoadmapPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader eyebrow="FamilySite" title="Feature roadmap" />
        <p className="-mt-2 mb-3 text-sm leading-relaxed text-slate-600">
          What’s available today, what we’re working on, and what’s intentionally out of scope. Wording here
          is for families—not engineering specs.
        </p>
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          <span className="font-medium text-slate-800">Status</span> tells you whether you can use something
          now, soon, or later.{" "}
          <span className="font-medium text-slate-800">Priority</span> is how much it matters for daily
          household rhythm—not a technical score.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "Live",
              "Building",
              "Planned",
              "Later",
              "Removed / Not needed",
            ] as const
          ).map((label) => (
            <Badge key={label} tone={statusTone(label)}>
              {label}
            </Badge>
          ))}
        </div>
      </Card>

      <WorkspaceTableWrap>
        <table className={cn(workspaceTableClassName, "min-w-[56rem] text-sm")}>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="px-3 py-3">Feature</th>
              <th className="px-3 py-3">Status</th>
              <th className="min-w-[14rem] px-3 py-3">Description</th>
              <th className="px-3 py-3">Priority</th>
              <th className="min-w-[12rem] px-3 py-3">Next step</th>
            </tr>
          </thead>
          <tbody>
            {ROADMAP_ROWS.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-slate-100 align-top odd:bg-white even:bg-slate-50/40"
              >
                <td className="px-3 py-3 font-medium text-slate-950">{row.feature}</td>
                <td className="px-3 py-3">
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </td>
                <td className="px-3 py-3 text-slate-700">{row.description}</td>
                <td className={cn("px-3 py-3", priorityClass(row.priority))}>
                  {row.priority}
                </td>
                <td className="px-3 py-3 text-slate-600">{row.nextStep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </WorkspaceTableWrap>

      <p className="text-xs leading-relaxed text-slate-500">
        This page is informational only. Nothing here changes how your saved household data behaves.
      </p>
    </div>
  );
}
