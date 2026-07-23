# FamilyHub Calendar — Focused Household Implementation Plan

**Status:** Plan only — no source code changes in this pass.  
**Calendar year for known dates:** **2026** (matches existing seed/demo dates in `FamilyData`).  
**Scope boundary:** School markers, two recurring kid activities, L&H travel blocks, tentative styling, and a *future* Travel section connection. Do **not** build meal planning, appointment booking, business scheduling, home maintenance, finance, or the large Stage 1 calendar architecture.

---

## 1. Existing calendar architecture found

### Routes

| Route key | Path | Renders | Notes |
|-----------|------|---------|--------|
| `calendar` | `/calendar` | `CalendarPage` | Primary sidebar + bottom-nav calendar |
| `planner` | `/planner` | **same** `CalendarPage` | Household tool label “Planner”; gated with `moduleKey="calendar"` |

Wiring: `src/components/layout/shellRoutes.ts`, `src/CurrentBuild.tsx`, `src/components/layout/SidebarNav.tsx`, `src/components/layout/AppShell.tsx`.

`src/pages/PlannerPage.tsx` exists as a simple planner list editor but is **not routed** (orphan). Live calendar/planner UX is `CalendarPage`.

### Components (calendar-relevant)

| File | Role |
|------|------|
| `src/pages/CalendarPage.tsx` | Main calendar UI: plan / month / week / day / list, filters, event CRUD drawer, Google embed links |
| `src/components/calendar/CalendarPlanningView.tsx` | Planning board |
| `src/components/calendar/WeeklyPlannerBoard.tsx` | Week columns |
| `src/components/calendar/CalendarEventCard.tsx` | Event card over planning-board items |
| `src/components/calendar/MemberScheduleStrip.tsx` | Member filter strip |
| `src/components/calendar/ReminderPanel.tsx` | Reminders panel |
| `src/components/calendar/AdminUxFullCalendar.tsx` | FullCalendar wrapper — **currently unused** elsewhere |
| `src/components/events/UpcomingEventsList.tsx` | Shared “upcoming” list (AdminUX + member surfaces) |
| `src/lib/upcomingEvents.ts` | `selectUpcomingEventsForHousehold` / member selectors |
| `src/lib/calendarPlannerData.ts` | Merges planner + chores + pantry + notifications → board items |
| `src/lib/calendarActivityStyles.ts` | Category → Tailwind visual tokens |
| `src/lib/calendarTodayNotifications.ts` | Today’s planner → notification synthesis |
| `src/types/calendarPlanner.ts` | Planning-board item types |

AdminUX “Today & upcoming” card: `src/pages/AdminUxHouseholdDashboard.tsx` uses `selectUpcomingEventsForHousehold` + `UpcomingEventsList`, navigates to `/calendar`.

### Data source

- **Single source of truth:** `FamilyData.planner: PlannerEvent[]`
- **Also:** `FamilyData.calendarLinks: CalendarLink[]` (Google embed, etc.)
- **Persistence:** entire `FamilyData` snapshot under localStorage key  
  `familysite-491:first-family-build` (`FAMILY_DATA_STORAGE_KEY` in `src/data/localFamilyRepository.ts`)
- **Normalization:** `normalizePlannerEvent` in `src/data/familyMigrations.ts` (`pickOrPreserve` for category — unknown categories are kept, not wiped)
- **Seed today:** three events (`plan-1` Family planning reset, `plan-2` Taco night / Meals, `plan-3` School forms due) — all May 2026
- **Cloud mirror:** Supabase `planner_events` / `calendar_links` (same field shapes including `repeat_enabled` / `repeat_rule`)

### Current event schema (`PlannerEvent`)

```ts
{
  id, title, date /* YYYY-MM-DD */, time,
  category: PlannerEventCategory,
  assignedMemberId, assignedPerson, assignedMemberIds?,
  responsibleAdultId?,
  startTime?, endTime?, isAllDay?,
  repeatEnabled?, repeatRule?: "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom later",
  location?, notes?,
  prepChecklist?, reminderSettings?,
  createdAt?, updatedAt?
}
```

**Gaps vs this focused build:**

| Need | Current support |
|------|-----------------|
| Multi-day range (travel) | **No `endDate`** — only a single `date` |
| Event tags | **None** on `PlannerEvent` (tags exist on docs/projects only) |
| Tentative status | **None** |
| No-school reason / sticky subtype | **None** (only category + notes) |
| Recurring expansion | Fields exist; **occurrences are not generated** — each row is one dated event |
| School calendar legend colors | **None** |

