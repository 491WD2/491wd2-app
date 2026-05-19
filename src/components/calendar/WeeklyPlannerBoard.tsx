import { useState, type DragEvent } from "react";
import type { PlannerBoardItem } from "../../types/calendarPlanner";
import { addDaysIso } from "../../lib/calendarPlannerData";
import { trackCalendarPlannerDragDrop } from "../../lib/calendarPlannerAnalytics";
import { cn, formatShortDate } from "../../lib/utils";
import { CalendarEventCard } from "./CalendarEventCard";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type WeeklyPlannerBoardProps = {
  weekStartIso: string;
  todayIso: string;
  itemsByDate: Map<string, PlannerBoardItem[]>;
  onItemSelect: (item: PlannerBoardItem) => void;
  onItemComplete: (item: PlannerBoardItem) => void;
  onItemDrop: (item: PlannerBoardItem, targetDateIso: string) => void;
};

export function WeeklyPlannerBoard({
  weekStartIso,
  todayIso,
  itemsByDate,
  onItemSelect,
  onItemComplete,
  onItemDrop,
}: WeeklyPlannerBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));

  function handleDragStart(e: DragEvent, item: PlannerBoardItem) {
    if (!item.draggable) {
      return;
    }
    setDragId(item.id);
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, kind: item.kind }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: DragEvent, targetDateIso: string) {
    e.preventDefault();
    setDropDate(null);
    setDragId(null);
    try {
      const raw = e.dataTransfer.getData("text/plain");
      const payload = JSON.parse(raw) as { id: string };
      const item = [...itemsByDate.values()]
        .flat()
        .find((i) => i.id === payload.id);
      if (!item || !item.draggable || item.dateIso === targetDateIso) {
        return;
      }
      trackCalendarPlannerDragDrop(item.id, item.kind, targetDateIso);
      onItemDrop(item, targetDateIso);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="fh-cal-planner__panel" aria-label="This week">
      <div className="fh-cal-planner__panel-head">
        <h2 className="fh-cal-planner__panel-title">
          📆 This week · {formatShortDate(weekStartIso)} – {formatShortDate(addDaysIso(weekStartIso, 6))}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Drag chores and events between days
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <div className="fh-cal-planner__week">
          {days.map((iso, index) => {
            const dayItems = itemsByDate.get(iso) ?? [];
            const isToday = iso === todayIso;
            const d = new Date(`${iso}T12:00:00`);
            return (
              <div
                key={iso}
                className={cn("fh-cal-planner__day", isToday && "fh-cal-planner__day--today")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropDate(iso);
                }}
                onDragLeave={() => setDropDate(null)}
                onDrop={(e) => handleDrop(e, iso)}
              >
                <div className="fh-cal-planner__day-head">
                  <p className="fh-cal-planner__day-name">{WEEKDAY_LABELS[index]}</p>
                  <p className="fh-cal-planner__day-date">{d.getDate()}</p>
                </div>
                <div
                  className={cn(
                    "fh-cal-planner__day-body",
                    dropDate === iso && "fh-cal-planner__day-body--drag-over",
                  )}
                >
                  {dayItems.length === 0 ? (
                    <p className="py-6 text-center text-xs font-semibold text-slate-400">—</p>
                  ) : (
                    dayItems.map((item) => (
                      <CalendarEventCard
                        key={item.id}
                        item={item}
                        draggable={item.draggable}
                        isDragging={dragId === item.id}
                        onDragStart={handleDragStart}
                        onSelect={onItemSelect}
                        onComplete={onItemComplete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
