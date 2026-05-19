import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MessageBoardItem, PantryItem, PlannerEvent } from "../data/familyData";
import { MessageBoardDrawer } from "../components/messageBoard/MessageBoardDrawer";
import { createEmptyMessageBoardItem } from "../lib/messageBoardUtils";
import { dedupeNotificationsForDisplay } from "../lib/householdNotify";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { buildPersonalizedHomeGreeting } from "../lib/kioskGreeting";
import { cn, findMemberById, getMemberFullName } from "../lib/utils";
import {
  buildKitchenDutyReminderNotifications,
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
} from "../lib/kitchenDuty";
import { prependNotifications } from "../lib/householdNotify";
import { getAppDisplayName, getMessageBoardCategoryDefinitions } from "../lib/customization";
import { DashboardHomeTopBar } from "../components/dashboard/DashboardHomeTopBar";
import { DashboardHomeTodaySnapshot } from "../components/dashboard/DashboardHomeTodaySnapshot";
import { DashboardHomeKitchenDutyCard } from "../components/dashboard/DashboardHomeKitchenDutyCard";
import { DashboardHubActivityCard } from "../components/dashboard/hub/DashboardHubActivityCard";
import { DashboardHubPantryCard } from "../components/dashboard/hub/DashboardHubPantryCard";
import { DashboardHubShoppingCard } from "../components/dashboard/hub/DashboardHubShoppingCard";
import type { HubWeekDay } from "../components/dashboard/hub/DashboardHubWeekCard";
import { DashboardHomeCleaningCard } from "../components/dashboard/DashboardHomeCleaningCard";
import { DashboardChoresDueTodayCard } from "../components/dashboard/DashboardChoresDueTodayCard";
import { DashboardWeeklyResetCard } from "../components/dashboard/DashboardWeeklyResetCard";
import { DashboardHubWeekCard } from "../components/dashboard/hub/DashboardHubWeekCard";
import { DashboardHomeMessagesCard } from "../components/dashboard/DashboardHomeMessagesCard";
import type { PageProps } from "./pageTypes";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { FamilyHubDashboard } from "./FamilyHubDashboard";
import { createActivity } from "../lib/activity";
import { isInventoryLowStock } from "./inventory/inventoryUtils";
import { Button } from "../components/ui/Button";
import { WorkspacePageShell } from "../components/workspace/ModuleWorkspace";
import {
  addDaysToIso,
  kitchenWeekdayFromIso,
  mondayIsoForContainingWeek,
} from "../lib/dashboardWeek";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { SMARTHR_CARD, SMARTHR_DASH_BODY_PARAGRAPH, SMARTHR_TITLE } from "../lib/smarthrUi";
import { useDashboardLayoutPreferences } from "../hooks/useDashboardLayoutPreferences";
import {
  DASHBOARD_GRID_WIDGET_IDS,
  DASHBOARD_LAYOUT_SCOPE_FAMILY,
  dashboardWidgetLgSpanClass,
} from "../lib/dashboardLayoutPreferences";
import {
  readDashboardHomeViewScope,
  writeDashboardHomeViewScope,
  type DashboardHomeViewScope,
} from "../lib/dashboardHomeViewStorage";
import { getMemberColor } from "../lib/memberColors";
import { DashboardLayoutControls } from "../components/dashboard/DashboardLayoutControls";
import { useUiCustomization } from "../context/UiCustomizationContext";
import { isPageSectionVisible } from "../lib/pageLayoutSectionCatalog";
import {
  countActiveNotificationsForDashboardInbox,
  plannerEventVisibleForMemberView,
  type DashboardViewMemberId,
} from "../lib/dashboardCommandCenterFilters";
import { selectImportantMessagesForHome } from "../lib/familyDataSelectors";
import { applyCalendarTodayReminderSync } from "../lib/calendarTodayNotifications";
import { applyChoreReminderSync } from "../lib/choreAlertNotifications";
import { prependChoreDigestIfNeeded } from "../lib/choreDueReminders";
import { siteNotificationEnabled } from "../lib/notificationPreferences";
import { getChoreDueDate, isChoreDone } from "../lib/choreTrackerUtils";

