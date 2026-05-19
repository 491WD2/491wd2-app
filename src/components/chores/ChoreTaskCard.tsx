import { memo, useCallback, type CSSProperties, type KeyboardEvent } from "react";
import type { ChoreCompleteVia } from "../../types/kioskAnalytics";
import type { ChoreTask } from "../../types/cleaning";
import { useChoreSwipe } from "../../hooks/useChoreSwipe";
import { trackKioskEvent } from "../../lib/kioskAnalytics";
import { CHORE_MEMBER_COLORS } from "../../lib/choreTheme";
import { choreClasses, choreCn, choreCtaClass, choreTw } from "../../lib/choreUi";
import { ChoreStatusBadge } from "./ChoreStatusBadge";

export type ChoreTaskCardProps = {
  task: ChoreTask;
  surface?: string;
  draggable?: boolean;
  onDragStart?: (task: ChoreTask) => void;
  onEdit?: (task: ChoreTask) => void;
  onMarkDone?: (task: ChoreTask, via?: ChoreCompleteVia) => void;
  compact?: boolean;
  enableSwipeDone?: boolean;
  isCompleting?: boolean;
  isDragging?: boolean;
  assignFlash?: boolean;
  aiHighlight?: boolean;
};

function ChoreTaskCardInner({
  task,
  surface = "chores:task-card",
  draggable = false,
  onDragStart,
  onEdit,
  onMarkDone,
  compact = false,
  enableSwipeDone = false,
  isCompleting = false,
  isDragging = false,
  assignFlash = false,
  aiHighlight = false,
}: ChoreTaskCardProps) {
  const memberColor = task.assignedTo ? CHORE_MEMBER_COLORS[task.assignedTo] : undefined;
  const done = task.status === "Done" || isCompleting;

  const swipe = useChoreSwipe({
    surface,
    onSwipeLeft:
      enableSwipeDone && onMarkDone && task.status !== "Done" && !isCompleting
        ? () => onMarkDone(task)
        : undefined,
  });

  const swipeStyle: CSSProperties | undefined =
    swipe.offsetX !== 0
      ? { transform: `translateX(${swipe.offsetX}px)` }
      : undefined;

  const swipeOnlyKeyboard =
    enableSwipeDone && onMarkDone && task.status !== "Done" && !isCompleting;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (
        swipeOnlyKeyboard &&
        !onEdit &&
        e.key === "Enter" &&
        onMarkDone &&
        task.status !== "Done" &&
        !isCompleting
      ) {
        e.preventDefault();
        onMarkDone(task, "keyboard");
      }
    },
    [isCompleting, onEdit, onMarkDone, swipeOnlyKeyboard, task],
  );

  const titleId = `chore-card-title-${task.id}`;

  return (
    <article
      className={choreCn(
        compact ? choreClasses.cardCompact : choreClasses.card,
        done && choreClasses.cardDone,
        isCompleting && choreClasses.cardCompleting,
        isDragging && choreClasses.cardDragging,
        swipe.isSwiping && choreClasses.cardSwiping,
        assignFlash && "wd-chore-hh__card--assign-flash",
        aiHighlight && "wd-chore-hh__card--ai-highlight",
      )}
      draggable={draggable && !isCompleting}
      onDragStart={() => onDragStart?.(task)}
      onTouchStart={enableSwipeDone ? swipe.onTouchStart : undefined}
      onTouchMove={enableSwipeDone ? swipe.onTouchMove : undefined}
      onTouchEnd={enableSwipeDone ? swipe.onTouchEnd : undefined}
      style={{
        ...swipeStyle,
        ...(memberColor ? { borderLeftColor: memberColor } : {}),
      }}
      onKeyDown={swipeOnlyKeyboard && !onEdit ? handleKeyDown : undefined}
      tabIndex={swipeOnlyKeyboard && !onEdit ? 0 : undefined}
      aria-labelledby={titleId}
      aria-describedby={
        enableSwipeDone && !done ? `chore-card-swipe-${task.id}` : undefined
      }
    >
      {isCompleting ? (
        <div className="wd-chore-hh__card-check-burst" aria-hidden>
          <span className="wd-chore-hh__card-check-icon">✓</span>
        </div>
      ) : null}
      <div className="wd-chore-hh__card-main">
        <h3 id={titleId} className="wd-chore-hh__card-title">
          {task.title}
        </h3>
        <p className="wd-chore-hh__card-meta">
          <span>{task.room}</span>
          {task.assignedTo ? <span>{task.assignedTo}</span> : <span>Unassigned</span>}
        </p>
        {task.suppressedByKitchenDuty ? (
          <p className="wd-chore-hh__card-flag">Moved — kitchen duty priority</p>
        ) : null}
        {task.isKitchenDuty ? (
          <p className="wd-chore-hh__card-flag wd-chore-hh__card-flag--kitchen">Kitchen duty</p>
        ) : null}
        {enableSwipeDone && !done ? (
          <p id={`chore-card-swipe-${task.id}`} className="wd-chore-hh__card-swipe-hint">
            Swipe left or press Enter to complete
          </p>
        ) : null}
      </div>
      <div className="wd-chore-hh__card-aside">
        <ChoreStatusBadge
          status={isCompleting ? "Done" : task.status}
          taskTitle={task.title}
        />
        <div className="wd-chore-hh__card-actions">
          {onEdit ? (
            <button
              type="button"
              className={choreCn(choreCtaClass("ghost"), choreTw.focusRing)}
              aria-label={`Edit ${task.title}`}
              onClick={() => {
                trackKioskEvent({
                  category: "chore",
                  action: "chore_edit_open",
                  surface,
                  metadata: { taskKey: task.id.slice(0, 16), room: task.room },
                });
                onEdit(task);
              }}
            >
              Edit
            </button>
          ) : null}
          {onMarkDone && task.status !== "Done" && !isCompleting ? (
            <button
              type="button"
              className={choreCn(choreCtaClass("primary"), choreTw.focusRing)}
              aria-label={`Mark ${task.title} done`}
              onClick={() => onMarkDone(task, "button")}
            >
              Done
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export const ChoreTaskCard = memo(ChoreTaskCardInner);
