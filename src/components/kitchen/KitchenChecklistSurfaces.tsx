import { ClipboardList } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import type { FamilyData, FamilyMember } from "../../data/familyData";
import { Button } from "../ui/Button";
import {
  kitchenChecklistProgressVisible,
  toggleKitchenChecklistItemForDate,
  visibleKitchenChecklistItems,
  markAllVisibleKitchenChecklistForDate,
  resetKitchenChecklistCheckedForDate,
} from "../../lib/kitchenChecklistDisplay";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
} from "../../lib/kitchenDuty";
import { getMemberColor } from "../../lib/memberColors";
import { cn, findMemberById, getMemberFullName } from "../../lib/utils";

const CARD = "rounded-[8px] border border-[#ededed] bg-white shadow-[0_6px_15px_rgba(36,37,38,0.06)]";

const ROW =
  "flex min-h-[44px] items-center gap-3 rounded-[8px] border border-[#ededed]/90 bg-[#fafafa] px-3 py-2 text-left";

type BaseProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  today: string;
  navigateWithinApp?: (href: string) => void;
  restrictChildNavigation?: boolean;
};

function useKitchenTodayContext(data: FamilyData, today: string) {
  return useMemo(() => {
    const todayKitchenDay = getTodayKitchenWeekdayLocal();
    const kitchenTodayEntry = todayKitchenDay
      ? data.kitchenSchedule.weekdays.find((w) => w.day === todayKitchenDay)
      : undefined;
    const kitchenTodayMember: FamilyMember | undefined = kitchenTodayEntry
      ? findMemberById(data, kitchenTodayEntry.memberId)
      : undefined;
    const kitchenCompletedToday = isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, today);
    const visible = visibleKitchenChecklistItems(data.kitchenChecklist);
    const progress = kitchenChecklistProgressVisible(data.kitchenChecklist, today);
    const assigneeColor = kitchenTodayMember ? getMemberColor(kitchenTodayMember) : undefined;
    const assigneeFirst =
      kitchenTodayMember?.name.trim().split(/\s+/)[0] || (kitchenTodayMember ? getMemberFullName(kitchenTodayMember) : "");

    return {
      todayKitchenDay,
      kitchenTodayMember,
      kitchenCompletedToday,
      visible,
      progress,
      assigneeColor,
      assigneeFirst,
    };
  }, [data, today]);
}

