# FamilyHub Capsule Architecture

**Project:** FamilyHub / FamilySite_491 (`familysite-491`)  
**Workspace:** `/Users/stellaroskens/491WD2`  
**Document type:** Architecture / planning only — **no source code, packages, localStorage, or keys changed by this document.**  
**Storage key (do not change):** `familysite-491:first-family-build`  
**Last updated:** 2026-07-22  
**Phase status:** Phase 1 (this document)

---

## 1. Product intent

FamilyHub is a household kiosk app for a Surface Pro in **vertical (portrait) kiosk mode**. The primary landing experience is a **wake-up / command page**: a shared family home base where anyone can see the day and add household items without digging into dashboards or entering a PIN.

### Design targets

| Target | Requirement |
|--------|-------------|
| Device | Surface Pro, vertical kiosk |
| Orientation | Portrait-first; still responsive on desktop and mobile |
| Layout | Clean card layout; soft FamilyHub visual style |
| Contrast | Readable contrast on pastel / soft surfaces |
| Density | No cluttered admin-template command layout |
| Auth in main flow | **No PIN entry** on the wake page or main household path |
| Navigation wording | Use **Home** to return to the wake page — **do not** use “Switch Member” in main UI |

### Household members (intended roster)

Wake-page member buttons, in display order:

1. Hershel  
2. Lorraine  
3. Stella  
4. Nox  
5. Jeremiah  
6. Selena  

> **Data note (do not implement in Phase 1):** Existing `FamilyData` / canonical roster may differ (e.g. spelling, missing Selena). Preserve existing members and fields; align roster via Settings / member data later — never by wiping storage.

---

## 2. Navigation model (high level)

```
Wake Page (Home / command center)
    │
    ├─ tap member card ──► Member Home (personal)
    │                         └─ Home button ──► Wake Page
    │
    ├─ Quick Add ──► shopping / pantry (+ chores later)
    │
    ├─ preview cards ──► deep module pages (Shopping, Calendar, …)
    │
    └─ Sidebar
           PRIMARY → daily household modules
           HOUSEHOLD TOOLS → secondary modules (not wake-page cards)
           SYSTEM → Settings
```

### PIN policy (main flow)

- Wake page is **not** a PIN login screen.
- Main flow: open app → wake page → optional member home via member cards.
- Existing PIN fields on `FamilyMember` / kiosk settings **remain in data** (do not delete).
- Stop using PIN entry in the **main** wake → member → Home path.
- PIN / kiosk lock may remain available later as an optional Settings / advanced path — out of scope for wake-page UX.

---

## 3. Final wake page structure

**Role:** Family kiosk home base. Show only the most useful **daily** household information. Portrait-first stack; on wide desktop, secondary columns may sit beside main cards without becoming an admin dashboard grid.

### Priority order (top → bottom)

| # | Block | Purpose | Wake page? |
|---|--------|---------|------------|
| 1 | **Top status** | Current time, current date, weather card (or placeholder if weather not active) | Yes — always |
| 2 | **Family member buttons** | Large tap targets for Hershel, Lorraine, Stella, Nox, Jeremiah, Selena → each opens that person’s Member Home | Yes — always |
| 3 | **Quick Add** | Prominent near top; add to Shopping, Pantry/Inventory, and (later) Chores/tasks | Yes — always, high prominence |
| 4 | **Shopping list preview** | Need to Buy items + quick add shopping field/button without entering a personal dashboard | Yes |
| 5 | **Kitchen duty & chores** | Whose kitchen day it is; chores/tasks due today; urgent/overdue if available | Yes |
| 6 | **Messages & notifications** | Pinned/important messages; notifications that need attention | Yes |
| 7 | **Upcoming events / calendar** | Today first, then next activities; title, time/date, assigned members, category, location if available | Yes (lower or side column) |

### Also allowed as compact wake signals

- **Pantry / Inventory alerts** (low stock, out of stock) — compact alert strip or small card, not a full inventory UI.

### Must **not** appear as large wake/command cards

Keep in app; access from sidebar (or deeper pages) only:

- Pets  
- Subscriptions  
- Projects  
- Photos  
- Planner  
- Routines  

### Wake page layout sketch (portrait)

