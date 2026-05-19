# AI personalization & real-time sync (client handoff)

Client-side “AI” for the `/chores` kiosk — **no external API**. Behavior follows schedule data, completion history, time of day, household roles, user feedback, and live store updates.

**Predictive scheduling & reminders:** [PREDICTIVE_SCHEDULING.md](../../src/components/chores/PREDICTIVE_SCHEDULING.md).

## Architecture

| Module | Role |
| --- | --- |
| `chorePersonalization.ts` | Greetings, pace, focus task |
| `choreAiSignals.ts` | Completion patterns, preferred hours |
| `choreAiSuggestions.ts` | Ranked recommendations |
| `choreAiFeedback.ts` | Helpful / dismiss → category weights |
| `chorePredictiveSchedule.ts` | Today/week predictions, priority & likelihood |
| `chorePredictiveModel.ts` | Early/late/skip feedback, peak hours |
| `choreReminders.ts` | In-app + optional push reminders |
| `ChoreShellContext` | Schedule + AI + feedback + predictions in one tree |

## Active member

1. **Kiosk pin** — `491wd-chore-active-member` (greeting chips).  
2. **Family session** — `familysite-491:first-family-build` → roster first name.

Changing member clears accepted suggestions and regenerates AI copy.

## Adaptive signals

| Signal | UX impact |
| --- | --- |
| Time of day | Greeting prefix; evening overdue subtitle; category confidence boosts |
| Completion pace | Behind → “Evening push” suggestion; ahead → praise card |
| Week completion % | Greeting `householdInsight` |
| Preferred hour | “You often complete chores in the afternoons” on next-task tip |
| Kitchen duty | Role suggestions; morning kitchen focus |
| User feedback | Raises/lowers future cards in same category |

## Suggestion categories & reasons

| Category | Example reasons |
| --- | --- |
| `personal` | `next_task`, `completion_pace`, `room_affinity` |
| `assign` | `unassigned` |
| `complete` | `overdue`, `completion_pace`, `steady` |
| `role` | `kitchen_duty`, `time_of_day` |
| `balance` | `load_balance`, `star_performer` |
| `history` | `support_member`, `room_affinity` |

Max **6** cards. Top card: **`highlight: true`** → pulse border, “Recommended now”, linked task outline on Home.

## Feedback loop

| Button | Stored effect |
| --- | --- |
| Helpful | +category score |
| Not helpful | −category score |
| Not now | Hide 48h; slight −score |
| Apply action | Helpful + navigate |

Storage: `491wd-chore-ai-feedback`

## Real-time

| Layer | Mechanism |
| --- | --- |
| Same tab | `useSyncExternalStore` + suggestion `useMemo` on schedule/state |
| Other tabs | `storage` + `BroadcastChannel` → reload + suggestion bump |

AI does not delay chore saves.

## Demo script

1. Open `/chores` as a named member.  
2. Note highlight card + task outline on Home.  
3. Complete a task → stats and suggestions update.  
4. Mark assign tip “Helpful” → repeat visit shows more assign tips.  
5. Second device/tab: complete chore → first tab updates.

## Full developer reference

See `src/components/chores/AI_PERSONALIZATION.md` in the source repo.
