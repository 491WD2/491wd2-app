import { ChevronRight, Sparkles } from "lucide-react";
import type { FamilyData } from "../../data/familyData";
import {
  choreHomeRowTier,
  compareChoresForDashboardMemberView,
  taskIsActiveCleaning,
} from "../../lib/dashboardCommandCenterFilters";
import { getMemberColorById } from "../../lib/memberColors";
import {
  SMARTHR_HUB_ASSIGNMENT_META,
  SMARTHR_HUB_ASSIGNMENT_META_SOFT,
  SMARTHR_HUB_LINK_ACCENT,
  SMARTHR_HUB_SURFACE_MUTED,
  SMARTHR_HUB_SURFACE_PRIMARY,
  SMARTHR_HUB_SURFACE_SHARED,
  SMARTHR_HUB_TITLE_MUTED,
  SMARTHR_HUB_TITLE_SHARED,
  SMARTHR_TITLE,
  SMARTHR_UI_COLORS,
} from "../../lib/smarthrUi";
import { cn, findMemberById, getMemberFullName } from "../../lib/utils";
import { hubCardClass, hubCardTitleClass, hubDashWidgetIconClass, hubMutedClass } from "./hub/dashboardHubTokens";

type Props = {
  data: FamilyData;
  /** `null` = family view — show all assignees’ open cleaning work. */
  dashboardViewMemberId: string | null;
  navigateWithinApp?: (href: string) => void;
};

/**
 * Cleaning / chores at a glance — links to full Cleaning module.
 */
export function DashboardHomeCleaningCard({ data, dashboardViewMemberId, navigateWithinApp }: Props) {
  const pool = data.tasks.filter((t) => taskIsActiveCleaning(t));
  const open = [...pool]
    .sort((a, b) =>
      compareChoresForDashboardMemberView(a, b, dashboardViewMemberId, (x, y) =>
        x.nextDueDate.localeCompare(y.nextDueDate) || x.title.localeCompare(y.title),
      ),
    )
    .slice(0, 8);

  return (
    <section className={hubCardClass} aria-labelledby="home-cleaning-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={hubDashWidgetIconClass} aria-hidden>
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <h2 id="home-cleaning-title" className={hubCardTitleClass}>
            Cleaning
          </h2>
        </div>
        <button
          type="button"
          className={cn(SMARTHR_HUB_LINK_ACCENT, "inline-flex items-center gap-1")}
          onClick={() => navigateWithinApp?.("/tasks")}
        >
          Open Cleaning
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {open.length === 0 ? (
        <p className={cn(hubMutedClass, "text-[14px] leading-relaxed")}>
          No open household chores right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {open.map((t) => {
            const assignee = findMemberById(data, t.assignedMemberId);
            const assigneeLabel = assignee ? getMemberFullName(assignee) : "Family";
            const tier = choreHomeRowTier(t, dashboardViewMemberId);
            const accent = t.assignedMemberId
              ? getMemberColorById(t.assignedMemberId, data.familyMembers)
              : SMARTHR_UI_COLORS.textGroupLabel;
            const surface =
              tier === "primary"
                ? SMARTHR_HUB_SURFACE_PRIMARY
                : tier === "shared"
                  ? SMARTHR_HUB_SURFACE_SHARED
                  : SMARTHR_HUB_SURFACE_MUTED;
            const titleCls =
              tier === "primary" ? SMARTHR_TITLE : tier === "shared" ? SMARTHR_HUB_TITLE_SHARED : SMARTHR_HUB_TITLE_MUTED;
            const metaCls =
              tier === "primary"
                ? SMARTHR_HUB_ASSIGNMENT_META
                : tier === "shared"
                  ? SMARTHR_HUB_ASSIGNMENT_META_SOFT
                  : SMARTHR_HUB_TITLE_MUTED;
            return (
              <li
                key={t.id}
                className={cn(
                  "flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between",
                  surface,
                )}
                style={{ borderLeftWidth: 4, borderLeftColor: accent }}
              >
                <p className={cn("text-[15px] font-semibold leading-snug", titleCls)}>{t.title}</p>
                <p className={cn(hubMutedClass, "text-[12px] sm:text-right")}>
                  Due {t.nextDueDate}
                  <span className={cn("block text-[11px] font-medium", metaCls)}>{assigneeLabel}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
