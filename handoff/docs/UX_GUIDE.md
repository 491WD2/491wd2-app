# UX guide — Chore kiosk

## Design principles

1. **Touch first** — Minimum 76px targets; generous spacing; swipe to complete on lists.
2. **Immediate feedback** — Every completion, assign, and sync shows motion + toast.
3. **One household truth** — All tabs read the same schedule store; no manual refresh.
4. **Progressive disclosure** — Week vs Assign modes; edit in modal; analytics hidden by default.
5. **Accessible by default** — Keyboard paths, ARIA tabs, focus rings, reduced-motion support.

## Color system

| Token | Hex | Use |
| --- | --- | --- |
| Yellow | `#FFD522` | Accents, kitchen / star highlights |
| Coral | `#FF4B6C` | Overdue, urgent badges |
| Magenta | `#C516E1` | Secondary gradient |
| Violet | `#735DFF` | Primary actions, tabs |
| Ink | `#1D1136` | Text |
| White | `#FFFFFF` | Cards, buttons |
| Muted | `#574f66` | Secondary text (WCAG-friendly) |

CSS variables: `--hh-yellow`, `--hh-coral`, etc. in `.wd-chore-hh`.

## Typography & layout

- Headings: heavy weight (800–900), tight tracking.
- Page max width: ~72rem (`choreLayout.view`).
- Stat grid: 2 columns mobile → 4 desktop.
- Dashboard member grid: 1 → 2 → 3 columns by breakpoint.

## Interaction catalog

| Gesture / input | Where | Result |
| --- | --- | --- |
| Tap **Done** | Task card | Complete + toast + stat pop |
| Swipe left | Home / Users lists | Complete (if enabled) |
| Enter | Card (swipe-only lists) | Complete |
| Tap **Edit** | Task card | Modal |
| Drag & drop | Schedule → Assign | Reassign + column flash |
| Tap member chip | Users | Filter tasks |
| Tap “Viewing as” | Greeting | Personalize AI |
| Tap AI action | Suggestion card | Navigate + “Applied” |
| Tap Dashboard card | Member panel | Users tab + focus |
| Escape | Modal | Close |
| Tab | All controls | Focus order |

## Motion (see `choreMotion.ts`)

| Timing | Ms | Use |
| --- | --- | --- |
| Toast auto-dismiss | 4200 | Notifications |
| Toast exit | 280 | Slide out |
| Complete burst | 520 | Card overlay |
| Assign flash | 480 | Violet pulse |
| Schedule pulse | 650 | Cross-tab sync |

Disabled when `prefers-reduced-motion: reduce`.

## Real-time behavior

- **Same tab:** `useSyncExternalStore` updates all subscribed views instantly.
- **Other browser tab:** `storage` event + BroadcastChannel → reload + warning toast + shell pulse.
- **AI / greeting:** Recompute when `schedule` or `activeMember` changes.

## Empty & error states

| State | Copy / UI |
| --- | --- |
| No tasks today | “No chores scheduled for today…” |
| No tasks on day | “No tasks on this day.” |
| No member tasks | “No tasks assigned today.” |
| Loading analytics | “Loading analytics…” |
| Loading chores route | “Loading chores…” (App shell) |

## Known UX limitations (document for client)

1. **Skip task** uses browser `prompt()` — functional but not polished; recommend future in-modal form.
2. **Data is per-browser** — not synced across devices unless family cloud sync is configured elsewhere.
3. **AI suggestions** are heuristic, not GPT — confidence % is relative scoring, not ML probability.

## Responsive breakpoints (CSS)

| Breakpoint | Behavior |
| --- | --- |
| &lt; 768px | Stacked headers; 2-col stats |
| ≥ 768px | Row headers; 4-col stats |
| ≥ 700px | 2-col dashboard grid |
| ≥ 1100px | 3-col dashboard grid |
| ≥ 1200px | Extra horizontal padding on chore content |

## PWA / kiosk install

- `display: standalone` supported.
- Slightly larger base font when installed (see `styles.css`).
- Touch highlight color on coarse pointers.
