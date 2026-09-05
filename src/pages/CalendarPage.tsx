import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Plus,
  Search,
  Table2,
  Trash2,
  Users,
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
import {
  FamilyAvatarStack,
  ScheduleCard,
  SegmentedModeBar,
  SoftStatusBadge,
  StickyNote,
  UpcomingPanel,
} from "../components/schedule";
import { createActivity } from "../lib/activity";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { getActivityCategoryVisualForEvent } from "../lib/calendarActivityStyles";
import { getChoreDueDate } from "../lib/choreTrackerUtils";
import { getCalendarCategories, mergeLists, selectOptionsWithCurrent } from "../lib/customization";
import {
  hasHouseholdCalendarPack,
  mergeHouseholdCalendarIntoData,
} from "../lib/householdCalendarSeed";
import { getPlannerEventFreshnessBadge } from "../lib/plannerActivityBadges";
import {
  expandPlannerEventsForRange,
  expandWeeklyUpcoming,
  formatPlannerRangeLabel,
  plannerEventIsUpcoming,
} from "../lib/plannerRecurrence";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import { formatShortDate, cn, getMemberFullName } from "../lib/utils";
import { addDaysToIso as addDaysLocal } from "../lib/dashboardWeek";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import type { PageProps } from "./pageTypes";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { CalendarPlanningView } from "../components/calendar/CalendarPlanningView";
import "../components/calendar/calendar-planner.css";
import {
  trackCalendarEventAdd,
  trackCalendarEventEdit,
  trackCalendarView,
} from "../lib/calendarPlannerAnalytics";
import "../styles/guided-kiosk.css";
import "../styles/schedule-dashboard.css";

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
type CalendarDashboardMode = "schedule" | "tasks" | "board" | "notes";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  plan: "Board",
  month: "Month",
  week: "Week",
  day: "Day",
  list: "List",
};

const DASHBOARD_MODES: { id: CalendarDashboardMode; label: string }[] = [
  { id: "schedule", label: "Schedule Planner" },
  { id: "tasks", label: "Task List" },
  { id: "board", label: "Household Board" },
  { id: "notes", label: "Notes" },
];

/** Chips map household-friendly labels → stored category values */
const ACTIVITY_TYPE_CHIPS: { label: string; category: PlannerEventCategory | "all" }[] = [
  { label: "All", category: "all" },
  { label: "School", category: "School" },
  { label: "No School", category: "No School" },
  { label: "Activities", category: "Activity" },
  { label: "Travel", category: "Travel" },
  { label: "Chores", category: "Chores" },
  { label: "Household", category: "Household" },
];

/** Light schedule-dashboard tokens — scoped to Calendar. */
const PAGE_BG =
  "fh-sched fh-calendar-page min-h-full text-slate-900 [-webkit-font-smoothing:antialiased]";
const SM_LABEL = "fh-calendar-eyebrow text-[11px] font-semibold uppercase tracking-[0.12em]";
const CARD_SHELL = "fh-calendar-surface-card rounded-[18px] border shadow-sm";
const SM_INPUT =
  "fh-calendar-input min-h-10 w-full rounded-[14px] border px-3 py-2 text-[14px] focus:outline-none focus:ring-2";
const CARD_CALENDAR = "fh-calendar-surface-card !rounded-[18px] shadow-sm";

const btnPrimaryOrange =
  "fh-calendar-btn-primary border-transparent bg-gradient-to-r from-[#3b6ef5] to-[#0d9488] font-semibold text-white shadow-[0_10px_22px_rgba(59,110,245,0.22)] hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7fb]";
const btnSecondaryLight =
  "fh-calendar-btn-secondary border font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f7fb]";
const segmentInactiveLight = "fh-calendar-segment-inactive";
const segmentActiveLight = "fh-calendar-segment-active";

function masterPlannerId(id: string): string {
  return id.replace(/__(occ|day)__\d{4}-\d{2}-\d{2}$/, "");
}