```
┌─────────────────────────────────────┐
│  TIME · DATE              [Weather] │  1. Status
├─────────────────────────────────────┤
│  [Hershel] [Lorraine] [Stella]      │  2. Members
│  [Nox]     [Jeremiah] [Selena]      │
├─────────────────────────────────────┤
│  QUICK ADD                          │  3. Quick Add
│  [Shopping] [Pantry] [Chores…]      │
├─────────────────────────────────────┤
│  Shopping — Need to Buy             │  4. Shopping preview
│  · item …  [+ Add]                  │
├─────────────────────────────────────┤
│  Kitchen duty · Chores due today    │  5. Duty / chores
├─────────────────────────────────────┤
│  Messages · Notifications           │  6. Comms
├─────────────────────────────────────┤
│  Upcoming events                    │  7. Calendar
└─────────────────────────────────────┘
```

Wide / desktop: blocks 5–7 may share a second column; blocks 1–4 stay primary above the fold when possible.

---

## 4. Sidebar structure

### PRIMARY

Daily household surfaces — default sidebar group.

| Label | Capsule | Notes |
|-------|---------|--------|
| Home | Core / Wake Page | Wake / command page |
| Messages | Messages | Full message board |
| Calendar / Upcoming Events | Events | Full calendar + list |
| Shopping | Shopping | Full list |
| Pantry & Inventory | Pantry & Inventory | Full inventory |
| Cleaning / Kitchen | Cleaning / Kitchen | Chores + kitchen duty |
| Emergency Planning | Emergency Planning | **New** household safety module |

### HOUSEHOLD TOOLS

Secondary modules — **sidebar / deeper only**; not large wake cards.

| Label | Capsule |
|-------|---------|
| Pets | Pets |
| Subscriptions | Subscriptions |
| Projects | Projects |
| Photos | Photos |
| Planner | Planner |
| Routines | Routines |

### SYSTEM

| Label | Capsule |
|-------|---------|
| Settings | Settings |

### Utility (not main sidebar tabs)

| Surface | Role |
|---------|------|
| Notifications | Inbox / alerts page; wake shows a preview |
| Quick Add | Dedicated flow/sheet; also embedded on wake page |
| Member Home | Via member cards; return with **Home** |
| Legacy / hidden routes | Keep redirects and deep links; do not promote classic admin dashboard as Home |

---

## 5. Capsule catalog

Each capsule below documents: purpose, concepts/data, actions, views, where it appears, and wake vs sidebar/deeper placement.

---

### 5.1 Core / Wake Page

| Field | Detail |
|-------|--------|
| **Purpose** | Shared kiosk home base: time/day, family entry, Quick Add, and daily household previews. |
| **Concepts / data** | Clock/date; weather (live or placeholder); `familyMembers`; shopping need-to-buy; pantry alerts; kitchen schedule / duty; chores/tasks due; `messageBoard` (pinned/important); `notifications`; calendar events. |
| **Actions** | Open Member Home; Quick Add; add shopping; open module deep links; acknowledge/dismiss alerts (as supported). |
| **Views** | Single portrait-first command layout (sections §3). |
| **Where it appears** | App default / Home route (`/` and Home aliases → wake). |
| **Wake page** | **Is** the wake page. |
| **Sidebar** | PRIMARY → Home. |

---

### 5.2 Member Home

| Field | Detail |
|-------|--------|
| **Purpose** | One person’s personal home: their chores, events, messages, and relevant alerts. |
| **Concepts / data** | Selected `FamilyMember`; member-scoped tasks, events, notifications, preferences (existing fields only). |
| **Actions** | Complete chores; view events; open modules; **Home** returns to wake page. |
| **Views** | Personal home page (existing member dashboard refined over phases). |
| **Where it appears** | After tapping a wake member card (`/family/:memberId` or equivalent). |
| **Wake page** | Member **buttons** only on wake; full personal UI is deeper. |
| **Sidebar** | Not a primary tab; entered from wake member cards. |

**UI wording:** Return control labeled **Home** — never “Switch Member” in main UI.

---

### 5.3 Events

| Field | Detail |
|-------|--------|
| **Purpose** | Household calendar and upcoming activities. |
| **Concepts / data** | Calendar events: title, time/date, assigned members, category, location (when present). |
| **Actions** | View today / upcoming; create/edit/delete in full Calendar module. |
| **Views** | Wake: today-first list; Member Home: personal upcoming; Sidebar: full Calendar / Upcoming Events. |
| **Where it appears** | Wake §7; Member Home; `/calendar` (and planner alias if kept). |
| **Wake page** | Yes — upcoming list (not full planner UI). |
| **Sidebar** | PRIMARY → Calendar / Upcoming Events. |

