import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { KitchenHubSection } from "../components/kitchen/KitchenHubSection";
import { Button } from "../components/ui/Button";
import { WorkspacePageShell } from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const btnSecondary =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa]";

export function KitchenSchedulePage({
  data,
  setData,
  onOpenDashboard,
  navigateWithinApp,
}: PageProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        tone="light"
        className={cn("flex flex-col gap-5 px-[15px] pb-10 pt-0 sm:px-[30px] md:pb-10", DS_MAIN_COLUMN)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {onOpenDashboard ? (
              <Button
                type="button"
                variant="secondary"
                className={cn("min-h-10", btnSecondary)}
                onClick={() => onOpenDashboard()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Home
              </Button>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Kitchen</p>
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] sm:text-2xl">Kitchen Schedule</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className={cn("min-h-10 text-sm font-semibold", btnSecondary)}
              onClick={() => navigateWithinApp?.("/kitchen")}
            >
              Open kitchen checklist
            </Button>
          </div>
        </div>
        <KitchenHubSection data={data} setData={setData} today={today} />
      </WorkspacePageShell>
    </div>
  );
}