function friendlyDateLong(today: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${today}T12:00:00`));
}

export function KitchenChecklistDashboardCard({
  data,
  setData,
  today,
  navigateWithinApp,
  restrictChildNavigation,
}: BaseProps) {
  const ctx = useKitchenTodayContext(data, today);
  const previewTasks = ctx.visible.slice(0, 3);
  const dateLine = friendlyDateLong(today);

  function toggleItem(itemId: string) {
    setData((cur) => ({
      ...cur,
      kitchenChecklist: toggleKitchenChecklistItemForDate(cur.kitchenChecklist, itemId, today),
    }));
  }

  return (
    <section
      className={cn(CARD, "mt-4 px-4 py-4 sm:px-5 sm:py-4")}
      aria-labelledby="dash-kitchen-checklist-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="dash-kitchen-checklist-title" className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8e8e8e]">
            Kitchen Checklist
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#575757]">{dateLine}</p>
        </div>
        {navigateWithinApp && !restrictChildNavigation ? (
          <button
            type="button"
            className="shrink-0 text-[13px] font-semibold text-[#F26522] underline-offset-2 hover:underline"
            onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
          >
            Edit schedule
          </button>
        ) : null}
      </div>

      {!ctx.kitchenTodayMember ? (
        <div className="mt-4">
          <p className="text-[15px] font-semibold leading-snug text-[#1f1f1f]">No kitchen duty assigned today.</p>
          {navigateWithinApp && !restrictChildNavigation ? (
            <button
              type="button"
              className="mt-2 text-[13px] font-semibold text-[#F26522] underline-offset-2 hover:underline"
              onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
            >
              Edit schedule
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {ctx.assigneeColor ? (
              <span
                className="inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-full border border-[#ededed] px-2.5 text-[12px] font-bold text-[#1f1f1f]"
                style={{ backgroundColor: `${ctx.assigneeColor}33`, borderColor: `${ctx.assigneeColor}55` }}
                aria-hidden
              >
                {ctx.assigneeFirst.slice(0, 1).toUpperCase()}
              </span>
            ) : null}
            <p className="min-w-0 text-[15px] font-semibold text-[#1f1f1f]">
              <span className="text-[#637381]">Today: </span>
              {ctx.assigneeFirst}
            </p>
            {ctx.kitchenCompletedToday ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                Duty logged
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] text-[#575757]">
            Checklist progress:{" "}
            <span className="font-semibold tabular-nums text-[#F26522]">
              {ctx.progress.completed} of {ctx.progress.total} done
            </span>
          </p>

          {ctx.visible.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-[#637381]">
              No checklist tasks yet. Open the full checklist to add steps, or restore defaults from Settings.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {previewTasks.map((item) => {
                const checked = item.checkedDate === today;
                return (
                  <li key={item.id} className={ROW}>
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 rounded border-[#ededed] accent-[#F26522]"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      aria-label={item.label}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[14px] font-medium leading-snug",
                        checked ? "text-[#637381] line-through" : "text-[#1f1f1f]",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              className="min-h-10 rounded-[8px] bg-gradient-to-r from-[#FF6F28] to-[#FF5325] px-4 text-[14px] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]"
              onClick={() => navigateWithinApp?.("/kitchen")}
              disabled={!navigateWithinApp}
            >
              <ClipboardList className="mr-2 h-4 w-4" aria-hidden />
              Open Checklist
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

export function KitchenChecklistCleaningSection({
  data,
  setData,
  today,
  navigateWithinApp,
  restrictChildNavigation,
}: BaseProps) {
  const ctx = useKitchenTodayContext(data, today);
  const dateLine = friendlyDateLong(today);

  function toggleItem(itemId: string) {
    setData((cur) => ({
      ...cur,
      kitchenChecklist: toggleKitchenChecklistItemForDate(cur.kitchenChecklist, itemId, today),
    }));
  }

  function markAllDone() {
    setData((cur) => ({
      ...cur,
      kitchenChecklist: markAllVisibleKitchenChecklistForDate(cur.kitchenChecklist, today),
    }));
  }

  function resetToday() {
    setData((cur) => ({
      ...cur,
      kitchenChecklist: resetKitchenChecklistCheckedForDate(cur.kitchenChecklist, today),
    }));
  }

  return (
    <section className={cn(CARD, "p-4 sm:p-5")} aria-labelledby="cleaning-kitchen-checklist-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">Kitchen</p>
          <h2 id="cleaning-kitchen-checklist-title" className="mt-1 text-lg font-semibold tracking-tight text-[#1f1f1f] sm:text-xl">
            Kitchen Checklist
          </h2>
          <p className="mt-1 text-sm text-[#575757]">{dateLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {navigateWithinApp && !restrictChildNavigation ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 rounded-[8px] border-[#ededed] text-xs font-semibold sm:text-sm"
              onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
            >
              Edit schedule
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="min-h-10 rounded-[8px] border-[#ededed] text-xs font-semibold sm:text-sm"
            onClick={() => navigateWithinApp?.("/kitchen")}
            disabled={!navigateWithinApp}
          >
            Open Checklist
          </Button>
        </div>
      </div>

      {!ctx.kitchenTodayMember ? (
        <div className="mt-4 rounded-[8px] border border-dashed border-[#ededed] bg-[#fafafa] px-4 py-4">
          <p className="text-[15px] font-semibold text-[#1f1f1f]">No kitchen duty assigned today.</p>
          {navigateWithinApp && !restrictChildNavigation ? (
            <button
              type="button"
              className="mt-2 text-[13px] font-semibold text-[#F26522] underline-offset-2 hover:underline"
              onClick={() => navigateWithinApp("/settings#kitchen_schedule")}
            >
              Edit schedule
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {ctx.assigneeColor ? (
              <span
                className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border px-2 text-[13px] font-bold text-[#1f1f1f]"
                style={{ backgroundColor: `${ctx.assigneeColor}2e`, borderColor: `${ctx.assigneeColor}66` }}
              >
                {ctx.assigneeFirst.slice(0, 1).toUpperCase()}
              </span>
            ) : null}
            <p className="text-[16px] font-semibold text-[#1f1f1f]">
              Kitchen duty: <span className="text-[#F26522]">{ctx.assigneeFirst}</span>
            </p>
            {ctx.kitchenCompletedToday ? (
              <span className="text-[13px] font-medium text-emerald-700">Kitchen duty marked complete for today.</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[#575757]">
            Progress{" "}
            <span className="font-semibold tabular-nums text-[#F26522]">
              {ctx.progress.completed} of {ctx.progress.total} done
            </span>
          </p>

          {ctx.visible.length === 0 ? (
            <p className="mt-3 text-sm text-[#637381]">No checklist tasks in your list yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {ctx.visible.map((item) => {
                const checked = item.checkedDate === today;
                return (
                  <li key={item.id} className={ROW}>
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 rounded border-[#ededed] accent-[#F26522]"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      aria-label={item.label}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[14px] font-medium leading-snug",
                        checked ? "text-[#637381] line-through" : "text-[#1f1f1f]",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {ctx.visible.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="min-h-10 text-sm font-semibold" onClick={markAllDone}>
                Mark all done
              </Button>
              <Button type="button" variant="ghost" className="min-h-10 text-sm font-semibold text-[#637381]" onClick={resetToday}>
                Reset today
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
