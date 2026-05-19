import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Camera,
  LayoutGrid,
  RefreshCw,
  Snowflake,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { workflowCardTone, workflowStrip } from "../../lib/workflowUi";

const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:ring-2 focus-visible:ring-[#FE9F43]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";

export type InventoryWorkflowHubTab =
  | "inventory"
  | "low-stock"
  | "expiring"
  | "food_plan"
  | "rotation"
  | "scan"
  | "inactive";

export function InventoryWorkflowHub({
  onSelectTab,
}: {
  onSelectTab: (tab: InventoryWorkflowHubTab) => void;
}) {
  const cards: {
    tab: InventoryWorkflowHubTab;
    title: string;
    detail: string;
    tone: keyof typeof workflowCardTone;
    icon: ReactNode;
  }[] = [
    {
      tab: "inventory",
      title: "Inventory",
      detail: "Everything currently stocked.",
      tone: "onHand",
      icon: <LayoutGrid className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "low-stock",
      title: "Low & out",
      detail: "Needs shopping attention.",
      tone: "needBuy",
      icon: <AlertTriangle className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "expiring",
      title: "Use soon",
      detail: "Dates, extra stock, or marked use-up.",
      tone: "lowAuto",
      icon: <BookOpen className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "rotation",
      title: "Rotation",
      detail: "FIFO and shelf guidance.",
      tone: "library",
      icon: <RefreshCw className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "food_plan",
      title: "Storage plan",
      detail: "Long- and short-term targets.",
      tone: "onHand",
      icon: <Snowflake className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "scan",
      title: "Add item",
      detail: "Scan a barcode and add to inventory.",
      tone: "lowAuto",
      icon: <Camera className="h-6 w-6" aria-hidden />,
    },
    {
      tab: "inactive",
      title: "Archive",
      detail: "Hidden from everyday views.",
      tone: "archived",
      icon: <Archive className="h-6 w-6" aria-hidden />,
    },
  ];

  return (
    <section
      className={cn(
        workflowStrip.wrap,
        "rounded-[8px] border border-[#ededed] bg-white p-4 text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-5",
      )}
    >
      <div>
        <p className={cn(workflowStrip.title, "text-[#637381]")}>Quick links</p>
        <p className={cn(workflowStrip.subtitle, "text-[#575757]")}>
          Jump to inventory, shopping needs, scanning, or archived items — everything stays on this device.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.tab}
            type="button"
            onClick={() => onSelectTab(c.tab)}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-start gap-2 rounded-[8px] border p-4 text-left shadow-[0_1px_1px_rgba(0,0,0,0.06)] ring-0 transition hover:brightness-[1.02] active:scale-[0.99]",
              workflowCardTone[c.tone],
            )}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <span className="text-slate-700">{c.icon}</span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                Open
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-950">{c.title}</h3>
              <p className="mt-1 text-sm leading-snug text-slate-600">{c.detail}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          className={cn(btnPrimaryOrange, "min-h-12 flex-1 gap-2 sm:max-w-xs")}
          onClick={() => onSelectTab("scan")}
        >
          <Camera className="h-5 w-5" />
          Open add item
        </Button>
        <Button
          type="button"
          variant="secondary"
          className={cn(btnSecondaryLight, "min-h-12 flex-1 sm:max-w-xs")}
          onClick={() => onSelectTab("inventory")}
        >
          Open inventory
        </Button>
      </div>
    </section>
  );
}