### Current category / tag support

**Typed categories** (`PlannerEventCategory`):  
`Family | School | Sports | Medical | Work | Church | Errand | Social | Personal | Other | Meals | Home`

**Default customization list** (`plannerCategories`): omits `Meals` / `Home`.  
Custom lists: `adminSettings.customization.calendarCategories` via `getCalendarCategories()`.

**CalendarPage filter chips** (label → stored category):  
All | Household→Family | School | Work | Cleaning→Sports | Shopping→Errand | Personal  

**Tags:** not on planner events. Search on CalendarPage covers title / category / location (and related text), not freeform tags.

### Recurring events today

- UI can set `repeatEnabled` + `repeatRule` in the event drawer.
- Selectors (`upcomingEvents`, hub dashboard, planning board) do **not** expand Weekly/etc. into future occurrences.
- Chore recurrence is a **separate** system (`Task.frequency` / `getNextDueDate`) — do not conflate.

### Date utilities (prefer local)

| Prefer | Avoid / note |
|--------|----------------|
| `parseLocalDate`, `formatIsoLocal`, AdminUX `localTodayIso` | Several calendar helpers use `toISOString().slice(0, 10)` (UTC skew risk) |

Seed and shopping dates already use **2026** — use 2026 for L&H trips unless product direction changes.

### Household roster (for assignees)

Canonical order → stable IDs:

| ID | Name |
|----|------|
| `member-1` | Lorraine |
| `member-2` | Hershel |
| `member-3` | Stella |
| `member-4` | Nox |
| `member-5` | Jeremiah |
| `member-6` | Selena |

**Steve** is not a roster member — “L&H with Steve” should assign Lorraine + Hershel and note Steve in title/notes/location, not invent a member.

### Sidebar / navigation today

- Primary: Calendar (`/calendar`)
- Household tool: Planner (`/planner` → same page)
- No Travel route, no Travel sidebar entry, no travel module key
- Do **not** remove Pets, Subscriptions, Projects, Photos, Planner, Routines, Shopping, Pantry, Emergency Planning, or Settings

---

## 2. Focused calendar requirements

### 2.1 School calendar markers

| Marker | Intent | Visual (suggested; override if school legend differs) |
|--------|--------|------------------------------------------------------|
| No School (full closure) | Day off school | Dark / black sticky note |
| Conference / partial closure | Partial day / conferences | Blue sticky note |
| First day of school | Milestone | Yellow sticky note |
| Last day of school | Milestone | Yellow sticky note |
| Color-coded school days | Match uploaded school calendar legend when available | Legend-driven |

**Sticky-note No School display**

- Sticky-note treatment on month/week/day (and list where sensible)
- **Reason at the bottom** of each sticky, e.g.:
  - Conferences
  - Holiday
  - Staff day
  - Break
  - Teacher in-service
  - Weather closure (if ever needed)

### TODO — school dates unavailable

> **Waiting for school calendar image/date list.**

Exact No School dates, first/last day of school, and legend colors are **not in the repo** (no school calendar image, PDF, CSV, or date list found). Do **not** invent school dates. Phase 3 should ship sticky rendering + data shape + reason field, and load real dates only after the family provides the calendar image/list.

### 2.2 Recurring activities

| Who | Activity | Cadence | Time |
|-----|----------|---------|------|
| Nox (`member-4`) | Horses | Every Friday | 4:30 PM |
| Jeremiah (`member-5`) | Bowling | Every Wednesday | 6:30 PM |

Category: **Activity** (recommended household category).  
Requires either occurrence expansion for `repeatRule: "Weekly"` or a safe helper that materializes a bounded set of instances for the visible range / upcoming list.

### 2.3 L&H travel events (2026)

L&H = **Lorraine & Hershel** (`member-1`, `member-2`).

| Trip | Dates (2026) | Status |
|------|--------------|--------|
| L&H Utah trip | Jul 24 – Jul 29 | Confirmed |
| L&H Texas trip | Aug 1 – Aug 16 | Confirmed |
| L&H Newport trip | Aug 30 – Sep 3 | Confirmed |
| L&H with Steve | Sep 10 – Sep 15 | **Tentative / not confirmed** |
| Lorraine WA trip | Sep 19 – Sep 25 | Confirmed (Lorraine; Hershel may or may not go — default assignee Lorraine; clarify later if needed) |

**Tentative visual cues (required for L&H with Steve):** dashed border, “Tentative” badge, and/or lighter opacity.

