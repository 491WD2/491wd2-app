import { ArrowLeft, CreditCard, Settings, Table2, X } from "lucide-react";
import { useState } from "react";
import { SubscriptionSettingsSection } from "../components/settings/SubscriptionSettingsSection";
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

export function SubscriptionsPage({
  data,
  onOpenDashboard,
  navigateWithinApp,
}: Pick<PageProps, "data" | "onOpenDashboard" | "navigateWithinApp">) {
  const [showFullSubscriptions, setShowFullSubscriptions] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!showFullSubscriptions) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--subscriptions">
        <section className="wd-guided-kiosk__hero" aria-labelledby="subscriptions-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Billing station</p>
            <h1 id="subscriptions-kiosk-title">What billing step?</h1>
            <p>Review subscriptions in a focused pop-up or open the advanced billing workspace.</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{data.familyMembers.length} members</span>
            <span>Local billing</span>
            <span>Settings linked</span>
          </div>
        </section>

        <section className="wd-guided-kiosk__actions-grid" aria-label="Subscription actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => setReviewOpen(true)}>
            <span className="wd-guided-kiosk__action-icon"><CreditCard className="h-5 w-5" aria-hidden /></span>
            <span><strong>Review subscriptions</strong><small>Open billing pop-up</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => navigateWithinApp?.("/settings#subscription")}>
            <span className="wd-guided-kiosk__action-icon"><Settings className="h-5 w-5" aria-hidden /></span>
            <span><strong>Subscription settings</strong><small>Jump to settings</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullSubscriptions(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Advanced billing</strong><small>Show complete billing surface</small></span>
          </button>
        </section>

        {reviewOpen ? (
          <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setReviewOpen(false)}>
            <section
              className="wd-guided-kiosk__sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="subscriptions-flow-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="wd-guided-kiosk__sheet-head">
                <div>
                  <p className="wd-guided-kiosk__eyebrow">Billing station</p>
                  <h2 id="subscriptions-flow-title">Review subscriptions</h2>
                  <p>Review billing details in one focused surface, then close this pop-up.</p>
                </div>
                <button
                  type="button"
                  className="wd-guided-kiosk__icon-btn"
                  aria-label="Close subscriptions review"
                  onClick={() => setReviewOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </header>
              <div className="rounded-[18px] border border-white/15 bg-white p-4 text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                <SubscriptionSettingsSection familyMembers={data.familyMembers} />
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
              onClick={() => setShowFullSubscriptions(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Kiosk station
            </Button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Billing</p>
              <h1 className="text-xl font-bold tracking-tight text-[#1f1f1f] sm:text-2xl">Subscriptions</h1>
            </div>
          </div>
          {navigateWithinApp ? (
            <Button
              type="button"
              variant="secondary"
              className={cn("min-h-10 text-sm font-semibold", btnSecondary)}
              onClick={() => navigateWithinApp("/settings#subscription")}
            >
              Open in Settings
            </Button>
          ) : null}
        </div>
        <SubscriptionSettingsSection familyMembers={data.familyMembers} />
      </WorkspacePageShell>
    </div>
  );
}
