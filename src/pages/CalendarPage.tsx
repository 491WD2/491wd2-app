import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
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
import {
  trackCalendarEventAdd,
  trackCalendarEventEdit,
  trackCalendarView,
} from "../lib/calendarPlannerAnalytics";

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

/** SmartHR HTML bundle tokens — matches Dashboard / Messages */
const PAGE_BG = "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";
const CARD_SHELL =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.2)]";
const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const CARD_CALENDAR =
  "!rounded-[8px] !border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.12)]";

const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const btnSecondaryLight =
  "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";
const segmentInactiveLight = "text-[#637381] hover:bg-white hover:text-[#1f1f1f]";
const segmentActiveLight =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-sm";

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
        className="flex w-full flex-wrap gap-1 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-1 sm:w-auto"
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

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "motion-page flex flex-col gap-4 overflow-x-hidden px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone="light"
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
                <h1 className="mt-1 text-[22px] font-medium leading-snug tracking-tight text-[#1f1f1f]">
                  Calendar
                </h1>
                <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#575757]">
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
          <Card className={CARD_CALENDAR} tone="light">
            <CardHeader eyebrow="Activities" title="Upcoming Activities" tone="light" />
            <p className="mb-3 text-sm text-[#575757]">
              Choose an activity to edit, or use Quick add for something new.
            </p>
            <div className="space-y-2">
              {upcomingPreview.length === 0 ? (
                <p className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-4 text-center text-sm text-[#637381]">
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

          <Card className={CARD_CALENDAR} tone="light">
            <CardHeader eyebrow="Filter" title="Activity types" tone="light" />
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(
                    "min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40",
                    categoryFilter === chip.category
                      ? "border-[#F26522]/35 bg-gradient-to-r from-[#FF6F28]/15 to-[#FF5325]/15 text-[#c2410c]"
                      : "border-[#ededed] bg-[#f8f9fa] text-[#637381] hover:border-[#dedede]",
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

          <Card className={CARD_CALENDAR} tone="light">
            <CardHeader eyebrow="Household" title="Assigned to" tone="light" />
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
              <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--bd-border)] bg-[var(--bd-bg-card)] px-4 py-3 shadow-[var(--bd-shadow-card)]">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(btnSecondaryLight, "min-h-10 px-2")}
                  onClick={navPrev}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-center text-sm font-bold text-[#1f1f1f] sm:text-base">
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
          <Card className={cn("overflow-hidden", CARD_CALENDAR)} tone="light">
            <div className="mb-4 flex flex-col gap-3 border-b border-[#ededed] pb-4 sm:flex-row sm:items-center sm:justify-between">
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
                <h2 className="min-w-0 flex-1 text-center text-lg font-semibold text-[#1f1f1f] sm:text-xl">
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
            className={cn(
              "group rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
            )}
            open={showLinkedCalendars}
            onToggle={(e) => setShowLinkedCalendars((e.target as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={SM_LABEL}>Google Calendar</p>
                  <p className="mt-1 text-base font-semibold text-[#1f1f1f]">Linked calendars</p>
                  <p className="mt-1 text-sm text-[#575757]">
                    Optional embed or link — your local activities stay in FamilySite.
                  </p>
                </div>
                <CalendarDays className="h-6 w-6 shrink-0 text-[#637381] group-open:text-[#F26522]" />
              </div>
            </summary>
            <div className="border-t border-[#ededed] px-4 py-4 sm:px-5 sm:py-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
                <Card className={CARD_CALENDAR} tone="light">
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
                    tone="light"
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
                <Card className={CARD_CALENDAR} tone="light">
                  <CardHeader eyebrow="Preview" title="Embed" tone="light" />
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
                  <p className="mt-4 text-sm leading-6 text-[#575757]">
                    Managed in Google Calendar. Updates there appear in this view.
                  </p>
                </Card>
              </div>
            </div>
          </details>
          ) : null}
        </main>
      </div>

      {editingEvent ? (
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
            setEditingEvent(addAnother ? createDraftEvent(data.familyMembers) : undefined);
            return [];
          }}
        />
      ) : null}
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
        "w-full rounded-[8px] border px-3 py-2.5 text-left shadow-[0_1px_1px_rgba(0,0,0,0.04)] transition hover:border-[#dedede] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
        v.block,
      )}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{event.title || "Untitled"}</p>
        {fresh ? (
          <span className="shrink-0 rounded border border-[#ededed] bg-[#f8f9fa] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#637381]">
            {fresh}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[0.7rem] text-[#637381]">
        {formatShortDate(event.date)} · {formatEventTime(event)}
      </p>
      <p className="mt-0.5 text-[0.7rem] text-[#575757]">{formatEventMembers(event, members)}</p>
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
      <div className="grid grid-cols-7 gap-px rounded-[8px] border border-[#ededed] bg-[#ededed] p-px">
        {weekdays.map((w) => (
          <div
            key={w}
            className="bg-[#f8f9fa] px-1 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-[#637381]"
          >
            {w}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`e-${idx}`} className="min-h-[5.5rem] bg-[#fafafa]" aria-hidden />
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
                "flex min-h-[5.5rem] flex-col border border-[#ededed] bg-white p-1",
                isToday && "bg-orange-50/80 ring-1 ring-[#F26522]/30",
                isSelected && "ring-2 ring-[#F26522]/50",
              )}
            >
              <button
                type="button"
                className={cn(
                  "mb-1 flex w-full items-center justify-between rounded-[6px] px-1 py-0.5 text-left text-xs font-semibold transition hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
                  isToday ? "text-[#c2410c]" : "text-[#637381]",
                )}
                onClick={() => onPickDay(iso)}
              >
                <span>{day}</span>
                {isToday ? (
                  <span className="text-[0.6rem] font-bold uppercase tracking-wide text-[#F26522]">
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
                        "truncate rounded-[4px] px-1 py-0.5 text-left text-[0.65rem] font-medium leading-tight transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FE9F43]/50",
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
                  <p className="px-1 text-[0.6rem] font-medium text-[#637381]">+{more} more</p>
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
      <div className="grid min-w-[720px] grid-cols-7 gap-2">
        {days.map((iso, i) => {
          const list = eventsByDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={cn(
                "flex min-h-[280px] flex-col rounded-[8px] border border-[#ededed] bg-white p-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
                isToday && "ring-1 ring-[#F26522]/35",
              )}
            >
              <button
                type="button"
                className={cn(
                  "mb-2 rounded-[8px] px-2 py-1.5 text-left text-xs font-semibold transition hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
                  isToday ? "text-[#c2410c]" : "text-[#1f1f1f]",
                )}
                onClick={() => onSelectDay(iso)}
              >
                <span className="block text-[0.65rem] uppercase tracking-wide text-[#637381]">
                  {weekdayShort[i]}
                </span>
                <span className="text-base">{iso.slice(8, 10)}</span>
              </button>
              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {list.length === 0 ? (
                  <p className="px-1 text-[0.65rem] text-[#94a3b8]">—</p>
                ) : (
                  list.map((ev) => {
                    const vis = getActivityCategoryVisualForEvent(ev);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        className={cn(
                          "rounded-[6px] border px-2 py-1.5 text-left text-[0.7rem] font-medium leading-snug shadow-[0_1px_1px_rgba(0,0,0,0.04)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FE9F43]/50",
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
      <p className={cn("text-sm font-medium", isToday ? "text-[#F26522]" : "text-[#637381]")}>
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
              "flex w-full flex-col rounded-[8px] border px-4 py-3 text-left shadow-[0_1px_1px_rgba(0,0,0,0.06)] transition hover:border-[#dedede] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40",
              vis.block,
            )}
            onClick={() => onEdit(ev)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-semibold">{ev.title || "Untitled"}</span>
              {fresh ? (
                <span className="rounded border border-[#ededed] bg-white/80 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#637381]">
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
          <h3 className="mb-3 border-b border-[#ededed] pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#637381]">
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
    <div className="grid gap-3 rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.08)] md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-semibold text-[#1f1f1f]">{event.title || "Untitled"}</p>
        <p className="mt-1 text-sm text-[#575757]">
          {formatEventTime(event)} · {event.location || "No location"}
        </p>
      </div>
      <span className={cn("justify-self-start rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", vis.chip)}>
        {event.category}
      </span>
      <p className="text-sm text-[#575757]">{formatEventMembers(event, members)}</p>
      <p className="text-sm tabular-nums text-[#637381]">{formatShortDate(event.date)}</p>
      <div className="flex flex-wrap items-center gap-2 justify-self-end">
        {fresh ? (
          <span className="rounded border border-[#ededed] bg-[#f8f9fa] px-2 py-0.5 text-[0.65rem] font-bold uppercase text-[#637381]">
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
    <div className="space-y-3 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-4">
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ededed] pt-3">
        <p className="text-xs text-[#637381]">
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
      <div className="overflow-hidden rounded-[8px] border border-[#ededed] bg-white p-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
        <iframe
          className="h-[min(78vh,680px)] min-h-[300px] w-full rounded-[6px] border border-[#ededed] bg-white sm:min-h-[360px] md:min-h-[420px]"
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
  "rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)] sm:p-5";

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
        className="!border-[#ededed] !bg-white !text-[#1f1f1f] !shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:max-w-4xl"
      >
        <DrawerHeader
          eyebrow={isExisting ? "Edit activity" : "New activity"}
          title={event.title || "New activity"}
          titleId={eventDrawerTitleId}
          trailing={
            <Button
              className="text-[#637381] hover:bg-[#f8f9fa] hover:text-[#1f1f1f]"
              onClick={onCancel}
              variant="ghost"
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </Button>
          }
        />

        <DrawerBody className="space-y-5 !bg-[#f7f7f7]">
          {errors.length > 0 ? (
            <div className="rounded-[8px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
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
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#1f1f1f] md:col-span-2">
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
            className="flex w-full items-center justify-between rounded-[8px] border border-[#ededed] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45"
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
          >
            Advanced options
            <span className="text-[#637381]">{advancedOpen ? "−" : "+"}</span>
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
                <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#1f1f1f]">
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
                <div className="flex items-center justify-between gap-3 border-b border-[#ededed] pb-3">
                  <h3 className="text-sm font-semibold text-[#1f1f1f]">Prep checklist</h3>
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
                      className="grid gap-2 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-3 md:grid-cols-[auto_1fr_auto]"
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
                        className="text-[#637381] hover:bg-white hover:text-[#1f1f1f]"
                        onClick={() => removePrepItem(item.id)}
                        variant="ghost"
                        type="button"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {(event.prepChecklist ?? []).length === 0 ? (
                    <p className="text-sm text-[#637381]">No prep items yet.</p>
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
    <div className="grid gap-2 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-3">
      {roster.map((member) => (
        <label
          className="flex items-center justify-between gap-3 text-sm text-[#1f1f1f]"
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
