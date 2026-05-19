# Accessibility & kiosk UX audit — Chores (`/chores`)

Audit date: production chore shell. Target: **WCAG 2.2 AA** where feasible on a touch-first household kiosk.

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| ARIA labels | **Pass** (after fixes) | Buttons, tabs, modals, status, member chips |
| Color contrast | **Pass** | Muted text darkened; badges checked on white |
| Keyboard | **Pass** | Tabs, modals, cards, skip link |
| Screen readers | **Pass** | Tab/tabpanel wiring, live regions, status roles |
| Touch targets | **Pass** | 76px (`--hh-touch`, ~20mm @ 96dpi) on primary controls |
| Motion | **Pass** | `prefers-reduced-motion` disables chore animations |

## Implemented patterns

### Navigation

- **Skip link** → `#chore-main` (visible on focus)
- **Main tabs** (`ChoreNavTabs`): `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `tabIndex={0|-1}`
- **Tab panels** (`ChoreTabPanel`): `role="tabpanel"`, `aria-labelledby`
- **Schedule sub-tabs** (Week / Assign): same tab pattern with linked panels

### Tasks

- **Task cards**: `aria-labelledby` on title; swipe hint as `aria-describedby` only when swipe enabled **and** no separate Done/Edit buttons (avoids duplicate tab stops)
- **Status badge**: `role="status"` + `aria-label` including task name
- **Done / Edit**: visible labels + explicit `aria-label` where needed

### Modals

- **Edit modal**: `role="dialog"`, `aria-modal`, labelled title, `htmlFor` on fields, focus trap (`useFocusTrap`), Escape to close, scrim as named button “Close dialog”
- **Skip task**: still uses `window.prompt` — works with keyboard but is not ideal for SR; see recommendations

### Personalization & AI

- Greeting: `aria-labelledby`, progressbar with `aria-valuenow`
- Member chips: `aria-pressed`, `aria-label`
- AI suggestions: region labelled; action buttons have visible text; accepted state uses `aria-live="polite"`

### Real-time feedback

- Toasts: `role="status"`, `aria-live="polite"`
- Completing tasks: visual burst + non-blocking status

### Touch & CSS

- Minimum interactive height/width: **`--hh-touch: 76px`** on `.wd-chore-hh__btn`, tabs, day pills, member chips, greeting chips, modal close, analytics toggle, schedule segment buttons
- **`:focus-visible`**: 3px violet outline on chore shell controls
- Coarse pointer / PWA: tap highlight in global `styles.css`

## Color contrast (representative)

| Pair | Ratio (approx.) | Use |
| --- | --- | --- |
| `#1D1136` on `#FFFFFF` | ~16:1 | Body text |
| `#574f66` on `#FFFFFF` | ~7:1 | Secondary text (`--hh-muted`) |
| `#735DFF` on `#f3f0ff` | ~4.6:1 | Todo badge |
| `#0d7a45` on `#e8fff3` | ~4.5:1 | Done badge |
| White on violet gradient (active tab) | >4.5:1 | Active tab / day pill |

## Keyboard checklist

| Action | Keys |
| --- | --- |
| Skip to content | Tab → Enter on skip link |
| Change main tab | Tab to tab, Enter/Space |
| Complete task (list w/ swipe only) | Focus card → Enter |
| Complete / edit (buttons) | Tab to Done / Edit |
| Open edit modal | Tab → Edit → fields → Save / Escape |
| Close modal | Escape or Close / scrim |
| Week navigation | Tab to Prev / This week / Next |
| Dismiss toast | Tab to × |

## Screen reader checklist

- Page title: “Chores” (`h1`)
- Tab change announces via focus move to panel (`tabpanel` + `tabIndex={0}`)
- Task status announced via badge `aria-label`
- Toast messages announced via live region
- “Applied” on AI suggestion via `aria-live`

## Testing performed

- `npm run typecheck` — strict TypeScript
- `npm run test` — Jest + React Testing Library (`ChoreNavTabs`, analytics queue, offline snapshot)
- `npm run build` — production bundle
- Manual review of component markup and CSS tokens

### Recommended device tests

1. **iPhone / Android** — swipe to complete, member chips, horizontal week scroll
2. **iPad landscape** — dashboard grid, assign board columns
3. **Large kiosk display** — nav tabs, stat cards, modal at arm’s length
4. **VoiceOver / TalkBack** — one full pass on Home → complete → Dashboard
5. **Keyboard only** — no mouse, all four tabs + modal

## Recommendations (future)

| Priority | Item |
| --- | --- |
| High | Replace `window.prompt` on Skip with in-modal text field |
| Medium | ~~Arrow-key navigation between main tabs~~ **Done** (`ChoreNavTabs`) |
| Medium | `aria-grabbed` / instructions on drag board for SR users |
| Low | Dedicated high-contrast theme toggle for chore shell |
| Low | Reduce `tabIndex={0}` on tabpanel if focus should land on first control inside |

## Files touched in audit

- `src/hooks/useFocusTrap.ts`
- `src/lib/choreA11y.ts`
- `src/components/chores/*` (NavTabs, TabPanel, TaskCard, EditModal, StatusBadge, MemberChip, PersonalGreeting)
- `src/pages/ChoresPage.tsx`, `src/pages/chores/ChoresScheduleView.tsx`
- `src/ui-builder.css` (touch, contrast, skip link, modal layer, focus)