---

### 5.4 Messages

| Field | Detail |
|-------|--------|
| **Purpose** | Household message board (pinned, important, general). |
| **Concepts / data** | `messageBoard` items: title, body, category, priority, pinned, author, timestamps. |
| **Actions** | Read; create/edit/pin on full Messages page; wake shows pinned/important. |
| **Views** | Wake preview; full Messages module. |
| **Where it appears** | Wake §6; `/messages`. |
| **Wake page** | Yes — pinned/important preview. |
| **Sidebar** | PRIMARY → Messages. |

---

### 5.5 Shopping

| Field | Detail |
|-------|--------|
| **Purpose** | Shared Need to Buy list; addable from wake without personal dashboards. |
| **Concepts / data** | `shopping` items; purchased/need state; categories as already modeled. |
| **Actions** | Quick add; mark purchased (as supported); open full Shopping page. |
| **Views** | Wake preview + Quick Add; full Shopping module. |
| **Where it appears** | Wake §3–4; `/shopping`. |
| **Wake page** | Yes — preview + Quick Add. |
| **Sidebar** | PRIMARY → Shopping. |

---

### 5.6 Pantry & Inventory

| Field | Detail |
|-------|--------|
| **Purpose** | Stock levels, low/out alerts, inventory management. |
| **Concepts / data** | Pantry/inventory items; quantity; low-stock signals; notifications `inventory_low` / `inventory_out`. |
| **Actions** | Quick Add when supported; open full Pantry & Inventory; respond to alerts. |
| **Views** | Wake: alerts + Quick Add target; full Pantry module. |
| **Where it appears** | Wake alerts; `/pantry`. |
| **Wake page** | Alerts / Quick Add only — not full inventory grid as a large card. |
| **Sidebar** | PRIMARY → Pantry & Inventory. |

---

### 5.7 Cleaning / Kitchen

| Field | Detail |
|-------|--------|
| **Purpose** | Kitchen duty day, checklist, household chores/tasks. |
| **Concepts / data** | Kitchen schedule; duty completions; checklist; chores/tasks due/overdue. |
| **Actions** | See who’s on duty; complete checklist items; manage chores in full module. |
| **Views** | Wake: duty + due/overdue summary; full Cleaning / Kitchen page. |
| **Where it appears** | Wake §5; `/tasks` (+ kitchen utilities as deep links). |
| **Wake page** | Yes — duty and chores due today. |
| **Sidebar** | PRIMARY → Cleaning / Kitchen. |

---

### 5.8 Emergency Planning *(new)*

| Field | Detail |
|-------|--------|
| **Purpose** | Household safety and preparedness — contacts, plans, checklists, medical notes. |
| **Concepts / data** *(planned; extend FamilyData carefully later)* | Emergency contacts; meeting locations; medical notes; emergency checklist; evacuation plan; supplies checklist; important documents/notes (later). Prefer additive fields; never wipe existing storage. |
| **Actions** | View/edit contacts and locations; check off preparedness lists; open notes/docs when supported. |
| **Views** | Dedicated Emergency Planning page (route + sidebar tab). |
| **Where it appears** | Sidebar PRIMARY only (not a large wake card unless a future “urgent safety” alert is explicitly designed). |
| **Wake page** | **No** large card by default. |
| **Sidebar** | PRIMARY → Emergency Planning. |

**Capsule summary (quick):** Safety hub for contacts, meeting points, medical notes, evacuation + supplies checklists, and later document notes — always available from Primary sidebar, never competing with daily wake cards.

---

### 5.9 Pets

| Field | Detail |
|-------|--------|
| **Purpose** | Pet care, meds, reminders. |
| **Concepts / data** | Existing pets entities / flea med notifications. |
| **Actions** | Manage pets in Pets module. |
| **Views** | Pets page only (sidebar). |
| **Where it appears** | `/pets`. |
| **Wake page** | **No** large card. |
| **Sidebar** | HOUSEHOLD TOOLS → Pets. |

---

### 5.10 Subscriptions

| Field | Detail |
|-------|--------|
| **Purpose** | Household subscription tracking. |
| **Concepts / data** | Existing subscriptions model. |
| **Actions** | Manage in Subscriptions module / Settings mirrors. |
| **Views** | Subscriptions page. |
| **Where it appears** | `/subscriptions`. |
| **Wake page** | **No** large card. |
| **Sidebar** | HOUSEHOLD TOOLS → Subscriptions. |

