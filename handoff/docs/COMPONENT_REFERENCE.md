# Component reference — Chore kiosk

All components live under `src/components/chores/`. Types exported from `src/components/chores/types.ts` and `index.ts`.

**Required wrapper:** `ChoreShellProvider` on `ChoresPage` (provides `useChoreShell()`).

---

## Context & data

### `ChoreShellProvider`

| | |
| --- | --- |
| **Purpose** | Single source for schedule, AI, toasts, animations, personalization |
| **Props** | `children: ReactNode` |
| **State source** | `useHouseholdChoreStore()` + local UI state |

### `useChoreShell()` return value

| Field | Type | Description |
| --- | --- | --- |
| `schedule` | `ScheduleBundle` | Today, week, month, member schedules — updates live |
| `choreState` | `PersistedChoreState` | Completions, assignments, skips |
| `choreNotes` | `PersistedChoreNotes` | Improvement notes |
| `today` | `string` | ISO date (today) |
| `personalization` | `ChorePersonalization` | Greeting, subtitle, focus task, completion % |
| `activeMember` | `HouseholdMember \| null` | Kiosk “viewing as” member |
| `setActiveMember` | `(m) => void` | Pin member; refreshes AI copy |
| `suggestions` | `ChoreSuggestion[]` | Up to 6 ranked AI cards |
| `acceptSuggestion` | `(s) => void` | Mark accepted + toast |
| `acceptedSuggestionIds` | `ReadonlySet<string>` | UI “Applied” state |
| `markDone` | `(task) => void` | Complete + animation + toast |
| `skipTask` | `(id, reason) => void` | Skip with reason |
| `setAssignment` | `(id, member) => void` | Assign + flash + toast |
| `setImprovementNote` | `(id, text) => void` | Persist note |
| `setMessageBoard` | `(member, text) => void` | User tab message board |
| `toasts` | `ChoreToast[]` | Active notifications |
| `dismissToast` | `(id) => void` | Dismiss toast |
| `completingIds` | `ReadonlySet<string>` | Cards in completion animation |
| `assignFlashIds` | `ReadonlySet<string>` | Post-assign pulse |
| `schedulePulse` | `boolean` | Cross-tab sync highlight |

---

## Shell & navigation

### `ChoreNavTabs`

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `ChoreShellTab` | `home` \| `dashboard` \| `schedule` \| `user` |
| `onChange` | `(tab) => void` | Tab change handler |

**A11y:** `role="tablist"`, tabs use `aria-selected`, `aria-controls`, `id` / `chore-tab-*`.

### `ChoreTabPanel`

| Prop | Type | Description |
| --- | --- | --- |
| `tabKey` | `ChoreShellTab` | Remount key for enter animation |
| `children` | `ReactNode` | Tab content |

**A11y:** `role="tabpanel"`, `aria-labelledby` linked to tab button.

### `ChoreToastStack`

No props. Reads `toasts` / `dismissToast` from context. Auto-dismiss ~4.2s with exit animation.

---

## Layout & chrome

### `ChoreViewHeader`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Page heading |
| `subtitle` | `ReactNode` | — | Supporting text |
| `actions` | `ReactNode` | — | CTAs (right or below) |
| `stacked` | `boolean` | `true` | Stack actions under title on narrow screens |

### `ChorePanel`

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Section title |
| `children` | `ReactNode` | Body |
| `action` | `ReactNode` | Optional header badge/button |
| `id` | `string` | Optional; sets `aria-labelledby` |

### `ChoreCtaButton`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `primary` \| `ghost` \| `accent` \| `success` | `primary` | Visual style |
| `children` | `ReactNode` | — | Label |
| … | `ButtonHTMLAttributes` | — | Standard button attrs |

**Touch:** min 76×76px via CSS.

### `ChoreStatCard`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Metric name |
| `value` | `ReactNode` | — | Number/text |
| `hint` | `string` | — | Subline |
| `accent` | `yellow` \| `coral` \| `magenta` \| `violet` | `violet` | Top border color |

**Interaction:** Value animates (pop) when `value` changes.

