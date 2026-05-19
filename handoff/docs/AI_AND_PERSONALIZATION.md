# AI personalization & real-time sync

Client-side “AI” for the `/chores` kiosk — **no external API**. Behavior follows household schedule data, completion history, analytics events, and optional session member.

## Personalization engine

| Module | Role |
| --- | --- |
| `chorePersonalization.ts` | Greetings, focus task, active member resolution |
| `choreAiSuggestions.ts` | Ranked recommendations with categories |
| `ChoreShellContext` | Single source: schedule + personalization + suggestions |

## Active member

1. **Kiosk pin** — `localStorage` key `491wd-chore-active-member` (set via greeting chips).
2. **Family session** — reads `familysite-491:first-family-build`, maps `adminSettings.activeMemberId` → first name → household member (Lorraine, Herschel, …).

Changing member refreshes suggestions and greeting copy.

## Greeting rules (`buildChorePersonalization`)

| Signal | Copy |
| --- | --- |
| Time of day | Morning / afternoon / evening prefix |
| Active member + open tasks | “N on your list · M done” |
| Kitchen duty | Appended when member matches rotation |
| Week completion % | `householdInsight` from assigned week tasks |
| Focus task | Overdue → kitchen duty → first open task |

## Suggestion categories

| Category | Triggers |
| --- | --- |
| `personal` | Active member’s next task, room affinity from week completions |
| `assign` | Unassigned tasks today |
| `complete` | Overdue, steady-state |
| `role` | Kitchen duty rotation |
| `balance` | Load imbalance, star performer can take more |
| `history` | Low weekly completion rate, analytics completion count |

Suggestions sort by priority, then personalized first, then confidence. Max **6** shown.

## Accepting a suggestion

`acceptSuggestion(id)` → toast “Applied: …”, card gets applied styling, navigation:

| Action | Behavior |
| --- | --- |
| `navigate_schedule` | Schedule tab |
| `focus_member` | Users tab + member focus |
| `focus_task` | Home tab + scroll to `#chore-task-{id}` |

## Real-time updates

| Layer | Mechanism |
| --- | --- |
| Same tab / component tree | `useSyncExternalStore` in `choreData.ts` — all views read `useChoreShell().schedule` |
| Same browser, other tabs | `storage` event → reload foundation + pulse + toast |
| Same browser, broadcast | `BroadcastChannel` `491wd-chore-realtime` + custom event on every persist |

No WebSocket in this build; pattern is extensible by posting to the same channel from a future server push handler.

## UI components

| Component | Pages |
| --- | --- |
| `ChorePersonalGreeting` | Home, Dashboard |
| `ChoreAiSuggestions` | Home, Dashboard |

Animations: greeting fade-in, AI panel reveal, staggered cards, accepted flash (disabled under `prefers-reduced-motion`).

## Types (source)

`src/types/choreAi.ts`: `ChoreSuggestion`, `ChorePersonalization`, `ChoreSuggestionCategory`.
