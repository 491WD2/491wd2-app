# State & data — Chore kiosk

## Architecture

```
localStorage  →  choreData (foundation)  →  useHouseholdChoreStore()
                                              ↓
                                        ChoreShellProvider
                                              ↓
                                    Pages & components
```

No server required for chore schedule in default build.

## localStorage keys

| Key | Content |
| --- | --- |
| `491wd-chore-state` (see `CHORE_STATE_STORAGE_KEY`) | Completions, skips, assignment overrides |
| `491wd-member-schedules` | Member schedules, message boards |
| `491wd-chore-notes` | Improvement notes per task |
| `491wd-chore-active-member` | Kiosk “viewing as” pin |
| `491wd-kiosk-analytics-events` | Optional analytics event log (max 1000) |
| `491wd-chore-storage-sync` | Custom event + BroadcastChannel for cross-tab |

Family app data (optional): `familysite-491:first-family-build` — used to resolve session member name for personalization.

## Primary types

| Type | File |
| --- | --- |
| `ChoreTask` | `src/types/cleaning.ts` |
| `ScheduleBundle` | `src/types/cleaning.ts` |
| `PersistedChoreState` | `src/types/cleaning.ts` |
| `ChoreSuggestion` | `src/types/choreAi.ts` |
| `HouseholdMember` | `src/types/chore.ts` |

## Store API (`useHouseholdChoreStore`)

| Method | Effect |
| --- | --- |
| `markDone(taskId)` | Record completion + persist + broadcast |
| `skipTask(taskId, reason)` | Record skip |
| `setAssignment(taskId, member)` | Override assignee |
| `setImprovementNote(taskId, text)` | Save note |
| `setMessageBoard(member, text)` | User message board |

Read-only (reactive): `schedule`, `choreState`, `choreNotes`, `today`, `definitions`, `checklists`.

## Schedule bundle shape (simplified)

```ts
schedule.today        // ChoreTask[] for today
schedule.thisWeek     // week tasks
schedule.thisMonth    // month tasks
schedule.kitchenDutyToday  // HouseholdMember | null
schedule.memberSchedules   // per-member today + rooms
```

Rebuilt on every persist via `buildScheduleBundle()`.

## Shell-only state (React, not persisted)

- Toasts, completing IDs, assign flash IDs
- Accepted suggestion IDs (session)
- `schedulePulse` flag (transient)
- Analytics console open (session / localStorage flag)

## Cross-tab sync flow

1. Tab A calls `markDone` → `persistFoundation()` → `localStorage` + listeners + `BroadcastChannel`.
2. Tab B receives `storage` or channel message → `reloadChoreFoundationFromStorage()` → React re-render.
3. Tab B shows warning toast + brief shell pulse animation.

## Analytics (non-blocking)

Events queued with `queueMicrotask` in `kioskAnalytics.ts`. Does not block store writes.

Surfaces include: `chores:home`, `chores:task-card`, `chores:assign-board`, `chores:edit-modal`, etc.

## Extending data

- Seed / ZIP import: `choreData.ts`, `choreZipSeed.ts`
- Do not mutate `foundationSnapshot` outside store mutators
- After external localStorage edits, call `reloadChoreFoundationFromStorage()`
