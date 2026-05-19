import type { DragEvent } from "react";
import type { PlannerBoardItem } from "../../types/calendarPlanner";
import { KioskCard } from "../cards/Card";
import "../cards/kiosk.css";
import { CALENDAR_PLANNER_SURFACE } from "../../lib/calendarPlannerAnalytics";
import { cn } from "../../lib/utils";

export type CalendarEventCardProps = {
  item: PlannerBoardItem;
  selected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onSelect?: (item: PlannerBoardItem) => void;
  onComplete?: (item: PlannerBoardItem) => void;
  onDragStart?: (e: DragEvent, item: PlannerBoardItem) => void;
};

function kioskCategory(item: PlannerBoardItem) {
  switch (item.kind) {
    case "chore":
      return "chores" as const;
    case "food":
    case "inventory":
      return "pantry" as const;
    default:
      return "events" as const;
  }
}

export function CalendarEventCard({
  item,
  selected,
  draggable: draggableProp,
  isDragging,
  onSelect,
  onComplete,
  onDragStart,
}: CalendarEventCardProps) {
  const done = false;
  const draggable = draggableProp ?? item.draggable;

  return (
    <div className={cn(selected && "ring-2 ring-indigo-400/50 rounded-[24px]")}>
      <KioskCard
        category={kioskCategory(item)}
        tone={item.overdue ? "warning" : undefined}
        title={item.title}
        subtitle={item.subtitle}
        emoji={item.emoji}
        analyticsSurface={CALENDAR_PLANNER_SURFACE}
        draggable={draggable}
        isDragging={isDragging}
        onDragStart={onDragStart ? (e) => onDragStart(e, item) : undefined}
        onClick={() => onSelect?.(item)}
        badges={[
          <span key="k" className="fh-kiosk-card__badge">
            {item.kind}
          </span>,
        ]}
        actions={
          onComplete
            ? [
                {
                  id: "done",
                  label: "Done",
                  variant: "primary",
                  onClick: () => onComplete(item),
                },
              ]
            : item.kind === "event"
              ? [
                  {
                    id: "edit",
                    label: "Edit",
                    variant: "secondary",
                    onClick: () => onSelect?.(item),
                  },
                ]
              : undefined
        }
        actionsReveal="always"
        checked={done}
      />
    </div>
  );
}
