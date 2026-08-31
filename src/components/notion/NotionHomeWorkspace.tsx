import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChefHat,
  CloudSun,
  ListTodo,
  MessageCircle,
  Package,
  ShoppingCart,
  Sparkles,
  StickyNote,
} from "lucide-react";
import type { FamilyData, KitchenDutyCompletion, Task } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import { getChoreDueDate } from "../../lib/choreTrackerUtils";
import { getAppDisplayName } from "../../lib/customization";
import {
  resolveSessionMemberIdForUi,
  selectImportantMessagesForHome,
} from "../../lib/familyDataSelectors";
import {
  buildFamilyHubDashboardModel,
  orderWakePageMembers,
} from "../../lib/familyHubDashboardData";
import {
  buildFridgeMiniMonth,
  formatFridgeClock,
} from "../../lib/fridgeHomeModel";
import { dedupeNotificationsForDisplay } from "../../lib/householdNotify";
import {
  buildTodayHomeRows,
  dashboardGreeting,
} from "../../lib/kioskHomeDashboardCharts";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  kitchenDutyRelatedNotificationId,
  labelKitchenWeekday,
} from "../../lib/kitchenDuty";
import { selectUpcomingEventsForHousehold } from "../../lib/upcomingEvents";
import { findMemberById, getMemberFullName, getMemberInitials, getNextDueDate } from "../../lib/utils";
import { createShoppingItemFromName } from "../../pages/shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../../services/rulesEngine";
import { StartPageCustomizeBar } from "../startPage";
import { NotionPageCanvas } from "./NotionPage";

export type NotionHomeWorkspaceProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  navigateWithinApp: (href: string) => void;
  onOpenPantry: () => void;
  onOpenShopping: () => void;
  onOpenCalendar: () => void;
  onOpenTasks?: () => void;
  onOpenMemberDashboard?: (memberId: string) => void;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MESSAGE_PREVIEW_LIMIT = 4;
const NOTIFICATION_PREVIEW_LIMIT = 5;

/** Home-only member dots — bright aqua-family accents for identity. */
const HOME_MEMBER_DOTS = [
  "#2F9BC4",
  "#3CBC95",
  "#4FC3D9",
  "#E8A317",
  "#5B8DEF",
  "#E15A4A",
] as const;

function homeMemberDot(index: number): string {
  return HOME_MEMBER_DOTS[index % HOME_MEMBER_DOTS.length];
}