function isTravelEvent(event: PlannerEvent): boolean {
  const category = (event.category ?? "").toLowerCase();
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  if (category === "travel" || tags.includes("travel")) return true;
  const title = (event.title ?? "").toLowerCase();
  return title.includes("trip") || title.includes("travel");
}

function isTentativeEvent(event: PlannerEvent): boolean {
  if (event.isTentative) return true;
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  if (tags.includes("tentative")) return true;
  const blob = `${event.title ?? ""} ${event.notes ?? ""} ${event.location ?? ""}`.toLowerCase();
  return blob.includes("tentative") || blob.includes("not confirmed");
}

function isSchoolMarkerEvent(event: PlannerEvent): boolean {
  const category = (event.category ?? "").toLowerCase();
  const tags = (event.tags ?? []).map((t) => t.toLowerCase());
  const title = (event.title ?? "").toLowerCase();
  if (category === "no school" || tags.includes("no-school") || title.includes("no school")) {
    return true;
  }
  if (title.includes("first day of school") || title.includes("last day of school")) {
    return true;
  }
  if (category === "school" && (title.includes("first day") || title.includes("last day"))) {
    return true;
  }
  return false;
}

function noSchoolReason(event: PlannerEvent): string {
  if (event.noSchoolReason?.trim()) return event.noSchoolReason.trim();
  const notes = (event.notes ?? "").trim();
  if (notes) return notes;
  const title = (event.title ?? "").toLowerCase();
  if (title.includes("first day")) return "First day";
  if (title.includes("last day")) return "Last day";
  if (title.includes("conference")) return "Conferences";
  if (title.includes("holiday")) return "Holiday";
  if (title.includes("staff") || title.includes("in-service") || title.includes("inservice")) {
    return "Staff In-Service / Preparation";
  }
  if (title.includes("break")) return "Break";
  if (title.includes("weather")) return "Weather closure";
  return "No School";
}

function stickyVariantForEvent(event: PlannerEvent): "dark" | "blue" | "yellow" | "green" {
  if (event.stickyColor) return event.stickyColor;
  const blob = `${event.title ?? ""} ${event.notes ?? ""} ${event.noSchoolReason ?? ""}`.toLowerCase();
  if (blob.includes("first day") || blob.includes("last day")) return "green";
  if (blob.includes("conference")) return "blue";
  if (blob.includes("staff") || blob.includes("in-service") || blob.includes("preparation")) {
    return "yellow";
  }
  return "dark";
}

function stickyTitleForEvent(event: PlannerEvent): string {
  const title = (event.title ?? "").trim();
  if (/first day|last day/i.test(title)) return title;
  return "No School";
}

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

