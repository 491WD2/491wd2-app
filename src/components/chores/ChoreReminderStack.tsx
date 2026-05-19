import { useCallback, useRef } from "react";
import type { ChoreReminder } from "../../types/chorePredictive";
import { useChoreSwipe } from "../../hooks/useChoreSwipe";
import { formatReminderTime } from "../../lib/choreReminders";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { choreCn, choreTw } from "../../lib/choreUi";

export type ChoreReminderStackProps = {
  reminders: ChoreReminder[];
  onDismiss: (id: string) => void;
  onOpenTask?: (taskId: string) => void;
};

function ReminderCard({
  reminder,
  onDismiss,
  onOpenTask,
}: {
  reminder: ChoreReminder;
  onDismiss: (id: string) => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const dismissedRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) {
      return;
    }
    dismissedRef.current = true;
    trackInteraction("chores:reminder", "dismiss", { taskId: reminder.taskId });
    onDismiss(reminder.id);
  }, [onDismiss, reminder.id, reminder.taskId]);

  const { onTouchStart, onTouchMove, onTouchEnd, offsetX, isSwiping } = useChoreSwipe({
    surface: "chores:reminder",
    onSwipeLeft: handleDismiss,
    onSwipeRight: handleDismiss,
  });

  return (
    <article
      className={choreCn(
        "wd-chore-reminder",
        `wd-chore-reminder--${reminder.priority}`,
        isSwiping && "wd-chore-reminder--swiping",
        "wd-chore-reminder--enter",
      )}
      style={{ transform: offsetX ? `translate3d(${offsetX}px, 0, 0)` : undefined }}
      role="alert"
      aria-labelledby={`reminder-title-${reminder.id}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="wd-chore-reminder__icon" aria-hidden>
        ⏰
      </div>
      <div className="wd-chore-reminder__body">
        <p className="wd-chore-reminder__eyebrow">
          <span className="wd-chore-reminder__badge">Predicted reminder</span>
          {formatReminderTime(reminder)}
        </p>
        <h3 id={`reminder-title-${reminder.id}`} className="wd-chore-reminder__title">
          {reminder.title}
        </h3>
        <p className="wd-chore-reminder__msg">{reminder.message}</p>
        <p className="wd-chore-reminder__hint">Swipe left or right to dismiss</p>
      </div>
      <div className="wd-chore-reminder__actions">
        {onOpenTask ? (
          <button
            type="button"
            className={choreCn("wd-chore-reminder__btn", choreTw.focusRing)}
            onClick={() => {
              trackInteraction("chores:reminder", "open_task", { taskId: reminder.taskId });
              onOpenTask(reminder.taskId);
            }}
            aria-label={`Open ${reminder.title}`}
          >
            Open
          </button>
        ) : null}
        <button
          type="button"
          className={choreCn("wd-chore-reminder__dismiss", choreTw.focusRing)}
          onClick={handleDismiss}
          aria-label={`Dismiss reminder for ${reminder.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
}

/** Incoming reminder banners — swipe to dismiss, above toasts. */
export function ChoreReminderStack({
  reminders,
  onDismiss,
  onOpenTask,
}: ChoreReminderStackProps) {
  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="wd-chore-reminder-stack" aria-live="assertive" aria-atomic="false">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onDismiss={onDismiss}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );
}