---

## Tasks

### `ChoreTaskList`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tasks` | `ChoreTask[]` | — | Tasks to render |
| `surface` | `string` | — | Analytics surface id |
| `onEdit` | `(task) => void` | — | Opens edit modal |
| `enableSwipeDone` | `boolean` | `false` | Swipe left to complete |
| `draggable` | `boolean` | `false` | For assign board |
| `onDragStart` | `(task) => void` | — | Drag handler |
| `emptyMessage` | `string` | `"No tasks."` | Empty state |

Uses `markDone` from context internally.

### `ChoreTaskCard`

| Prop | Type | Description |
| --- | --- | --- |
| `task` | `ChoreTask` | Task model |
| `surface` | `string` | Analytics |
| `onEdit` | `(task) => void` | Edit button |
| `onMarkDone` | `(task) => void` | Done button / swipe |
| `enableSwipeDone` | `boolean` | Touch swipe + optional Enter |
| `isCompleting` | `boolean` | Check burst overlay |
| `isDragging` | `boolean` | Drag lift style |
| `assignFlash` | `boolean` | Post-assign pulse |
| `compact` | `boolean` | Compact layout |
| `draggable` | `boolean` | HTML5 drag |

### `ChoreStatusBadge`

| Prop | Type | Description |
| --- | --- | --- |
| `status` | `ChoreTaskStatus` | To Do, Done, etc. |
| `taskTitle` | `string` | Optional; enriches `aria-label` |

---

## Modals & assign

### `ChoreEditModal`

| Prop | Type | Description |
| --- | --- | --- |
| `task` | `ChoreTask \| null` | Task being edited |
| `open` | `boolean` | Visibility |
| `onClose` | `() => void` | Close handler |
| `onSave` | `(id, assignee, note) => void` | Save assignment + notes |
| `onMarkDone` | `(task) => void` | Mark complete |
| `onSkip` | `(id, reason) => void` | Skip task |

**A11y:** Focus trap, Escape, labelled fields, scrim button.

### `ChoreDragBoard`

| Prop | Type | Description |
| --- | --- | --- |
| `tasks` | `ChoreTask[]` | Usually `schedule.today` |
| `onAssign` | `(taskId, member) => void` | Drop handler |
| `onEdit` | `(task) => void` | Edit from card |

**Interaction:** Drag from pool to member columns; drop flash; card lift while dragging.

---

## Personalization & AI

### `ChorePersonalGreeting`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `home` \| `dashboard` | `home` | Slight style variant |

**Interaction:** “Viewing as” chips call `setActiveMember`; progress bar shows % done today.

### `ChoreAiSuggestions`

| Prop | Type | Description |
| --- | --- | --- |
| `onNavigateTab` | `(tab) => void` | Schedule / Home navigation |
| `onFocusMember` | `(member) => void` | Users tab + focus |
| `onFocusTask` | `(taskId) => void` | Scroll to task on Home |

**Interaction:** Action buttons call `acceptSuggestion` + navigation.

### `ChoreMemberChip`

| Prop | Type | Description |
| --- | --- | --- |
| `member` | `HouseholdMember` | Name |
| `selected` | `boolean` | Active chip |
| `onSelect` | `() => void` | Makes chip a button |

---

## Admin (lazy)

### `ChoreAnalyticsConsole`

| Prop | Type | Description |
| --- | --- | --- |
| `onClose` | `() => void` | Optional close |

Lazy-loaded on `ChoresPage` when analytics enabled.

---

## Page views (composition)

| View | File | Uses |
| --- | --- | --- |
| Home | `ChoresHomeView.tsx` | Greeting, AI, stats, task list (swipe) |
| Dashboard | `ChoresDashboardView.tsx` | Greeting, AI, stats, member panels |
| Schedule | `ChoresScheduleView.tsx` | Week pills, assign board, task list |
| Users | `ChoresUserView.tsx` | Chips, message board, member tasks |

Parent: `ChoresPage.tsx` — tabs, modal, analytics, `ChoreShellProvider`.
