import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  CalendarDays,
  ChefHat,
  Package,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import type { FamilyData } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import { getAppDisplayName } from "../../lib/customization";
import {
  buildFridgeMiniMonth,
  formatFridgeClock,
} from "../../lib/fridgeHomeModel";
import {
  buildTodayHomeRows,
  dashboardGreeting,
} from "../../lib/kioskHomeDashboardCharts";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  labelKitchenWeekday,
} from "../../lib/kitchenDuty";
import { selectUpcomingEventsForHousehold } from "../../lib/upcomingEvents";
import { findMemberById, getMemberFullName } from "../../lib/utils";
import { createShoppingItemFromName } from "../../pages/shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../../services/rulesEngine";
import {
  MiniStatCard,
  StartPageCustomizeBar,
  StartPageWidget,
  WidgetActionPill,
  WidgetEmptyState,
  WidgetFooter,
  WidgetHeader,
  WidgetIconTile,
  WidgetMetaChip,
} from "../startPage";
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

function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenTask(status: string | undefined): boolean {
  return status !== "Done" && status !== "Completed" && status !== "Skipped";
}

export function NotionHomeWorkspace({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenShopping,
  onOpenCalendar,
  onOpenTasks,
}: NotionHomeWorkspaceProps) {
  const [now, setNow] = useState(() => new Date());
  const [shoppingDraft, setShoppingDraft] = useState("");

  const todayIso = localTodayIso(now);
  const householdName = getAppDisplayName(data.adminSettings)?.trim() || "FamilyHub";
  const clock = formatFridgeClock(now);
  const greeting = dashboardGreeting(now).replace(/\s*👋\s*$/, "");

  const miniMonth = useMemo(() => buildFridgeMiniMonth(data, now), [data, now]);

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

  const shoppingItemLabel =
    needToBuy.length === 1 ? "1 item" : `${needToBuy.length} items`;

  return (
    <NotionPageCanvas className="fh-notion-page fh-notion-home fh-smart-home fh-fridge-home fh-fridge-home--tablet fh-start-page fh-pro-page fh-home-pro fh-meridian">
      <header className="fh-fridge-home__top fh-pro-card fh-home-pro__hero" aria-label="Greeting and clock">
        <div className="fh-fridge-home__top-copy">
          <p className="fh-fridge-home__kicker fh-pro-section-title">{greeting}</p>
          <h1 className="fh-fridge-home__title">{householdName}</h1>
          <StartPageCustomizeBar />
        </div>

        <ul className="fh-fridge-home__status fh-home-pro__chips" aria-label="Today at a glance">
          <li>
            <button type="button" onClick={() => go("/tasks", onOpenTasks)}>
              Kitchen · {kitchenComplete ? "Done" : kitchenName}
            </button>
          </li>
          <li>
            <button type="button" onClick={() => go("/tasks", onOpenTasks)}>
              {openChoreCount} chore{openChoreCount === 1 ? "" : "s"} open
            </button>
          </li>
          <li>
            <button type="button" onClick={() => go("/shopping", onOpenShopping)}>
              {needToBuy.length} shopping
            </button>
          </li>
        </ul>

        <div className="fh-fridge-home__clock fh-home-pro__clock" aria-live="polite">
          <p className="fh-fridge-home__clock-time">{clock.time}</p>
          <p className="fh-fridge-home__clock-date">{clock.dateLine}</p>
        </div>
      </header>

      <div className="fh-fridge-home__board-wrap">
        <p className="fh-pro-section-title fh-start-page__board-label">Today at home</p>
        <div className="fh-fridge-home__board">
          <StartPageWidget
            className="fh-fridge-home__kitchen"
            aria-labelledby="fh-fridge-kitchen"
            header={
              <WidgetHeader
                titleId="fh-fridge-kitchen"
                title="Today’s kitchen duty"
                icon={
                  <WidgetIconTile tone="amber">
                    <ChefHat className="h-4 w-4" />
                  </WidgetIconTile>
                }
                action={
                  <WidgetActionPill onClick={() => go("/tasks", onOpenTasks)}>
                    Open chores
                  </WidgetActionPill>
                }
              />
            }
            footer={
              <WidgetFooter aria-label="Kitchen duty summary">
                <WidgetMetaChip>Kitchen</WidgetMetaChip>
                <WidgetMetaChip>Today</WidgetMetaChip>
                <WidgetMetaChip>{kitchenAssigned ? "Assigned" : "Unassigned"}</WidgetMetaChip>
              </WidgetFooter>
            }
          >
            <div className="fh-fridge-home__kitchen-hero fh-home-pro__priority">
              <p className="fh-fridge-home__kitchen-name">{kitchenName}</p>
              {kitchenAssigned ? (
                <p className="fh-fridge-home__kitchen-summary">
                  Kitchen duty is assigned for today
                </p>
              ) : null}
              <p className="fh-fridge-home__kitchen-meta">
                <span className="fh-status-pill fh-status-pill--neutral">{kitchenDayLabel}</span>
                <span
                  className={`fh-status-pill ${kitchenComplete ? "fh-status-pill--done" : "fh-status-pill--open"}`}
                >
                  {kitchenComplete ? "Completed" : "Still open"}
                </span>
              </p>
            </div>

            <h3 className="fh-pro-section-title">Today’s chores</h3>
            {todayRows.length === 0 ? (
              <WidgetEmptyState>Nothing due for today yet.</WidgetEmptyState>
            ) : (
              <ul className="fh-fridge-home__activity-list fh-home-pro__list">
                {todayRows.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="fh-pro-list-row"
                      onClick={() => go("/tasks", onOpenTasks)}
                    >
                      <span className="fh-pro-list-row__title">{item.title}</span>
                      <span className="fh-pro-list-row__meta">
                        {item.time} · {item.done ? "Done" : "Chore"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </StartPageWidget>

          <StartPageWidget
            className="fh-fridge-home__calendar"
            aria-labelledby="fh-fridge-calendar"
            header={
              <WidgetHeader
                titleId="fh-fridge-calendar"
                title="Calendar"
                subtitle="Household schedule"
                icon={
                  <WidgetIconTile>
                    <CalendarDays className="h-4 w-4" />
                  </WidgetIconTile>
                }
                action={
                  <WidgetActionPill onClick={() => go("/calendar", onOpenCalendar)}>
                    Open calendar
                  </WidgetActionPill>
                }
              />
            }
            footer={
              <WidgetFooter aria-label="Calendar categories">
                <WidgetMetaChip>School</WidgetMetaChip>
                <WidgetMetaChip>Travel</WidgetMetaChip>
                <WidgetMetaChip>Activities</WidgetMetaChip>
              </WidgetFooter>
            }
          >
            <div className="fh-fridge-home__cal-layout">
              <div className="fh-fridge-home__cal-agenda">
                <h3 className="fh-pro-section-title">Upcoming</h3>
                <p className="fh-fridge-home__agenda-day">{agendaHeading}</p>
                {agendaEvents.length === 0 ? (
                  <WidgetEmptyState>No upcoming events on the planner.</WidgetEmptyState>
                ) : (
                  <ul className="fh-fridge-home__activity-list fh-home-pro__list">
                    {agendaEvents.slice(0, 7).map((event) => {
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
                            className="fh-pro-list-row"
                            onClick={() => go("/calendar", onOpenCalendar)}
                          >
                            <span className="fh-pro-list-row__title">{event.title}</span>
                            <span className="fh-pro-list-row__meta">{metaParts.join(" · ")}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="fh-fridge-home__mini-cal fh-home-pro__mini-cal" aria-label={miniMonth.monthLabel}>
                <p className="fh-fridge-home__mini-cal-label">{miniMonth.monthLabel}</p>
                <div className="fh-fridge-home__mini-cal-weekdays">
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div className="fh-fridge-home__mini-cal-grid">
                  {miniMonth.weeks.flat().map((day) => (
                    <button
                      key={day.iso}
                      type="button"
                      className={[
                        "fh-fridge-home__mini-cal-day",
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
          </StartPageWidget>
        </div>
      </div>

      <div className="fh-fridge-home__dock-wrap">
        <p className="fh-pro-section-title fh-start-page__dock-label">Household lists</p>
        <div className="fh-fridge-home__dock">
          <StartPageWidget
            className="fh-fridge-home__shopping"
            aria-labelledby="fh-fridge-shop"
            header={
              <WidgetHeader
                titleId="fh-fridge-shop"
                title="Shopping"
                subtitle={`${shoppingItemLabel} on the list`}
                icon={
                  <WidgetIconTile tone="mint">
                    <ShoppingCart className="h-4 w-4" />
                  </WidgetIconTile>
                }
                action={
                  <WidgetActionPill onClick={() => go("/shopping", onOpenShopping)}>
                    Open shopping
                  </WidgetActionPill>
                }
              />
            }
          >
            {needToBuy.length === 0 ? (
              <WidgetEmptyState>Shopping list is clear.</WidgetEmptyState>
            ) : (
              <ul className="fh-fridge-home__shop-list fh-home-pro__list">
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
                        className="fh-pro-list-row fh-home-pro__shop-row"
                        onClick={() => go("/shopping", onOpenShopping)}
                      >
                        <span className="fh-home-pro__shop-main">
                          <span className="fh-pro-list-row__title">{item.name}</span>
                          {showCategory ? (
                            <span className="fh-pro-list-row__meta">{category}</span>
                          ) : null}
                        </span>
                        <span className="fh-home-pro__qty">{qty}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <form className="fh-home-pro__composer" onSubmit={onShoppingAdd}>
              <input
                aria-label="Quick add shopping item"
                autoComplete="off"
                onChange={(e) => setShoppingDraft(e.target.value)}
                placeholder="Add an item…"
                value={shoppingDraft}
              />
              <button type="submit" className="fh-pro-btn fh-pro-btn--primary" aria-label="Add shopping item">
                Add
              </button>
            </form>
          </StartPageWidget>

          <StartPageWidget
            as="aside"
            className="fh-fridge-home__storage"
            aria-labelledby="fh-fridge-storage"
            header={
              <WidgetHeader
                titleId="fh-fridge-storage"
                title="Pantry & Storage"
                subtitle="Household food storage"
                icon={
                  <WidgetIconTile tone="aqua">
                    <Package className="h-4 w-4" />
                  </WidgetIconTile>
                }
                action={
                  <WidgetActionPill onClick={() => go("/pantry", onOpenPantry)}>
                    Open storage
                  </WidgetActionPill>
                }
              />
            }
            footer={
              <WidgetFooter>
                <nav className="fh-home-pro__links" aria-label="Quick links">
                  <button type="button" className="fh-pro-btn fh-pro-btn--ghost" onClick={() => go("/calendar", onOpenCalendar)}>
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    Calendar
                  </button>
                  <button type="button" className="fh-pro-btn fh-pro-btn--ghost" onClick={() => go("/tasks", onOpenTasks)}>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Chores
                  </button>
                  <button type="button" className="fh-pro-btn fh-pro-btn--ghost" onClick={() => go("/shopping", onOpenShopping)}>
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    Shopping
                  </button>
                </nav>
              </WidgetFooter>
            }
          >
            <p className="fh-fridge-home__storage-note">
              Track pantry stock, fridge items, and freezer storage in one place.
            </p>

            {storageZoneStats ? (
              <div className="fh-storage-widget__areas">
                <p className="fh-pro-section-title">Storage</p>
                <div className="fh-fridge-home__zone-stats" aria-label="Storage summary">
                  <MiniStatCard value={storageZoneStats.pantry} label="Pantry" tone="mint" />
                  <MiniStatCard value={storageZoneStats.fridge} label="Fridge" tone="aqua" />
                  <MiniStatCard value={storageZoneStats.freezer} label="Freezer" tone="blue" />
                </div>
              </div>
            ) : (
              <WidgetEmptyState>
                Open Storage to start tracking pantry, fridge, and freezer items.
              </WidgetEmptyState>
            )}
          </StartPageWidget>
        </div>
      </div>
    </NotionPageCanvas>
  );
}