---

### 5.11 Projects

| Field | Detail |
|-------|--------|
| **Purpose** | Longer-running household / workspace projects. |
| **Concepts / data** | Existing or stub projects/workspace data — preserve routes and data. |
| **Actions** | Open Projects from sidebar when enabled. |
| **Views** | Projects / workspace page. |
| **Where it appears** | Projects route (keep; do not remove). |
| **Wake page** | **No** large card. |
| **Sidebar** | HOUSEHOLD TOOLS → Projects. |

---

### 5.12 Photos

| Field | Detail |
|-------|--------|
| **Purpose** | Household photo / media surface (as supported or planned). |
| **Concepts / data** | Future or existing media hooks — additive only. |
| **Actions** | Browse/add when implemented. |
| **Views** | Photos module. |
| **Where it appears** | Sidebar HOUSEHOLD TOOLS. |
| **Wake page** | **No** large card. |
| **Sidebar** | HOUSEHOLD TOOLS → Photos. |

---

### 5.13 Planner

| Field | Detail |
|-------|--------|
| **Purpose** | Deeper planning surface distinct from the daily Upcoming Events list. |
| **Concepts / data** | Planner / calendar-adjacent data; keep aliases if present. |
| **Actions** | Plan ahead in Planner module. |
| **Views** | Planner page (sidebar). |
| **Where it appears** | Planner route / alias. |
| **Wake page** | **No** — wake uses Events preview only. |
| **Sidebar** | HOUSEHOLD TOOLS → Planner. |

---

### 5.14 Routines

| Field | Detail |
|-------|--------|
| **Purpose** | Recurring household routines (morning/evening, etc.). |
| **Concepts / data** | Routine definitions / completions as modeled or added later. |
| **Actions** | View and check off routines in Routines module. |
| **Views** | Routines page. |
| **Where it appears** | Sidebar HOUSEHOLD TOOLS. |
| **Wake page** | **No** large card. |
| **Sidebar** | HOUSEHOLD TOOLS → Routines. |

---

### 5.15 Notifications

| Field | Detail |
|-------|--------|
| **Purpose** | Attention-needed household alerts inbox. |
| **Concepts / data** | `notifications` (inventory, shopping, message, kitchen, chore, calendar, pet, etc.). |
| **Actions** | Read, dismiss, jump to related entity when linked. |
| **Views** | Wake preview; full Notifications page. |
| **Where it appears** | Wake §6; `/notifications`. |
| **Wake page** | Yes — needs-attention preview. |
| **Sidebar** | Utility / header entry preferred; not required as a Primary tab if Notifications are reachable from wake + Settings/header. |

---

### 5.16 Settings

| Field | Detail |
|-------|--------|
| **Purpose** | Household configuration, members, visibility, data source, optional advanced PIN/kiosk options. |
| **Concepts / data** | `adminSettings`, members, module visibility, customization labels. |
| **Actions** | Edit settings; manage members; later Settings cleanup (Phase 10). |
| **Views** | Settings page. |
| **Where it appears** | `/settings`. |
| **Wake page** | **No**. |
| **Sidebar** | SYSTEM → Settings. |

---

### 5.17 Quick Add

| Field | Detail |
|-------|--------|
| **Purpose** | Fast capture into Shopping, Pantry/Inventory, and later Chores — especially from the wake page. |
| **Concepts / data** | Writes into existing shopping / pantry / task collections. |
| **Actions** | Choose target → enter item → save; optional dedicated `/quick-add` utility. |
| **Views** | Embedded wake block (prominent); optional full Quick Add page/sheet. |
| **Where it appears** | Wake §3; header/utility entry. |
| **Wake page** | Yes — required, high prominence. |
| **Sidebar** | Not a Primary tab; utility. |

---

## 6. Command layout rules (summary)

### Show on wake / command page

- Weather / time / date  
- Family member buttons  
- Quick Add  
- Shopping (preview)  
- Pantry / Inventory **alerts**  
- Kitchen duty  
- Chores  
- Messages  
- Notifications  
- Upcoming Events / Calendar (list)

### Do not show as large command-page cards

- Pets  
- Subscriptions  
- Projects  
- Photos  
- Planner  
- Routines  

These remain in the app via **HOUSEHOLD TOOLS** sidebar (and existing routes). **Do not remove features or delete files** to satisfy this rule — hide from wake layout only.

---

## 7. Mapping to current app (guidance only)