function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenTask(status: string | undefined): boolean {
  return status !== "Done" && status !== "Completed" && status !== "Skipped";
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function isDoneToday(task: Task, todayIso: string): boolean {
  return (
    task.lastCompletedDate === todayIso ||
    task.status === "Done" ||
    task.status === "Completed"
  );
}

function BentoIcon({
  tone = "sky",
  children,
}: {
  tone?: "sky" | "mint" | "lavender" | "butter" | "coral";
  children: ReactNode;
}) {
  return (
    <span className={`fh-bento-icon fh-bento-icon--${tone}`} aria-hidden>
      {children}
    </span>
  );
}

function BentoCard({
  className,
  tone,
  eyebrow,
  title,
  titleId,
  subtitle,
  icon,
  action,
  children,
  footer,
  labelledBy,
}: {
  className?: string;
  tone?: "sky" | "mint" | "lavender" | "butter" | "coral" | "blush";
  eyebrow?: string;
  title: string;
  titleId: string;
  subtitle?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section
      className={["fh-bento-card", tone ? `fh-bento-card--${tone}` : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={labelledBy ?? titleId}
    >
      <div className="fh-bento-card__head">
        <div className="fh-bento-card__head-main">
          {icon}
          <div className="fh-bento-card__titles">
            {eyebrow ? <p className="fh-bento-card__eyebrow">{eyebrow}</p> : null}
            <h2 className="fh-bento-card__title" id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className="fh-bento-card__subtitle">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="fh-bento-card__body">{children}</div>
      {footer ? <div className="fh-bento-card__foot">{footer}</div> : null}
    </section>
  );
}

export function NotionHomeWorkspace({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenShopping,
  onOpenCalendar,
  onOpenTasks,
  onOpenMemberDashboard,
}: NotionHomeWorkspaceProps) {
  const [now, setNow] = useState(() => new Date());
  const [shoppingDraft, setShoppingDraft] = useState("");

  const todayIso = localTodayIso(now);
  const householdName = getAppDisplayName(data.adminSettings)?.trim() || "FamilyHub";
  const clock = formatFridgeClock(now);
  const greeting = dashboardGreeting(now).replace(/\s*👋\s*$/, "");
  const selectedMemberId = resolveSessionMemberIdForUi(data);

  const miniMonth = useMemo(() => buildFridgeMiniMonth(data, now), [data, now]);
  const hubModel = useMemo(
    () => buildFamilyHubDashboardModel(data, todayIso),
    [data, todayIso],
  );

  const wakeMembers = useMemo(
    () => orderWakePageMembers(data.familyMembers ?? []),
    [data.familyMembers],
  );

  const needToBuy = useMemo(
    () => (data.shopping ?? []).filter((item) => item && !item.purchased),
    [data.shopping],
  );

  const openTasks = useMemo(
    () => (data.tasks ?? []).filter((t) => t && isOpenTask(t.status)),
    [data.tasks],
  );

  const todayRows = useMemo(
    () => buildTodayHomeRows(data, todayIso, openTasks),
    [data, todayIso, openTasks],
  );

  const todayChores = useMemo(
    () =>
      (data.tasks ?? []).filter(
        (task) =>
          task &&
          task.status !== "Skipped" &&
          (getChoreDueDate(task) === todayIso || task.lastCompletedDate === todayIso),
      ),
    [data.tasks, todayIso],
  );

  const upcomingEvents = useMemo(
    () => selectUpcomingEventsForHousehold(data, todayIso, 8),
    [data, todayIso],
  );

  const todayEvents = useMemo(
    () => upcomingEvents.filter((event) => event.isToday),
    [upcomingEvents],
  );

  const agendaEvents = todayEvents.length > 0 ? todayEvents : upcomingEvents;
  const agendaHeading = todayEvents.length > 0 ? clock.dateLine : "Upcoming";

  const importantMessages = useMemo(
    () => selectImportantMessagesForHome(data, MESSAGE_PREVIEW_LIMIT),
    [data],
  );

  const attentionNotifications = useMemo(() => {
    const raw = (data.notifications ?? []).filter(
      (n) => n && !n.dismissedAt && !n.readAt,
    );
    return dedupeNotificationsForDisplay(raw).slice(0, NOTIFICATION_PREVIEW_LIMIT);
  }, [data.notifications]);

  const todayKitchenDay = getTodayKitchenWeekdayLocal(now);
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule?.weekdays?.find((entry) => entry.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;
  const kitchenName = kitchenTodayMember
    ? getMemberFullName(kitchenTodayMember)
    : "Not assigned yet";
  const kitchenComplete = isKitchenDutyCompleteForDate(
    data.kitchenDutyCompletions ?? [],
    todayIso,
  );
  const openChoreCount = todayRows.filter((row) => !row.done).length;
  const kitchenAssigned = Boolean(kitchenTodayMember);
  const kitchenDayLabel = todayKitchenDay
    ? labelKitchenWeekday(todayKitchenDay)
    : "No kitchen day mapped";

  const choresDoneToday = todayChores.filter((task) => isDoneToday(task, todayIso)).length;
  const choreTotal = todayChores.length;
  const chorePct = choreTotal === 0 ? 0 : Math.round((choresDoneToday / choreTotal) * 100);
  const pantryAlertCount =
    (hubModel.overview?.lowStock ?? 0) + (hubModel.overview?.expiringFood ?? 0);

  const storageZoneStats = useMemo(() => {
    const items = (data.pantry ?? []).filter((item) => item && !item.inactiveInInventory);
    if (items.length === 0) return null;
    const fridge = items.filter((item) =>
      String(item.storageArea ?? "").toLowerCase().includes("fridge"),
    ).length;
    const freezer = items.filter((item) =>
      String(item.storageArea ?? "").toLowerCase().includes("freezer"),
    ).length;
    const pantry = items.filter((item) => {
      const area = String(item.storageArea ?? "").toLowerCase();
      return area === "pantry" || area.includes("cabinet");
    }).length;
    if (fridge + freezer + pantry === 0) return null;
    return { pantry, fridge, freezer };
  }, [data.pantry]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  function go(href: string, fallback?: () => void) {
    navigateWithinApp(href);
    fallback?.();
  }

  function openMemberHome(memberId: string) {
    if (onOpenMemberDashboard) {
      onOpenMemberDashboard(memberId);
      return;
    }
    go(`/family/${encodeURIComponent(memberId)}`);
  }

  function addShoppingItem(rawName: string): boolean {
    const name = rawName.trim();
    if (!name) return false;
    const duplicateIndex = findDuplicateShoppingIndex(data.shopping ?? [], name);
    if (duplicateIndex >= 0) {
      setShoppingDraft("");
      go("/shopping", onOpenShopping);
      return true;
    }
    const item = createShoppingItemFromName(name);
    setData((prev) =>
      createActivity(
        {
          ...prev,
          shopping: [item, ...(prev.shopping ?? [])],
        },
        {
          type: "created",
          entityType: "shopping",
          entityId: item.id,
          message: `Added “${item.name}” to shopping.`,
        },
      ),
    );
    setShoppingDraft("");
    return true;
  }

  function onShoppingAdd(event: FormEvent) {
    event.preventDefault();
    addShoppingItem(shoppingDraft);
  }

  function toggleKitchenTodayDone() {
    if (!todayKitchenDay || !kitchenTodayMember) {
      go("/tasks", onOpenTasks);
      return;
    }
    const stamp = new Date().toISOString();
    const relatedId = kitchenDutyRelatedNotificationId(todayIso);
    const activeMemberId =
      data.adminSettings.activePreferencesMemberId ??
      data.familyMembers.find((m) => m.status === "active")?.id;

    setData((current) => {
      const completions = current.kitchenDutyCompletions ?? [];
      const existing = completions.find((c) => c.dutyDate === todayIso);
      if (existing) {
        const nextCompletions = completions.filter((c) => c.id !== existing.id);
        const dates = new Set(current.kitchenSchedule.completedDates ?? []);
        dates.delete(todayIso);
        return createActivity(
          {
            ...current,
            kitchenDutyCompletions: nextCompletions,
            kitchenSchedule: {
              ...current.kitchenSchedule,
              completedDates: [...dates].sort(),
              kitchenDutyReminderIssuedForDate: undefined,
              updatedAt: stamp,
            },
          },
          {
            type: "updated",
            entityType: "data",
            entityId: "kitchen-schedule",
            entityTitle: "Kitchen schedule",
            message: "Kitchen duty marked not complete for today.",
          },
        );
      }

      const completion: KitchenDutyCompletion = {
        id: crypto.randomUUID(),
        dayKey: todayKitchenDay,
        dutyDate: todayIso,
        memberId: kitchenTodayMember.id,
        completedAt: stamp,
        completedByMemberId: activeMemberId,
        createdAt: stamp,
      };
      const dates = new Set(current.kitchenSchedule.completedDates ?? []);
      dates.add(todayIso);
      const notifications = (current.notifications ?? []).map((n) =>
        n.type === "kitchen_duty" && n.relatedEntityId === relatedId && !n.dismissedAt
          ? { ...n, dismissedAt: stamp }
          : n,
      );

      return createActivity(
        {
          ...current,
          kitchenDutyCompletions: [...completions, completion],
          kitchenSchedule: {
            ...current.kitchenSchedule,
            completedDates: [...dates].sort(),
            updatedAt: stamp,
          },
          notifications,
        },
        {
          type: "completed",
          entityType: "data",
          entityId: completion.id,
          entityTitle: "Kitchen duty",
          message: "Completed kitchen duty.",
          memberId: activeMemberId,
        },
      );
    });
  }

  function toggleTodayChore(task: Task) {
    const stamp = new Date().toISOString();
    const completedDate = todayIso;
    setData((current) => {
      const existing = current.tasks.find((item) => item.id === task.id);
      if (!existing) return current;
      const alreadyDone = isDoneToday(existing, todayIso);
      return createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? alreadyDone
                ? {
                    ...item,
                    lastCompletedDate: "",
                    updatedAt: stamp,
                  }
                : {
                    ...item,
                    status: item.type === "chore" ? "Not Started" : "Done",
                    isBrainDump: false,
                    lastCompletedDate: completedDate,
                    nextDueDate:
                      item.type === "chore"
                        ? getNextDueDate(completedDate, item.frequency)
                        : item.nextDueDate,
                    updatedAt: stamp,
                  }
              : item,
          ),
        },
        {
          type: alreadyDone ? "updated" : "completed",
          entityType: existing.type === "chore" ? "chore" : "task",
          entityId: existing.id,
          entityTitle: existing.title,
          memberId: existing.assignedMemberId || undefined,
          message: alreadyDone
            ? `Reopened: ${existing.title}.`
            : `Completed ${existing.type === "chore" ? "chore" : "task"}: ${existing.title}.`,
        },
      );
    });
  }

  const shoppingItemLabel =
    needToBuy.length === 1 ? "1 item" : `${needToBuy.length} items`;

  return (
    <NotionPageCanvas className="fh-bento">
      <header className="fh-bento__masthead">
        <div className="fh-bento__masthead-copy">
          <p className="fh-bento__kicker">{greeting}</p>
          <h1 className="fh-bento__title">{householdName}</h1>
        </div>
        <StartPageCustomizeBar />
      </header>

      <div className="fh-bento__grid">
        <section
          className="fh-bento-card fh-bento-card--sky fh-bento-card--hero fh-bento__cell-status"
          aria-label="Greeting and clock"
        >
          <div className="fh-bento-card__head">
            <div className="fh-bento-card__head-main">
              <BentoIcon tone="sky">
                <CloudSun className="h-4 w-4" />
              </BentoIcon>
              <div className="fh-bento-card__titles">
                <p className="fh-bento-card__eyebrow">Now at home</p>
                <h2 className="fh-bento-card__title" id="fh-bento-status">
                  Time &amp; status
                </h2>
              </div>
            </div>
          </div>
          <div className="fh-bento-card__body">
            <div className="fh-bento-clock" aria-live="polite">
              <p className="fh-bento-clock__time">{clock.time}</p>
              <p className="fh-bento-clock__date">{clock.dateLine}</p>
            </div>
            <div className="fh-bento-weather" aria-label="Weather placeholder">
              <CloudSun className="h-5 w-5" aria-hidden />
              <div>
                <strong>Weather</strong>
                <span>Local forecast placeholder</span>
              </div>
            </div>
            <ul className="fh-bento-chips" aria-label="Today at a glance">
              <li>
                <button type="button" className="fh-bento-chip" onClick={() => go("/tasks", onOpenTasks)}>
                  Kitchen · {kitchenComplete ? "Done" : kitchenName}
                </button>
              </li>
              <li>
                <button type="button" className="fh-bento-chip" onClick={() => go("/tasks", onOpenTasks)}>
                  {openChoreCount} chore{openChoreCount === 1 ? "" : "s"} open
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="fh-bento-chip"
                  onClick={() => go("/shopping", onOpenShopping)}
                >
                  {needToBuy.length} shopping
                </button>
              </li>
            </ul>
          </div>
        </section>

        <section
          className="fh-bento-card fh-bento__cell-family"
          aria-label="Family members"
        >
          <div className="fh-bento-card__head">
            <div className="fh-bento-card__head-main">
              <BentoIcon tone="lavender">
                <Sparkles className="h-4 w-4" />
              </BentoIcon>
              <div className="fh-bento-card__titles">
                <p className="fh-bento-card__eyebrow">Household</p>
                <h2 className="fh-bento-card__title" id="fh-bento-family">
                  Family
                </h2>
                <p className="fh-bento-card__subtitle">Open a person’s dashboard</p>
              </div>
            </div>
          </div>
          <div className="fh-bento-members">
            {wakeMembers.length === 0 ? (
              <p className="fh-bento-empty">No active family members yet. Add them in Settings.</p>
            ) : (
              wakeMembers.map((member, index) => {
                const color = homeMemberDot(index);
                const selected = member.id === selectedMemberId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    className={["fh-bento-member", selected ? "is-selected" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => openMemberHome(member.id)}
                    aria-pressed={selected}
                    aria-label={`${getMemberFullName(member)}${selected ? ", current" : ""}`}
                  >
                    <span
                      className="fh-bento-avatar"
                      style={
                        {
                          backgroundColor: color,
                          color: "#fff",
                        } as CSSProperties
                      }
                      aria-hidden
                    >
                      {getMemberInitials(member)}
                    </span>
                    <span>{firstName(getMemberFullName(member))}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="fh-bento-card fh-bento-card--butter fh-bento__cell-quick" aria-labelledby="fh-bento-quick-add">
          <div className="fh-bento-card__head">
            <div className="fh-bento-card__head-main">
              <BentoIcon tone="butter">
                <Sparkles className="h-4 w-4" />
              </BentoIcon>
              <div className="fh-bento-card__titles">
                <p className="fh-bento-card__eyebrow">Actions</p>
                <h2 className="fh-bento-card__title" id="fh-bento-quick-add">
                  Quick Add
                </h2>
                <p className="fh-bento-card__subtitle">Add without leaving Home</p>
              </div>
            </div>
          </div>
          <div className="fh-bento-actions">
            <button
              type="button"
              className="fh-bento-action"
              onClick={() =>
                go("/quick-add?type=grocery&name=", () => go("/shopping", onOpenShopping))
              }
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Add shopping
              <small>Grocery item</small>
            </button>
            <button
              type="button"
              className="fh-bento-action"
              onClick={() => go("/quick-add?type=chore&title=", onOpenTasks)}
            >
              <ListTodo className="h-4 w-4" aria-hidden />
              Add chore
              <small>Task for today</small>
            </button>
            <button
              type="button"
              className="fh-bento-action"
              onClick={() => go("/quick-add?type=event&title=", onOpenCalendar)}
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              Add event
              <small>Calendar</small>
            </button>
            <button
              type="button"
              className="fh-bento-action"
              onClick={() => go("/quick-add?type=note&title=", () => go("/messages"))}
            >
              <StickyNote className="h-4 w-4" aria-hidden />
              Add note
              <small>Family message</small>
            </button>
          </div>
        </section>

        <BentoCard
          className="fh-bento__cell-today"
          eyebrow="Snapshot"
          title="Today"
          titleId="fh-bento-today"
          subtitle="What needs attention"
          icon={
            <BentoIcon tone="sky">
              <Sparkles className="h-4 w-4" />
            </BentoIcon>
          }
        >
          <div className="fh-bento-snapshot">
            <div
              className="fh-bento-ring"
              style={{ ["--pct" as string]: chorePct } as CSSProperties}
              aria-label={`${choresDoneToday} of ${choreTotal} chores done today`}
            >
              <div className="fh-bento-ring__hole">
                <span className="fh-bento-ring__value">{choreTotal === 0 ? "—" : `${chorePct}%`}</span>
                <span className="fh-bento-ring__label">chores</span>
              </div>
            </div>
            <div className="fh-bento-metrics">
              <div className="fh-bento-metric">
                <span>Open chores</span>
                <strong>{openChoreCount}</strong>
              </div>
              <div className="fh-bento-metric">
                <span>Events today</span>
                <strong>{todayEvents.length}</strong>
              </div>
              <div className="fh-bento-metric">
                <span>Shopping</span>
                <strong>{needToBuy.length}</strong>
              </div>
              <div className="fh-bento-metric">
                <span>Messages</span>
                <strong>{importantMessages.length + attentionNotifications.length}</strong>
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          className="fh-fridge-home__kitchen fh-bento__cell-kitchen"
          tone="mint"
          eyebrow="Duty"
          title="Today’s kitchen duty"
          titleId="fh-fridge-kitchen"
          subtitle={kitchenAssigned ? "Kitchen duty is assigned for today" : "Assign a lead in chores"}
          icon={
            <BentoIcon tone="mint">
              <ChefHat className="h-4 w-4" />
            </BentoIcon>
          }
          action={
            <button type="button" className="fh-bento-btn" onClick={() => go("/tasks", onOpenTasks)}>
              Open chores
            </button>
          }
        >
          <p className="fh-bento-hero-name">{kitchenName}</p>
          <p className="fh-bento-copy">
            <span className="fh-bento-chip">{kitchenDayLabel}</span>{" "}
            <span className={`fh-bento-chip ${kitchenComplete ? "fh-bento-chip--done" : "fh-bento-chip--open"}`}>
              {kitchenComplete ? "Completed" : "Still open"}
            </span>
          </p>
          <button
            type="button"
            className={`fh-bento-btn ${kitchenComplete ? "" : "fh-bento-btn--mint"}`}
            onClick={toggleKitchenTodayDone}
          >
            {kitchenComplete ? "Mark kitchen duty open" : "Mark kitchen duty done"}
          </button>

          <h3 className="fh-bento-card__title">Today’s chores</h3>
          {todayChores.length === 0 && todayRows.length === 0 ? (
            <p className="fh-bento-empty">Nothing due for today yet.</p>
          ) : (
            <ul className="fh-bento-list">
              {(todayChores.length > 0 ? todayChores : []).slice(0, 6).map((task) => {
                const done = isDoneToday(task, todayIso);
                const assignee = task.assignedMemberId
                  ? findMemberById(data, task.assignedMemberId)
                  : undefined;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      className={["fh-bento-row", done ? "is-done" : ""].filter(Boolean).join(" ")}
                      onClick={() => toggleTodayChore(task)}
                      aria-pressed={done}
                    >
                      <span className="fh-bento-check">{done ? <Check className="h-3 w-3" /> : null}</span>
                      <span className="fh-bento-row__main">
                        <span className="fh-bento-row__title">{task.title}</span>
                        <span className="fh-bento-row__meta">
                          {assignee ? getMemberFullName(assignee) : task.owner || "Household"} ·{" "}
                          {done ? "Done" : "Chore"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {todayChores.length === 0
                ? todayRows.slice(0, 6).map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="fh-bento-row"
                        onClick={() => go("/tasks", onOpenTasks)}
                      >
                        <span className="fh-bento-row__title">{item.title}</span>
                        <span className="fh-bento-row__meta">
                          {item.time} · {item.done ? "Done" : "Chore"}
                        </span>
                      </button>
                    </li>
                  ))
                : null}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          className="fh-bento__cell-events"
          tone="lavender"
          eyebrow="Schedule"
          title="Calendar"
          titleId="fh-fridge-calendar"
          subtitle="Household schedule"
          icon={
            <BentoIcon tone="lavender">
              <CalendarDays className="h-4 w-4" />
            </BentoIcon>
          }
          action={
            <button type="button" className="fh-bento-btn" onClick={() => go("/calendar", onOpenCalendar)}>
              Open calendar
            </button>
          }
        >
          <div className="fh-bento-cal">
            <div>
              <h3 className="fh-bento-card__title">Upcoming</h3>
              <p className="fh-bento-copy">{agendaHeading}</p>
              {agendaEvents.length === 0 ? (
                <p className="fh-bento-empty">No upcoming events on the planner.</p>
              ) : (
                <ul className="fh-bento-list">
                  {agendaEvents.slice(0, 6).map((event) => {
                    const memberChips = (event.assigneeLabel || "Family")
                      .split(",")
                      .map((name) => name.trim())
                      .filter(Boolean);
                    const category = event.category?.trim();
                    const metaParts = [
                      event.whenLabel,
                      category && category.toLowerCase() !== "other" ? category : null,
                      memberChips.join(", "),
                    ].filter(Boolean);
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          className="fh-bento-row"
                          onClick={() => go("/calendar", onOpenCalendar)}
                        >
                          <span className="fh-bento-dot" aria-hidden />
                          <span className="fh-bento-row__main">
                            <span className="fh-bento-row__title">{event.title}</span>
                            <span className="fh-bento-row__meta">{metaParts.join(" · ")}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="fh-bento-mini-cal" aria-label={miniMonth.monthLabel}>
              <p className="fh-bento-mini-cal__label">{miniMonth.monthLabel}</p>
              <div className="fh-bento-mini-cal__weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="fh-bento-mini-cal__grid">
                {miniMonth.weeks.flat().map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    className={[
                      "fh-bento-mini-cal__day",
                      day.inMonth ? "" : "is-muted",
                      day.isToday ? "is-today" : "",
                      day.hasEvents ? "has-events" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => go("/calendar", onOpenCalendar)}
                    aria-label={`${day.iso}${day.hasEvents ? ", has events" : ""}`}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          className="fh-bento__cell-messages"
          eyebrow="Inbox"
          title="Messages"
          titleId="fh-bento-messages"
          subtitle="Pinned notes and alerts"
          icon={
            <BentoIcon>
              <MessageCircle className="h-4 w-4" />
            </BentoIcon>
          }
          action={
            <button type="button" className="fh-bento-btn" onClick={() => go("/messages")}>
              Messages
            </button>
          }
        >
          {importantMessages.length === 0 && attentionNotifications.length === 0 ? (
            <p className="fh-bento-empty">No pinned messages or unread alerts.</p>
          ) : (
            <ul className="fh-bento-list">
              {importantMessages.map((msg) => (
                <li key={msg.id}>
                  <button type="button" className="fh-bento-row" onClick={() => go("/messages")}>
                    <span className="fh-bento-dot" aria-hidden />
                    <span className="fh-bento-row__main">
                      <span className="fh-bento-row__title">{msg.title?.trim() || msg.message}</span>
                      <span className="fh-bento-row__meta">
                        {msg.pinned ? "Pinned" : msg.priority}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {attentionNotifications.map((note) => (
                <li key={note.id}>
                  <button type="button" className="fh-bento-row" onClick={() => go("/notifications")}>
                    <Bell className="h-4 w-4" aria-hidden />
                    <span className="fh-bento-row__main">
                      <span className="fh-bento-row__title">{note.title}</span>
                      <span className="fh-bento-row__meta">Notification</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          className="fh-bento__cell-shopping"
          tone="coral"
          eyebrow="Need to buy"
          title="Shopping"
          titleId="fh-fridge-shop"
          subtitle={`${shoppingItemLabel} on the list`}
          icon={
            <BentoIcon tone="coral">
              <ShoppingCart className="h-4 w-4" />
            </BentoIcon>
          }
          action={
            <button type="button" className="fh-bento-btn" onClick={() => go("/shopping", onOpenShopping)}>
              Open shopping
            </button>
          }
        >
          {needToBuy.length === 0 ? (
            <p className="fh-bento-empty">Shopping list is clear.</p>
          ) : (
            <ul className="fh-bento-list">
              {needToBuy.slice(0, 5).map((item) => {
                const qty = [item.quantity, item.unit].filter(Boolean).join(" ") || "1";
                const category = item.category?.trim();
                const showCategory =
                  Boolean(category) &&
                  category.toLowerCase() !== "other" &&
                  category.toLowerCase() !== "general";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="fh-bento-row"
                      onClick={() => go("/shopping", onOpenShopping)}
                    >
                      <span className="fh-bento-row__main">
                        <span className="fh-bento-row__title">{item.name}</span>
                        {showCategory ? (
                          <span className="fh-bento-row__meta">{category}</span>
                        ) : null}
                      </span>
                      <span className="fh-bento-row__meta">{qty}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <form className="fh-bento-composer" onSubmit={onShoppingAdd}>
            <input
              aria-label="Quick add shopping item"
              autoComplete="off"
              onChange={(e) => setShoppingDraft(e.target.value)}
              placeholder="Add an item…"
              value={shoppingDraft}
            />
            <button type="submit" className="fh-bento-btn fh-bento-btn--primary" aria-label="Add shopping item">
              Add
            </button>
          </form>
        </BentoCard>

        <BentoCard
          className="fh-bento__cell-pantry"
          tone="blush"
          eyebrow="Storage"
          title="Pantry & Storage"
          titleId="fh-fridge-storage"
          subtitle="Household food storage"
          icon={
            <BentoIcon tone="mint">
              <Package className="h-4 w-4" />
            </BentoIcon>
          }
          action={
            <button type="button" className="fh-bento-btn" onClick={() => go("/pantry", onOpenPantry)}>
              Open storage
            </button>
          }
          footer={
            <nav className="fh-bento-links" aria-label="Quick links">
              <button type="button" className="fh-bento-btn" onClick={() => go("/calendar", onOpenCalendar)}>
                <CalendarDays className="h-4 w-4" aria-hidden />
                Calendar
              </button>
              <button type="button" className="fh-bento-btn" onClick={() => go("/tasks", onOpenTasks)}>
                <Sparkles className="h-4 w-4" aria-hidden />
                Chores
              </button>
              <button type="button" className="fh-bento-btn" onClick={() => go("/shopping", onOpenShopping)}>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Shopping
              </button>
            </nav>
          }
        >
          <p className="fh-bento-copy">
            Track pantry stock, fridge items, and freezer storage in one place.
          </p>
          {pantryAlertCount > 0 ? (
            <button
              type="button"
              className="fh-bento-row"
              onClick={() => go("/pantry?view=pantry", onOpenPantry)}
            >
              <span className="fh-bento-dot fh-bento-dot--alert" aria-hidden />
              <span className="fh-bento-row__main">
                <span className="fh-bento-row__title">
                  {pantryAlertCount} pantry alert{pantryAlertCount === 1 ? "" : "s"}
                </span>
                <span className="fh-bento-row__meta">
                  {hubModel.overview?.lowStock ?? 0} low stock · {hubModel.overview?.expiringFood ?? 0}{" "}
                  expiring
                </span>
              </span>
            </button>
          ) : (
            <p className="fh-bento-empty">No pantry alerts right now.</p>
          )}
          {storageZoneStats ? (
            <div className="fh-bento-zones" aria-label="Storage summary">
              <div className="fh-bento-zone">
                <strong>{storageZoneStats.pantry}</strong>
                <span>Pantry</span>
              </div>
              <div className="fh-bento-zone">
                <strong>{storageZoneStats.fridge}</strong>
                <span>Fridge</span>
              </div>
              <div className="fh-bento-zone">
                <strong>{storageZoneStats.freezer}</strong>
                <span>Freezer</span>
              </div>
            </div>
          ) : (
            <p className="fh-bento-empty">
              Open Storage to start tracking pantry, fridge, and freezer items.
            </p>
          )}
        </BentoCard>
      </div>
    </NotionPageCanvas>
  );
}
