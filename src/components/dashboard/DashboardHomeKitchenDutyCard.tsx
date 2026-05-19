import { ChefHat } from "lucide-react";
import type { FamilyData, FamilyMember, KitchenWeekday } from "../../data/familyData";
import { kitchenChecklistProgressVisible } from "../../lib/kitchenChecklistDisplay";
import { kitchenDutyDashboardSummaryLine } from "../../lib/dashboardHomeKitchenDutySummary";
import { labelKitchenWeekday } from "../../lib/kitchenDuty";
import { getMemberColor } from "../../lib/memberColors";
import {
  SMARTHR_BODY,
  SMARTHR_DASH_ACCENT_RAIL_NEUTRAL,
  SMARTHR_DASH_CHECKLIST_META,
  SMARTHR_DASH_KICKER,
  SMARTHR_DASH_KITCHEN_CARD,
  SMARTHR_DASH_KITCHEN_HEADLINE_DEFAULT,
  SMARTHR_DASH_KITCHEN_HEADLINE_MUTED,
  SMARTHR_DASH_KITCHEN_HEADLINE_SUCCESS,
  SMARTHR_DASH_KITCHEN_ICON_WRAP,
  SMARTHR_DASH_KITCHEN_SUBLINE_STRONG,
  SMARTHR_DASH_LINK_ACCENT,
  SMARTHR_DASH_LINK_MUTED,
} from "../../lib/smarthrUi";

type Props = {
  data: FamilyData;
  today: string;
  todayKitchenDay: KitchenWeekday | null;
  kitchenTodayMember: FamilyMember | undefined;
  kitchenCompletedToday: boolean;
  activeMemberId?: string;
  dashboardViewMemberId?: string | null;
  navigateWithinApp?: (href: string) => void;
  restrictChildNavigation?: boolean;
};

export function DashboardHomeKitchenDutyCard({
  data,
  today,
  todayKitchenDay,
  kitchenTodayMember,
  kitchenCompletedToday,
  activeMemberId,
  dashboardViewMemberId,
  navigateWithinApp,
  restrictChildNavigation,
}: Props) {
  const duty = kitchenDutyDashboardSummaryLine({
    todayKitchenDay,
    kitchenTodayMember,
    kitchenCompletedToday,
    activeMemberId,
    dashboardViewMemberId,
  });

  const weekdayLabel = todayKitchenDay ? labelKitchenWeekday(todayKitchenDay) : "Today";
  const dutyAccent =
    kitchenTodayMember && !kitchenCompletedToday ? getMemberColor(kitchenTodayMember) : undefined;

  const checklistProgress = kitchenChecklistProgressVisible(data.kitchenChecklist, today);
  const showChecklistProgress = checklistProgress.total > 0;

  const headlineClass =
    duty.tone === "muted"
      ? SMARTHR_DASH_KITCHEN_HEADLINE_MUTED
      : duty.tone === "success"
        ? SMARTHR_DASH_KITCHEN_HEADLINE_SUCCESS
        : SMARTHR_DASH_KITCHEN_HEADLINE_DEFAULT;

  return (
    <section className={SMARTHR_DASH_KITCHEN_CARD} aria-label="Kitchen duty today">
      <div className="flex min-w-0 items-stretch gap-2.5 sm:gap-3">
        <div className={SMARTHR_DASH_KITCHEN_ICON_WRAP} aria-hidden>
          <ChefHat className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </div>
        {dutyAccent && kitchenTodayMember && !kitchenCompletedToday ? (
          <span
            className="w-1 shrink-0 self-stretch rounded-full"
            style={{ backgroundColor: dutyAccent }}
            aria-hidden
          />
        ) : (
          <span className={SMARTHR_DASH_ACCENT_RAIL_NEUTRAL} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className={SMARTHR_DASH_KICKER}>
            Kitchen duty
            {weekdayLabel ? <span className={SMARTHR_BODY}> · {weekdayLabel}</span> : null}
          </p>
          <p className={headlineClass}>{duty.text}</p>
          {showChecklistProgress ? (
            <p className={SMARTHR_DASH_CHECKLIST_META}>
              Checklist{" "}
              <span className={SMARTHR_DASH_KITCHEN_SUBLINE_STRONG}>
                {checklistProgress.completed} of {checklistProgress.total} done
              </span>
            </p>
          ) : null}
          {navigateWithinApp ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <button type="button" className={SMARTHR_DASH_LINK_ACCENT} onClick={() => navigateWithinApp("/kitchen")}>
                Open Checklist
              </button>
              {!restrictChildNavigation ? (
                <button
                  type="button"
                  className={SMARTHR_DASH_LINK_MUTED}
                  onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
                >
                  Edit schedule
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
