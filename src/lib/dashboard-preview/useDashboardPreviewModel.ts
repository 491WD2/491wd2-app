import { useMemo } from "react";
import type { FamilyData } from "../../data/familyData";
import { resolveSessionMemberIdForUi } from "../familyDataSelectors";
import {
  buildFamilyHubDashboardModel,
  orderWakePageMembers,
} from "../familyHubDashboardData";
import { buildFridgeMiniMonth, formatFridgeClock } from "../fridgeHomeModel";
import { buildTodayHomeRows, dashboardGreeting } from "../kioskHomeDashboardCharts";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  labelKitchenWeekday,
} from "../kitchenDuty";
import { findMemberById, getMemberFullName } from "../utils";
import { selectDashboardChores } from "./selectDashboardChores";
import { selectDashboardMessages } from "./selectDashboardMessages";
import { selectDashboardPantry } from "./selectDashboardPantry";
import { selectDashboardShopping } from "./selectDashboardShopping";
import { selectDashboardUpcoming } from "./selectDashboardUpcoming";

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

  const shoppingSelection = useMemo(() => selectDashboardShopping(data), [data]);
  const needToBuy = shoppingSelection.items;

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

  const upcomingSelection = useMemo(
    () => selectDashboardUpcoming(data, todayIso),
    [data, todayIso],
  );
  const upcomingRows = upcomingSelection.rows;
  const upcomingAgendaHeading = upcomingSelection.heading;

  const messagesSelection = useMemo(() => selectDashboardMessages(data), [data]);
  const importantMessages = messagesSelection.messages;
  const attentionNotifications = messagesSelection.notifications;

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

  const pantrySelection = useMemo(() => selectDashboardPantry(hubModel), [hubModel]);
  const pantryAlertCount = pantrySelection.alertCount;

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
    const zoneStats = storageZoneStats
      ? [
          { key: "pantry", label: "Pantry", count: storageZoneStats.pantry },
          { key: "fridge", label: "Fridge", count: storageZoneStats.fridge },
          { key: "freezer", label: "Freezer", count: storageZoneStats.freezer },
        ]
      : [];
    return {
      lowStockCount: pantrySelection.lowStockCount,
      expiringCount: pantrySelection.expiringCount,
      zoneStats,
      alertRows: pantrySelection.rows,
      pantryAlertCount: pantrySelection.alertCount,
      summaryLabel: pantrySelection.summaryLabel,
      emptyLabel: pantrySelection.emptyLabel,
    };
  }, [pantrySelection, storageZoneStats]);

  const shoppingCount = shoppingSelection.count;
  const todayEventCount = upcomingSelection.todayCount;
  const upcomingEventCount = upcomingSelection.relevantCount;
  const messagesAndAlertsCount = messagesSelection.count;

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
    shoppingSelection,
    todayRows,
    todayChores,
    choreSelection,
    upcomingSelection,
    upcomingAgendaHeading,
    upcomingRows,
    importantMessages,
    attentionNotifications,
    messagesSelection,
    todayKitchenDay,
    kitchenTodayMember,
    kitchenName,
    kitchenComplete,
    openChoreCount,
    kitchenAssigned,
    kitchenDayLabel,
    kitchenStatus,
    pantryAlertCount,
    pantrySelection,
    storageZoneStats,
    pantryModel,
    shoppingCount,
    todayEventCount,
    upcomingEventCount,
    messagesAndAlertsCount,
  };
}

export type DashboardPreviewModel = ReturnType<typeof useDashboardPreviewModel>;