This section orients implementers; **Phase 1 does not change code.**

| Intended surface | Likely current anchors |
|------------------|------------------------|
| Wake / Home | FamilyHub / AdminUX home routes (e.g. `/adminux`, `/` aliases); evolve toward §3 layout |
| Member Home | `/family/:memberId` (`MemberDashboardPage`) |
| Messages | `/messages` |
| Events | `/calendar` (+ `/planner` alias) |
| Shopping | `/shopping` |
| Pantry | `/pantry` |
| Cleaning / Kitchen | `/tasks` (+ kitchen deep links) |
| Pets / Subscriptions / Projects / … | Existing routes; demote from wake cards |
| Emergency Planning | **New** route + sidebar key (future phase) |
| Quick Add | `/quick-add` + wake embed |
| Classic dashboard | Not the product Home; do not restore as primary wake |

Preserve:

- localStorage key `familysite-491:first-family-build`  
- `FamilyData` shape and existing fields  
- PIN fields (unused in main flow, not deleted)  
- All existing modules/features (sidebar or deep link)

---

## 8. Implementation phases

| Phase | Work | Exit criteria |
|-------|------|----------------|
| **1** | Update architecture document (this file) | Doc matches intended wake, sidebar, capsules, PIN policy |
| **2** | Build/refine Wake Page layout | Portrait-first sections §3 shell; soft FamilyHub style; readable contrast |
| **3** | Prominent Quick Add (shopping / inventory) | Wake Quick Add works for shopping + pantry when supported |
| **4** | Shopping preview on Wake | Need to Buy list + add without personal dashboard |
| **5** | Kitchen duty + chores on Wake | Duty owner + due/overdue chores visible |
| **6** | Messages + notifications on Wake | Pinned/important + attention alerts |
| **7** | Upcoming Events on Wake + Member Home | Today-first list with title/time/members/category/location |
| **8** | Emergency Planning route + sidebar | New PRIMARY tab; preparedness surfaces stubbed/filled |
| **9** | Clean command page | Pets, Subscriptions, Projects, Photos, Planner, Routines off wake large cards; remain in sidebar |
| **10** | Settings cleanup | Later; members, visibility, optional advanced PIN — no storage wipe |

**Build rule:** Run `npm run build` after each implementation phase (Phases 2–10). Phase 1 is docs-only.

---

## 9. Risk notes

| Risk | Mitigation |
|------|------------|
| localStorage wipe | Never reset storage; never change key `familysite-491:first-family-build` |
| FamilyData breakage | Additive changes only; do not remove fields |
| PIN fields | Keep in schema; remove from **main UX flow** only |
| Feature deletion | Do not remove features or delete files to “clean” the wake page — relocate to sidebar |
| Roster mismatch (Hershel/Selena vs current data) | Align carefully via member management; no destructive reset |
| Weather unavailable | Show weather **placeholder** card until integration is active |
| Admin template clutter | Prefer soft FamilyHub cards; avoid dense admin widget walls on wake |
| Dual homes | One Home = wake page; member return = **Home**; no “Switch Member” label |

---

## 10. Recommended first implementation step

**After Phase 1 (this document): start Phase 2 — Wake Page layout only.**

Concretely:

1. Treat the existing Home / FamilyHub command surface as the wake page shell.  
2. Restructure the **layout order** to match §3 (status → members → Quick Add → shopping → kitchen/chores → messages/notifications → events).  
3. Make member cards large tap targets to Member Home; add a clear **Home** control on Member Home.  
4. Do **not** yet build Emergency Planning (Phase 8) or strip sidebar tools (Phase 9) unless they block layout.  
5. Keep PIN out of this path; leave PIN data untouched.  
6. Run `npm run build` when Phase 2 code lands.

---

## 11. Document checklist (Phase 1 complete when)

- [x] Vertical Surface Pro / portrait kiosk target documented  
- [x] Wake page is not a PIN login; no PIN in main flow  
- [x] Member buttons → personal home; return via **Home**  
- [x] Wake section priority order documented  
- [x] Command show / do-not-show rules documented  
- [x] Sidebar PRIMARY / HOUSEHOLD TOOLS / SYSTEM documented  
- [x] Emergency Planning capsule documented  
- [x] Full capsule list with purpose, data, actions, views, placement  
- [x] Phases 1–10 and risks documented  
- [x] Recommended next step = Phase 2 wake layout  

---

*End of FamilyHub Capsule Architecture — Phase 1.*
