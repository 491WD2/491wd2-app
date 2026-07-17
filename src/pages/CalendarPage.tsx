import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  type CalendarLink,
  type FamilyMember,
  type PlannerEvent,
  type PlannerEventCategory,
  type PlannerPrepChecklistItem,
  type PlannerReminderSetting,
  type PlannerRepeatRule,
} from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
} from "../components/workspace/DrawerShell";
import { EmptyStatePanel, WorkspacePageShell } from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { getActivityCategoryVisualForEvent } from "../lib/calendarActivityStyles";
import { getCalendarCategories, mergeLists, selectOptionsWithCurrent } from "../lib/customization";
import { getPlannerEventFreshnessBadge } from "../lib/plannerActivityBadges";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import { formatShortDate, cn, getMemberFullName } from "../lib/utils";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import type { PageProps } from "./pageTypes";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { KioskPageTitle } from "../components/layout/KioskPageTitle";
import { WidgetPageShell } from "../components/widgets";
import { CalendarPlanningView } from "../components/calendar/CalendarPlanningView";
import "../components/calendar/calendar-planner.css";
import {
  trackCalendarEventAdd,
  trackCalendarEventEdit,
  trackCalendarView,
} from "../lib/calendarPlannerAnalytics";
import "../styles/guided-kiosk.css";

const repeatRules: PlannerRepeatRule[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
  "Custom later",
];

const reminderOptions: PlannerReminderSetting[] = [
  { id: "none", label: "None", offsetMinutes: -1 },
  { id: "at-time", label: "At activity time", offsetMinutes: 0 },
  { id: "15-before", label: "15 minutes before", offsetMinutes: 15 },
  { id: "60-before", label: "1 hour before", offsetMinutes: 60 },
  { id: "day-before", label: "1 day before", offsetMinutes: 1440 },
];

const categorySuggestions: Partial<Record<PlannerEventCategory, string[]>> = {
  School: ["Backpack", "Lunch", "Pickup reminder", "Forms / permission slip"],
  Sports: ["Uniform", "Water bottle", "Gear bag", "Departure reminder"],
  Medical: [
    "Insurance card",
    "Medication list",
    "Arrive 15 minutes early",
    "Prep note",
  ],
};

type CalendarViewMode = "plan" | "month" | "week" | "day" | "list";
type CalendarGuidedFlow = "find" | "today";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  plan: "Planning",
  month: "Month",
  week: "Week",
  day: "Day",
  list: "List",
};

/** Chips map household-friendly labels → stored category values */
const ACTIVITY_TYPE_CHIPS: { label: string; category: PlannerEventCategory | "all" }[] = [
  { label: "All", category: "all" },
  { label: "Household", category: "Family" },
  { label: "School", category: "School" },
  { label: "Work", category: "Work" },
  { label: "Cleaning", category: "Sports" },
  { label: "Shopping", category: "Errand" },
  { label: "Personal", category: "Personal" },
];

/** Calendar dark kiosk tokens — scoped to Calendar only. */
const PAGE_BG = "fh-calendar-page min-h-full text-[#f7fbff] [-webkit-font-smoothing:antialiased]";
const SM_LABEL = "fh-calendar-eyebrow text-[11px] font-semibold uppercase tracking-[0.12em]";
const CARD_SHELL =
  "fh-calendar-surface-card rounded-[24px] border shadow-[0_18px_44px_rgba(0,0,0,0.3)]";
const SM_INPUT =
  "fh-calendar-input min-h-10 w-full rounded-[16px] border px-3 py-2 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus:ring-2";
const CARD_CALENDAR =
  "fh-calendar-surface-card !rounded-[24px] shadow-[0_18px_44px_rgba(0,0,0,0.3)]";

const btnPrimaryOrange =
  "fh-calendar-btn-primary border-transparent bg-gradient-to-r from-[#20e6a2] to-[#4fb7ff] font-semibold text-[#03101b] shadow-[0_12px_28px_rgba(32,230,162,0.18)] hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914]";
const btnSecondaryLight =
  "fh-calendar-btn-secondary border font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914]";
