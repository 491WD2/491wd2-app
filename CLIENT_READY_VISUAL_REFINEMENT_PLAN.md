# Client-Ready Visual Refinement Plan

**Status:** Active refinement direction for FamilyHub Home + Calendar  
**Constraint:** Visual polish only where safe — no Bootstrap, no localStorage resets, no module removals, no meal planning / appointment booking / business scheduling.

---

## Visual Skin Replacement Direction

**Chosen style:** Light AdminUX / Gogo-inspired premium dashboard, with FridgeWise soft aqua accents for Pantry. Dark smart-home kiosk theme is deferred.

### Typography decision

| Role | Font | Notes |
|------|------|--------|
| Headings | **Urbanist** | Rounded, modern, confident dashboard titles |
| Body / UI | **Mulish** | Clean UI text for labels, buttons, inputs, nav |
| Fallbacks | Inter → SF Pro → system-ui | Safe if Google Fonts unavailable |

Loaded via `index.html` Google Fonts link. Tokens in `src/styles/familyhub-theme.css`.

### Color tokens (edit in one place)

File: **`src/styles/familyhub-theme.css`**

- Background: soft blue/aqua atmospheric `--app-bg*`
- Surfaces: `--surface-main`, `--surface-muted`, `--surface-glass`
- Text: `--text-main`, `--text-soft`, `--text-muted`
- Brand: `--brand-primary`, `--brand-aqua`, `--brand-mint`, `--brand-amber`, `--brand-rose`, `--brand-violet`
- Soft fills: `--soft-blue`, `--soft-aqua`, `--soft-mint`, …
- Radii: cards 24px, buttons 16px, pills 999px
- Shadows: soft large panels, tiny button/card shadows — no harsh black

### Card rules

- White or glassy surface, soft border, premium shadow, large radius
- Colored **icon tile** beside title (not full-card rainbow washes)
- Ghost pill actions for secondary links
- Readable hierarchy; avoid bulky empty space and childish saturation

### Button / chip rules

- Primary: refined blue, soft rounded, subtle shadow
- Ghost / secondary: white with soft border
- Filter chips: white unselected; selected = blue/aqua fill

### Sidebar rules

- Keep slim icon sidebar
- Frosted pale mint/blue glass
- Clear active inset accent + soft blue fill
- Consistent icon tile sizing; do not change routes

### Page-specific direction

| Page | Direction |
|------|-----------|
| `/`, `/adminux` | Premium Home board (hero + kitchen + calendar + shopping + storage) — **layout preserved**, skin upgraded |
| `/calendar` | Schedule planner workspace; tokens bridged to theme |
| `/pantry` | FridgeWise aqua light-touch (tokens, pills, cards) — no logic rebuild |
| `/emergency`, `/cleaning` | Typography/token inheritance only; do not regress |

### Second design pass still needed

- Full Cleaning / Household Board kanban polish
- Dark kiosk theme (separate pass)
- Deeper AdminUX non-Home page skin consistency
- Member dashboards / Messages density pass

---

## Home Dashboard Polish Pass 2

**Status:** Done (visual-only; layout locked)  
**Date:** 2026-08-01

Second professional polish on the **exact** Home/AdminUX layout. See theme tokens below and the Start Page section for the current direction.

---

## FamilyHub Start Page / Configurable Widget Direction

**Status:** Active visual direction (shell prepared; editor deferred)  
**Date:** 2026-08-01

Home (`/` · `/adminux`) is treated as a **FamilyHub Start Page** — a household command-center dashboard inspired by configurable start pages (Bitrix “Vibe”, AdminUIX/Gogo widgets, smart-home boards). Visible title stays the household / Family Hub name; language stays household-only (widgets, family dashboard, household tools, customize layout, add widget).

### Current Home is a configurable start page

Layout remains locked:

- Left sidebar · top command bar · start header  
- Kitchen duty · Calendar (+ mini month) · Shopping · Pantry & Storage  

