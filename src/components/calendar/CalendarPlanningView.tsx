import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, PlannerEvent } from "../../data/familyData";
import type { PlannerBoardItem, PlannerTypeFilter } from "../../types/calendarPlanner";
import {
  buildPlannerBoardItems,
  filterPlannerItems,
  groupItemsByDate,
  movePlannerItemDate,
  PLANNER_TYPE_FILTERS,
  sectionItems,
  startOfWeekMondayIso,
} from "../../lib/calendarPlannerData";
import {
  loadCompletedReminderIds,
  markReminderCompleted,
} from "../../lib/calendarReminderStorage";
import {
  trackCalendarFoodReminderClick,
  trackCalendarReminderComplete,
} from "../../lib/calendarPlannerAnalytics";
import { createActivity } from "../../lib/activity";
import { getNextDueDate } from "../../lib/utils";
import { dismissNotificationPatch } from "../../lib/calendarPlannerData";
import { MemberScheduleStrip } from "./MemberScheduleStrip";
import { WeeklyPlannerBoard } from "./WeeklyPlannerBoard";
import { ReminderPanel } from "./ReminderPanel";
import { CalendarEventCard } from "./CalendarEventCard";
import "./calendar-planner.css";
import { cn } from "../../lib/utils";

export type CalendarPlanningViewProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  todayIso: string;
  weekStartIso: string;
  onEditEvent: (event: PlannerEvent) => void;
  onAddEvent: () => void;
};

export function CalendarPlanningView({
  data,
  setData,
  todayIso,
  weekStartIso: weekStartProp,
  onEditEvent,
  onAddEvent,
}: CalendarPlanningViewProps) {
  const weekStartIso = weekStartProp || startOfWeekMondayIso(todayIso);
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<PlannerTypeFilter>("all");
  const [completedIds, setCompletedIds] = useState(() => loadCompletedReminderIds());

  const allItems = useMemo(
    () => buildPlannerBoardItems(data, todayIso, weekStartIso, completedIds),
    [data, todayIso, weekStartIso, completedIds],
  );

  const filtered = useMemo(
    () => filterPlannerItems(allItems, memberFilter, typeFilter),
    [allItems, memberFilter, typeFilter],
  );

  const itemsByDate = useMemo(() => groupItemsByDate(filtered), [filtered]);
  const sections = useMemo(
    () => sectionItems(filtered, todayIso, weekStartIso),
    [filtered, todayIso, weekStartIso],
  );

  function handleSelect(item: PlannerBoardItem) {
    if (item.kind === "food" || item.kind === "inventory") {
      trackCalendarFoodReminderClick(item.id, item.kind);
    }
    if (item.plannerEvent) {
      onEditEvent(item.plannerEvent);
    }
  }

  function handleComplete(item: PlannerBoardItem) {
    trackCalendarReminderComplete(item.id, item.kind);
    const nextDone = markReminderCompleted(item.id);
    setCompletedIds(nextDone);

    if (item.kind === "chore" && item.task) {
      const completedDate = todayIso;
      setData((current) =>
        createActivity(
          {
            ...current,
            tasks: current.tasks.map((t) =>
              t.id === item.sourceId
                ? {
                    ...t,
                    status: t.type === "chore" ? "Not Started" : "Done",
                    lastCompletedDate: completedDate,
                    nextDueDate:
                      t.type === "chore"
                        ? getNextDueDate(completedDate, t.frequency)
                        : t.nextDueDate,
                    updatedAt: new Date().toISOString(),
                  }
                : t,
            ),
          },
          {
            type: "completed",
            entityType: item.task!.type === "chore" ? "chore" : "task",
            entityId: item.sourceId,
            entityTitle: item.title,
            message: `Completed from calendar: ${item.title}.`,
          },
        ),
      );
      return;
    }

    if (item.notificationId) {
      setData((current) => ({
        ...current,
        notifications: dismissNotificationPatch(current.notifications, item.notificationId!),
      }));
    }
  }

  function handleDrop(item: PlannerBoardItem, targetDateIso: string) {
    setData((current) => {
      const next = movePlannerItemDate(current, item, targetDateIso);
      return createActivity(next, {
        type: "updated",
        entityType: item.kind === "chore" ? "chore" : "planner",
        entityId: item.sourceId,
        entityTitle: item.title,
        message: `Moved to ${targetDateIso} on planning board.`,
      });
    });
  }

  return (
    <div className="fh-cal-planner">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="fh-cal-planner__filters" role="group" aria-label="Filter by type">
          {PLANNER_TYPE_FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={cn(
                "fh-cal-planner__filter-chip",
                typeFilter === chip.id && "fh-cal-planner__filter-chip--active",
              )}
              onClick={() => setTypeFilter(chip.id)}
            >
              <span aria-hidden>{chip.emoji}</span>
              {chip.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="fh-cal-planner__filter-chip fh-cal-planner__filter-chip--active"
          onClick={onAddEvent}
        >
          + Add event
        </button>
      </div>

      <MemberScheduleStrip
        members={data.familyMembers}
        items={filtered}
        memberFilter={memberFilter}
        onMemberFilter={setMemberFilter}
      />

      <section className="fh-cal-planner__panel" aria-label="Today">
        <div className="fh-cal-planner__panel-head">
          <h2 className="fh-cal-planner__panel-title">☀️ Today</h2>
        </div>
        <div className="fh-cal-planner__panel-body">
          {sections.today.length === 0 ? (
            <p className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
              Nothing scheduled for today.
            </p>
          ) : (
            sections.today.map((item) => (
              <CalendarEventCard
                key={item.id}
                item={item}
                onSelect={handleSelect}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>
      </section>

      <WeeklyPlannerBoard
        weekStartIso={weekStartIso}
        todayIso={todayIso}
        itemsByDate={itemsByDate}
        onItemSelect={handleSelect}
        onItemComplete={handleComplete}
        onItemDrop={handleDrop}
      />

      <div className="fh-cal-planner__section-grid">
        <ReminderPanel
          title="Chores due"
          emoji="🧹"
          items={sections.choresDue}
          emptyText="No open chores this week."
          onSelect={handleSelect}
          onComplete={handleComplete}
        />
        <ReminderPanel
          title="Food expiring soon"
          emoji="⏳"
          items={sections.foodExpiring}
          emptyText="No expiring items."
          onSelect={handleSelect}
          onComplete={handleComplete}
        />
        <ReminderPanel
          title="Low stock reminders"
          emoji="📦"
          items={sections.lowStock}
          emptyText="Pantry levels look good."
          onSelect={handleSelect}
          onComplete={handleComplete}
        />
        <ReminderPanel
          title="Family events"
          emoji="📅"
          items={sections.familyEvents}
          emptyText="No events this week."
          onSelect={handleSelect}
          onComplete={handleComplete}
        />
        <ReminderPanel
          title="Household reminders"
          emoji="🔔"
          items={sections.householdReminders}
          emptyText="No active reminders."
          onSelect={handleSelect}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