### 2.4 Future Travel section (plan only — do not build now)

Later Travel dashboard/section should be reachable from the Calendar area via:

1. Tag search (e.g. `travel`, destination tags)
2. Dropdown under the calendar sidebar
3. Travel category / filter

Future Travel fields (data needs for later):

- Trip list
- Destination
- Dates (start / end)
- Family members traveling
- Tentative status
- Packing notes
- Travel notes
- Reservation / document placeholders (later)
- Filter by person / destination / tag

This pass: **document data needs + Calendar connection only** (Phase 6 placeholder UI, Phase 7 full dashboard).

---

## 3. Recommended calendar event categories

Household-friendly set for this focused build (additive; keep legacy categories working via `pickOrPreserve` / customization merge):

| Category | Use |
|----------|-----|
| **School** | School days, school milestones, school-related events |
| **No School** | Closure / sticky-note days (reason in dedicated field or notes convention) |
| **Activity** | Recurring kid activities (horses, bowling) |
| **Travel** | Trip blocks / travel events |
| **Household** | General household (prefer over overloaded “Family” long-term; map or dual-support) |
| **Chores** | Calendar-visible chore anchors if shown as events (optional; chores already have their own module) |
| **Reminder** | Lightweight reminders on the calendar |
| **Tentative** | Optional category *or* prefer a **status flag** (`isTentative`) so Travel stays Travel while looking tentative |

**Recommendation:** Prefer `isTentative: boolean` (or `status: "confirmed" | "tentative"`) over forcing category `"Tentative"`, so filters by Travel still work. Still allow `"Tentative"` as a filter chip alias that matches `isTentative === true`.

Keep existing categories (`Family`, `Sports`, `Medical`, …) so stored user events do not break. Extend `PlannerEventCategory` union + `plannerCategories` / Settings customization defaults carefully (additive).

---

## 4. Recommended visual styling

| Kind | Style |
|------|--------|
| No School full closure | Dark / black sticky note; reason text pinned to bottom |
| Conference / partial | Blue sticky note; reason at bottom |
| First / Last day of school | Yellow sticky marker (badge or sticky) |
| School legend days | Follow uploaded legend when available; otherwise School category sky tokens already in `calendarActivityStyles.ts` |
| Recurring Activity | Distinct Activity color (e.g. amber/teal block — pick one clear token in `calendarActivityStyles`) + optional “Repeats weekly” hint |
| Travel trip blocks | Multi-day bar / span on month+week; destination in title; Travel color (e.g. indigo/teal distinct from School) |
| Tentative travel | Dashed border + “Tentative” badge + reduced opacity |

Implementation home for tokens: extend `src/lib/calendarActivityStyles.ts` + calendar CSS (`calendar-planner.css` / CalendarPage scoped classes). Sticky notes may need a small dedicated CSS block (`.fh-cal-sticky`, `.fh-cal-sticky--dark`, `.fh-cal-sticky--blue`, `.fh-cal-sticky--yellow`).

---

## 5. Safe data strategy

**Hard constraints:** Do not reset localStorage. Do not change `FAMILY_DATA_STORAGE_KEY`. Do not overwrite `FamilyData` wholesale. No destructive migration.

### Recommended approach (layered)

1. **Schema: additive only**  
   - Optional fields on `PlannerEvent`, e.g.:
     - `endDate?: string` (multi-day travel / school spans)
     - `isTentative?: boolean`
     - `tags?: string[]` (for Travel + school reason tags later)
     - `noSchoolReason?: string` (or encode reason in `notes` with a stable prefix until schema lands)
     - `displayStyle?: "sticky" | "block" | "marker"` (optional)
   - `normalizePlannerEvent` should **default missing fields**, never drop unknown categories or existing events.

2. **Seed / demo loader — non-destructive**  
   Prefer a helper such as `ensureFocusedHouseholdCalendarEvents(data): FamilyData` that:
   - Runs only when called from an explicit “Load household calendar demo” control **or** when planner is empty / missing known demo IDs
   - Inserts by **stable IDs** (`plan-nox-horses-…`, `plan-lh-utah-2026`, …) only if that ID is absent
   - Never deletes or replaces user-created events
   - Never clears `planner`

3. **Do not** replace `initialFamilyData.planner` in a way that clobbers live localStorage on load. Existing repository merge/migration already preserves stored snapshots; keep it that way.

4. **School dates:** ship empty school dataset + UI stubs until calendar image/list arrives; then import via the same additive ID-guarded loader.

