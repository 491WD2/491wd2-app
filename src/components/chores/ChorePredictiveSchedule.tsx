import { memo, useCallback, useState } from "react";
import type { PredictiveScheduleReport } from "../../types/chorePredictive";
import type { PredictedChoreItem } from "../../types/chorePredictive";
import type { ChoreReminderPrefs } from "../../types/chorePredictive";
import type { ChoreShellTab } from "../../lib/choreTheme";
import { requestReminderPushPermission } from "../../lib/choreReminders";
import { trackInteraction } from "../../lib/kioskAnalytics";
import { choreCn, choreCtaClass, choreTw } from "../../lib/choreUi";

export type ChorePredictiveScheduleProps = {
  report: PredictiveScheduleReport;
  prefs: ChoreReminderPrefs;
  onPrefsChange: (prefs: ChoreReminderPrefs) => void;
  onFocusTask?: (taskId: string) => void;
  onNavigateTab?: (tab: ChoreShellTab) => void;
};

function likelihoodClass(likelihood: PredictedChoreItem["likelihood"]): string {
  switch (likelihood) {
    case "likely":
      return "wd-chore-predict__chip--likely";
    case "moderate":
      return "wd-chore-predict__chip--moderate";
    default:
      return "wd-chore-predict__chip--risk";
  }
}

function priorityClass(priority: PredictedChoreItem["priority"]): string {
  return `wd-chore-predict__row--${priority}`;
}

function PredictiveRow({
  item,
  onFocus,
}: {
  item: PredictedChoreItem;
  onFocus?: (taskId: string) => void;
}) {
  const isPredicted = item.kind === "suggested";
  return (
    <li
      className={choreCn(
        "wd-chore-predict__row",
        priorityClass(item.priority),
        isPredicted && "wd-chore-predict__row--ai",
      )}
    >
      <div className="wd-chore-predict__row-main">
        <span className="wd-chore-predict__title">
          {isPredicted ? (
            <span className="wd-chore-predict__badge-ai" aria-label="AI suggested">
              Predicted
            </span>
          ) : (
            <span className="wd-chore-predict__badge-sched" aria-label="Scheduled task">
              Scheduled
            </span>
          )}
          {item.task.title}
        </span>
        <span className="wd-chore-predict__meta">
          {item.task.room}
          {item.member ? ` · ${item.member}` : ""}
        </span>
        <p className="wd-chore-predict__reason">{item.reason}</p>
      </div>
      <div className="wd-chore-predict__aside">
        <span
          className={choreCn("wd-chore-predict__chip", likelihoodClass(item.likelihood))}
          title={`${Math.round(item.completionProbability * 100)}% likely on time`}
        >
          {item.likelihood === "likely"
            ? "Likely"
            : item.likelihood === "moderate"
              ? "Moderate"
              : "At risk"}
        </span>
        {item.suggestedHour != null ? (
          <span className="wd-chore-predict__time">~{item.suggestedHour}:00</span>
        ) : null}
        {onFocus ? (
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), choreTw.focusRing, "wd-chore-predict__btn")}
            onClick={() => onFocus(item.task.id)}
            aria-label={`View ${item.task.title}`}
          >
            View
          </button>
        ) : null}
      </div>
    </li>
  );
}

export const ChorePredictiveSchedule = memo(function ChorePredictiveSchedule({
  report,
  prefs,
  onPrefsChange,
  onFocusTask,
  onNavigateTab,
}: ChorePredictiveScheduleProps) {
  const [weekOpen, setWeekOpen] = useState(false);

  const togglePush = useCallback(async () => {
    const next = !prefs.pushNotifications;
    if (next) {
      const perm = await requestReminderPushPermission();
      if (perm !== "granted" && perm !== "unsupported") {
        trackInteraction("chores:predictive", "push_denied");
        return;
      }
    }
    onPrefsChange({ ...prefs, pushNotifications: next });
    trackInteraction("chores:predictive", "push_toggle", { enabled: next });
  }, [onPrefsChange, prefs]);

  const peakLabel =
    report.peakActivityHours.length > 0
      ? report.peakActivityHours.map((h) => `${h}:00`).join(", ")
      : "—";

  return (
    <section
      className="wd-chore-predict"
      aria-labelledby="chore-predict-title"
      data-chore-tour="predictive-schedule"
    >
      <header className="wd-chore-predict__head">
        <div>
          <h2 id="chore-predict-title">Predictive schedule</h2>
          <p className="wd-chore-predict__sub">
            AI-ranked chores from completion patterns and household roles. Peak activity:{" "}
            <strong>{peakLabel}</strong>
          </p>
        </div>
        <div className="wd-chore-predict__prefs" role="group" aria-label="Reminder settings">
          <label className="wd-chore-predict__toggle">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => onPrefsChange({ ...prefs, enabled: e.target.checked })}
              aria-label="Enable in-app reminders"
            />
            Reminders
          </label>
          <label className="wd-chore-predict__toggle">
            <input
              type="checkbox"
              checked={prefs.pushNotifications}
              onChange={() => void togglePush()}
              aria-label="Enable push notifications for reminders"
            />
            Push
          </label>
        </div>
      </header>

      {report.today.length === 0 ? (
        <p className="wd-chore-hh__empty wd-chore-hh__empty--inline" role="status">
          No open chores to predict — great work today.
        </p>
      ) : (
        <ul className="wd-chore-predict__list" aria-label="Suggested chores for today">
          {report.today.map((item) => (
            <PredictiveRow
              key={`${item.kind}-${item.task.id}`}
              item={item}
              onFocus={onFocusTask}
            />
          ))}
        </ul>
      )}

      <details
        className="wd-chore-predict__week"
        open={weekOpen}
        onToggle={(e) => setWeekOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>Upcoming week ({report.week.filter((d) => !d.isToday).length} days)</summary>
        {report.week
          .filter((day) => !day.isToday && day.items.length > 0)
          .map((day) => (
            <div key={day.dateIso} className="wd-chore-predict__day">
              <h3>{day.label}</h3>
              <ul className="wd-chore-predict__list wd-chore-predict__list--compact">
                {day.items.slice(0, 5).map((item) => (
                  <PredictiveRow key={item.task.id} item={item} onFocus={onFocusTask} />
                ))}
              </ul>
              {day.items.length > 5 ? (
                <p className="wd-chore-hh__hint">+{day.items.length - 5} more</p>
              ) : null}
            </div>
          ))}
      </details>

      {onNavigateTab ? (
        <button
          type="button"
          className={choreCn(choreCtaClass("ghost"), choreTw.focusRing, "wd-chore-predict__link")}
          onClick={() => onNavigateTab("schedule")}
        >
          Open full schedule
        </button>
      ) : null}
    </section>
  );
});
