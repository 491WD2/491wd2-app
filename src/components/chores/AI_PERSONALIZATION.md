# Chore AI personalization & adaptive suggestions

Client-side intelligence for `/chores` — **no external API**. Signals include schedule data, completion timestamps, time of day, household roles, kiosk feedback, and real-time store updates.

## Modules

| Module | Role |
| --- | --- |
| `chorePersonalization.ts` | Greetings, pace, focus task, time-of-day copy |
| `choreAiSignals.ts` | Completion pace, per-member stats, preferred hours |
| `choreAiSuggestions.ts` | Ranked suggestions + highlight selection |
| `choreAiFeedback.ts` | Helpful / not helpful / dismiss → category weights |
| `ChoreShellContext` | Single reactive source for UI |

## Personalization signals

| Signal | Effect |
| --- | --- |
| Time of day | Morning / afternoon / evening greeting; evening overdue copy |
| Active member | Personalized subtitle, kitchen duty line, focus task |
| Completion pace | `ahead` / `on_track` / `behind` — insights + “evening push” suggestions |
| Week completion % | `householdInsight` on greeting |
| Highlight suggestion | `aiNudge` line under greeting; matching task card outline on Home |

## Suggestion rules (by category)

| Category | Triggers |
| --- | --- |
| `personal` | Active member’s next task; preferred completion hour; ahead-of-pace praise |
| `assign` | Unassigned tasks (boosted afternoon) |
| `complete` | Overdue; behind pace; steady state |
| `role` | Kitchen duty; morning kitchen focus for duty holder |
| `balance` | Load imbalance; star performer + unassigned pool |
| `history` | Low week rate + open tasks; room affinity from completions |

Each suggestion has a stable `reason` code (`next_task`, `overdue`, `time_of_day`, etc.) for analytics and feedback.

### Ranking

1. Priority (high → low)  
2. Personalized first  
3. Confidence (after feedback + time-of-day boosts)  
4. Max **6** cards; top eligible card gets `highlight: true`

### Confidence adjustments

- **Feedback:** `getCategoryFeedbackBoost()` — ±2.5% per stored score point  
- **Time of day:** e.g. evening +10% for `complete`, morning +8% for `role`  
- **Dismissals:** Hidden 48h per suggestion id; category score −0.5  

Storage key: `491wd-chore-ai-feedback`

## User feedback (refinement loop)

| Action | Effect |
| --- | --- |
| **Helpful** | +1 category score; removed from dismiss list |
| **Not helpful** | −1 category score |
| **Not now** | Dismiss id 48h; −0.5 category score |
| **Apply** (action button) | Same as helpful + navigation + toast |

Suggestions **regenerate** when: schedule/chore state changes, task completed, assignment changes, cross-tab sync, or feedback saved.

## Visual cues

| Element | Class / behavior |
| --- | --- |
| Highlight card | `wd-chore-hh__ai-card--highlight` + “Recommended now” badge + pulse |
| AI panel | `wd-chore-hh__ai--highlight-active` ring when any highlight exists |
| Task on Home | `wd-chore-hh__card--ai-highlight` on task matching `highlightedTaskId` |
| Greeting | `wd-chore-hh__greeting-ai-nudge` for top suggestion title |

Animations respect `prefers-reduced-motion`.

## Real-time compatibility

- Suggestions use `useMemo` on `store.schedule` + `store.choreState` — updates on every `persistFoundation()` / cross-tab reload  
- `bumpSuggestions()` after complete, assign, skip, realtime sync, feedback  
- Does **not** block store writes (feedback uses sync localStorage only)

## Analytics events

| Event | When |
| --- | --- |
| `ai_suggestions_shown` | Panel renders with count + highlight flag |
| `ai_suggestion_accept` | User taps action (includes `reason`) |
| `ai_feedback_helpful` / `not_helpful` / `dismiss` | Feedback buttons |

## Demo / QA

1. Pin a member → see personalized “Your next” + highlight.  
2. Complete tasks → pace and suggestions update without refresh.  
3. Tap **Helpful** on assign tips → more assign-style cards over time.  
4. Open second tab, complete a chore → first tab suggestions refresh.  
5. Clear feedback: `localStorage.removeItem('491wd-chore-ai-feedback')`

## Types

`src/types/choreAi.ts` — `ChoreSuggestion`, `ChoreSuggestionReason`, `ChorePersonalization`