5. **Recurring activities:**  
   - Store master rows with `repeatEnabled: true`, `repeatRule: "Weekly"`, correct `startTime`  
   - Plus a **bounded occurrence expander** for visible range / upcoming (do not invent infinite DB rows)  
   - Or materialize N weeks of instances with stable IDs once via demo loader (simpler short-term; expander is better long-term)

6. **Travel multi-day without breaking old UI:**  
   - Add optional `endDate`; render spans where views understand it  
   - Fallback: if `endDate` absent, behave as today (single `date`)  
   - Upcoming selectors: include event if `today` is between `date` and `endDate` (inclusive)

7. **Preserve Google `calendarLinks` and all other modules.**

---

## 6. Files likely needing edits

*(Implementation later — listed for scoping.)*

### Data / types / normalization

- `src/data/familyData.ts` — `PlannerEvent` fields, category union, optional seed helpers (careful)
- `src/data/familyMigrations.ts` — `normalizePlannerEvent` additive defaults
- `src/lib/customization.ts` — default calendar category lists if defaults change
- `src/data/supabaseMappers.ts` + Supabase migration (only if cloud sync must carry new fields)
- **New (recommended):** `src/lib/focusedHouseholdCalendarSeed.ts` (or similar) — ID-guarded additive loader
- **New (recommended):** `src/lib/plannerRecurrence.ts` — weekly occurrence expansion for visible range
- **New (later):** `src/data/schoolCalendarDates.ts` — empty placeholder + TODO until real list arrives

### Calendar UI / styles

- `src/pages/CalendarPage.tsx` — categories chips, filters, sticky rendering, multi-day, tentative, Travel sidebar dropdown placeholder
- `src/lib/calendarActivityStyles.ts` — Activity / Travel / No School / sticky tokens
- `src/components/calendar/calendar-planner.css` — sticky-note + tentative styles
- `src/components/calendar/CalendarEventCard.tsx` — sticky / tentative / travel span presentation
- `src/components/calendar/WeeklyPlannerBoard.tsx` / `CalendarPlanningView.tsx` — display hooks
- `src/components/calendar/AdminUxFullCalendar.tsx` — only if brought online later (out of focused scope unless needed)

### Upcoming / dashboards

- `src/lib/upcomingEvents.ts` — date-range + tentative labels; recurrence awareness
- `src/components/events/UpcomingEventsList.tsx` — optional Tentative badge
- `src/pages/AdminUxHouseholdDashboard.tsx` — only if card copy/filter needs Travel awareness (minimal)
- `src/lib/familyHubDashboardData.ts` — if hub upcoming should respect `endDate` / recurrence

### Navigation (Phase 6 placeholder only)

- `src/components/layout/shellRoutes.ts` — **do not** add full Travel route yet; optional future `travel` key noted in comments/plan only until Phase 7
- `src/components/layout/SidebarNav.tsx` — calendar-area dropdown placeholder (not a new top-level module removal of anything)
- `src/CurrentBuild.tsx` — Phase 7 only for Travel page mount

### Settings (if categories become customizable defaults)

- `src/components/settings/CustomizationCenter.tsx` / Settings customization surfaces that list `calendarCategories`

---

## 7. Implementation phases

### Phase 1 — Categories / types and visual styles

- Extend category allowlist + customization defaults for: School, No School, Activity, Travel, Household, Chores, Reminder (and Tentative as filter alias if using status flag)
- Add optional schema fields: `endDate`, `isTentative`, `tags`, `noSchoolReason` (or agreed notes convention)
- Extend `calendarActivityStyles` + sticky/tentative CSS tokens
- Keep all legacy categories valid

**Exit criteria:** Types + styles exist; old events still normalize and render.

### Phase 2 — Focused household calendar seed / helper (safe)

- Add ID-guarded additive loader for:
  - Nox horses (weekly Friday 16:30)
  - Jeremiah bowling (weekly Wednesday 18:30)
  - Five L&H / Lorraine travel events (2026 dates above; Steve trip `isTentative: true`)
- School entries: **skip dates**; leave TODO hook / empty module
- Never wipe planner; never change storage key

**Exit criteria:** Demo load can be invoked safely on a populated household without deleting user events.

### Phase 3 — No-school sticky note rendering

- Sticky-note component/styles (dark / blue / yellow variants)
- Reason at bottom (`noSchoolReason` or notes)
- Wire month/week/day (and list) for `No School` + first/last markers
- **Still waiting for school calendar image/date list** before filling real dates

