import type { PlannerBoardItem } from "../../types/calendarPlanner";
import { CalendarEventCard } from "./CalendarEventCard";

export type ReminderPanelProps = {
  title: string;
  emoji: string;
  items: PlannerBoardItem[];
  emptyText: string;
  onSelect: (item: PlannerBoardItem) => void;
  onComplete: (item: PlannerBoardItem) => void;
};

export function ReminderPanel({
  title,
  emoji,
  items,
  emptyText,
  onSelect,
  onComplete,
}: ReminderPanelProps) {
  return (
    <section className="fh-cal-planner__panel" aria-label={title}>
      <div className="fh-cal-planner__panel-head">
        <h2 className="fh-cal-planner__panel-title">
          {emoji} {title}
        </h2>
      </div>
      <div className="fh-cal-planner__panel-body">
        {items.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
            {emptyText}
          </p>
        ) : (
          items.map((item) => (
            <CalendarEventCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              onComplete={
                item.kind === "food" ||
                item.kind === "inventory" ||
                item.kind === "reminder" ||
                item.kind === "chore"
                  ? onComplete
                  : undefined
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