const segmentInactiveLight = "fh-calendar-segment-inactive";
const segmentActiveLight =
  "fh-calendar-segment-active";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoFromYmd(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function addDaysIso(iso: string, delta: number): string {
  const t = new Date(`${iso.slice(0, 10)}T12:00:00`);
  t.setDate(t.getDate() + delta);
  return t.toISOString().slice(0, 10);
}

function startOfWeekMondayIso(iso: string): string {
  const t = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const dow = t.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  t.setDate(t.getDate() + diff);
  return t.toISOString().slice(0, 10);
}

function endOfWeekSundayIso(fromMondayIso: string): string {
  return addDaysIso(fromMondayIso, 6);
}

/** `m` is 1–12 (January = 1). */
function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function padWeekStart(y: number, monthIndex: number): number {
  const d = new Date(y, monthIndex - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function monthYearLabel(anchor: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(anchor);
}

function initialViewMode(kioskShell: boolean): CalendarViewMode {
  if (kioskShell) {
    return "plan";
  }
  if (typeof window !== "undefined" && window.innerWidth < 640) {
    return "list";
  }
  return "month";
}

export function CalendarPage({ data, setData }: PageProps) {
  const kioskShell = useKioskShell();
  const primaryCalendar = data.calendarLinks[0];
  const admin = data.adminSettings;
  const calendarCategoryOptions = useMemo(
    () => mergeLists(getCalendarCategories(admin), data.planner.map((e) => e.category)),
    [admin, data.planner],
  );

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date(`${today}T12:00:00`));
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => initialViewMode(Boolean(kioskShell)));
  const [categoryFilter, setCategoryFilter] = useState<PlannerEventCategory | "all">("all");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");
  const [showLinkedCalendars, setShowLinkedCalendars] = useState(true);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | undefined>();
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [guidedFlow, setGuidedFlow] = useState<CalendarGuidedFlow | null>(null);
  const [guidedSearch, setGuidedSearch] = useState("");
  const [guidedMessage, setGuidedMessage] = useState<string | null>(null);

  const localEventsSorted = useMemo(
    () => [...data.planner].sort(sortEvents),
    [data.planner],
  );

  const filteredPlanner = useMemo(() => {
    return localEventsSorted.filter((event) => {
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }
      if (memberFilter !== "all") {
        const ids = event.assignedMemberIds ?? [];
        if (!ids.includes(memberFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [localEventsSorted, categoryFilter, memberFilter]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, PlannerEvent[]>();
    for (const e of filteredPlanner) {
      const d = e.date?.trim().slice(0, 10);
      if (!d) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(e);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => compareEventStart(a, b));
    }
    return m;
  }, [filteredPlanner]);

  const upcomingPreview = useMemo(() => {
    return filteredPlanner.filter((e) => e.date >= today).slice(0, 6);
  }, [filteredPlanner, today]);
  const todaysEvents = useMemo(
    () => filteredPlanner.filter((event) => event.date?.slice(0, 10) === today),
    [filteredPlanner, today],
  );
  const guidedEventMatches = useMemo(() => {
    const query = guidedSearch.trim().toLowerCase();
    return filteredPlanner
      .filter((event) => {
        if (!query) {
          return true;
        }
        return (
          event.title.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query) ||
          (event.location ?? "").toLowerCase().includes(query)
        );
      })
      .slice(0, 14);
  }, [filteredPlanner, guidedSearch]);

  useEffect(() => {
    if (viewMode === "plan") {
      trackCalendarView();
    }
  }, [viewMode]);

  function openNewActivityDrawer() {
    setEditingEvent(createDraftEvent(data.familyMembers));
  }

  function saveActivity(event: PlannerEvent) {
    const errors = validateActivity(event);

    if (errors.length > 0) {
      return errors;
    }

    const existing = data.planner.some((item) => item.id === event.id);
    const normalized = normalizeEventForSave(event, data.familyMembers);

    setData((current) =>
      createActivity(
        {
          ...current,
          planner: existing
            ? current.planner.map((item) => (item.id === event.id ? normalized : item))
            : [...current.planner, normalized],
        },
        {
          type: existing ? "updated" : "created",
          entityType: "planner",
          entityId: normalized.id,
          entityTitle: normalized.title,
          message: existing
            ? `Updated activity: ${normalized.title}.`
            : `Added activity: ${normalized.title}.`,
        },
      ),
    );

    if (existing) {
      trackCalendarEventEdit(normalized.id);
    } else {
      trackCalendarEventAdd(normalized.id);
    }

    return [];
  }

  function deleteActivity(event: PlannerEvent) {
    const confirmed = window.confirm("Remove this activity from your calendar?");

    if (!confirmed) {
      return;
    }

    setData((current) =>
      createActivity(
        {
          ...current,
          planner: current.planner.filter((item) => item.id !== event.id),
        },
        {
          type: "deleted",
          entityType: "planner",
          entityId: event.id,
          entityTitle: event.title,
          message: `Removed activity: ${event.title}.`,
        },
      ),
    );
    setEditingEvent(undefined);
  }

  function addCalendarLink() {
    const now = new Date().toISOString();
    const link: CalendarLink = {
      id: crypto.randomUUID(),
      name: "Family Google Calendar",
      calendarUrl: "",
      embedUrl: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
      displayName: "Family Google Calendar",
      publicUrl: "",
    };

    setData((current) => ({
      ...current,
      calendarLinks: [link, ...current.calendarLinks],
    }));
  }

  function updateCalendarLink(id: string, updates: Partial<CalendarLink>) {
    setData((current) => ({
      ...current,
      calendarLinks: current.calendarLinks.map((link) => {
        if (link.id !== id) {
          return link;
        }

        const nextLink = {
          ...link,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        return {
          ...nextLink,
          displayName: nextLink.name,
          publicUrl: nextLink.calendarUrl,
        };
      }),
    }));
  }

  function removeCalendarLink(id: string) {
    const confirmed = window.confirm("Remove this saved calendar link?");

    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      calendarLinks: current.calendarLinks.filter((link) => link.id !== id),
    }));
  }

  function goToday() {
    const t = new Date().toISOString().slice(0, 10);
    setSelectedDate(t);
    setMonthAnchor(new Date(`${t}T12:00:00`));
  }

  function navPrev() {
    if (viewMode === "plan") {
      const next = addDaysIso(selectedDate, -7);
      setSelectedDate(next);
      setMonthAnchor(new Date(`${next}T12:00:00`));
      return;
    }
    if (viewMode === "list") return;
    if (viewMode === "month") {
      setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
      return;
    }
    const delta = viewMode === "week" ? -7 : -1;
    const next = addDaysIso(selectedDate, delta);
    setSelectedDate(next);
    setMonthAnchor(new Date(`${next}T12:00:00`));
  }

  function navNext() {
    if (viewMode === "plan") {
      const next = addDaysIso(selectedDate, 7);
      setSelectedDate(next);
      setMonthAnchor(new Date(`${next}T12:00:00`));
      return;
    }
    if (viewMode === "list") return;
    if (viewMode === "month") {
      setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
      return;
    }
    const delta = viewMode === "week" ? 7 : 1;
    const next = addDaysIso(selectedDate, delta);
    setSelectedDate(next);
    setMonthAnchor(new Date(`${next}T12:00:00`));
  }

  const weekStartIso = useMemo(() => startOfWeekMondayIso(selectedDate), [selectedDate]);

  const headerAction = (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
      <div
        className="fh-calendar-view-switcher flex w-full flex-wrap gap-1 rounded-[18px] border p-1 sm:w-auto"
        role="group"
        aria-label="Calendar view"
      >
        {(["plan", "month", "week", "day", "list"] as CalendarViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className={cn(
              "min-h-10 flex-1 rounded-[6px] px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7] sm:flex-none sm:px-4",
              viewMode === mode ? segmentActiveLight : segmentInactiveLight,
            )}
            onClick={() => setViewMode(mode)}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" className={btnSecondaryLight} onClick={() => setShowFullCalendar(false)}>
          Kiosk station
        </Button>
        <Button type="button" variant="secondary" className={btnSecondaryLight} onClick={goToday}>
          Today
        </Button>
        <Button type="button" variant="primary" className={btnPrimaryOrange} onClick={openNewActivityDrawer}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Activity
        </Button>
      </div>
    </div>
  );

  function openCalendarFlow(flow: CalendarGuidedFlow) {
    setGuidedMessage(null);
    setGuidedFlow(flow);
    setGuidedSearch("");
  }

  function renderCalendarFlowSheet() {
    if (!guidedFlow) {
      return null;
    }
    const events = guidedFlow === "today" ? todaysEvents : guidedEventMatches;
    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setGuidedFlow(null)}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Calendar station</p>
              <h2 id="calendar-flow-title">
                {guidedFlow === "today" ? "Today’s activities" : "Find an activity"}
              </h2>
              <p>Pick an activity and the details pop-up opens next.</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close calendar flow"
              onClick={() => setGuidedFlow(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {guidedFlow === "find" ? (
            <label className="wd-guided-kiosk__search">
              <Search className="h-4 w-4" aria-hidden />
              <input
                type="search"
                value={guidedSearch}
                onChange={(event) => setGuidedSearch(event.target.value)}
                placeholder="Search event, category, location..."
                autoFocus
              />
            </label>
          ) : null}

          <div className="wd-guided-kiosk__chooser" role="listbox" aria-label="Calendar activities">
            {events.length === 0 ? (
              <p className="wd-guided-kiosk__empty">
                {guidedFlow === "today" ? "No activities today." : "No matching activities."}
              </p>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="wd-guided-kiosk__chooser-row"
                  role="option"
                  onClick={() => {
                    setEditingEvent(event);
                    setGuidedFlow(null);
                  }}
                >
                  <span>
                    <strong>{event.title || "Untitled"}</strong>
                    <small>{formatShortDate(event.date)} · {formatEventTime(event)} · {event.category}</small>
                  </span>
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  const activityDrawer = editingEvent ? (
    <ActivityDrawer
      categoryOptions={calendarCategoryOptions}
      event={editingEvent}
      isExisting={data.planner.some((item) => item.id === editingEvent.id)}
      members={data.familyMembers}
      onCancel={() => setEditingEvent(undefined)}
      onChange={setEditingEvent}
      onDelete={() => deleteActivity(editingEvent)}
      onSave={(event, addAnother) => {
        const errors = saveActivity(event);
        if (errors.length > 0) return errors;
        setGuidedMessage(`${event.title || "Activity"} saved.`);
        setEditingEvent(addAnother ? createDraftEvent(data.familyMembers) : undefined);
        return [];
      }}
    />
  ) : null;

  if (!showFullCalendar) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--calendar fh-calendar-guided">
        <section className="wd-guided-kiosk__hero" aria-labelledby="calendar-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Calendar station</p>
            <h1 id="calendar-kiosk-title">What calendar step?</h1>
            <p>
              Add an activity, find one, or check today. Each choice opens the next focused pop-up.
            </p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{todaysEvents.length} today</span>
            <span>{upcomingPreview.length} upcoming</span>
            <span>{data.calendarLinks.length} links</span>
          </div>
        </section>

        {guidedMessage ? (
          <section className="wd-guided-kiosk__complete" role="status">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p>{guidedMessage}</p>
            <button type="button" onClick={() => setGuidedMessage(null)}>
              Continue
            </button>
          </section>
        ) : null}

        <section className="wd-guided-kiosk__actions-grid" aria-label="Calendar actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={openNewActivityDrawer}>
            <span className="wd-guided-kiosk__action-icon"><Plus className="h-5 w-5" aria-hidden /></span>
            <span><strong>Add activity</strong><small>Open event details</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => openCalendarFlow("find")}>
            <span className="wd-guided-kiosk__action-icon"><Search className="h-5 w-5" aria-hidden /></span>
            <span><strong>Find activity</strong><small>Search, then edit</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => openCalendarFlow("today")}>
            <span className="wd-guided-kiosk__action-icon"><CalendarDays className="h-5 w-5" aria-hidden /></span>
            <span><strong>Today</strong><small>See today’s events</small></span>
          </button>
          <button
            type="button"
            className="wd-guided-kiosk__action"
            onClick={() => {
              addCalendarLink();
              setGuidedMessage("Calendar link draft added.");
            }}
          >
            <span className="wd-guided-kiosk__action-icon"><ExternalLink className="h-5 w-5" aria-hidden /></span>
            <span><strong>Add calendar link</strong><small>Create link draft</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullCalendar(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Calendar workspace</strong><small>Month, week, list, links</small></span>
          </button>
        </section>

        {renderCalendarFlowSheet()}
        {activityDrawer}
      </div>
    );
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "motion-page flex flex-col gap-4 overflow-x-hidden px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone="premiumDark"
      >
        <header className={cn(CARD_SHELL, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div
                className="h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#FF6F28] to-[#FF5325]"
                aria-hidden
              />
              <div className="min-w-0">
                <p className={SM_LABEL}>Household</p>
                <h1 className="mt-1 text-[22px] font-semibold leading-snug tracking-tight text-[#f7fbff]">
                  Calendar
                </h1>
                <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#a4b0ca]">
                  Chores, pantry reminders, member schedules, and household events — no meal planning.
                </p>
              </div>
            </div>
            {headerAction}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] xl:gap-6">
        {viewMode !== "plan" ? (
        <aside className="flex min-w-0 flex-col gap-4">
          <Card className={CARD_CALENDAR} tone="premiumDark">
            <CardHeader eyebrow="Activities" title="Upcoming Activities" tone="premiumDark" />
            <p className="mb-3 text-sm text-[#a4b0ca]">
              Choose an activity to edit, or use Quick add for something new.
            </p>
            <div className="space-y-2">
              {upcomingPreview.length === 0 ? (
                <p className="fh-calendar-empty rounded-[16px] border px-3 py-4 text-center text-sm">
                  No upcoming activities.
                </p>
              ) : (
                upcomingPreview.map((event) => (
                  <UpcomingActivityRow
                    key={event.id}
                    event={event}
                    members={data.familyMembers}
                    onOpen={() => setEditingEvent(event)}
                  />
                ))
              )}
            </div>
            <Button
              className={cn("mt-4 w-full", btnPrimaryOrange)}
              type="button"
              variant="primary"
              onClick={openNewActivityDrawer}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Quick add
            </Button>
          </Card>

          <Card className={CARD_CALENDAR} tone="premiumDark">
            <CardHeader eyebrow="Filter" title="Activity types" tone="premiumDark" />
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(
                    "fh-calendar-filter-chip min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/40",
                    categoryFilter === chip.category
                      ? "fh-calendar-filter-chip--active"
                      : "fh-calendar-filter-chip--idle",
                  )}
                  onClick={() =>
                    setCategoryFilter(chip.category === "all" ? "all" : chip.category)
                  }
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className={CARD_CALENDAR} tone="premiumDark">
            <CardHeader eyebrow="Household" title="Assigned to" tone="premiumDark" />
            <Select
              value={memberFilter}
              onChange={(e) =>
                setMemberFilter(e.target.value === "all" ? "all" : e.target.value)
              }
              className={cn("min-h-11", SM_INPUT)}
            >
              <option value="all">Everyone</option>
              {data.familyMembers
                .filter((m) => m.status === "active")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberFullName(m)}
                  </option>
                ))}
            </Select>
          </Card>
        </aside>
        ) : null}

        <main className={cn("min-w-0 space-y-4", viewMode === "plan" && "lg:col-span-full")}>
          {viewMode === "plan" ? (
            <WidgetPageShell className="!min-h-0 !p-0 !bg-transparent lg:col-span-full">
              {kioskShell ? (
                <KioskPageTitle
                  eyebrow="Household planning"
                  title="Weekly board"
                  description="Drag chores and events, filter by member, and clear pantry reminders."
                />
              ) : null}
              <div className="fh-calendar-week-nav flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(btnSecondaryLight, "min-h-10 px-2")}
                  onClick={navPrev}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-center text-sm font-bold text-[#f7fbff] sm:text-base">
                  {formatShortDate(weekStartIso)} – {formatShortDate(endOfWeekSundayIso(weekStartIso))}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(btnSecondaryLight, "min-h-10 px-2")}
                  onClick={navNext}
                  aria-label="Next week"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <CalendarPlanningView
                data={data}
                setData={setData}
                todayIso={today}
                weekStartIso={weekStartIso}
                onEditEvent={setEditingEvent}
                onAddEvent={openNewActivityDrawer}
              />
            </WidgetPageShell>
          ) : null}
          {viewMode !== "plan" ? (
          <Card className={cn("fh-calendar-board-card overflow-hidden", CARD_CALENDAR)} tone="premiumDark">
            <div className="fh-calendar-board-head mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {viewMode === "list" ? (
                  <div className="min-h-10 w-10 shrink-0" aria-hidden />
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(btnSecondaryLight, "min-h-10 px-2")}
                    onClick={navPrev}
                    aria-label={
                      viewMode === "month"
                        ? "Previous month"
                        : viewMode === "week"
                          ? "Previous week"
                          : "Previous day"
                    }
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="min-w-0 flex-1 text-center text-lg font-semibold text-[#f7fbff] sm:text-xl">
                  {viewMode === "month" && monthYearLabel(monthAnchor)}
                  {viewMode === "week" &&
                    `${formatShortDate(weekStartIso)} – ${formatShortDate(endOfWeekSundayIso(weekStartIso))}`}
                  {viewMode === "day" &&
                    new Intl.DateTimeFormat(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(`${selectedDate}T12:00:00`))}
                  {viewMode === "list" && "Agenda"}
                </h2>
                {viewMode === "list" ? (
                  <div className="min-h-10 w-10 shrink-0" aria-hidden />
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className={cn(btnSecondaryLight, "min-h-10 px-2")}
                    onClick={navNext}
                    aria-label={
                      viewMode === "week"
                        ? "Next week"
                        : viewMode === "month"
                          ? "Next month"
                          : "Next day"
                    }
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {viewMode === "month" ? (
              <CalendarMonthGrid
                eventsByDate={eventsByDate}
                monthAnchor={monthAnchor}
                selectedIso={selectedDate}
                todayIso={today}
                onPickDay={(iso) => {
                  setSelectedDate(iso);
                  setMonthAnchor(new Date(`${iso}T12:00:00`));
                }}
                onEdit={(ev) => setEditingEvent(ev)}
              />
            ) : null}
            {viewMode === "week" ? (
              <CalendarWeekColumns
                eventsByDate={eventsByDate}
                weekStartIso={weekStartIso}
                todayIso={today}
                onEdit={(ev) => setEditingEvent(ev)}
                onSelectDay={setSelectedDate}
              />
            ) : null}
            {viewMode === "day" ? (
              <CalendarDayPanel
                dateIso={selectedDate}
                events={eventsByDate.get(selectedDate) ?? []}
                members={data.familyMembers}
                todayIso={today}
                onAdd={openNewActivityDrawer}
                onEdit={(ev) => setEditingEvent(ev)}
              />
            ) : null}
            {viewMode === "list" ? (
              <CalendarListAgenda
                members={data.familyMembers}
                todayIso={today}
                events={filteredPlanner}
                onEdit={(ev) => setEditingEvent(ev)}
                onAdd={openNewActivityDrawer}
              />
            ) : null}
          </Card>
          ) : null}

          {viewMode !== "plan" ? (
          <details
            className="fh-calendar-linked-card group rounded-[24px] border shadow-[0_18px_44px_rgba(0,0,0,0.3)]"
            open={showLinkedCalendars}
            onToggle={(e) => setShowLinkedCalendars((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={SM_LABEL}>Google Calendar</p>
                  <p className="mt-1 text-base font-semibold text-[#f7fbff]">Linked calendars</p>
                  <p className="mt-1 text-sm text-[#a4b0ca]">
                    Optional embed or link — your local activities stay in FamilySite.
                  </p>
                </div>
                <CalendarDays className="h-6 w-6 shrink-0 text-[#a4b0ca] group-open:text-[#20e6a2]" />
              </div>
            </summary>
            <div className="border-t border-[rgba(150,170,210,0.14)] px-4 py-4 sm:px-5 sm:py-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                <Card className={CARD_CALENDAR} tone="premiumDark">
                  <CardHeader
                    action={
                      <Button
                        className={cn(btnPrimaryOrange, "min-h-10")}
                        type="button"
                        variant="primary"
                        onClick={addCalendarLink}
                      >
                        <Plus className="h-4 w-4" />
                        Add link
                      </Button>
                    }
                    eyebrow="Saved links"
                    title="Calendar URLs"
                    tone="premiumDark"
                  />
                  <div className="space-y-3">
                    {data.calendarLinks.length === 0 ? (
                      <EmptyStatePanel
                        action={
                          <Button
                            className={btnPrimaryOrange}
                            type="button"
                            variant="primary"
                            onClick={addCalendarLink}
                          >
                            <Plus className="h-4 w-4" />
                            Add calendar link
                          </Button>
                        }
                        text="Add a share link or Google Calendar embed."
                        title="No linked calendars"
                        tone="light"
                      />
                    ) : null}
                    {data.calendarLinks.map((calendar) => (
                      <CalendarLinkEditorDark
                        calendar={calendar}
                        key={calendar.id}
                        onRemove={() => removeCalendarLink(calendar.id)}
                        onUpdate={(updates) => updateCalendarLink(calendar.id, updates)}
                      />
                    ))}
                  </div>
                </Card>
                <Card className={CARD_CALENDAR} tone="premiumDark">
                  <CardHeader eyebrow="Preview" title="Embed" tone="premiumDark" />
                  {primaryCalendar ? (
                    <CalendarPreviewDark calendar={primaryCalendar} />
                  ) : (
                    <EmptyStatePanel
                      action={
                        <Button
                          className={btnSecondaryLight}
                          type="button"
                          variant="secondary"
                          onClick={addCalendarLink}
                        >
                          <Plus className="h-4 w-4" />
                          Add calendar link
                        </Button>
                      }
                      text="Add an embed-safe Google Calendar URL to preview here."
                      title="Nothing to preview"
                      tone="light"
                    />
                  )}
                  <p className="mt-4 text-sm leading-6 text-[#a4b0ca]">
                    Managed in Google Calendar. Updates there appear in this view.
                  </p>
                </Card>
              </div>
            </div>
          </details>
          ) : null}
        </main>
      </div>

      {activityDrawer}
      </WorkspacePageShell>
    </div>
  );
}

function UpcomingActivityRow({
  event,
  members,
  onOpen,
}: {
  event: PlannerEvent;
  members: FamilyMember[];
  onOpen: () => void;
}) {
  const v = getActivityCategoryVisualForEvent(event);
  const fresh = getPlannerEventFreshnessBadge(event);
  return (
    <button
      type="button"
      className={cn(
        "fh-calendar-event-row w-full rounded-[16px] border px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/45",
        v.block,
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{event.title || "Untitled"}</p>
        {fresh ? (
          <span className="fh-calendar-badge shrink-0 rounded border px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide">
            {fresh}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[0.7rem] text-[#a4b0ca]">
        {formatShortDate(event.date)} · {formatEventTime(event)}
      </p>
      <p className="mt-0.5 text-[0.7rem] text-[#c6d4ef]">{formatEventMembers(event, members)}</p>
    </button>
  );
}

function CalendarMonthGrid({
  monthAnchor,
  selectedIso,
  todayIso,
  eventsByDate,
  onPickDay,
  onEdit,
}: {
  monthAnchor: Date;
  selectedIso: string;
  todayIso: string;
  eventsByDate: Map<string, PlannerEvent[]>;
  onPickDay: (iso: string) => void;
  onEdit: (e: PlannerEvent) => void;
}) {
  const y = monthAnchor.getFullYear();
  const monthIndex = monthAnchor.getMonth() + 1;
  const blanks = padWeekStart(y, monthIndex);
  const totalDays = daysInMonth(y, monthIndex);
  const cells: (number | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="overflow-x-auto">
      <div className="fh-calendar-month-grid grid grid-cols-7 gap-2 rounded-[24px] border p-2">
        {weekdays.map((w) => (
          <div
            key={w}
            className="fh-calendar-month-weekday rounded-[14px] px-1 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide"
          >
            {w}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`e-${idx}`} className="fh-calendar-month-blank min-h-[5.5rem] rounded-[18px]" aria-hidden />
            );
          }
          const iso = isoFromYmd(y, monthIndex, day);
          const dayEvents = eventsByDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const show = dayEvents.slice(0, 3);
          const more = Math.max(0, dayEvents.length - 3);

          return (
            <div
              key={iso}
              className={cn(
                "fh-calendar-month-cell flex min-h-[5.5rem] flex-col rounded-[18px] border p-2",
                isToday && "fh-calendar-month-cell--today",
                isSelected && "fh-calendar-month-cell--selected",
              )}
            >
              <button
                type="button"
                className={cn(
                  "mb-1 flex w-full items-center justify-between rounded-[12px] px-1 py-0.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/45",
                  isToday ? "text-[#20e6a2]" : "text-[#a4b0ca]",
                )}
                onClick={() => onPickDay(iso)}
              >
                <span>{day}</span>
                {isToday ? (
                  <span className="text-[0.6rem] font-bold uppercase tracking-wide text-[#20e6a2]">
                    Today
                  </span>
                ) : null}
              </button>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {show.map((ev) => {
                  const vis = getActivityCategoryVisualForEvent(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      title={ev.title}
                      className={cn(
                        "fh-calendar-mini-event truncate rounded-[10px] px-2 py-1 text-left text-[0.65rem] font-semibold leading-tight transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4fb7ff]/50",
                        vis.block,
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(ev);
                      }}
                    >
                      {ev.title || "Untitled"}
                    </button>
                  );
                })}
                {more > 0 ? (
                  <p className="px-1 text-[0.6rem] font-medium text-[#a4b0ca]">+{more} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarWeekColumns({
  weekStartIso,
  todayIso,
  eventsByDate,
  onSelectDay,
  onEdit,
}: {
  weekStartIso: string;
  todayIso: string;
  eventsByDate: Map<string, PlannerEvent[]>;
  onSelectDay: (iso: string) => void;
  onEdit: (e: PlannerEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));
  const weekdayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="overflow-x-auto">
      <div className="fh-calendar-week-grid grid min-w-[720px] grid-cols-7 gap-3">
        {days.map((iso, i) => {
          const list = eventsByDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={cn(
                "fh-calendar-week-column flex min-h-[280px] flex-col rounded-[20px] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                isToday && "fh-calendar-week-column--today",
              )}
            >
              <button
                type="button"
                className={cn(
                  "mb-2 rounded-[16px] px-2 py-1.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/45",
                  isToday ? "text-[#20e6a2]" : "text-[#f7fbff]",
                )}
                onClick={() => onSelectDay(iso)}
              >
                <span className="block text-[0.65rem] uppercase tracking-wide text-[#a4b0ca]">
                  {weekdayShort[i]}
                </span>
                <span className="text-base">{iso.slice(8, 10)}</span>
              </button>
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {list.length === 0 ? (
                  <p className="px-1 text-[0.65rem] text-[#66738f]">—</p>
                ) : (
                  list.map((ev) => {
                    const vis = getActivityCategoryVisualForEvent(ev);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        className={cn(
                          "fh-calendar-week-event rounded-[14px] border px-2 py-1.5 text-left text-[0.7rem] font-semibold leading-snug shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4fb7ff]/50",
                          vis.block,
                        )}
                        onClick={() => onEdit(ev)}
                      >
                        <span className="line-clamp-2">{ev.title || "Untitled"}</span>
                        <span className="mt-0.5 block text-[0.65rem] opacity-80">
                          {formatEventTime(ev)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarDayPanel({
  dateIso,
  events,
  members,
  todayIso,
  onAdd,
  onEdit,
}: {
  dateIso: string;
  events: PlannerEvent[];
  members: FamilyMember[];
  todayIso: string;
  onAdd: () => void;
  onEdit: (e: PlannerEvent) => void;
}) {
  const isToday = dateIso === todayIso;
  const sorted = [...events].sort(compareEventStart);

  if (sorted.length === 0) {
    return (
      <EmptyStatePanel
        action={
          <Button className={btnPrimaryOrange} type="button" variant="primary" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Activity
          </Button>
        }
        text="Open the calendar or add an activity when plans come up."
        title="Nothing scheduled for this day."
        tone="light"
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className={cn("text-sm font-medium", isToday ? "text-[#20e6a2]" : "text-[#a4b0ca]")}>
        {isToday ? "Today" : formatShortDate(dateIso)}
      </p>
      {sorted.map((ev) => {
        const vis = getActivityCategoryVisualForEvent(ev);
        const fresh = getPlannerEventFreshnessBadge(ev);
        return (
          <button
            key={ev.id}
            type="button"
            className={cn(
              "fh-calendar-day-event flex w-full flex-col rounded-[18px] border px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/40",
              vis.block,
            )}
            onClick={() => onEdit(ev)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-semibold">{ev.title || "Untitled"}</span>
              {fresh ? (
                <span className="fh-calendar-badge rounded border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide">
                  {fresh}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm opacity-90">{formatEventTime(ev)}</p>
            <p className="mt-0.5 text-xs opacity-80">{formatEventMembers(ev, members)}</p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-wide opacity-70">{ev.category}</p>
          </button>
        );
      })}
    </div>
  );
}

function CalendarListAgenda({
  events,
  members,
  todayIso,
  onEdit,
  onAdd,
}: {
  events: PlannerEvent[];
  members: FamilyMember[];
  todayIso: string;
  onEdit: (e: PlannerEvent) => void;
  onAdd: () => void;
}) {
  const groups = useMemo(() => groupAgenda(events, todayIso), [events, todayIso]);

  if (events.length === 0) {
    return (
      <EmptyStatePanel
        action={
          <Button className={btnPrimaryOrange} type="button" variant="primary" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Activity
          </Button>
        }
        text="Household plans will appear here."
        title="No upcoming activities."
        tone="light"
      />
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="mb-3 border-b border-[rgba(150,170,210,0.14)] pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a4b0ca]">
            {g.label}
          </h3>
          <div className="space-y-2">
            {g.items.map((ev) => (
              <LocalActivityRow key={ev.id} event={ev} members={members} onEdit={() => onEdit(ev)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupAgenda(events: PlannerEvent[], todayIso: string) {
  const tomorrow = addDaysIso(todayIso, 1);
  const weekEnd = endOfWeekSundayIso(startOfWeekMondayIso(todayIso));

  const today: PlannerEvent[] = [];
  const tomorrowL: PlannerEvent[] = [];
  const week: PlannerEvent[] = [];
  const later: PlannerEvent[] = [];
  const earlier: PlannerEvent[] = [];

  for (const e of events) {
    const d = e.date.slice(0, 10);
    if (d < todayIso) {
      earlier.push(e);
    } else if (d === todayIso) {
      today.push(e);
    } else if (d === tomorrow) {
      tomorrowL.push(e);
    } else if (d > tomorrow && d <= weekEnd) {
      week.push(e);
    } else {
      later.push(e);
    }
  }

  const sortFn = (a: PlannerEvent, b: PlannerEvent) =>
    `${a.date}${a.startTime || a.time}`.localeCompare(`${b.date}${b.startTime || b.time}`);

  earlier.sort(sortFn);
  today.sort(sortFn);
  tomorrowL.sort(sortFn);
  week.sort(sortFn);
  later.sort(sortFn);

  const out: { label: string; items: PlannerEvent[] }[] = [];
  if (earlier.length) out.push({ label: "Earlier", items: earlier });
  if (today.length) out.push({ label: "Today", items: today });
  if (tomorrowL.length) out.push({ label: "Tomorrow", items: tomorrowL });
  if (week.length) out.push({ label: "This week", items: week });
  if (later.length) out.push({ label: "Later", items: later });
  return out;
}

function LocalActivityRow({
  event,
  members,
  onEdit,
}: {
  event: PlannerEvent;
  members: FamilyMember[];
  onEdit: () => void;
}) {
  const vis = getActivityCategoryVisualForEvent(event);
  const fresh = getPlannerEventFreshnessBadge(event);
  return (
    <div className="fh-calendar-agenda-row grid gap-3 rounded-[18px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-semibold text-[#f7fbff]">{event.title || "Untitled"}</p>
        <p className="mt-1 text-sm text-[#a4b0ca]">
          {formatEventTime(event)} · {event.location || "No location"}
        </p>
      </div>
      <span className={cn("justify-self-start rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", vis.chip)}>
        {event.category}
      </span>
      <p className="text-sm text-[#c6d4ef]">{formatEventMembers(event, members)}</p>
      <p className="text-sm tabular-nums text-[#a4b0ca]">{formatShortDate(event.date)}</p>
      <div className="flex flex-wrap items-center gap-2 justify-self-end">
        {fresh ? (
          <span className="fh-calendar-badge rounded border px-2 py-0.5 text-[0.65rem] font-bold uppercase">
            {fresh}
          </span>
        ) : null}
        <Button className={btnSecondaryLight} onClick={onEdit} variant="secondary" type="button">
          Details
        </Button>
      </div>
    </div>
  );
}

function CalendarLinkEditorDark({
  calendar,
  onUpdate,
  onRemove,
}: {
  calendar: CalendarLink;
  onUpdate: (updates: Partial<CalendarLink>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="fh-calendar-link-editor space-y-3 rounded-[18px] border p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <CalendarFieldDark label="Display name">
          <Input
            className={SM_INPUT}
            value={calendar.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </CalendarFieldDark>
        <CalendarFieldDark label="Google Calendar public link">
          <Input
            className={SM_INPUT}
            placeholder="https://calendar.google.com/calendar/..."
            value={calendar.calendarUrl}
            onChange={(event) => onUpdate({ calendarUrl: event.target.value })}
          />
        </CalendarFieldDark>
        <CalendarFieldDark label="Embed URL (optional)">
          <Input
            className={SM_INPUT}
            placeholder="https://calendar.google.com/calendar/embed?..."
            value={calendar.embedUrl ?? ""}
            onChange={(event) => onUpdate({ embedUrl: event.target.value })}
          />
        </CalendarFieldDark>
        <CalendarFieldDark label="Notes">
          <Textarea
            className={cn(SM_INPUT, "min-h-[88px]")}
            value={calendar.notes}
            onChange={(event) => onUpdate({ notes: event.target.value })}
          />
        </CalendarFieldDark>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(150,170,210,0.14)] pt-3">
        <p className="text-xs text-[#a4b0ca]">
          Saved {formatShortDate(calendar.createdAt)} · Updated {formatShortDate(calendar.updatedAt)}
        </p>
        <div className="flex flex-wrap gap-2">
          <OpenCalendarLinkDark calendar={calendar} />
          <Button
            className="text-rose-700 hover:bg-rose-50"
            onClick={onRemove}
            variant="ghost"
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function CalendarPreviewDark({ calendar }: { calendar: CalendarLink }) {
  if (isValidGoogleCalendarEmbedUrl(calendar.embedUrl)) {
    return (
      <div className="fh-calendar-preview-frame overflow-hidden rounded-[18px] border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <iframe
          className="h-[min(78vh,680px)] min-h-[300px] w-full rounded-[14px] border border-[rgba(150,170,210,0.14)] bg-white sm:min-h-[360px] md:min-h-[420px]"
          loading="lazy"
          src={calendar.embedUrl}
          title={calendar.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EmptyStatePanel
        text="Use a Google Calendar embed URL for inline preview, or open the public link."
        title="Inline preview unavailable"
        tone="light"
      />
      <OpenCalendarLinkDark calendar={calendar} />
    </div>
  );
}

function OpenCalendarLinkDark({ calendar }: { calendar: CalendarLink }) {
  if (!isValidHttpUrl(calendar.calendarUrl)) {
    return (
      <Button className={btnSecondaryLight} disabled variant="secondary" type="button">
        <ExternalLink className="h-4 w-4" aria-hidden />
        Open calendar
      </Button>
    );
  }

  return (
    <a
      className={cn(
        "motion-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
        btnSecondaryLight,
      )}
      href={calendar.calendarUrl}
      rel="noreferrer"
      target="_blank"
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
      Open calendar
    </a>
  );
}

function CalendarFieldDark({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className={SM_LABEL}>{label}</span>
      {children}
    </label>
  );
}

const calendarDrawerSection =
  "fh-calendar-drawer-section rounded-[20px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-5";

function ActivityDrawer({
  categoryOptions,
  event,
  isExisting,
  members,
  onCancel,
  onChange,
  onDelete,
  onSave,
}: {
  categoryOptions: string[];
  event: PlannerEvent;
  isExisting: boolean;
  members: FamilyMember[];
  onCancel: () => void;
  onChange: (event: PlannerEvent) => void;
  onDelete: () => void;
  onSave: (event: PlannerEvent, addAnother: boolean) => string[];
}) {
  useDrawerEscape(true, onCancel);
  const eventDrawerTitleId = useId();
  const [errors, setErrors] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const suggestions = categorySuggestions[event.category] ?? [];
  const assignmentRoster = membersForAssignmentSelect(
    members,
    ...(event.assignedMemberIds ?? []),
    event.assignedMemberId,
    event.responsibleAdultId,
  );

  function update(updates: Partial<PlannerEvent>) {
    onChange({ ...event, ...updates, updatedAt: new Date().toISOString() });
  }

  function save(addAnother = false) {
    const validationErrors = onSave(event, addAnother);
    setErrors(validationErrors);
  }

  function addPrepItem(text = "Prep item") {
    update({
      prepChecklist: [...(event.prepChecklist ?? []), { id: crypto.randomUUID(), text, completed: false }],
    });
  }

  function updatePrepItem(id: string, updates: Partial<PlannerPrepChecklistItem>) {
    update({
      prepChecklist: (event.prepChecklist ?? []).map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    });
  }

  function removePrepItem(id: string) {
    update({
      prepChecklist: (event.prepChecklist ?? []).filter((item) => item.id !== id),
    });
  }

  const inputDrawer = cn("min-h-11", SM_INPUT);

  return (
    <>
      <DrawerBackdrop ariaLabel="Close activity editor" onClick={onCancel} />
      <DrawerPanel
        role="dialog"
        aria-labelledby={eventDrawerTitleId}
        aria-modal="true"
        className="fh-calendar-drawer !border-[rgba(150,170,210,0.18)] !bg-[#07101f] !text-[#f7fbff] !shadow-[0_24px_90px_rgba(0,0,0,0.5)] lg:max-w-4xl"
      >
        <DrawerHeader
          eyebrow={isExisting ? "Edit activity" : "New activity"}
          title={event.title || "New activity"}
          titleId={eventDrawerTitleId}
          trailing={
            <Button
              className="text-[#a4b0ca] hover:bg-white/10 hover:text-[#f7fbff]"
              onClick={onCancel}
              variant="ghost"
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
          }
        />

        <DrawerBody className="space-y-5 !bg-[#050914]">
          {errors.length > 0 ? (
            <div className="rounded-[18px] border border-rose-400/30 bg-rose-500/12 p-3 text-sm text-rose-100">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          <section className={cn(calendarDrawerSection, "grid grid-cols-1 gap-3 md:grid-cols-2")}>
            <CalendarFieldDark label="Title">
              <Input className={inputDrawer} value={event.title} onChange={(c) => update({ title: c.target.value })} />
            </CalendarFieldDark>
            <CalendarFieldDark label="Date">
              <Input className={inputDrawer} type="date" value={event.date} onChange={(c) => update({ date: c.target.value })} />
            </CalendarFieldDark>
            {!event.isAllDay ? (
              <>
                <CalendarFieldDark label="Start time">
                  <Input
                    className={inputDrawer}
                    type="time"
                    value={event.startTime ?? event.time}
                    onChange={(c) =>
                      update({ startTime: c.target.value, time: c.target.value })
                    }
                  />
                </CalendarFieldDark>
                <CalendarFieldDark label="End time">
                  <Input
                    className={inputDrawer}
                    type="time"
                    value={event.endTime ?? ""}
                    onChange={(c) => update({ endTime: c.target.value })}
                  />
                </CalendarFieldDark>
              </>
            ) : null}
            <CalendarFieldDark label="Assigned to">
              <MemberMultiSelectDark event={event} members={members} onChange={update} />
            </CalendarFieldDark>
            <CalendarFieldDark label="Category">
              <Select
                className={inputDrawer}
                value={event.category}
                onChange={(c) => update({ category: c.target.value as PlannerEventCategory })}
              >
                {selectOptionsWithCurrent(categoryOptions, event.category).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </CalendarFieldDark>
            <CalendarFieldDark label="Location">
              <Input
                className={inputDrawer}
                value={event.location ?? ""}
                onChange={(c) => update({ location: c.target.value })}
              />
            </CalendarFieldDark>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#f7fbff] md:col-span-2">
              <input
                checked={Boolean(event.isAllDay)}
                className="h-5 w-5 accent-[#F26522]"
                onChange={(c) => update({ isAllDay: c.target.checked })}
                type="checkbox"
              />
              All day
            </label>
          </section>

          <button
            type="button"
            className="fh-calendar-drawer-toggle flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fb7ff]/45"
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
          >
            Advanced options
            <span className="text-[#a4b0ca]">{advancedOpen ? "−" : "+"}</span>
          </button>

          {advancedOpen ? (
            <>
              <section className={cn(calendarDrawerSection, "grid grid-cols-1 gap-3 md:grid-cols-2")}>
                <CalendarFieldDark label="Responsible adult">
                  <Select
                    className={inputDrawer}
                    value={event.responsibleAdultId ?? ""}
                    onChange={(c) => update({ responsibleAdultId: c.target.value })}
                  >
                    <option value="">None selected</option>
                    {assignmentRoster.map((member) => (
                      <option key={member.id} value={member.id}>
                        {getMemberFullName(member)}
                      </option>
                    ))}
                  </Select>
                </CalendarFieldDark>
                <div className="md:col-span-2">
                  <CalendarFieldDark label="Notes">
                    <Textarea
                      className={cn(inputDrawer, "min-h-[100px]")}
                      value={event.notes ?? ""}
                      onChange={(c) => update({ notes: c.target.value })}
                    />
                  </CalendarFieldDark>
                </div>
                <CalendarFieldDark label="Reminder">
                  <Select
                    className={inputDrawer}
                    value={event.reminderSettings?.[0]?.id ?? "none"}
                    onChange={(c) => {
                      const reminder = reminderOptions.find((o) => o.id === c.target.value);
                      update({
                        reminderSettings: reminder && reminder.id !== "none" ? [reminder] : [],
                      });
                    }}
                  >
                    {reminderOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </CalendarFieldDark>
                <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#f7fbff]">
                  <input
                    checked={Boolean(event.repeatEnabled)}
                    className="h-5 w-5 accent-[#F26522]"
                    onChange={(c) => update({ repeatEnabled: c.target.checked })}
                    type="checkbox"
                  />
                  Repeat
                </label>
                {event.repeatEnabled ? (
                  <CalendarFieldDark label="Repeat rule">
                    <Select
                      className={inputDrawer}
                      value={event.repeatRule ?? ""}
                      onChange={(c) => update({ repeatRule: c.target.value as PlannerRepeatRule })}
                    >
                      <option value="">Choose repeat rule</option>
                      {repeatRules.map((rule) => (
                        <option key={rule}>{rule}</option>
                      ))}
                    </Select>
                  </CalendarFieldDark>
                ) : null}
              </section>

              <section className={cn(calendarDrawerSection, "space-y-3")}>
                <div className="flex items-center justify-between gap-3 border-b border-[rgba(150,170,210,0.14)] pb-3">
                  <h3 className="text-sm font-semibold text-[#f7fbff]">Prep checklist</h3>
                  <Button className={btnSecondaryLight} onClick={() => addPrepItem()} variant="secondary" type="button">
                    Add item
                  </Button>
                </div>
                {suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        className={btnSecondaryLight}
                        onClick={() => addPrepItem(suggestion)}
                        variant="secondary"
                        type="button"
                      >
                        Add {suggestion}
                      </Button>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-2">
                  {(event.prepChecklist ?? []).map((item) => (
                    <div
                      className="fh-calendar-prep-row grid gap-2 rounded-[18px] border p-3 md:grid-cols-[auto_1fr_auto]"
                      key={item.id}
                    >
                      <input
                        checked={item.completed}
                        className="mt-2 h-5 w-5 accent-[#F26522]"
                        onChange={(c) => updatePrepItem(item.id, { completed: c.target.checked })}
                        type="checkbox"
                      />
                      <Input
                        className={inputDrawer}
                        value={item.text}
                        onChange={(c) => updatePrepItem(item.id, { text: c.target.value })}
                      />
                      <Button
                        className="text-[#a4b0ca] hover:bg-white/10 hover:text-[#f7fbff]"
                        onClick={() => removePrepItem(item.id)}
                        variant="ghost"
                        type="button"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {(event.prepChecklist ?? []).length === 0 ? (
                    <p className="text-sm text-[#a4b0ca]">No prep items yet.</p>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </DrawerBody>

        <DrawerFooter>
          <div>
            {isExisting ? (
              <Button
                className="text-rose-700 hover:bg-rose-50"
                onClick={onDelete}
                variant="ghost"
                type="button"
              >
                Delete activity
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className={btnSecondaryLight} onClick={() => save(true)} variant="secondary" type="button">
              Save &amp; add another
            </Button>
            <Button className={btnPrimaryOrange} onClick={() => save(false)} variant="primary" type="button">
              Save Activity
            </Button>
          </div>
        </DrawerFooter>
      </DrawerPanel>
    </>
  );
}

function MemberMultiSelectDark({
  event,
  members,
  onChange,
}: {
  event: PlannerEvent;
  members: FamilyMember[];
  onChange: (updates: Partial<PlannerEvent>) => void;
}) {
  const selected = new Set(event.assignedMemberIds ?? []);
  const roster = membersForAssignmentSelect(
    members,
    ...(event.assignedMemberIds ?? []),
    event.assignedMemberId,
  );

  return (
    <div className="fh-calendar-member-select grid gap-2 rounded-[18px] border p-3">
      {roster.map((member) => (
        <label
          className="flex items-center justify-between gap-3 text-sm text-[#f7fbff]"
          key={member.id}
        >
          {getMemberFullName(member)}
          <input
            checked={selected.has(member.id)}
            className="h-5 w-5 accent-[#F26522]"
            onChange={(change) => {
              const next = new Set(selected);
              if (change.target.checked) {
                next.add(member.id);
              } else {
                next.delete(member.id);
              }
              onChange({ assignedMemberIds: Array.from(next) });
            }}
            type="checkbox"
          />
        </label>
      ))}
    </div>
  );
}

function createDraftEvent(members: FamilyMember[]): PlannerEvent {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: "",
    category: "Family",
    assignedMemberId: "",
    assignedMemberIds: [],
    assignedPerson: "Family",
    responsibleAdultId: members[0]?.id ?? "",
    date: new Date().toISOString().slice(0, 10),
    time: "16:00",
    startTime: "16:00",
    endTime: "17:00",
    isAllDay: false,
    repeatEnabled: false,
    repeatRule: undefined,
    location: "",
    notes: "",
    prepChecklist: [],
    reminderSettings: [],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeEventForSave(event: PlannerEvent, members: FamilyMember[]): PlannerEvent {
  const assignedMemberIds = event.assignedMemberIds ?? [];
  const roster = membersForAssignmentSelect(members, ...assignedMemberIds);
  const primaryMember = roster.find((member) => member.id === assignedMemberIds[0]);
  const startTime = event.isAllDay ? "" : event.startTime || event.time;

  return {
    ...event,
    title: event.title.trim(),
    assignedMemberId: assignedMemberIds[0] ?? "",
    assignedPerson: primaryMember?.name ?? "Family",
    time: startTime,
    startTime,
    endTime: event.isAllDay ? "" : event.endTime,
    repeatRule: event.repeatEnabled ? event.repeatRule : undefined,
    updatedAt: new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
  };
}

function validateActivity(event: PlannerEvent) {
  const errors: string[] = [];

  if (!event.title.trim()) {
    errors.push("Title is required.");
  }

  if (!event.date) {
    errors.push("Date is required.");
  }

  if (!event.isAllDay) {
    if (!event.startTime && !event.time) {
      errors.push("Start time is required unless all-day is enabled.");
    }
    if (!event.endTime) {
      errors.push("End time is required unless all-day is enabled.");
    }
    if (
      (event.startTime || event.time) &&
      event.endTime &&
      event.endTime <= (event.startTime || event.time)
    ) {
      errors.push("End time must be after start time.");
    }
  }

  if (event.repeatEnabled && !event.repeatRule) {
    errors.push("Choose a repeat rule, or turn repeat off.");
  }

  return errors;
}

function sortEvents(a: PlannerEvent, b: PlannerEvent) {
  return `${a.date}${a.startTime || a.time}`.localeCompare(`${b.date}${b.startTime || b.time}`);
}

function compareEventStart(a: PlannerEvent, b: PlannerEvent) {
  const ta = (a.startTime || a.time || "").localeCompare(b.startTime || b.time || "");
  if (ta !== 0) return ta;
  return (a.title || "").localeCompare(b.title || "");
}

function formatEventTime(event: PlannerEvent) {
  if (event.isAllDay) {
    return "All day";
  }

  if (event.endTime) {
    return `${event.startTime || event.time} – ${event.endTime}`;
  }

  return event.startTime || event.time || "Any time";
}

function formatEventMembers(event: PlannerEvent, members: FamilyMember[]) {
  const assignedIds = event.assignedMemberIds ?? [];
  const roster = membersForAssignmentSelect(members, ...assignedIds);
  const names = assignedIds
    .map((id) => {
      const m = roster.find((member) => member.id === id);
      return m ? getMemberFullName(m) : undefined;
    })
    .filter(Boolean);

  if (names.length > 0) {
    return names.join(", ");
  }

  return event.assignedPerson !== "Family" ? event.assignedPerson : "Unassigned";
}

function isValidGoogleCalendarEmbedUrl(value?: string) {
  if (!value || !isValidHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "calendar.google.com" &&
      url.pathname.startsWith("/calendar/embed")
    );
  } catch {
    return false;
  }
}

function isValidHttpUrl(value?: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
