# AI predictive scheduling & reminders

Client-side heuristics (no external API). Data stays in **localStorage** on the kiosk device.

## Features

| Feature | Location |
| --- | --- |
| Predictive schedule (today + week) | Dashboard → **Predictive schedule** |
| In-app reminders | Top of chore shell (`ChoreReminderStack`) |
| Optional push | Dashboard toggles **Push** (browser `Notification` API) |
| Feedback loop | Completing, skipping, or timing vs. prediction updates the model |

## Prediction rules

Inputs:

- **Scheduled tasks** from `buildTasksForDate` / `ScheduleBundle`
- **Completion history** in `PersistedChoreState.completions`
- **AI signals** (`buildChoreAiSignals`) — pace, member week rate, preferred hours
- **Predictive model** (`491wd-chore-predictive-model`) — per-task early/late/skip bias, hour histogram, member peak hour
- **Suggestion feedback** (`491wd-chore-ai-feedback`) — category boosts from helpful / not helpful

Scoring (0–1):

- Overdue → high priority, high score
- Kitchen duty + active member → boost
- Member week completion rate → likelihood
- Proximity to peak / preferred hour → boost
- Unassigned → penalty
- Task timing bias from past early/late/skip → adjust

Labels:

- **Scheduled** — on the official roster
- **Predicted** — AI nudge (e.g. evening push) on top of schedule
- **Likely / Moderate / At risk** — completion probability bands
- **Priority** — high / medium / low (color-coded border)

## Reminder logic

Prefs key: `491wd-chore-reminder-prefs`

| Field | Default | Behavior |
| --- | --- | --- |
| `enabled` | `true` | In-app banners |
| `pushNotifications` | `false` | System notifications when permitted |
| `leadMinutes` | `30` | Window before suggested hour |
| `members` | `[]` | Empty = all members |
| `quietHoursStart` / `End` | 22 / 7 | No reminders in range |

Dismissals: `491wd-chore-reminders-dismissed` (12h TTL per reminder id).

Reminders support **swipe left/right** to dismiss (same threshold as task cards).

## Feedback loop

On **complete** (`markDone`):

- Compare completion hour to predicted `suggestedHour`
- Update `taskTiming` (early / on_time / late) and hour histogram

On **skip**:

- Increment `skipped` for task id

Model reload triggers predictive schedule refresh via `subscribePredictiveModel`.

## TypeScript

- `src/types/chorePredictive.ts` — `PredictedChoreItem`, `PredictiveScheduleReport`, `ChoreReminder`, prefs, model
- `src/lib/chorePredictiveSchedule.ts` — `buildPredictiveSchedule`
- `src/lib/chorePredictiveModel.ts` — load/save/feedback
- `src/lib/choreReminders.ts` — prefs, build, push

## Testing

```bash
npm run test -- chorePredictive
```

Manual: Dashboard → verify color bands; complete a task early/late; confirm next prediction shifts; toggle Push and grant permission once.