**Exit criteria:** Sticky UI works with 1–2 fixture events for visual QA; production school dates remain TODO.

### Phase 4 — Recurring activity display

- Weekly expander (preferred) or bounded materialization
- Show horses Fridays / bowling Wednesdays in month/week/list + upcoming feed
- Assign Nox / Jeremiah correctly

**Exit criteria:** Upcoming + calendar views show next several weeks of both activities without duplicating on every reload.

### Phase 5 — Travel event display + tentative styling

- Multi-day travel blocks using `endDate`
- Utah / Texas / Newport / Steve / WA trips
- Tentative: dashed border, badge, lighter opacity for Steve trip
- Upcoming list includes in-range travel days

**Exit criteria:** All five trips visible with correct date spans; Steve trip clearly tentative.

### Phase 6 — Calendar sidebar dropdown / tag search placeholder for Travel

- Under Calendar sidebar (or CalendarPage side panel): dropdown entry “Travel (coming soon)” or filter chip Travel
- Tag search stub recognizing `travel` / destination tags when `tags` exist
- **Do not** build full Travel dashboard

**Exit criteria:** User can discover Travel-from-Calendar path; no new destructive routes; existing tools remain.

### Phase 7 — Build Travel dashboard later

- Dedicated Travel section/page (route + module visibility when ready)
- Trip list UI with destination, dates, members, tentative, packing/travel notes
- Filters: person, destination, tag
- Reservation/document placeholders
- Deep-link from Calendar Travel filter/dropdown

**Exit criteria:** Out of scope for this focused calendar pass — tracked only.

---

## 8. Missing information

### School calendar

**Exact school dates are missing.**

No school calendar photo, PDF, CSV, or date list exists in `/Users/stellaroskens/491WD2`.

> **Waiting for school calendar image/date list.**

Needed before Phase 3 can be fully data-complete:

- [ ] No School dates + reasons (Conferences, Holiday, Staff day, Break, Teacher in-service, Weather, …)
- [ ] First day of school
- [ ] Last day of school
- [ ] Legend colors (if different from suggested black / blue / yellow)

Until then: implement **structure + visuals only**; do not invent dates.

### Clarifications (nice to have, not blockers for Phases 1–2/4–5)

- [ ] Lorraine WA trip: Lorraine only vs L&H?
- [ ] Horse / bowling locations (optional `location`)
- [ ] Timezone confirmation (seed Google embed uses `America/Los_Angeles` — assume Pacific for local day math)
- [ ] Whether Steve trip should also tag an external guest name field later

---

## Appendix A — Proposed demo event IDs (stable, additive)

| ID | Title | Notes |
|----|-------|-------|
| `plan-nox-horses-weekly` | Nox — Horses | Weekly Fri 16:30; Activity; Nox |
| `plan-jeremiah-bowling-weekly` | Jeremiah — Bowling | Weekly Wed 18:30; Activity; Jeremiah |
| `plan-lh-utah-2026` | L&H Utah trip | 2026-07-24 → 2026-07-29; Travel |
| `plan-lh-texas-2026` | L&H Texas trip | 2026-08-01 → 2026-08-16; Travel |
| `plan-lh-newport-2026` | L&H Newport trip | 2026-08-30 → 2026-09-03; Travel |
| `plan-lh-steve-2026` | L&H with Steve | 2026-09-10 → 2026-09-15; Travel; **tentative** |
| `plan-lorraine-wa-2026` | Lorraine WA trip | 2026-09-19 → 2026-09-25; Travel |

School IDs: defer until date list arrives (`plan-school-noschool-YYYYMMDD-…`, `plan-school-first-day-…`, etc.).

---

## Appendix B — Out of scope (explicit)

- Full Stage 1 calendar architecture rewrite
- Meal planning
- Appointment booking / business scheduling
- Home maintenance calendars
- Finance
- Removing or replacing Pets, Subscriptions, Projects, Photos, Planner, Routines, Shopping, Pantry, Emergency Planning, Settings
- Changing localStorage key / resetting storage / destructive FamilyData overwrite
- Full Travel dashboard (Phase 7 only)

---

## Appendix C — Recommended first implementation step

**Start with Phase 1:** additive `PlannerEvent` fields + household categories + visual style tokens (including sticky/tentative CSS), with migrations that only default missing fields.

That unlocks safe Phase 2 seeding and keeps UI work from fighting the type system. Defer school **dates** until the calendar image/list is provided; do not block Phases 1–2 / 4–5 on school data.