Cards are now **Start Page widgets** with shared anatomy, preview customization controls, and theme-driven depth. Full drag/edit mode is **not** built yet.

**Visual target:** Bitrix-style / AdminUIX / Gogo soft widgets on a smart-home tablet shell — accent rails, layered shadows, tinted headers, customize tray — not plain white prototype cards.

## Home Final Pass Against Kiosk Standard

**Status:** Done · **Date:** 2026-08-01  
**Routes:** `/` · `/adminux`

### What changed

Final Home pass so the command center matches `/kiosk` language:

- Page root uses `fh-pro-page` + `fh-home-pro`
- Hero is a clean `fh-pro-card` (no rails/glows)
- Customize / Add widget / Theme are quiet secondary controls
- Section titles use `fh-pro-section-title` (“Today at home”, “Household lists”, “Upcoming”, “Storage”, “Today’s chores”)
- Cards use `fh-pro-card` via `StartPageWidget`
- Empty states use `fh-pro-empty`
- Actions use `fh-pro-btn` / `fh-pro-btn--ghost` / `fh-pro-btn--primary`
- Kitchen chores + calendar events + shopping items use `fh-pro-list-row`
- Storage mini stats use `fh-pro-stat`
- Removed busy shopping summary chips / decorative composer tray / leftover storage hint

### Pro classes used on Home

`fh-pro-page`, `fh-pro-card`, `fh-pro-section-title`, `fh-pro-stat`, `fh-pro-list-row`, `fh-pro-btn`, `fh-pro-btn--ghost`, `fh-pro-btn--primary`, `fh-pro-empty`

Home-only helpers: `.fh-home-pro*`, `.fh-home-customize*` in `familyhub-pro.css`.

### Remaining Home design issues (later)

- Optional quick-action grid like `/kiosk` (Add Task / Add Grocery) if product wants parity
- Live customize/theme editor still preview-only
- Dense chore lists could share a single KioskRow component later

---

## Wall Display Professional Style as App Standard

**Status:** Active app-wide visual standard  
**Date:** 2026-08-01  
**Reference route:** `/kiosk` (full kiosk board + Office Inventory light cards). There is no `/wall-display` route — sidebar “Wall display” maps to `/kiosk`.

### Why Wall Display is the standard

The user preferred the Wall Display / Kiosk professionalism over decorative Home widget chrome. The product look is now:

- Calm pale blue/aqua page (`#f7f9fc` family)
- Clean white cards, subtle border, soft shadow
- Uppercase section labels
- Compact stats + quick-action patterns
- Blue icon accents, not pastel overload
- Family command center — not a toy widget board

### Shared layer

| Piece | Location |
|-------|----------|
| Theme tokens | `src/styles/familyhub-theme.css` |
| Kiosk tokens | `src/styles/familyhub-kiosk-tokens.css` |
| **Pro bridge** | `src/styles/familyhub-pro.css` (`.fh-pro-*` + page bridges) |
| Light kiosk kit | `fh-kiosk-home__*` / `KioskPageShell`, `KioskStatCard`, `KioskActionCard`, … |
| Home structure | `NotionHomeWorkspace` + simplified start widgets |

Primitives: `.fh-pro-page`, `.fh-pro-card`, `.fh-pro-section-title`, `.fh-pro-stat`, `.fh-pro-action`, `.fh-pro-list-row`, `.fh-pro-btn`, `.fh-pro-empty`.

### Page-by-page notes

| Page | Application |
|------|-------------|
| Home `/` `/adminux` | Decorative widget rails/glows stripped; clean white cards; Wall Display section labels; calm hero |
| Calendar `/calendar` | Decorative blurs removed; white workspace/toolbar cards |
| Shopping `/shopping` | Canvas + cards bridged to pro/kiosk surfaces |
| Pantry `/pantry` | Same canvas/card bridge; existing kiosk home kit |
| Cleaning `/tasks` | Hero glow off; white hero/filter bars |
| Emergency | Already close; inherits pale shell |
| Messages | Existing `fh-kiosk-home` list rows + pro shell bg |
| Settings | `wd-settings-ref` cards aligned to white pro cards |
| Kiosk `/kiosk` | Source of truth (full board Tailwind + guided station) |

