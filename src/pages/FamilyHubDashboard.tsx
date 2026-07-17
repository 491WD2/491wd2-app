import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Bell,
  CheckCircle2,
  Cloud,
  CloudRain,
  ClipboardList,
  ListChecks,
  Package,
  PackagePlus,
  ScanLine,
  ShoppingCart,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { buildFamilyHubDashboardModel } from "../lib/familyHubDashboardData";
import type { KitchenWeekday } from "../data/familyData";
import {
  trackFamilyHubDashboardView,
} from "../lib/familyHubDashboardAnalytics";
import { getAppDisplayName } from "../lib/customization";
import {
  calendarIsoToKitchenWeekday,
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  labelKitchenWeekday,
} from "../lib/kitchenDuty";
import {
  toggleKitchenChecklistItemForDate,
  visibleKitchenChecklistItems,
} from "../lib/kitchenChecklistDisplay";
import { getMemberColor, rgbaFromHex } from "../lib/memberColors";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import { findMemberById, getMemberFullName, getMemberInitials } from "../lib/utils";
import "../components/cards/kiosk.css";
import { WidgetPageShell } from "../components/widgets";
import "../components/familyHub/family-hub-dashboard.css"; /* member grid */
import type { PageProps } from "./pageTypes";

export type FamilyHubDashboardProps = Pick<
  PageProps,
  | "data"
  | "setData"
  | "navigateWithinApp"
  | "onOpenPantry"
  | "onOpenTasks"
  | "onOpenCalendar"
  | "onOpenMemberDashboard"
> & {
  greeting?: string;
};

const DASHBOARD_WEATHER_LOCATION = "Lebanon, Oregon";

function addDaysIso(iso: string, count: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + count);
  return date.toISOString().slice(0, 10);
}

