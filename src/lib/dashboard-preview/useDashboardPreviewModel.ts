import { useMemo } from "react";
import type { FamilyData } from "../../data/familyData";
import {
  resolveSessionMemberIdForUi,
  selectImportantMessagesForHome,
} from "../familyDataSelectors";
import {
  buildFamilyHubDashboardModel,
  orderWakePageMembers,
} from "../familyHubDashboardData";
import { buildFridgeMiniMonth, formatFridgeClock } from "../fridgeHomeModel";
import { dedupeNotificationsForDisplay } from "../householdNotify";
import { buildTodayHomeRows, dashboardGreeting } from "../kioskHomeDashboardCharts";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  labelKitchenWeekday,
} from "../kitchenDuty";
import { selectUpcomingEventsForHousehold } from "../upcomingEvents";
import { findMemberById, getMemberFullName } from "../utils";
import { selectDashboardChores } from "./selectDashboardChores";

const MESSAGE_PREVIEW_LIMIT = 4;
const NOTIFICATION_PREVIEW_LIMIT = 5;
const UPCOMING_PREVIEW_LIMIT = 6;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenTask(status: string | undefined): boolean {
  return status !== "Done" && status !== "Completed" && status !== "Skipped";
}

/** Read-only derived state for DashboardPreview — mirrors NotionHomeWorkspace selectors. */
export function useDashboardPreviewModel(data: FamilyData, now: Date) {
  const todayIso = localTodayIso(now);
  const clock = formatFridgeClock(now);
  const greeting = dashboardGreeting(now).replace(/\s*👋\s*$/, "");
  const selectedMemberId = resolveSessionMemberIdForUi(data);

  const miniMonth = useMemo(() => buildFridgeMiniMonth(data, now), [data, now]);
  const hubModel = useMemo(
    () => buildFamilyHubDashboardModel(data, todayIso),
    [data, todayIso],
  );

  const orderedMembers = useMemo(
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

  const choreSelection = useMemo(
    () => selectDashboardChores(data, todayIso),
    [data, todayIso],
  );
  const todayChores = choreSelection.rows.map((row) => row.task);

  const upcomingEvents = useMemo(
    () => selectUpcomingEventsForHousehold(data, todayIso, 8),
    [data, todayIso],
  );

  const todayEvents = useMemo(
    () => upcomingEvents.filter((event) => event.isToday),
    [upcomingEvents],
  );

  const agendaEvents = todayEvents.length > 0 ? todayEvents : upcomingEvents;
  const upcomingAgendaHeading = todayEvents.length > 0 ? clock.dateLine : "Upcoming";

  const upcomingRows = useMemo(
    () =>
      agendaEvents.slice(0, UPCOMING_PREVIEW_LIMIT).map((event) => {
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
        return {
          id: event.id,
          title: event.title,
          date: event.date,
          meta: metaParts.join(" · "),
        };
      }),
    [agendaEvents],
  );

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
  const openChoreCount = choreSelection.openCount;
  const kitchenAssigned = Boolean(kitchenTodayMember);
  const kitchenDayLabel = todayKitchenDay
    ? labelKitchenWeekday(todayKitchenDay)
    : "No kitchen day mapped";
  const kitchenStatus = kitchenComplete ? "Done" : kitchenName;

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

  const pantryModel = useMemo(() => {
    const lowStockCount = hubModel.overview?.lowStock ?? 0;
    const expiringCount = hubModel.overview?.expiringFood ?? 0;
    const alertRows =
      pantryAlertCount > 0
        ? [
            {
              id: "pantry-alerts",
              title: `${pantryAlertCount} pantry alert${pantryAlertCount === 1 ? "" : "s"}`,
              detail: `${lowStockCount} low stock · ${expiringCount} expiring`,
              href: "/pantry?view=pantry",
            },
          ]
        : [];
    const zoneStats = storageZoneStats
      ? [
          { key: "pantry", label: "Pantry", count: storageZoneStats.pantry },
          { key: "fridge", label: "Fridge", count: storageZoneStats.fridge },
          { key: "freezer", label: "Freezer", count: storageZoneStats.freezer },
        ]
      : [];
    return { lowStockCount, expiringCount, zoneStats, alertRows, pantryAlertCount };
  }, [hubModel, pantryAlertCount, storageZoneStats]);

  const shoppingCount = needToBuy.length;
  const todayEventCount = todayEvents.length;
  const messagesAndAlertsCount = importantMessages.length + attentionNotifications.length;

  return {
    todayIso,
    clock,
    greeting,
    selectedMemberId,
    miniMonth,
    miniMonthWeekdayLabels: WEEKDAY_LABELS,
    hubModel,
    orderedMembers,
    needToBuy,
    todayRows,
    todayChores,
    choreSelection,
    upcomingEvents,
    todayEvents,
    agendaEvents,
    upcomingAgendaHeading,
    upcomingRows,
    importantMessages,
    attentionNotifications,
    todayKitchenDay,
    kitchenTodayMember,
    kitchenName,
    kitchenComplete,
    openChoreCount,
    kitchenAssigned,
    kitchenDayLabel,
    kitchenStatus,
    pantryAlertCount,
    storageZoneStats,
    pantryModel,
    shoppingCount,
    todayEventCount,
    messagesAndAlertsCount,
  };
}

export type DashboardPreviewModel = ReturnType<typeof useDashboardPreviewModel>;