function pantryDisplayName(p: PantryItem): string {
  const raw = (p.productName || p.name || "").trim();
  return raw || "Item";
}

function hubPantryTileStatus(p: PantryItem): "good" | "low" | "out" {
  if (p.inactiveInInventory) {
    return "good";
  }
  if (p.status === "Out") {
    return "out";
  }
  if (p.status === "Low" || isInventoryLowStock(p)) {
    return "low";
  }
  return "good";
}

export function DashboardPage({
  data,
  setData,
  navigateWithinApp,
  restrictChildNavigation,
  onOpenTasks,
  onOpenPantry,
  onOpenShopping,
  onOpenCalendar,
  onOpenSettings: _onOpenSettings,
  onOpenMemberDashboard,
}: PageProps) {
  const kioskShell = useKioskShell();
  const today = new Date().toISOString().slice(0, 10);
  const sessionMemberId = resolveSessionMemberIdForUi(data);
  const activeMember = sessionMemberId ? findMemberById(data, sessionMemberId) : undefined;

  const greeting = useMemo(() => {
    if (!activeMember) {
      return "Family Dashboard";
    }
    const first = activeMember.name.trim().split(/\s+/)[0] || activeMember.name;
    return buildPersonalizedHomeGreeting(first);
  }, [activeMember]);

  const notificationCount = useMemo(() => {
    const mid = sessionMemberId;
    const raw = data.notifications.filter((n) => {
      if (n.dismissedAt) {
        return false;
      }
      const to = (n.recipientMemberId ?? "").trim();
      if (!to) {
        return true;
      }
      if (!mid) {
        return false;
      }
      return to === mid;
    });
    return dedupeNotificationsForDisplay(raw).length;
  }, [data.notifications, sessionMemberId]);

  const groceryNeeds = data.shopping.filter((item) => !item.purchased);

  const pantryCounts = useMemo(() => {
    let low = 0;
    let out = 0;
    let almostOut = 0;
    for (const p of data.pantry) {
      if (p.inactiveInInventory) continue;
      if (p.status === "Out") {
        out += 1;
        continue;
      }
      if (p.status === "Low") {
        low += 1;
        continue;
      }
      if (isInventoryLowStock(p)) {
        almostOut += 1;
      }
    }
    return { low, out, almostOut };
  }, [data.pantry]);

  const pantryAttentionTotal = pantryCounts.low + pantryCounts.out + pantryCounts.almostOut;

  const eventsByDate = useMemo(() => {
    const m = new Map<string, PlannerEvent[]>();
    for (const e of data.planner) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.time.localeCompare(b.time));
    }
    return m;
  }, [data.planner]);

  const pantryHubTiles = useMemo(() => {
    return data.pantry
      .filter((p) => !p.inactiveInInventory)
      .slice(0, 48)
      .map((p) => {
        const status = hubPantryTileStatus(p);
        return {
          id: p.id,
          name: pantryDisplayName(p),
          quantity: String(p.quantity ?? "").trim() || "0",
          unit: (p.unit ?? "").trim() || "—",
          category: (p.category ?? "").trim() || "—",
          status,
          note:
            status === "low"
              ? p.notes?.trim() || "Running low"
              : status === "out"
                ? p.notes?.trim()
                : undefined,
        };
      });
  }, [data.pantry]);

  const [weekMondayIso, setWeekMondayIso] = useState(() => mondayIsoForContainingWeek(today));

  const weekMonthTitle = useMemo(() => {
    const d = new Date(`${weekMondayIso}T12:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
  }, [weekMondayIso]);

  const selectedWeekDayIso = useMemo(() => {
    const mon = weekMondayIso;
    const sun = addDaysToIso(mon, 6);
    if (today >= mon && today <= sun) {
      return today;
    }
    return mon;
  }, [weekMondayIso, today]);

  const todayKitchenDay = getTodayKitchenWeekdayLocal();
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule.weekdays.find((w) => w.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;

  const kitchenCompletedToday = useMemo(
    () => isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, today),
    [data.kitchenDutyCompletions, today],
  );

  useEffect(() => {
    if (!todayKitchenDay || kitchenCompletedToday) {
      return;
    }
    if (data.kitchenSchedule.kitchenDutyReminderIssuedForDate === today) {
      return;
    }
    if (!siteNotificationEnabled(data.adminSettings.siteNotificationDefaults, "enableReminders")) {
      return;
    }
    if (data.adminSettings.siteNotificationDefaults?.kitchenDutyReminders === false) {
      return;
    }
    if (!kitchenTodayMember || !kitchenTodayEntry) {
      return;
    }

    const incoming = buildKitchenDutyReminderNotifications({
      dutyDate: today,
      assigneeMemberId: kitchenTodayEntry.memberId,
      assigneeDisplayName: getMemberFullName(kitchenTodayMember),
      familyMembers: data.familyMembers,
      userPreferencesByMemberId: data.adminSettings.userPreferencesByMemberId,
      siteKitchenDutyRemindersEnabled: data.adminSettings.siteNotificationDefaults?.kitchenDutyReminders,
    });

    if (incoming.length === 0) {
      return;
    }

    setData((current) => {
      if (current.kitchenSchedule.kitchenDutyReminderIssuedForDate === today) {
        return current;
      }
      const now = new Date().toISOString();
      return {
        ...current,
        notifications: prependNotifications(current.notifications, incoming),
        kitchenSchedule: {
          ...current.kitchenSchedule,
          kitchenDutyReminderIssuedForDate: today,
          updatedAt: now,
        },
      };
    });
  }, [
    today,
    todayKitchenDay,
    kitchenCompletedToday,
    kitchenTodayMember?.id,
    kitchenTodayEntry?.memberId,
    data.adminSettings.siteNotificationDefaults?.enableReminders,
    data.adminSettings.siteNotificationDefaults?.kitchenDutyReminders,
    data.adminSettings.userPreferencesByMemberId,
    data.familyMembers,
    data.kitchenSchedule.kitchenDutyReminderIssuedForDate,
    setData,
  ]);

  const choreDigestIssuedForDate = useRef<string | null>(null);
  useEffect(() => {
    choreDigestIssuedForDate.current = null;
  }, [today]);

  useEffect(() => {
    if (choreDigestIssuedForDate.current === today) {
      return;
    }
    setData((cur) => {
      const next = prependChoreDigestIfNeeded(cur, today);
      if (next) {
        choreDigestIssuedForDate.current = today;
        return next;
      }
      return cur;
    });
  }, [today, setData]);

  const choreNotifyKey = useMemo(() => {
    return data.tasks
      .filter((t) => t.type === "chore")
      .map((t) => `${t.id}:${getChoreDueDate(t)}:${t.status}`)
      .sort()
      .join("|");
  }, [data.tasks]);

  const plannerTodayKey = useMemo(() => {
    return data.planner
      .filter((e) => e.date === today)
      .map((e) => `${e.id}:${e.time}:${e.title}`)
      .sort()
      .join("|");
  }, [data.planner, today]);

  useEffect(() => {
    setData((cur) => applyCalendarTodayReminderSync(cur, today));
  }, [
    today,
    plannerTodayKey,
    setData,
    data.adminSettings.siteNotificationDefaults?.enableReminders,
    data.adminSettings.siteNotificationDefaults?.calendarEventsToday,
    data.adminSettings.siteNotificationDefaults?.calendarReminders,
  ]);

  useEffect(() => {
    setData((cur) => applyChoreReminderSync(cur, today));
  }, [
    today,
    choreNotifyKey,
    setData,
    data.adminSettings.siteNotificationDefaults?.enableReminders,
    data.adminSettings.siteNotificationDefaults?.choresDue,
    data.adminSettings.siteNotificationDefaults?.choresOverdue,
  ]);

  const [msgDrawerOpen, setMsgDrawerOpen] = useState(false);
  const [msgDrawerMode, setMsgDrawerMode] = useState<"create" | "edit">("create");
  const [msgDraft, setMsgDraft] = useState<MessageBoardItem | null>(null);

  const messageCategories = useMemo(
    () => getMessageBoardCategoryDefinitions(data.adminSettings, data.messageBoard),
    [data.adminSettings, data.messageBoard],
  );

  const [dashboardScope, setDashboardScopeState] = useState<DashboardHomeViewScope>(() =>
    readDashboardHomeViewScope(),
  );

  const validMemberIds = useMemo(
    () => new Set(data.familyMembers.map((m) => m.id)),
    [data.familyMembers],
  );

  useEffect(() => {
    if (
      dashboardScope !== DASHBOARD_LAYOUT_SCOPE_FAMILY &&
      !validMemberIds.has(dashboardScope)
    ) {
      setDashboardScopeState(DASHBOARD_LAYOUT_SCOPE_FAMILY);
      writeDashboardHomeViewScope(DASHBOARD_LAYOUT_SCOPE_FAMILY);
    }
  }, [dashboardScope, validMemberIds]);

  const setDashboardScope = useCallback((scope: DashboardHomeViewScope) => {
    setDashboardScopeState(scope);
    writeDashboardHomeViewScope(scope);
  }, []);

  const layoutViewLabel = useMemo(() => {
    if (dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY) {
      return "Family";
    }
    const m = findMemberById(data, dashboardScope);
    if (!m) {
      return "Member";
    }
    const first = m.name.trim().split(/\s+/)[0];
    return first || m.name;
  }, [dashboardScope, data]);

  const viewAccentColor = useMemo(() => {
    if (dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY) {
      return "var(--fs-primary, #F26522)";
    }
    return getMemberColor(findMemberById(data, dashboardScope));
  }, [dashboardScope, data]);

  const viewMemberId = useMemo<DashboardViewMemberId>(
    () => (dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY ? null : dashboardScope),
    [dashboardScope],
  );

  const todayPlannerCount = useMemo(() => {
    return data.planner.filter((e) => e.date === today).length;
  }, [data.planner, today]);

  const upcomingPlannerCount = useMemo(() => {
    const end = addDaysToIso(today, 7);
    let n = 0;
    for (const e of data.planner) {
      if (e.date <= today || e.date > end) {
        continue;
      }
      n += 1;
    }
    return n;
  }, [data.planner, today]);

  const choresDueTodayCount = useMemo(() => {
    return data.tasks.filter(
      (t) => t.type === "chore" && !isChoreDone(t) && getChoreDueDate(t) === today,
    ).length;
  }, [data.tasks, today]);

  const choresOverdueCount = useMemo(() => {
    return data.tasks.filter(
      (t) => t.type === "chore" && !isChoreDone(t) && getChoreDueDate(t) < today,
    ).length;
  }, [data.tasks, today]);

  const importantMessageCount = useMemo(
    () => selectImportantMessagesForHome(data, 24).length,
    [data],
  );

  const snapshotNotificationCount = useMemo(
    () =>
      countActiveNotificationsForDashboardInbox(
        data.notifications,
        dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY ? "household" : "targetMember",
        sessionMemberId,
        dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY ? undefined : dashboardScope,
      ),
    [data.notifications, dashboardScope, sessionMemberId],
  );

  const hubWeekDays = useMemo((): HubWeekDay[] => {
    const days: HubWeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDaysToIso(weekMondayIso, i);
      const d = new Date(`${iso}T12:00:00`);
      const weekdayShort = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
      const evs = eventsByDate.get(iso) ?? [];
      let pill = "—";
      let dayTone: HubWeekDay["dayTone"] = "default";

      if (viewMemberId) {
        const mine = evs.filter((e) => plannerEventVisibleForMemberView(e, viewMemberId));
        const others = evs.filter((e) => !plannerEventVisibleForMemberView(e, viewMemberId));
        if (mine[0]) {
          pill = mine[0].title;
          dayTone = "focus";
        } else if (others[0]) {
          pill = others[0].title;
          dayTone = "muted";
        } else {
          const wd = kitchenWeekdayFromIso(iso);
          if (wd) {
            const row = data.kitchenSchedule.weekdays.find((w) => w.day === wd);
            const mem = row ? findMemberById(data, row.memberId) : undefined;
            if (mem) {
              pill = mem.name.trim().split(/\s+/)[0] || getMemberFullName(mem);
              dayTone = mem.id === viewMemberId ? "focus" : "muted";
            }
          }
        }
      } else if (evs[0]) {
        pill = evs[0].title;
      } else {
        const wd = kitchenWeekdayFromIso(iso);
        if (wd) {
          const row = data.kitchenSchedule.weekdays.find((w) => w.day === wd);
          const mem = row ? findMemberById(data, row.memberId) : undefined;
          if (mem) {
            pill = mem.name.trim().split(/\s+/)[0] || getMemberFullName(mem);
          }
        }
      }

      days.push({
        iso,
        weekdayShort,
        dayNum: d.getDate(),
        pill,
        dayTone,
      });
    }
    return days;
  }, [weekMondayIso, eventsByDate, data.kitchenSchedule.weekdays, viewMemberId, data]);

  const {
    sortedGridWidgets,
    editLayout,
    setEditLayout,
    setWidgetVisible,
    setWidgetSize,
    moveWidgetOrder,
    reorderWidgetsByDrag,
    resetLayout,
  } = useDashboardLayoutPreferences(dashboardScope);

  const { pageLayout } = useUiCustomization();
  const showTodaySnapshot = isPageSectionVisible(pageLayout, "home", "todaySnapshot");
  const showLayoutControls = isPageSectionVisible(pageLayout, "home", "layoutControls");
  const showPostMessage = isPageSectionVisible(pageLayout, "home", "postMessage");

  const mainCells = useMemo(
    () =>
      sortedGridWidgets.filter((w) => DASHBOARD_GRID_WIDGET_IDS.has(w.id) && w.visible),
    [sortedGridWidgets],
  );

  function saveDashboardMessage(item: MessageBoardItem, isNew: boolean) {
    const now = new Date().toISOString();
    if (isNew) {
      setData((current) =>
        createActivity(
          {
            ...current,
            messageBoard: [{ ...item, createdAt: now, updatedAt: now }, ...current.messageBoard],
          },
          {
            type: "updated",
            entityType: "messageBoard",
            entityId: "message-board",
            entityTitle: "Message Board",
            message: "Message posted.",
          },
        ),
      );
    } else {
      setData((current) =>
        createActivity(
          {
            ...current,
            messageBoard: current.messageBoard.map((m) =>
              m.id === item.id ? { ...item, updatedAt: now } : m,
            ),
          },
          {
            type: "updated",
            entityType: "messageBoard",
            entityId: "message-board",
            entityTitle: "Message Board",
            message: "Saved.",
          },
        ),
      );
    }
    setMsgDrawerOpen(false);
    setMsgDraft(null);
  }

  function openDashboardMessageCreate() {
    setMsgDrawerMode("create");
    setMsgDraft(
      createEmptyMessageBoardItem({
        authorMemberId: sessionMemberId ?? undefined,
      }),
    );
    setMsgDrawerOpen(true);
  }

  function markShoppingPurchased(id: string) {
    setData((current) => {
      const item = current.shopping.find((s) => s.id === id);
      const now = new Date().toISOString();
      if (!item || item.purchased) {
        return current;
      }
      const nextData = {
        ...current,
        shopping: current.shopping.map((shoppingItem) =>
          shoppingItem.id === id
            ? {
                ...shoppingItem,
                purchased: true,
                needsPutAway: false,
                updatedAt: now,
              }
            : shoppingItem,
        ),
      };
      return createActivity(nextData, {
        type: "updated",
        entityType: "shoppingItem",
        entityId: item.id,
        entityTitle: item.name,
        message: `Marked ${item.name} as purchased.`,
      });
    });
  }

  function renderMainCell(widgetId: string) {
    switch (widgetId) {
      case "messages":
        return (
          <DashboardHomeMessagesCard
            data={data}
            navigateWithinApp={navigateWithinApp}
            filterMemberId={viewMemberId ?? undefined}
          />
        );
      case "pantry":
        return (
          <DashboardHubPantryCard
            tiles={pantryHubTiles}
            lowOrOutCount={pantryAttentionTotal}
            onAddItem={() => navigateWithinApp?.("/pantry") ?? onOpenPantry?.()}
            onOpenPantry={() => navigateWithinApp?.("/pantry") ?? onOpenPantry?.()}
          />
        );
      case "shopping":
        return (
          <DashboardHubShoppingCard
            items={groceryNeeds}
            onTogglePurchased={markShoppingPurchased}
            onAddItem={() => navigateWithinApp?.("/shopping") ?? onOpenShopping?.()}
            onOpenShopping={onOpenShopping ?? (() => {})}
          />
        );
      case "calendar":
        return (
          <DashboardHubWeekCard
            days={hubWeekDays}
            selectedIso={selectedWeekDayIso}
            monthTitle={weekMonthTitle}
            onPrevWeek={() => setWeekMondayIso((m) => addDaysToIso(m, -7))}
            onNextWeek={() => setWeekMondayIso((m) => addDaysToIso(m, 7))}
            onSelectDay={() => navigateWithinApp?.("/calendar") ?? onOpenCalendar?.()}
          />
        );
      case "notifications":
        return (
          <div id="home-notifications" className="scroll-mt-24">
            <DashboardHubActivityCard
              data={data}
              setData={setData}
              currentMemberId={sessionMemberId}
              inboxMode={
                dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY ? "household" : "targetMember"
              }
              targetMemberId={
                dashboardScope === DASHBOARD_LAYOUT_SCOPE_FAMILY ? undefined : dashboardScope
              }
              onViewAll={
                navigateWithinApp ? () => navigateWithinApp("/settings#notifications") : undefined
              }
            />
          </div>
        );
      case "cleaning":
        return (
          <DashboardHomeCleaningCard
            data={data}
            dashboardViewMemberId={viewMemberId}
            navigateWithinApp={navigateWithinApp}
          />
        );
      case "choresDueToday":
        return (
          <DashboardChoresDueTodayCard
            data={data}
            setData={setData}
            todayIso={today}
            dashboardViewMemberId={viewMemberId}
            navigateWithinApp={navigateWithinApp}
          />
        );
      default:
        return null;
    }
  }

  if (kioskShell) {
    return (
      <FamilyHubDashboard
        data={data}
        greeting={greeting}
        navigateWithinApp={navigateWithinApp}
        onOpenPantry={onOpenPantry}
        onOpenTasks={onOpenTasks}
        onOpenCalendar={onOpenCalendar}
        onOpenMemberDashboard={onOpenMemberDashboard}
      />
    );
  }

  return (
    <div
      className="dashboard-smart-hr-root min-h-full min-h-[100dvh] antialiased text-[var(--fs-text,#1f1f1f)]"
      style={{ ["--dash-view-accent" as string]: viewAccentColor }}
    >
    <WorkspacePageShell
      className={cn(
        "flex flex-col px-[15px] pb-10 pt-0 sm:px-[30px] md:pb-10",
        DS_MAIN_COLUMN,
      )}
    >
      <div className={cn("flex flex-col gap-3 sm:gap-4 md:gap-5")}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
          <div className="min-w-0 lg:col-span-8">
            <DashboardHomeTopBar
              greeting={greeting}
              householdName={getAppDisplayName(data.adminSettings)}
              notificationCount={notificationCount}
              activeMemberLabel={activeMember ? getMemberFullName(activeMember) : undefined}
              navigateWithinApp={navigateWithinApp}
              onNotificationsClick={() => {
                navigateWithinApp?.("/#home-notifications");
                window.requestAnimationFrame(() =>
                  document
                    .getElementById("home-notifications")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
              restrictChildNavigation={restrictChildNavigation}
              scopePicker={{
                activeScope: dashboardScope,
                members: data.familyMembers,
                onScopeChange: setDashboardScope,
              }}
            />
          </div>

          <div className="min-w-0 lg:col-span-4">
            <DashboardHomeKitchenDutyCard
              data={data}
              today={today}
              todayKitchenDay={todayKitchenDay}
              kitchenTodayMember={kitchenTodayMember}
              kitchenCompletedToday={kitchenCompletedToday}
              activeMemberId={sessionMemberId}
              dashboardViewMemberId={viewMemberId}
              navigateWithinApp={navigateWithinApp}
              restrictChildNavigation={restrictChildNavigation}
            />
          </div>
        </div>

        {showTodaySnapshot ? (
          <DashboardHomeTodaySnapshot
            snapshotNotificationCount={snapshotNotificationCount}
            importantMessageCount={importantMessageCount}
            shoppingNeedCount={groceryNeeds.length}
            todayEventCount={todayPlannerCount}
            upcomingEventCount={upcomingPlannerCount}
            choresDueTodayCount={choresDueTodayCount}
            choresOverdueCount={choresOverdueCount}
            pantryAttentionCount={pantryAttentionTotal}
            navigateWithinApp={navigateWithinApp}
            restrictChildNavigation={restrictChildNavigation}
          />
        ) : null}

        <DashboardWeeklyResetCard
          data={data}
          todayIso={today}
          dashboardViewMemberId={viewMemberId}
          navigateWithinApp={navigateWithinApp}
        />

        {showLayoutControls ? (
          <DashboardLayoutControls
            editLayout={editLayout}
            onSetEditLayout={setEditLayout}
            widgets={sortedGridWidgets}
            onWidgetVisibleChange={setWidgetVisible}
            onWidgetSizeChange={setWidgetSize}
            onMoveOrder={moveWidgetOrder}
            onReorderDrag={reorderWidgetsByDrag}
            onResetLayout={resetLayout}
            layoutViewLabel={layoutViewLabel}
          />
        ) : null}

        {mainCells.length === 0 ? (
          <section
            className={cn(SMARTHR_CARD, "p-6 text-center sm:p-8")}
            aria-live="polite"
          >
            <h2 className={cn("text-[17px] font-semibold text-[#1f1f1f]", SMARTHR_TITLE)}>
              No tiles visible
            </h2>
            <p className={cn("mt-2", SMARTHR_DASH_BODY_PARAGRAPH)}>
              Turn tiles back on with Edit layout — your household data is still here.
            </p>
            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="primary"
                className="min-h-10 rounded-xl px-5 font-semibold"
                onClick={() => setEditLayout(true)}
              >
                Edit layout
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:gap-5 lg:auto-rows-min">
            {mainCells.map((w) => (
              <div
                key={w.id}
                style={{ order: w.order }}
                className={cn(dashboardWidgetLgSpanClass(w), "col-span-1 min-w-0")}
              >
                {renderMainCell(w.id)}
              </div>
            ))}
          </div>
        )}

        {showPostMessage ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="font-semibold"
              onClick={openDashboardMessageCreate}
            >
              Post household message
            </Button>
          </div>
        ) : null}
      </div>

      <MessageBoardDrawer
        open={msgDrawerOpen}
        mode={msgDrawerMode}
        draft={msgDraft}
        categories={messageCategories}
        familyMembers={data.familyMembers}
        onClose={() => {
          setMsgDrawerOpen(false);
          setMsgDraft(null);
        }}
        onSave={saveDashboardMessage}
        onDelete={undefined}
      />
    </WorkspacePageShell>
    </div>
  );
}