### What remains

- Deeper Chores kanban density pass
- Optional migrate KioskPage Tailwind helpers onto `.fh-pro-*`
- Real theme editor in Settings
- Widget reorder/editor (separate from this style pass)

---

### Home Dashboard Polish Pass 3 — Shopping and Pantry Widgets

**Status:** Done (visual-only; layout locked) · **Date:** 2026-08-01

Focused polish so Shopping and Pantry & Storage read as finished premium widgets. Kitchen/Calendar densified lightly. Structure unchanged.

| Widget | Improvements |
|--------|----------------|
| **Shopping** | Subtitle, summary chip strip, denser list rows + category when present, mint quantity pills, inset Quick add composer, footer chips |
| **Pantry & Storage** | Shorter copy, “Storage areas” label, `MiniStatCard` tiles, muted Storage hint, polished quick-link pills |
| Kitchen | Richer duty hero panel + empty-state fills dead space |
| Calendar | Agenda left accent; stronger today ring |

**Tokens/classes:** `familyhub-theme.css`, `familyhub-start-page.css` (`.fh-shop-widget*`, `.fh-mini-stat*`, `.fh-storage-widget*`), `MiniStatCard` in `src/components/startPage/`.

**Shopping structure:** Header → summary chips → rows/empty → Quick add composer → footer (Shopping list · Quick add · Household).

**Pantry structure:** Header → short copy → Storage areas mini stats → hint → footer quick links.

**Later:** widget editor/reorder, theme switcher, pantry detail dashboard, shopping category workflows.

### Widget card anatomy

Components: `src/components/startPage/`

| Piece | Component / class | Role |
|-------|-------------------|------|
| Shell | `StartPageWidget` · `.fh-start-widget` | Premium glass/white widget chrome |
| Header | `WidgetHeader` · `.fh-start-widget__header` | Icon + title + subtitle + actions |
| Icon tile | `WidgetIconTile` · `.fh-start-widget__icon` | Colored square/circle accent |
| Action | `WidgetActionPill` · `.fh-start-widget__action` | Ghost pill (Open chores / calendar / …) |
| Menu | `WidgetMenuButton` · `.fh-start-widget__menu` | 3-dot preview (disabled) |
| Body | `.fh-start-widget__body` | Widget content |
| Empty | `WidgetEmptyState` · `.fh-start-widget__empty` | Soft inset empty panel |
| Footer | `WidgetFooter` / `WidgetMetaChip` | Meta chips / quick links |

Styles: `src/styles/familyhub-start-page.css` (+ shell accents in `familyhub-smart-dash.css`).

### Theme variables controlling the look

Edit **`src/styles/familyhub-theme.css`**:

| Intent | Tokens |
|--------|--------|
| Colors / atmosphere | `--app-bg*`, `--brand-primary`, `--brand-aqua`, `--soft-*` |
| Fonts | `--font-heading`, `--font-body`, `--font-ui` |
| Card radius | `--radius-widget` (≈26px), `--radius-card` |
| Card shadow | `--shadow-widget`, `--shadow-widget-hover` |
| Surfaces | `--surface-widget*`, `--surface-sidebar`, `--surface-hero` |
| Borders | `--border-widget`, `--border-soft`, `--border-divider` |

Later customization (not wired yet): widget **order**, **visibility**, and **density** will read from preferences — do not invent a new localStorage key in this pass.

### Sidebar rules

- Full-text frosted ice/blue app shell  
- Active route = white pill + blue icon circle + soft shadow  
- Inactive icons in soft circular chips  
- Uppercase section labels with tracking  
- Intentional member/account footer pill when present  
- **Do not change routes**

### Top bar rules

