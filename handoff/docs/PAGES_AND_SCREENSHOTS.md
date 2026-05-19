# Pages guide & screenshot instructions

Use this document for client training, acceptance testing, and marketing captures.

## How to capture screenshots

1. Run the production build locally:
   ```bash
   npm run build && npm run start
   ```
2. Open **http://localhost:4173/chores** in Chrome or Safari.
3. Recommended viewports:
   - **Kiosk:** 1920×1080 or 1280×800 landscape
   - **Tablet:** 1024×768 or iPad preset (768×1024)
   - **Phone:** 390×844 (optional)
4. Save PNGs into `handoff/screenshots/` using the filenames below.
5. macOS: `Cmd+Shift+4` · Windows: `Win+Shift+S` · Chrome DevTools → Device toolbar → Capture screenshot.

> Screenshots are **not** bundled automatically (environment-specific). The handoff package includes this checklist; your team adds images to `handoff/screenshots/`.

---

## Global shell (all tabs)

**URL:** `/chores`

| # | Filename | What to show |
| --- | --- | --- |
| G1 | `00-chores-hero-tabs.png` | Full width: hero (“Chores”), subtitle, four tabs (Home active) |
| G2 | `00-chores-toast-complete.png` | After marking a task Done — green toast top-right |
| G3 | `00-chores-edit-modal.png` | Edit modal open on any task (assignee + notes visible) |
| G4 | `00-chores-skip-link.png` | Keyboard: Tab once — skip link focused (optional) |

---

## Home tab

**Path:** `/chores` → Home (default)

| # | Filename | Steps | What to show |
| --- | --- | --- | --- |
| H1 | `01-home-full.png` | Load Home | Greeting, AI suggestions, 4 stat cards, today’s task list |
| H2 | `01-home-greeting-member.png` | Tap a name under “Viewing as” | Personalized greeting + AI “Your next” card |
| H3 | `01-home-swipe-hint.png` | — | Task card with “Swipe left…” hint visible |
| H4 | `01-home-task-completing.png` | Tap **Done** | Check burst animation mid-flight |
| H5 | `01-home-stats.png` | — | Close-up of stat row after 1–2 completions |

**User instructions (client-facing):**

1. Review today’s tasks and kitchen duty in the header.
2. Optionally select your name under **Viewing as** for personalized suggestions.
3. Tap **Done** or swipe left on a task to complete.
4. Tap **Edit** to change assignee or notes.
5. Use **Assign & schedule** to open the Schedule tab.

---

## Dashboard tab

| # | Filename | Steps | What to show |
| --- | --- | --- | --- |
| D1 | `02-dashboard-full.png` | Tap **Dashboard** | Greeting, AI, 4 metrics, member cards grid |
| D2 | `02-dashboard-member-card.png` | — | One member card with mini task list |
| D3 | `02-dashboard-live-update.png` | Complete task on Home, return | Updated “today” count on card (proves real-time) |

**User instructions:**

1. Scan household-wide metrics (today / week / month).
2. Tap a member card to jump to **Users** for that person.
3. Counts update automatically when chores are completed elsewhere.

---

## Schedule tab

| # | Filename | Steps | What to show |
| --- | --- | --- | --- |
| S1 | `03-schedule-week.png` | **Schedule** → **Week** | Week day pills + task list for selected day |
| S2 | `03-schedule-week-nav.png` | Tap **Next →** / **This week** | Week navigation buttons |
| S3 | `03-schedule-assign.png` | Tap **Assign** | Drag board: pool + member columns |
| S4 | `03-schedule-drag-hover.png` | Drag task over column | Column highlight / drop state |
| S5 | `03-schedule-after-assign.png` | Drop task on member | Toast “Assigned to …” |

**User instructions:**

1. **Week:** Pick a day pill to see that day’s tasks; use Prev / This week / Next.
2. **Assign:** Drag chores from **Unassigned pool** to a household member column.
3. Tap **Edit** on any card to open the detail modal.

---

## Users tab

| # | Filename | Steps | What to show |
| --- | --- | --- | --- |
| U1 | `03-users-full.png` | **Users** tab | Member chips, hero strip, message board, task list |
| U2 | `03-users-message-board.png` | Type in message board | Sample reminder text |
| U3 | `03-users-member-switch.png` | Select different chip | Updated tasks + hero color accent |

**User instructions:**

1. Select a household member at the top.
2. Edit the **message board** for handoff notes.
3. Complete or edit tasks assigned to that member today.
4. View **This month — rooms** for rotation context.

---

## AI suggestions (any tab with cards visible)

| # | Filename | Steps | What to show |
| --- | --- | --- | --- |
| A1 | `04-ai-suggestions.png` | — | Smart suggestions panel with 2+ cards |
| A2 | `04-ai-applied.png` | Tap an action (e.g. Open assign board) | Card “Applied” + navigation |

---

## Accessibility & mobile (optional pack)

| # | Filename | Steps |
| --- | --- | --- |
| X1 | `05-mobile-home.png` | DevTools iPhone — Home tab |
| X2 | `05-focus-visible.png` | Tab through controls — violet focus ring |
| X3 | `05-reduced-motion.png` | OS: reduce motion on — static UI |

---

## Analytics (admin / optional)

Enable: `?analytics=1` on URL or admin nav flag.

| # | Filename | What to show |
| --- | --- | --- |
| Z1 | `99-analytics-console.png` | Event log panel expanded |

---

## Screenshot folder structure

```
handoff/screenshots/
  README.md
  01-home-full.png
  02-dashboard-full.png
  03-schedule-assign.png
  ...
```

After adding images, zip `handoff/` for delivery:  
`zip -r FamilySite491-handoff.zip handoff`
