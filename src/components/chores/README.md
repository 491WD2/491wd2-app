# Household chore components (`/chores`)

Touch-first kiosk shell. **Palette:** `#FFD522` `#FF4B6C` `#C516E1` `#735DFF` `#1D1136` `#FFFFFF`.

## Architecture

| Layer | Role |
| --- | --- |
| `useHouseholdChoreStore()` | Schedule, completions, assignments (`choreData.ts`) |
| `ChoreShellProvider` | Toasts, completing animation, `markDone`, AI list, cross-tab sync |
| `choreUi.ts` | `choreClasses`, `choreLayout`, `choreCtaClass`, `choreStatClass` |
| `choreTheme.ts` | Colors, tabs, 76px touch minimum (~20mm) |

## Pages (tab views)

| View | File | Interactions |
| --- | --- | --- |
| Home | `ChoresHomeView.tsx` | Stats, AI, swipe/Enter to complete today |
| Dashboard | `ChoresDashboardView.tsx` | Member cards (click → Users), live counts |
| Schedule | `ChoresScheduleView.tsx` | Week pills, drag assign board, edit modal |
| Users | `ChoresUserView.tsx` | Member chips, message board, task list |

## Real-time updates

- Same-tab: `useSyncExternalStore` rebuilds `schedule` on every action.
- Shell: `markDone(task)` → burst + toast → store write; all tabs read `useChoreShell().schedule`.
- Cross-tab: `storage` on chore state key → `reloadChoreFoundationFromStorage()` + schedule pulse + warning toast.

## Motion & micro-interactions

CSS-first animations in `ui-builder.css`; timings in `choreMotion.ts`.

| Action | Feedback |
| --- | --- |
| Complete | Check burst, green pulse, toast slide-in/out, stat value pop |
| Assign | Violet assign-flash on card; column/pool drop flash |
| Drag | Card lift (`card--dragging`); hover columns highlight |
| Swipe | Live horizontal offset while dragging finger |
| Modal | Backdrop fade + dialog scale-in; `:active` press on buttons |
| Sync | Brief inset pulse on shell (`wd-chore-hh--schedule-pulse`) |

`prefers-reduced-motion: reduce` disables all animations.

## AI suggestions (`choreAiSuggestions.ts`)

Client heuristics (no API): unassigned, overdue, kitchen duty, load balance, completion rates.  
`ChoreAiSuggestions` actions: Schedule tab or Users tab + `focusMember`.

## Component reference

Prop types are exported from each component module (e.g. `ChoreEditModal.tsx`).

| Component | Purpose | Key props |
| --- | --- | --- |
| `ChoreShellProvider` | Context wrapper | children |
| `useChoreShell` | Store + UI actions | — |
| `ChoreNavTabs` | Shell tabs | `active`, `onChange` |
| `ChoreViewHeader` | Page title row | `title`, `subtitle`, `actions`, `stacked` |
| `ChoreCtaButton` | 76px CTA | `variant`, `onClick` |
| `ChoreStatCard` | Metric tile | `label`, `value`, `accent` |
| `ChorePanel` | Section card | `title`, `children`, `action` |
| `ChoreTaskList` | Memoized list | `tasks`, `surface`, `enableSwipeDone` |
| `ChoreTaskCard` | Task row | `task`, `onMarkDone`, `isCompleting` |
| `ChoreEditModal` | Edit dialog | `task`, `open`, `onSave`, `onMarkDone` |
| `ChoreDragBoard` | Drag assign | `tasks`, `onAssign`, `onEdit` |
| `ChoreAiSuggestions` | AI cards | `onNavigateTab`, `onFocusMember` |
| `ChoreToastStack` | Notifications | (reads context) |
| `ChoreTabPanel` | Tab enter animation | `tabKey`, `children` |

## CSS

Primary block: `.wd-chore-hh` in `src/ui-builder.css`. Prefer `choreClasses` / `choreLayout` in TS over duplicating BEM strings.

## Accessibility

- Focus rings via `choreTw.focusRing`
- `aria-current` on nav tabs; `role="dialog"` on modal
- Keyboard: Enter on cards, Escape on modal, member panels on Dashboard

## Performance

- `memo` on `ChoreTaskList`, `ChoreTaskCard`, `ChoreAiSuggestions`
- Lazy `ChoreAnalyticsAgent`, edit modal, onboarding tour, tab views
- `ChoresPage` lazy-loaded from `App.tsx` (separate production chunk)
- Analytics in `queueMicrotask` (non-blocking)

## Production build

See [docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md) — `npm run build`, chore QA at `/chores`.

## Accessibility

See [docs/ACCESSIBILITY.md](../../../docs/ACCESSIBILITY.md) — ARIA, keyboard, contrast, 76px touch targets, screen reader patterns.