- Translucent white command chrome  
- Soft bottom border  
- Compact breadcrumb  
- Circular icon buttons  
- Polished notification badge  

### Hero / start header rules

- Greeting + household title + status pills + clock  
- Preview controls: **Customize** · **Add widget** · **Theme** (disabled; tooltip “Layout editing coming later.”)  
- Feels like a Start Page header / family command strip  

### Customization controls planned

| Control | Now | Later |
|---------|-----|-------|
| Customize | Preview disabled button | Real edit-layout mode |
| Add widget | Preview disabled button | Widget picker |
| Theme | Preview disabled button | Theme switcher |
| Widget ⋮ menu | Disabled helper | Hide / move / settings |
| Drag / reorder | — | Yes |
| Visibility toggles | — | Yes |
| Publish start page | — | Optional household publish |

### How to restyle later (without a rebuild)

1. Colors / fonts / radius / shadows → `familyhub-theme.css`  
2. Widget chrome / customize bar → `familyhub-start-page.css`  
3. Shell sidebar / top bar / hero grid → `familyhub-smart-dash.css`  
4. Widget order / visibility / density → future preferences + Start Page editor (not in this pass)

### What remains for later

- Real edit layout mode  
- Widget picker + drag/reorder  
- Theme switcher wired to tokens  
- Per-widget visibility toggles  
- Cleaning / Household Board kanban polish  
- Dark wall-tablet / kiosk theme  
- Non-Home AdminUX pages to the same widget density  

---

## Home Dashboard Template Style Spec

The current Home/AdminUX **structure is locked**:

- Slim left sidebar + top app bar
- Hero (greeting, status chips, clock)
- Kitchen duty + Calendar (activities + mini month)
- Shopping + Pantry & Storage

### Theme token file

`src/styles/familyhub-theme.css` — **edit this file** to restyle the app later:

1. Change `--brand-primary` / `--brand-aqua` for brand color
2. Change `--font-heading` / `--font-body` for type
3. Change `--radius-card` / `--shadow-card` for chrome weight
4. Change `--app-bg-start` / `--app-bg-middle` / `--app-bg-end` for atmosphere

### Hero rules

- Frosted white elevated card
- Confident Urbanist title + large tabular clock
- Status chips as soft pills (not candy tiles)

### What remains for later

- Optional dark wall-tablet theme
- Deeper FridgeWise inventory card components
- Non-Home module gallery cleanup where still childish

---

## Schedule Dashboard Reference Direction

Modern schedule/task dashboard screenshots are used as **visual inspiration only**. FamilyHub keeps household language, existing routes, and existing `FamilyData`.

### How the references map to FamilyHub

| Reference pattern | FamilyHub translation |
|-------------------|------------------------|
| Clean white workspace | Light page canvas (`#f4f7fb`) + white surfaces |
| Compact top segmented navigation | `SegmentedModeBar` on Calendar |
| Narrow structured sidebar / right rail | Right **Upcoming / Needs attention** panel |
| Polished toolbar controls | Add activity · Today · Find · Group · Filter · avatars |
| Pastel schedule cards | `ScheduleCard` + category pastel tokens |
| Kanban task cards | Future Cleaning / Household Board (placeholder now) |
| Soft shadows + thin dividers | Shared `.fh-sched-*` / refined Home cards |
| Grouped responsible people | **Family member** avatar chips |
| Waiting list | **Upcoming / Needs attention** |
| Task list | Chores / Cleaning Task List |
| Notes | Messages |
| Schedule planner | Calendar |

### Pages that should use this style

| Page | Priority | Notes |
|------|----------|--------|
| `/calendar` (and `/planner`) | **Now** | Primary schedule dashboard shell |
| `/` and `/adminux` Home | **Now** | Compact hero + refined white stat cards |
| `/cleaning` + kitchen/chores | **Later** | Task List / Kanban / By Member / By Day / Table |
| `/messages` | Later | Align Notes density with dashboard cards |
| `/projects` | Later | Keep Projects module; match card chrome |
| `/emergency` | Keep calm utility look; borrow soft borders only |