export function CalendarPage({ data, setData, navigateWithinApp }: PageProps) {
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
  const [dashboardMode, setDashboardMode] = useState<CalendarDashboardMode>("schedule");
  const [categoryFilter, setCategoryFilter] = useState<PlannerEventCategory | "all">("all");
  const [memberFilter, setMemberFilter] = useState<string | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [toolbarSearch, setToolbarSearch] = useState("");
  const [showLinkedCalendars, setShowLinkedCalendars] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | undefined>();
  /** Schedule dashboard is the default; guided station remains available. */
  const [showFullCalendar, setShowFullCalendar] = useState(true);
  const [guidedFlow, setGuidedFlow] = useState<CalendarGuidedFlow | null>(null);
  const [guidedSearch, setGuidedSearch] = useState("");
  const [guidedMessage, setGuidedMessage] = useState<string | null>(null);

  const activeMembers = useMemo(
    () => data.familyMembers.filter((m) => m.status === "active"),
    [data.familyMembers],
  );

  const notificationCount = useMemo(
    () => (data.notifications ?? []).filter((n) => n && !n.dismissedAt && !n.readAt).length,
    [data.notifications],
  );

  const localEventsSorted = useMemo(
    () => [...data.planner].sort(sortEvents),
    [data.planner],
  );

  const filteredPlanner = useMemo(() => {
    const query = toolbarSearch.trim().toLowerCase();
    return localEventsSorted.filter((event) => {
      if (event.id === "plan-pack-lebanon-2026-27") {
        return false;
      }
      if (categoryFilter !== "all") {
        if (categoryFilter === "Household") {
          if (event.category !== "Household" && event.category !== "Family") {
            return false;
          }
        } else if (event.category !== categoryFilter) {
          return false;
        }
      }
      if (memberFilter !== "all") {
        const ids = event.assignedMemberIds ?? [];
        if (!ids.includes(memberFilter) && event.assignedMemberId !== memberFilter) {
          return false;
        }
      }
      if (query) {
        const tagHay = (event.tags ?? []).join(" ");
        const hay =
          `${event.title} ${event.category} ${event.location ?? ""} ${event.notes ?? ""} ${tagHay}`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [localEventsSorted, categoryFilter, memberFilter, toolbarSearch]);

  const displayRange = useMemo(() => {
    const weekStart = startOfWeekMondayIso(selectedDate);
    if (viewMode === "week" || viewMode === "plan") {
      return {
        start: weekStart,
        end: endOfWeekSundayIso(weekStart),
      };
    }
    if (viewMode === "day") {
      return { start: selectedDate, end: selectedDate };
    }
    if (viewMode === "month") {
      const y = monthAnchor.getFullYear();
      const m = monthAnchor.getMonth() + 1;
      const start = isoFromYmd(y, m, 1);
      const end = isoFromYmd(y, m, daysInMonth(y, m));
      return { start, end };
    }
    // list / agenda — expand next ~120 days for weekly + ranges
    return { start: today, end: addDaysLocal(today, 120) };
  }, [viewMode, selectedDate, monthAnchor, today]);

  const expandedPlanner = useMemo(
    () => expandPlannerEventsForRange(filteredPlanner, displayRange.start, displayRange.end),
    [filteredPlanner, displayRange.start, displayRange.end],
  );

  const eventsByDate = useMemo(() => {
    const m = new Map<string, PlannerEvent[]>();
    for (const e of expandedPlanner) {
      const d = e.date?.trim().slice(0, 10);
      if (!d) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(e);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => compareEventStart(a, b));
    }
    return m;
  }, [expandedPlanner]);

  const upcomingPreview = useMemo(() => {
    const rows: PlannerEvent[] = [];
    for (const event of filteredPlanner) {
      if (!plannerEventIsUpcoming(event, today)) continue;
      if (event.repeatEnabled && event.repeatRule === "Weekly") {
        rows.push(...expandWeeklyUpcoming(event, today, 3));
        continue;
      }
      if (event.endDate && event.endDate >= today && event.date < today) {
        rows.push({ ...event, date: today });
        continue;
      }
      if (event.date >= today || (event.endDate && event.endDate >= today)) {
        rows.push(event);
      }
    }
    return rows.sort(sortEvents).slice(0, 8);
  }, [filteredPlanner, today]);
  const schoolStickyEvents = useMemo(() => {
    return filteredPlanner
      .filter((event) => isSchoolMarkerEvent(event))
      .filter((event) => event.date >= today)
      .slice(0, 6);
  }, [filteredPlanner, today]);
  const travelUpcoming = useMemo(() => {
    return filteredPlanner
      .filter((event) => isTravelEvent(event) && plannerEventIsUpcoming(event, today))
      .slice(0, 5);
  }, [filteredPlanner, today]);
  const choresDueSoon = useMemo(() => {
    return (data.tasks ?? [])
      .filter((task) => {
        if (!task || task.status === "Done" || task.status === "Completed" || task.status === "Skipped") {
          return false;
        }
        const due = getChoreDueDate(task);
        if (!due) return false;
        return due >= today && due <= addDaysIso(today, 7);
      })
      .slice(0, 5);
  }, [data.tasks, today]);
  const todaysEvents = useMemo(
    () => expandedPlanner.filter((event) => event.date?.slice(0, 10) === today),
    [expandedPlanner, today],
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

  /** First-run empty calendar only — never overwrites existing events. */
  useEffect(() => {
    if ((data.planner ?? []).length > 0) return;
    const result = mergeHouseholdCalendarIntoData(data);
    if (result.addedCount === 0) return;
    setData(result.data);
    setGuidedMessage(
      `Loaded ${result.addedCount} family calendar dates (school, activities, travel).`,
    );
    // Intentional one-shot when planner is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadFamilyCalendarDates() {
    const result = mergeHouseholdCalendarIntoData(data);
    setData(result.data);
    if (result.addedCount === 0) {
      setGuidedMessage(
        hasHouseholdCalendarPack(data.planner)
          ? "Family calendar dates are already loaded — nothing new to add."
          : "No new family calendar dates to add (duplicates skipped).",
      );
      return;
    }
    setGuidedMessage(
      `Added ${result.addedCount} family calendar date${result.addedCount === 1 ? "" : "s"}${
        result.skippedCount > 0 ? ` (${result.skippedCount} already present)` : ""
      }.`,
    );
  }

  function openPlannerEvent(event: PlannerEvent) {
    const masterId = masterPlannerId(event.id);
    const master = data.planner.find((item) => item.id === masterId) ?? event;
    setEditingEvent({ ...master, id: masterId });
  }

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

  function goApp(href: string) {
    if (navigateWithinApp) {
      navigateWithinApp(href);
      return;
    }
    window.location.assign(href);
  }

  function handleDashboardMode(mode: CalendarDashboardMode) {
    if (mode === "notes") {
      goApp("/messages");
      return;
    }
    if (mode === "tasks") {
      setDashboardMode("tasks");
      return;
    }
    if (mode === "board") {
      setDashboardMode("board");
      setViewMode("plan");
      return;
    }
    setDashboardMode("schedule");
    if (viewMode === "plan") {
      setViewMode(kioskShell ? "plan" : "month");
    }
  }

  const headerAction = (
    <div className="fh-calendar-view-switcher flex w-full flex-wrap gap-1 rounded-[14px] border p-1 sm:w-auto">
      {(["month", "week", "day", "list", "plan"] as CalendarViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          className={cn(
            "min-h-9 flex-1 rounded-[10px] px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/40 sm:flex-none",
            viewMode === mode ? segmentActiveLight : segmentInactiveLight,
          )}
          onClick={() => {
            setViewMode(mode);
            setDashboardMode(mode === "plan" ? "board" : "schedule");
          }}
        >
          {VIEW_LABELS[mode]}
        </button>
      ))}
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

  const upcomingPanel = (
    <UpcomingPanel
      sections={[
        {
          id: "school",
          label: "School notes",
          content:
            schoolStickyEvents.length > 0 ? (
              <ul className="fh-sched-upcoming__list">
                {schoolStickyEvents.map((event) => (
                  <li key={event.id}>
                    <StickyNote
                      title={stickyTitleForEvent(event)}
                      dateLabel={formatShortDate(event.date)}
                      reason={noSchoolReason(event)}
                      variant={stickyVariantForEvent(event)}
                      onClick={() => openPlannerEvent(event)}
                    />
                  </li>
                ))}
              </ul>
            ) : null,
        },
        {
          id: "activities",
          label: "Upcoming activities",
          content:
            upcomingPreview.filter((e) => !isTravelEvent(e) && !schoolStickyEvents.includes(e)).length >
            0 ? (
              <ul className="fh-sched-upcoming__list">
                {upcomingPreview
                  .filter((e) => !isTravelEvent(e) && !schoolStickyEvents.some((s) => s.id === e.id))
                  .slice(0, 5)
                  .map((event) => (
                    <li key={event.id}>
                      <ScheduleCard
                        title={event.title || "Untitled"}
                        meta={`${formatShortDate(event.date)} · ${formatEventTime(event)}`}
                        tone={isTravelEvent(event) ? "travel" : "pastel-teal"}
                        badges={[{ label: event.category || "Activity", tone: "teal" }]}
                        onClick={() => openPlannerEvent(event)}
                      />
                    </li>
                  ))}
              </ul>
            ) : null,
        },
        {
          id: "travel",
          label: "Travel",
          content:
            travelUpcoming.length > 0 ? (
              <ul className="fh-sched-upcoming__list">
                {travelUpcoming.map((event) => (
                  <li key={event.id}>
                    <ScheduleCard
                      title={event.title || "Travel"}
                      meta={`${formatPlannerRangeLabel(event)}${event.location ? ` · ${event.location}` : ""}`}
                      tone="travel"
                      tentative={isTentativeEvent(event)}
                      badges={[
                        { label: "Travel", tone: "lavender" },
                        {
                          label: formatEventMembers(event, data.familyMembers),
                          tone: "teal",
                        },
                      ]}
                      onClick={() => openPlannerEvent(event)}
                    />
                  </li>
                ))}
              </ul>
            ) : null,
        },
        {
          id: "chores",
          label: "Chores due soon",
          content:
            choresDueSoon.length > 0 ? (
              <ul className="fh-sched-upcoming__list">
                {choresDueSoon.map((task) => (
                  <li key={task.id}>
                    <ScheduleCard
                      title={task.title || "Chore"}
                      meta={`Due ${formatShortDate(getChoreDueDate(task))}`}
                      tone="pastel-green"
                      badges={[{ label: "Chore", tone: "green" }]}
                      onClick={() => goApp("/tasks")}
                    />
                  </li>
                ))}
              </ul>
            ) : null,
        },
      ]}
      emptyText="No upcoming school notes, activities, travel, or chores yet."
      headerAction={
        notificationCount > 0 ? (
          <button
            type="button"
            className="fh-sched-btn fh-sched-btn--ghost"
            onClick={() => goApp("/notifications")}
            aria-label={`${notificationCount} notifications`}
          >
            <Bell className="h-4 w-4" aria-hidden />
            <SoftStatusBadge tone="rose">{notificationCount}</SoftStatusBadge>
          </button>
        ) : null
      }
    />
  );

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(
          "motion-page flex flex-col gap-3 overflow-x-hidden px-[15px] pb-10 pt-3 sm:gap-4 sm:px-[24px] md:pb-10",
          DS_MAIN_COLUMN,
        )}
        tone="light"
      >
        <SegmentedModeBar
          options={DASHBOARD_MODES}
          value={dashboardMode}
          onChange={handleDashboardMode}
          aria-label="Calendar workspace modes"
        />

        <div className="fh-sched-toolbar" role="toolbar" aria-label="Calendar toolbar">
          <div className="fh-sched-toolbar__group">
            <button type="button" className="fh-sched-btn fh-sched-btn--primary" onClick={openNewActivityDrawer}>
              <Plus className="h-4 w-4" aria-hidden />
              Add activity
            </button>
            <button type="button" className="fh-sched-btn" onClick={goToday}>
              Today
            </button>
          </div>
          <label className="fh-sched-search">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              value={toolbarSearch}
              onChange={(e) => setToolbarSearch(e.target.value)}
              placeholder="Find activity"
              aria-label="Find activity"
            />
          </label>
          <div className="fh-sched-toolbar__group">
            <button
              type="button"
              className="fh-sched-btn"
              aria-pressed={memberFilter !== "all"}
              onClick={() => setMemberFilter(memberFilter === "all" ? (activeMembers[0]?.id ?? "all") : "all")}
            >
              <Users className="h-4 w-4" aria-hidden />
              Group by family member
            </button>
            <button
              type="button"
              className="fh-sched-btn"
              aria-pressed={showFilters}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filter
            </button>
          </div>
          <div className="fh-sched-toolbar__spacer" />
          <FamilyAvatarStack
            members={activeMembers}
            selectedId={memberFilter}
            onSelect={(id) => setMemberFilter(id)}
          />
          {notificationCount > 0 ? (
            <button
              type="button"
              className="fh-sched-btn"
              onClick={() => goApp("/notifications")}
              aria-label={`${notificationCount} notifications`}
            >
              <Bell className="h-4 w-4" aria-hidden />
              <SoftStatusBadge tone="rose">{notificationCount}</SoftStatusBadge>
            </button>
          ) : null}
            <button type="button" className="fh-sched-btn" onClick={loadFamilyCalendarDates}>
              Load family calendar dates
            </button>
            <button type="button" className="fh-sched-btn fh-sched-btn--ghost" onClick={() => setShowFullCalendar(false)}>
              Station
            </button>
        </div>

        {showFilters ? (
          <div className={cn(CARD_SHELL, "flex flex-wrap gap-2 p-3")}>
            {ACTIVITY_TYPE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className={cn(
                  "fh-calendar-filter-chip min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  categoryFilter === chip.category
                    ? "fh-calendar-filter-chip--active"
                    : "fh-calendar-filter-chip--idle",
                )}
                onClick={() => setCategoryFilter(chip.category === "all" ? "all" : chip.category)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}

        {dashboardMode === "tasks" ? (
          <div className="fh-sched-placeholder">
            <strong>Task List</strong>
            <p>
              Household chores and tasks live in Cleaning / Kitchen. Open the task list to manage
              what’s due today, overdue, and this week.
            </p>
            <button type="button" className="fh-sched-btn fh-sched-btn--primary" onClick={() => goApp("/tasks")}>
              Open Task List
            </button>
          </div>
        ) : null}

        {dashboardMode === "board" || (dashboardMode === "schedule" && viewMode === "plan") ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
            <main className="fh-sched-workspace min-w-0">
              <div className="fh-sched-workspace__head">
                <h2 className="fh-sched-workspace__title">Household Board</h2>
                {headerAction}
              </div>
              {dashboardMode === "board" && viewMode !== "plan" ? (
                <div className="fh-sched-placeholder mb-4">
                  <strong>Kanban-style chore board</strong>
                  <p>
                    A full household kanban is planned for Cleaning. Use the weekly planning board
                    below for now, or open Cleaning for chore workflows.
                  </p>
                  <button type="button" className="fh-sched-btn" onClick={() => goApp("/tasks")}>
                    Open Cleaning / Chores
                  </button>
                </div>
              ) : null}
              <div className="fh-calendar-week-nav mb-3 flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2">
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(btnSecondaryLight, "min-h-9 px-2")}
                  onClick={navPrev}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-center text-sm font-bold text-slate-800 sm:text-base">
                  {formatShortDate(weekStartIso)} – {formatShortDate(endOfWeekSundayIso(weekStartIso))}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className={cn(btnSecondaryLight, "min-h-9 px-2")}
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
                onEditEvent={openPlannerEvent}
                onAddEvent={openNewActivityDrawer}
              />
            </main>
            {upcomingPanel}
          </div>
        ) : null}

        {dashboardMode === "schedule" && viewMode !== "plan" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
            <main className="fh-sched-workspace min-w-0 space-y-4">
              {guidedMessage ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
                  <p>{guidedMessage}</p>
                  <button type="button" className="fh-sched-btn" onClick={() => setGuidedMessage(null)}>
                    Dismiss
                  </button>
                </div>
              ) : null}
              <div className="fh-sched-workspace__head">
                <div>
                  <p className={SM_LABEL}>FamilyHub</p>
                  <h2 className="fh-sched-workspace__title">Schedule Planner</h2>
                </div>
                {headerAction}
              </div>

              <Card className={cn("fh-calendar-board-card overflow-hidden", CARD_CALENDAR)} tone="light">
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
                    <h2 className="min-w-0 flex-1 text-center text-lg font-semibold text-slate-900 sm:text-xl">
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
                    onEdit={openPlannerEvent}
                  />
                ) : null}
                {viewMode === "week" ? (
                  <CalendarWeekColumns
                    eventsByDate={eventsByDate}
                    weekStartIso={weekStartIso}
                    todayIso={today}
                    onEdit={openPlannerEvent}
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
                    onEdit={openPlannerEvent}
                  />
                ) : null}
                {viewMode === "list" ? (
                  <CalendarListAgenda
                    members={data.familyMembers}
                    todayIso={today}
                    events={expandedPlanner.filter((e) => e.date >= today).slice(0, 80)}
                    onEdit={openPlannerEvent}
                    onAdd={openNewActivityDrawer}
                  />
                ) : null}
              </Card>

              <details
                className="fh-calendar-linked-card group rounded-[18px] border"
                open={showLinkedCalendars}
                onToggle={(e) => setShowLinkedCalendars((e.target as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={SM_LABEL}>Google Calendar</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">Linked calendars</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Optional embed — local activities stay in FamilyHub.
                      </p>
                    </div>
                    <CalendarDays className="h-6 w-6 shrink-0 text-slate-400 group-open:text-teal-600" />
                  </div>
                </summary>
                <div className="border-t border-slate-200 px-4 py-4 sm:px-5 sm:py-6">
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
                    </Card>
                  </div>
                </div>
              </details>
            </main>
            {upcomingPanel}
          </div>
        ) : null}

        {activityDrawer}
      </WorkspacePageShell>
    </div>
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
                  if (isSchoolMarkerEvent(ev)) {
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        title={`${stickyTitleForEvent(ev)} — ${noSchoolReason(ev)}`}
                        className={cn(
                          "fh-sticky truncate !min-h-0 !rotate-0 px-1.5 py-1 text-left text-[0.6rem] font-bold leading-tight",
                          `fh-sticky--${stickyVariantForEvent(ev)}`,
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(ev);
                        }}
                      >
                        <span className="block truncate">{stickyTitleForEvent(ev)}</span>
                        <span className="fh-sticky__reason !mt-0.5 !border-0 !pt-0 !normal-case opacity-90">
                          {noSchoolReason(ev)}
                        </span>
                      </button>
                    );
                  }
                  const vis = getActivityCategoryVisualForEvent(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      title={ev.title}
                      className={cn(
                        "fh-calendar-mini-event truncate rounded-[10px] px-2 py-1 text-left text-[0.65rem] font-semibold leading-tight transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ef5]/50",
                        vis.block,
                        isTentativeEvent(ev) && "fh-sched-card--tentative",
                        isTravelEvent(ev) && "fh-sched-card--travel",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(ev);
                      }}
                    >
                      {isTentativeEvent(ev) ? "Tentative · " : ""}
                      {ev.title || "Untitled"}
                    </button>
                  );
                })}
                {more > 0 ? (
                  <p className="px-1 text-[0.6rem] font-medium text-slate-500">+{more} more</p>
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
                          "fh-calendar-week-event rounded-[14px] border px-2 py-1.5 text-left text-[0.7rem] font-semibold leading-snug transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b6ef5]/50",
                          vis.block,
                          isTentativeEvent(ev) && "fh-sched-card--tentative",
                          isTravelEvent(ev) && "fh-sched-card--travel",
                          isSchoolMarkerEvent(ev) &&
                            `fh-sticky !min-h-0 !rotate-0 fh-sticky--${stickyVariantForEvent(ev)}`,
                        )}
                        onClick={() => onEdit(ev)}
                      >
                        <span className="line-clamp-2">
                          {isSchoolMarkerEvent(ev)
                            ? `${stickyTitleForEvent(ev)} · ${noSchoolReason(ev)}`
                            : `${isTentativeEvent(ev) ? "Tentative · " : ""}${ev.title || "Untitled"}`}
                        </span>
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
              "fh-calendar-day-event flex w-full flex-col rounded-[18px] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/40",
              vis.block,
              isTentativeEvent(ev) && "fh-sched-card--tentative",
              isTravelEvent(ev) && "fh-sched-card--travel",
            )}
            onClick={() => onEdit(ev)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="font-semibold">
                {isTentativeEvent(ev) ? "Tentative · " : ""}
                {ev.title || "Untitled"}
              </span>
              {isTentativeEvent(ev) ? (
                <span className="fh-soft-badge fh-soft-badge--tentative">Tentative</span>
              ) : fresh ? (
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
    tags: [],
    isTentative: false,
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
    endDate: event.endDate?.trim() || undefined,
    tags: event.tags ?? [],
    isTentative: Boolean(event.isTentative),
    noSchoolReason: event.noSchoolReason,
    stickyColor: event.stickyColor,
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
