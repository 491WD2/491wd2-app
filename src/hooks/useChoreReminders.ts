import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChoreReminderPrefs } from "../types/chorePredictive";
import type { PredictiveScheduleReport } from "../types/chorePredictive";
import {
  buildRemindersFromReport,
  dismissReminder as persistDismissReminder,
  loadReminderPrefs,
  saveReminderPrefs,
  showPushReminder,
} from "../lib/choreReminders";

const REMINDER_POLL_MS = 60_000;

export function useChoreReminders(
  report: PredictiveScheduleReport,
  todayIso: string,
  activeMember: import("../types/chore").HouseholdMember | null,
) {
  const [prefs, setPrefsState] = useState<ChoreReminderPrefs>(() => loadReminderPrefs());
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [tick, setTick] = useState(0);

  const setPrefs = useCallback((next: ChoreReminderPrefs) => {
    saveReminderPrefs(next);
    setPrefsState(next);
  }, []);

  const reminders = useMemo(() => {
    void dismissedVersion;
    void tick;
    return buildRemindersFromReport(report, prefs, todayIso, activeMember);
  }, [report, prefs, todayIso, activeMember, dismissedVersion, tick]);

  const dismissReminder = useCallback((id: string) => {
    persistDismissReminder(id);
    setDismissedVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), REMINDER_POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!prefs.enabled || !prefs.pushNotifications) {
      return;
    }
    const top = reminders[0];
    if (!top) {
      return;
    }
    const now = Date.now();
    if (now >= top.suggestedAt - prefs.leadMinutes * 60_000 && now < top.expiresAt) {
      showPushReminder(top);
    }
  }, [reminders, prefs.enabled, prefs.pushNotifications, prefs.leadMinutes]);

  return { reminders, prefs, setPrefs, dismissReminder };
}