### Design patterns to reuse

1. **White main workspace** on a very light blue/off-white page background  
2. **Colored icon tiles** instead of full-card rainbow gradients  
3. **Pastel event/task fills** with dark readable text  
4. **Soft status badges** for Travel / Tentative / School / Chore  
5. **Sticky notes** for No School / Conferences / Staff / First–Last day  
6. **Compact avatar chips** for family member filtering  
7. **Segmented mode bar** for Schedule / Tasks / Board / Projects / Notes  
8. **Right rail** for upcoming + needs attention (not a second data store)

Shared CSS: `src/styles/schedule-dashboard.css`  
Shared components: `src/components/schedule/*`

### Business terminology to avoid

Do **not** use:

- Team / employees / clients / customers  
- Agency / marketing / training  
- Work hours / capacity / revenue / billing  
- Appointment booking / business scheduling  

Use instead:

| Avoid | Prefer |
|-------|--------|
| Team | Family |
| Responsible | Family member |
| Waiting list | Upcoming / Needs attention |
| Task list (corporate) | Chores / Tasks |
| Kanban board | Household board |
| Notes (CRM) | Messages / Notes |
| Schedule planner (ops) | Calendar |

### Implementation notes — Calendar

**Done in this pass**

- Default landing is the light **Schedule Planner** workspace (guided “Station” still available)  
- Top modes: Schedule Planner · Task List · Household Board · Projects · Notes  
- Compact toolbar with search, filters, family avatars, notifications badge  
- Main white calendar surface (month / week / day / list)  
- Right **Upcoming / Needs attention** panel (school stickies when present, activities, travel styling, chores due soon)  
- Sticky-note + travel/tentative **visual** support (no invented school dates)  
- Projects → `/projects`, Notes → `/messages`, Task List / Cleaning placeholders link to existing modules  

**Not in this pass**

- Full Travel dashboard  
- Recurring expansion / school date import  
- Full household kanban rebuild  

### Implementation notes — Home (`/adminux`)

**Done in this pass**

- Smaller white hero (no large pastel gradient wash)  
- Summary cards use **refined** white surfaces + colored icon squares  
- More compact family member cards  
- Keep all existing sections: shopping, pantry, kitchen/chores, messages, upcoming, notifications, subscriptions, projects  
- Soften “Billing tools” helper copy  

### Implementation notes — Cleaning / Chores (future)

Kanban/task-list screenshots inform a later Cleaning polish. Planned views:

- Task List  
- Kanban / Household Board  
- By Family Member  
- By Day  
- Table  
- Today / Overdue / This Week sections  

Do not rebuild Cleaning in the Calendar visual pass unless shared tokens land naturally.

---

## Shared components

| Component | Path | Role |
|-----------|------|------|
| `SegmentedModeBar` | `src/components/schedule/SegmentedModeBar.tsx` | Top mode tabs |
| `FamilyAvatarStack` | `src/components/schedule/FamilyAvatarStack.tsx` | Member chips |
| `SoftStatusBadge` | `src/components/schedule/SoftStatusBadge.tsx` | Soft badges |
| `StickyNote` | `src/components/schedule/StickyNote.tsx` | School sticky visuals |
| `ScheduleCard` | `src/components/schedule/ScheduleCard.tsx` | Pastel activity/travel cards |
| `UpcomingPanel` | `src/components/schedule/UpcomingPanel.tsx` | Right rail |

Also extended: `src/lib/calendarActivityStyles.ts` (Travel, No School, Activity, Household, Chores, Reminder).

---

## Safety checklist

- [x] No Bootstrap import or template paste  
- [x] No localStorage key change / reset  
- [x] No FamilyData overwrite  
- [x] Routes and modules preserved  
- [x] No meal planning / appointment booking / business scheduling  
- [x] No fake school calendar dates invented  
