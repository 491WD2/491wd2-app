# Client-Ready Visual Refinement Plan

**Status:** Active refinement direction for FamilyHub Home + Calendar  
**Constraint:** Visual polish only where safe — no Bootstrap, no localStorage resets, no module removals, no meal planning / appointment booking / business scheduling.

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
