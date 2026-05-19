import {
  CalendarDays,
  Camera,
  ClipboardList,
  Download,
  MessageSquare,
  Plus,
  Refrigerator,
  ShoppingCart,
  X,
} from "lucide-react";
import { useEffect, type JSX } from "react";
import type { AdminSettings } from "../../data/familyData";
import { buildQuickActionHref } from "../../services/quickActions";
import { cn } from "../../lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  navigateHref: (href: string) => void;
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>;
  restrictChildNavigation?: boolean;
};

const ringFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const iconWrap =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#fff8f4] text-[#F26522] shadow-[0_1px_2px_rgba(36,37,38,0.06)]";

function moduleOn(
  moduleVisibility: Partial<AdminSettings["moduleVisibility"]> | undefined,
  key: keyof AdminSettings["moduleVisibility"],
) {
  return moduleVisibility?.[key] !== false;
}

/** Reachable quick actions — SmartHR light sheet / modal (no dark chrome). */
export function QuickActionsPanel({
  open,
  onClose,
  navigateHref,
  moduleVisibility,
  restrictChildNavigation,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  type ActionRow = { label: string; hint: string; icon: JSX.Element; onClick: () => void };
  const actions: ActionRow[] = [];
  if (moduleOn(moduleVisibility, "tasks")) {
    actions.push({
      label: "Add chore",
      hint: "Chore tracker — assign and due dates",
      icon: <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref(buildQuickActionHref({ type: "chore", title: "" })),
    });
  }
  if (moduleOn(moduleVisibility, "shopping")) {
    actions.push({
      label: "Add shopping item",
      hint: "Household shopping list",
      icon: <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref(buildQuickActionHref({ type: "grocery", name: "" })),
    });
  }
  if (!restrictChildNavigation) {
    actions.push({
      label: "Add message",
      hint: "Household message board",
      icon: <MessageSquare className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref(buildQuickActionHref({ type: "message", title: "" })),
    });
  }
  if (moduleOn(moduleVisibility, "calendar")) {
    actions.push({
      label: "Add calendar event",
      hint: "Planner activities",
      icon: <CalendarDays className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref(buildQuickActionHref({ type: "event", title: "" })),
    });
  }
  if (moduleOn(moduleVisibility, "pantry")) {
    actions.push({
      label: "Add pantry item",
      hint: "New inventory row",
      icon: <Refrigerator className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref(buildQuickActionHref({ type: "pantry", name: "" })),
    });
    actions.push({
      label: "Scan item",
      hint: "Barcode or camera in pantry",
      icon: <Camera className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref("/pantry?tab=add-item"),
    });
  }
  actions.push({
    label: "Quick add hub",
    hint: "All shortcuts on one page",
    icon: <Plus className="h-5 w-5 shrink-0" aria-hidden />,
    onClick: () => navigateHref("/quick-add"),
  });
  if (!restrictChildNavigation) {
    actions.push({
      label: "Backup & data",
      hint: "Export, import, and protect your household file",
      icon: <Download className="h-5 w-5 shrink-0" aria-hidden />,
      onClick: () => navigateHref("/settings#backup_data"),
    });
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close quick actions"
        title="Close quick actions"
        className={cn(
          "fixed inset-0 z-[70] bg-[#f7f7f7]/80 backdrop-blur-[3px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/40 focus-visible:ring-inset",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed z-[71] flex min-h-0 w-[min(100vw-1.5rem,26rem)] max-w-[100vw] flex-col overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white text-[#1f1f1f] shadow-[0_8px_30px_rgba(36,37,38,0.1)]",
          "max-h-[min(88dvh,560px)]",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2",
          "sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-actions-title"
        aria-describedby="quick-actions-desc"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p id="quick-actions-title" className="text-[17px] font-semibold leading-snug text-[#1f1f1f]">
              Quick Add
            </p>
            <p id="quick-actions-desc" className="mt-0.5 text-[13px] leading-snug text-[#637381]">
              Add for the household from anywhere.
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#f7f7f7] text-[#1f1f1f] shadow-[0_1px_2px_rgba(36,37,38,0.06)] hover:bg-[#E5E7EB]/80",
              ringFocus,
            )}
            onClick={onClose}
            aria-label="Close quick actions"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-[#E5E7EB] overflow-y-auto overscroll-contain px-2 py-1 sm:px-3">
          {actions.map((a) => (
            <li key={a.label}>
              <button
                type="button"
                className={cn(
                  "flex w-full min-h-[52px] items-center gap-3 rounded-[8px] px-2 py-2.5 text-left transition sm:min-h-[56px] sm:px-3 sm:py-3",
                  "hover:bg-[#f7f7f7] active:bg-[#E5E7EB]/60",
                  ringFocus,
                )}
                onClick={() => {
                  a.onClick();
                  onClose();
                }}
              >
                <span className={iconWrap}>{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-snug text-[#1f1f1f]">{a.label}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[#637381]">{a.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-[#E5E7EB] bg-[#fafafa] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <button
            type="button"
            className={cn(
              "motion-button min-h-12 w-full rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#637381] shadow-[0_1px_2px_rgba(36,37,38,0.05)] transition hover:bg-[#f7f7f7] hover:text-[#1f1f1f]",
              ringFocus,
            )}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

type FabProps = {
  onClick: () => void;
  hidden?: boolean;
};

/** Floating entry point — phones only (desktop/tablet use top-bar Quick Add where applicable). */
export function QuickActionsFab({ onClick, hidden }: FabProps) {
  if (hidden) {
    return null;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-button fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-[65] flex min-h-[3.25rem] min-w-[3.25rem] items-center justify-center rounded-full border border-[#FF6F28]/30 bg-gradient-to-r from-[#FF6F28] to-[#FF5325] px-5 text-base font-bold text-white shadow-[0_8px_24px_rgba(242,101,34,0.35)] md:hidden",
        ringFocus,
      )}
      aria-label="Open quick add"
    >
      <Plus className="mr-2 h-6 w-6" aria-hidden />
      Quick Add
    </button>
  );
}