function formatDashboardTime(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDashboardDate(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDashboardMonth(date = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatScheduleDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function dateToLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const KITCHEN_CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type KitchenChecklistMode = "day" | "night";

const KITCHEN_POPUP_DONE_STORAGE_KEY = "491wd-kitchen-popup-checklist-state";
const KITCHEN_POPUP_NOTES_STORAGE_KEY = "491wd-kitchen-popup-checklist-notes";

const NIGHT_TIME_CHECKLIST = [
  {
    id: "clean-counters",
    title: "Clean Counters",
    detail: "Wipe spills or crumbs as soon as they happen.",
  },
  {
    id: "dishes",
    title: "Dishes",
    detail: "Load dishwasher or hand-wash items after use.",
  },
  {
    id: "sweep-floor",
    title: "Sweep Floor",
    detail: "Quick sweep when crumbs or food hit the floor.",
  },
  {
    id: "check-stove",
    title: "Check Stove",
    detail: "Wipe splatter after cooking.",
  },
  {
    id: "clear-fridge-items",
    title: "Clear Fridge Items if Needed",
    detail: "Put away food on the counters.",
  },
  {
    id: "put-food-away",
    title: "Put Food Away",
    detail: "Return ingredients, snacks, seasonings, and pantry items.",
  },
  {
    id: "replace-towel",
    title: "Replace Towel if Dirty",
    detail: "Swap kitchen towel if wet, dirty, or used for spills.",
  },
  {
    id: "check-dishwasher",
    title: "Check Dishwasher",
    detail: "Start if full; unload if clean and needed.",
  },
  {
    id: "clean-sink",
    title: "Clean Sink",
    detail: "Keep sink clear; rinse food debris.",
  },
] as const;

function readStoredRecord(key: string): Record<string, string[]> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

function readStoredNotes(key: string): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function defaultChecklistMode(date: Date): KitchenChecklistMode {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= 19 * 60 + 30 ? "night" : "day";
}

export function FamilyHubDashboard({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenTasks,
  onOpenCalendar,
  onOpenMemberDashboard,
}: FamilyHubDashboardProps) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const model = useMemo(
    () => buildFamilyHubDashboardModel(data, todayIso),
    [data, todayIso],
  );

  const householdName = getAppDisplayName(data.adminSettings);
  const now = new Date();
  const [dashboardTimeValue, dashboardTimePeriod = ""] = formatDashboardTime(now).split(" ");
  const [checklistPopupOpen, setChecklistPopupOpen] = useState(false);
  const [activeChecklistMode, setActiveChecklistMode] = useState<KitchenChecklistMode>(() =>
    defaultChecklistMode(new Date()),
  );
  const [popupDoneByKey, setPopupDoneByKey] = useState<Record<string, string[]>>(() =>
    readStoredRecord(KITCHEN_POPUP_DONE_STORAGE_KEY),
  );
  const [popupNotesByKey, setPopupNotesByKey] = useState<Record<string, string>>(() =>
    readStoredNotes(KITCHEN_POPUP_NOTES_STORAGE_KEY),
  );
  const todayKitchenDay = getTodayKitchenWeekdayLocal(now);
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule.weekdays.find((entry) => entry.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;
  const kitchenLeadName = kitchenTodayMember
    ? firstName(getMemberFullName(kitchenTodayMember))
    : "Family";
  const daytimeChecklistItems = useMemo(
    () => visibleKitchenChecklistItems(data.kitchenChecklist),
    [data.kitchenChecklist],
  );
  const kitchenAssignmentMembers = useMemo(
    () =>
      membersForAssignmentSelect(
        data.familyMembers,
        ...data.kitchenSchedule.weekdays.map((entry) => entry.memberId),
      ),
    [data.familyMembers, data.kitchenSchedule.weekdays],
  );
  const currentCalendarYear = now.getFullYear();
  const currentCalendarMonth = now.getMonth();
  const kitchenCalendarDays = useMemo(
    () => {
      const firstOfMonth = new Date(currentCalendarYear, currentCalendarMonth, 1, 12);
      const gridStart = new Date(firstOfMonth);
      gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        const iso = dateToLocalIso(date);
        const day = calendarIsoToKitchenWeekday(iso);
        const assignment = day
          ? data.kitchenSchedule.weekdays.find((entry) => entry.day === day)
          : undefined;
        const member = assignment ? findMemberById(data, assignment.memberId) : undefined;
        return {
          iso,
          dayNumber: date.getDate(),
          inCurrentMonth: date.getMonth() === currentCalendarMonth,
          isToday: iso === todayIso,
          isComplete: isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, iso),
          memberColor: getMemberColor(member),
          memberName: member ? firstName(getMemberFullName(member)) : "Open",
        };
      });
    },
    [currentCalendarMonth, currentCalendarYear, data, todayIso],
  );
  const activeShoppingRows = useMemo(
    () => data.shopping.filter((item) => !item.purchased).slice(0, 6),
    [data.shopping],
  );
  const scheduleRows = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const iso = addDaysIso(todayIso, index - 3);
        const day = calendarIsoToKitchenWeekday(iso);
        const assignment = day
          ? data.kitchenSchedule.weekdays.find((entry) => entry.day === day)
          : undefined;
        const member = assignment ? findMemberById(data, assignment.memberId) : undefined;
        return {
          iso,
          day,
          weekday: day ? labelKitchenWeekday(day).slice(0, 3).toUpperCase() : "",
          date: formatScheduleDate(iso),
          memberId: assignment?.memberId ?? "",
          memberColor: getMemberColor(member),
          memberName: member ? firstName(getMemberFullName(member)) : "Open",
          isToday: iso === todayIso,
        };
      }),
    [data, todayIso],
  );
  const upcomingKitchenRows = scheduleRows.filter((row) => !row.isToday).slice(0, 3);

  useEffect(() => {
    trackFamilyHubDashboardView(householdName);
  }, [householdName]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KITCHEN_POPUP_DONE_STORAGE_KEY, JSON.stringify(popupDoneByKey));
    }
  }, [popupDoneByKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KITCHEN_POPUP_NOTES_STORAGE_KEY, JSON.stringify(popupNotesByKey));
    }
  }, [popupNotesByKey]);

  function go(href: string, fallback?: () => void) {
    if (navigateWithinApp) {
      navigateWithinApp(href);
      return;
    }
    fallback?.();
  }

  function updateKitchenDay(day: KitchenWeekday, memberId: string) {
    const updatedAt = new Date().toISOString();
    setData((current) => ({
      ...current,
      kitchenSchedule: {
        ...current.kitchenSchedule,
        weekdays: current.kitchenSchedule.weekdays.map((row) =>
          row.day === day ? { ...row, memberId } : row,
        ),
        updatedAt,
      },
    }));
  }

  function openChecklistPopup(mode = defaultChecklistMode(new Date())) {
    setActiveChecklistMode(mode);
    setChecklistPopupOpen(true);
  }

  function toggleDaytimeChecklistItem(itemId: string) {
    setData((current) => ({
      ...current,
      kitchenChecklist: toggleKitchenChecklistItemForDate(current.kitchenChecklist, itemId, todayIso),
    }));
  }

  function toggleNightChecklistItem(itemId: string) {
    const key = `night:${todayIso}`;
    setPopupDoneByKey((current) => {
      const ids = new Set(current[key] ?? []);
      if (ids.has(itemId)) {
        ids.delete(itemId);
      } else {
        ids.add(itemId);
      }
      return { ...current, [key]: [...ids] };
    });
  }

  const activeChecklistKey = `${activeChecklistMode}:${todayIso}`;
  const activeChecklistNotes = popupNotesByKey[activeChecklistKey] ?? "";
  const nightDoneIds = new Set(popupDoneByKey[`night:${todayIso}`] ?? []);
  const activeChecklistTitle =
    activeChecklistMode === "night" ? "Night Time List" : "Kitchen checklist";
  const activeChecklistWindow =
    activeChecklistMode === "night"
      ? "Resets daily at 7:30 PM"
      : "Resets daily at 12:01 AM and runs until 7:29 PM";

  return (
    <WidgetPageShell className="fh-family-hub fh-family-hub--reference">
      <section className="fh-family-hub__top-deck" aria-label="Household dashboard command center">
        <header className="fh-family-hub__reference-header" aria-label="Kitchen assignment summary">
          <div className="fh-family-hub__duty-summary">
            <div className="fh-family-hub__duty-copy">
              <p className="fh-family-hub__duty-kicker">Kitchen assignment</p>
              <p className="fh-family-hub__duty-title">
                Kitchen Lead <strong>{kitchenLeadName}</strong>
              </p>
              <p className="fh-family-hub__duty-now">
                Shared family station <span aria-hidden> · </span>{model.overview.dateLabel}
              </p>
            </div>
          </div>
          <div className="fh-family-hub__weather-row" aria-label={`Time and weather for ${DASHBOARD_WEATHER_LOCATION}`}>
            <span className="fh-family-hub__weather-location">{DASHBOARD_WEATHER_LOCATION}</span>
            <div className="fh-family-hub__weather-card fh-family-hub__weather-card--today">
              <Sun className="h-5 w-5" aria-hidden />
              <strong>72°</strong>
              <span>Today</span>
            </div>
            <div className="fh-family-hub__weather-card">
              <Cloud className="h-5 w-5" aria-hidden />
              <strong>68°</strong>
              <span>Fri</span>
            </div>
            <div className="fh-family-hub__weather-card">
              <CloudRain className="h-5 w-5" aria-hidden />
              <strong>65°</strong>
              <span>Sat</span>
            </div>
            <div className="fh-family-hub__time-card">
              <strong className="fh-family-hub__time-value">
                <span>{dashboardTimeValue}</span>
                {dashboardTimePeriod ? <em>{dashboardTimePeriod}</em> : null}
              </strong>
              <span>{formatDashboardDate(now)}</span>
            </div>
          </div>
        </header>

        <section className="fh-family-hub__primary-actions" aria-label="Primary household actions">
          <button type="button" className="fh-module-card fh-module-card--green" onClick={() => openChecklistPopup()}>
            <span className="fh-module-card__icon" aria-hidden>
              <ListChecks className="h-5 w-5" />
            </span>
            <span className="fh-module-card__copy">
              <strong>Kitchen Checklist</strong>
              <small>Day and night check-off lists</small>
            </span>
            <span className="fh-module-card__arrow" aria-hidden>→</span>
          </button>
          <button type="button" className="fh-module-card fh-module-card--blue" onClick={() => go("/tasks", onOpenTasks)}>
            <span className="fh-module-card__icon" aria-hidden>
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="fh-module-card__copy">
              <strong>Open Cleaning</strong>
              <small>Cleaning and task dashboard</small>
            </span>
            <span className="fh-module-card__arrow" aria-hidden>→</span>
          </button>
          <button type="button" className="fh-module-card fh-module-card--orange" onClick={() => go("/shopping?action=add")}>
            <span className="fh-module-card__icon" aria-hidden>
              <ShoppingCart className="h-5 w-5" />
            </span>
            <span className="fh-module-card__copy">
              <strong>Add Shopping Item</strong>
              <small>Quick add to the shared list</small>
            </span>
            <span className="fh-module-card__arrow" aria-hidden>→</span>
          </button>
          <button type="button" className="fh-module-card fh-module-card--amber" onClick={() => go("/pantry?view=pantry", onOpenPantry)}>
            <span className="fh-module-card__icon" aria-hidden>
              <Package className="h-5 w-5" />
            </span>
            <span className="fh-module-card__copy">
              <strong>Open Pantry</strong>
              <small>Inventory and low stock</small>
            </span>
            <span className="fh-module-card__arrow" aria-hidden>→</span>
          </button>
          <button type="button" className="fh-module-card fh-module-card--purple" onClick={() => go("/calendar", onOpenCalendar)}>
            <span className="fh-module-card__icon" aria-hidden>
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="fh-module-card__copy">
              <strong>Open Calendar</strong>
              <small>Weekly planning board</small>
            </span>
            <span className="fh-module-card__arrow" aria-hidden>→</span>
          </button>
        </section>

        <section className="fh-family-hub__priority-grid" aria-label="Shopping and pantry dashboard">
          <section className="fh-family-hub__panel fh-family-hub__panel--shopping" aria-labelledby="home-shopping-title">
            <div className="fh-family-hub__panel-head">
              <div>
                <p className="fh-family-hub__panel-kicker fh-family-hub__panel-kicker--blue">Shopping</p>
                <h2 id="home-shopping-title">Shopping List</h2>
                <span>{model.overview.shoppingOpen} items to buy</span>
              </div>
              <button type="button" onClick={() => go("/shopping")}>View all</button>
            </div>
            <div className="fh-family-hub__shopping-rows">
              {activeShoppingRows.length === 0 ? (
                <p className="fh-widget-empty">Shopping list is clear.</p>
              ) : (
                activeShoppingRows.map((item) => (
                  <button key={item.id} type="button" className="fh-family-hub__shopping-row" onClick={() => go("/shopping")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>{item.name}</span>
                    <small>{item.quantity} {item.unit}</small>
                  </button>
                ))
              )}
            </div>
            <div className="fh-family-hub__panel-actions fh-family-hub__panel-actions--two">
              <button type="button" onClick={() => go("/pantry?tab=add-item")}>
                <ScanLine className="h-4 w-4" aria-hidden />
                Scan Item
              </button>
              <button type="button" onClick={() => go("/shopping")}>
                <TrendingUp className="h-4 w-4" aria-hidden />
                Frequent Items
              </button>
            </div>
          </section>

          <section className="fh-family-hub__panel fh-family-hub__panel--actions" aria-labelledby="home-quick-actions-title">
            <div className="fh-family-hub__panel-head">
              <div>
                <p className="fh-family-hub__panel-kicker fh-family-hub__panel-kicker--green">Quick Actions</p>
                <h2 id="home-quick-actions-title">Pantry</h2>
                <span>Fast item entry</span>
              </div>
            </div>
            <div className="fh-family-hub__quick-action-stack">
              <button type="button" className="fh-family-hub__quick-open" onClick={() => go("/pantry?view=pantry", onOpenPantry)}>
                Open
              </button>
              <button type="button" className="fh-family-hub__action-row" onClick={() => go("/pantry?tab=add-item")}>
                <PackagePlus className="h-5 w-5" aria-hidden />
                <span><strong>Add New Item</strong><small>Manually add to list</small></span>
              </button>
              <button type="button" className="fh-family-hub__action-row fh-family-hub__action-row--purple" onClick={() => go("/pantry?tab=add-item")}>
                <ScanLine className="h-5 w-5" aria-hidden />
                <span><strong>Scan Barcode</strong><small>Add via barcode scan</small></span>
              </button>
              <button type="button" className="fh-family-hub__action-row fh-family-hub__action-row--amber" onClick={() => go("/shopping")}>
                <TrendingUp className="h-5 w-5" aria-hidden />
                <span><strong>Frequent Items</strong><small>Quick select common items</small></span>
              </button>
              <button type="button" className="fh-family-hub__action-row fh-family-hub__action-row--orange" onClick={() => go("/pantry?view=pantry", onOpenPantry)}>
                <Bell className="h-5 w-5" aria-hidden />
                <span><strong>Low Stock Alert</strong><small>Add items running low</small></span>
              </button>
            </div>
          </section>
        </section>

        <section className="fh-family-hub__planner-board" aria-label="Kitchen assignment day board">
          <div className="fh-family-hub__planner-main">
            <div className="fh-family-hub__planner-title-row">
              <span aria-hidden>‹</span>
              <div>
                <h2>{formatDashboardMonth(now)}</h2>
                <p>Kitchen assignment calendar</p>
              </div>
              <span aria-hidden>›</span>
            </div>
            <div className="fh-family-hub__planner-calendar">
              <div className="fh-family-hub__planner-weekdays" aria-hidden>
                {KITCHEN_CALENDAR_WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="fh-family-hub__planner-month-grid">
                {kitchenCalendarDays.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    className={[
                      "fh-family-hub__planner-date",
                      !day.inCurrentMonth ? "fh-family-hub__planner-date--muted" : "",
                      day.isToday ? "fh-family-hub__planner-date--today" : "",
                      day.isComplete ? "fh-family-hub__planner-date--done" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => go("/kitchen-schedule", onOpenTasks)}
                  >
                    <span>{day.dayNumber}</span>
                    <strong style={{ color: day.memberColor }}>{day.memberName}</strong>
                    <small>{day.isToday ? "Today" : day.isComplete ? "Done" : "Kitchen"}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <aside className="fh-family-hub__planner-side" aria-label="Kitchen assignment details">
            <button type="button" className="fh-family-hub__planner-today" onClick={() => go("/kitchen", onOpenTasks)}>
              Today
            </button>
            <div className="fh-family-hub__planner-mini">
              <p>Kitchen week</p>
              <div>
                {scheduleRows.map((row) => (
                  <button
                    key={row.iso}
                    type="button"
                    className={row.isToday ? "fh-family-hub__planner-day fh-family-hub__planner-day--today" : "fh-family-hub__planner-day"}
                    onClick={() => go("/kitchen-schedule", onOpenTasks)}
                  >
                    <span>{row.weekday}</span>
                    <strong>{row.date}</strong>
                  </button>
                ))}
              </div>
            </div>
            <div className="fh-family-hub__planner-card">
              <h3>Up Next</h3>
              {upcomingKitchenRows.map((row) => (
                <p key={row.iso}>
                  <span>{row.date}</span>
                  <strong>{row.memberName}</strong>
                </p>
              ))}
            </div>
            <div className="fh-family-hub__planner-card fh-family-hub__planner-card--schedule">
              <h3>Kitchen Schedule</h3>
              <div className="fh-family-hub__planner-schedule-list">
                {scheduleRows.map((row) => (
                  <div key={row.iso} className={row.isToday ? "fh-family-hub__planner-schedule-row fh-family-hub__planner-schedule-row--today" : "fh-family-hub__planner-schedule-row"}>
                    <span>{row.weekday}</span>
                    <strong>{row.date}</strong>
                    {row.day ? (
                      <select
                        aria-label={`Kitchen lead for ${row.date}`}
                        className="fh-family-hub__schedule-select"
                        value={row.memberId}
                        style={{
                          color: row.memberColor,
                          borderColor: rgbaFromHex(row.memberColor, 0.4),
                          backgroundColor: rgbaFromHex(row.memberColor, 0.12),
                        }}
                        onChange={(event) => {
                          if (row.day) {
                            updateKitchenDay(row.day, event.target.value);
                          }
                        }}
                      >
                        {kitchenAssignmentMembers.map((member) => (
                          <option key={member.id} value={member.id} style={{ color: getMemberColor(member) }}>
                            {firstName(getMemberFullName(member))}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

      </section>

      <section className="fh-family-hub__family-status" aria-labelledby="home-family-status-title">
        <div className="fh-family-hub__family-status-head">
          <div>
            <p>Family status</p>
            <h2 id="home-family-status-title">All Members</h2>
          </div>
          <span>Tap a card to open that member’s view</span>
        </div>
        <div className="fh-family-hub__member-strip" aria-label="Family member progress">
          {model.memberStatuses.map((row) => (
            <button
              key={row.member.id}
              type="button"
              className="fh-family-hub__member-pill"
              onClick={() => {
                if (onOpenMemberDashboard) {
                  onOpenMemberDashboard(row.member.id);
                  return;
                }
                go(`/family/${row.member.id}`);
              }}
            >
              <span className="fh-family-hub__member-pill-avatar" aria-hidden>
                {getMemberInitials(row.member)}
              </span>
              <span>
                <strong>{firstName(row.displayName)}</strong>
                <small>{row.weeklyCompleted}/{row.weeklyTarget} · {row.openChores} open</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {checklistPopupOpen ? (
        <div className="fh-family-hub__checklist-modal" role="presentation" onMouseDown={() => setChecklistPopupOpen(false)}>
          <section
            className="fh-family-hub__checklist-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kitchen-checklist-popup-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="fh-family-hub__checklist-dialog-head">
              <div>
                <p>Kitchen Station</p>
                <h2 id="kitchen-checklist-popup-title">{activeChecklistTitle}</h2>
                <span>{activeChecklistWindow}</span>
              </div>
              <button type="button" aria-label="Close kitchen checklist" onClick={() => setChecklistPopupOpen(false)}>
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="fh-family-hub__checklist-tabs" role="tablist" aria-label="Kitchen checklist lists">
              <button
                type="button"
                role="tab"
                aria-selected={activeChecklistMode === "day"}
                className={activeChecklistMode === "day" ? "fh-family-hub__checklist-tab fh-family-hub__checklist-tab--active" : "fh-family-hub__checklist-tab"}
                onClick={() => setActiveChecklistMode("day")}
              >
                Kitchen checklist
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeChecklistMode === "night"}
                className={activeChecklistMode === "night" ? "fh-family-hub__checklist-tab fh-family-hub__checklist-tab--active" : "fh-family-hub__checklist-tab"}
                onClick={() => setActiveChecklistMode("night")}
              >
                Night Time List
              </button>
            </div>

            <div className="fh-family-hub__checklist-popup-list">
              {activeChecklistMode === "day"
                ? daytimeChecklistItems.map((item) => {
                    const done = item.checkedDate === todayIso;
                    return (
                      <article key={item.id} className={done ? "fh-family-hub__checklist-popup-row fh-family-hub__checklist-popup-row--done" : "fh-family-hub__checklist-popup-row"}>
                        <div>
                          <h3>{item.label}</h3>
                          <p>{done ? "Done today" : "Open today"}</p>
                        </div>
                        <button type="button" onClick={() => toggleDaytimeChecklistItem(item.id)}>
                          {done ? "Undo" : "Done"}
                        </button>
                      </article>
                    );
                  })
                : NIGHT_TIME_CHECKLIST.map((item) => {
                    const done = nightDoneIds.has(item.id);
                    return (
                      <article key={item.id} className={done ? "fh-family-hub__checklist-popup-row fh-family-hub__checklist-popup-row--done" : "fh-family-hub__checklist-popup-row"}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.detail}</p>
                        </div>
                        <button type="button" onClick={() => toggleNightChecklistItem(item.id)}>
                          {done ? "Undo" : "Done"}
                        </button>
                      </article>
                    );
                  })}
            </div>

            <label className="fh-family-hub__checklist-notes">
              <span>Notes</span>
              <textarea
                value={activeChecklistNotes}
                rows={4}
                placeholder="Add reminders, improvements, or anything the next person should know."
                onChange={(event) =>
                  setPopupNotesByKey((current) => ({
                    ...current,
                    [activeChecklistKey]: event.target.value,
                  }))
                }
              />
            </label>
          </section>
        </div>
      ) : null}
    </WidgetPageShell>
  );
}
