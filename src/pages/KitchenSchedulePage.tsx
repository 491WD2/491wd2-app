import { ArrowLeft, CalendarDays, ListChecks, Table2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { KitchenHubSection } from "../components/kitchen/KitchenHubSection";
import { Button } from "../components/ui/Button";
import { WorkspacePageShell } from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn } from "../lib/utils";
import type { PageProps } from "./pageTypes";
import "../styles/guided-kiosk.css";

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
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (!showFullSchedule) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--kitchen-schedule">
        <section className="wd-guided-kiosk__hero" aria-labelledby="kitchen-schedule-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Kitchen station</p>
            <h1 id="kitchen-schedule-kiosk-title">What schedule step?</h1>
            <p>Open the schedule in a pop-up or jump to the live kitchen checklist.</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{data.kitchenSchedule.weekdays.length} weekday rows</span>
            <span>{today}</span>
            <span>Kitchen linked</span>
          </div>
        </section>

        <section className="wd-guided-kiosk__actions-grid" aria-label="Kitchen schedule actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => setScheduleOpen(true)}>
            <span className="wd-guided-kiosk__action-icon"><CalendarDays className="h-5 w-5" aria-hidden /></span>
            <span><strong>Review schedule</strong><small>Open schedule pop-up</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => navigateWithinApp?.("/kitchen")}>
            <span className="wd-guided-kiosk__action-icon"><ListChecks className="h-5 w-5" aria-hidden /></span>
            <span><strong>Kitchen checklist</strong><small>Go to today’s duty</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullSchedule(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Advanced schedule</strong><small>Open detailed editor</small></span>
          </button>
        </section>

        {scheduleOpen ? (
          <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setScheduleOpen(false)}>
            <section
              className="wd-guided-kiosk__sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="kitchen-schedule-flow-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="wd-guided-kiosk__sheet-head">
                <div>
                  <p className="wd-guided-kiosk__eyebrow">Kitchen schedule</p>
                  <h2 id="kitchen-schedule-flow-title">Review schedule</h2>
                  <p>Update schedule details, then close this pop-up.</p>
                </div>
                <button
                  type="button"
                  className="wd-guided-kiosk__icon-btn"
                  aria-label="Close kitchen schedule"
                  onClick={() => setScheduleOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </header>
              <div className="rounded-[16px] bg-white p-4 text-slate-950">
                <KitchenHubSection data={data} setData={setData} today={today} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    );
  }

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
            <Button
              type="button"
              variant="secondary"
              className={cn("min-h-10", btnSecondary)}
              onClick={() => setShowFullSchedule(false)}
            >
              Kiosk station
            </Button>
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
