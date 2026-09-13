import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  CalendarDays,
  ChefHat,
  CloudMoon,
  CloudSun,
  MessageCircle,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Sun,
} from "lucide-react";
import type { FamilyData } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import { getAppDisplayName } from "../../lib/customization";
import { selectImportantMessagesForHome } from "../../lib/familyDataSelectors";
import {
  buildFridgeMiniMonth,
  formatFridgeClock,
} from "../../lib/fridgeHomeModel";
import {
  eventWhenChip,
  isShoppingItemDueSoon,
  summarizePantryForHome,
  summarizeShoppingForHome,
  weatherPlaceholderCopy,
} from "../../lib/homePriorityDashboard";
import { buildTodayHomeRows } from "../../lib/kioskHomeDashboardCharts";
import {
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
} from "../../lib/kitchenDuty";
import { selectUpcomingEventsForHousehold } from "../../lib/upcomingEvents";
import { findMemberById, getMemberFullName } from "../../lib/utils";
import { createShoppingItemFromName } from "../../pages/shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../../services/rulesEngine";
import {
  StartPageWidget,
  WidgetActionPill,
  WidgetEmptyState,
  WidgetHeader,
  WidgetIconTile,
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

function pantryBadgeClass(badge: string): string {
  if (badge === "Out") return "fh-home-bright__badge fh-home-bright__badge--out";
  if (badge === "Low") return "fh-home-bright__badge fh-home-bright__badge--low";
  return "fh-home-bright__badge fh-home-bright__badge--soon";
}

function weatherIcon(now: Date) {
  const hour = now.getHours();
  if (hour < 6 || hour >= 21) return CloudMoon;
  if (hour < 17) return Sun;
  return CloudSun;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
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
  const shoppingInputRef = useRef<HTMLInputElement>(null);

  const todayIso = localTodayIso(now);
  const householdName = getAppDisplayName(data.adminSettings)?.trim() || "FamilyHub";
  const clock = formatFridgeClock(now);
  const weather = weatherPlaceholderCopy(now);
  const WeatherIcon = weatherIcon(now);

  const miniMonth = useMemo(() => buildFridgeMiniMonth(data, now), [data, now]);
  const shopping = useMemo(
    () => summarizeShoppingForHome(data.shopping, todayIso),
    [data.shopping, todayIso],
  );
  const pantry = useMemo(() => summarizePantryForHome(data.pantry), [data.pantry]);

  const openTasks = useMemo(
    () => (data.tasks ?? []).filter((task) => task && isOpenTask(task.status)),
    [data.tasks],
  );
  const todayRows = useMemo(
    () => buildTodayHomeRows(data, todayIso, openTasks),
    [data, todayIso, openTasks],
  );
  const upcomingEvents = useMemo(
    () => selectUpcomingEventsForHousehold(data, todayIso, 3),
    [data, todayIso],
  );
  const importantMessages = useMemo(
    () => selectImportantMessagesForHome(data, 3),
    [data],
  );

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

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  function go(href: string, fallback?: () => void) {
    navigateWithinApp(href);
    fallback?.();
  }

  function focusShoppingComposer() {
    shoppingInputRef.current?.focus();
    shoppingInputRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
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
    shopping.open.length === 1 ? "1 item on the list" : `${shopping.open.length} items on the list`;

  return (
    <NotionPageCanvas className="fh-notion-page fh-notion-home fh-smart-home fh-fridge-home fh-fridge-home--tablet fh-start-page fh-pro-page fh-home-pro fh-home-bright">
      <header className="fh-home-bright__strip" aria-label="Date, time, kitchen, and weather">
        <div className="fh-home-bright__when">
          <p className="fh-home-bright__kicker">{householdName}</p>
          <h1 className="fh-home-bright__title">{clock.dateLine}</h1>
          <div className="fh-home-bright__clock" aria-live="polite">
            <p className="fh-home-bright__clock-time">{clock.time}</p>
          </div>
        </div>

        <button
          type="button"
          className="fh-home-bright__kitchen"
          onClick={() => go("/tasks", onOpenTasks)}
          aria-label={`Who’s on kitchen: ${kitchenName}`}
        >
          <span className="fh-home-bright__kitchen-icon" aria-hidden>
            <ChefHat className="h-4 w-4" />
          </span>
          <span className="fh-home-bright__kitchen-copy">
            <span className="fh-home-bright__kitchen-label">Who’s on kitchen</span>
            <span className="fh-home-bright__kitchen-name">
              {kitchenTodayMember ? firstName(kitchenName) : kitchenName}
            </span>
            <span className="fh-home-bright__kitchen-state">
              {kitchenComplete ? "Duty completed" : "Kitchen duty today"}
            </span>
          </span>
        </button>

        <nav className="fh-home-bright__actions" aria-label="Quick add">
          <button
            type="button"
            className="fh-home-bright__action fh-home-bright__action--shop"
            onClick={focusShoppingComposer}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add shopping
          </button>
          <button
            type="button"
            className="fh-home-bright__action fh-home-bright__action--pantry"
            onClick={() => go("/quick-add?type=pantry&name=", onOpenPantry)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add pantry
          </button>
          <button
            type="button"
            className="fh-home-bright__action fh-home-bright__action--event"
            onClick={() => go("/quick-add?type=event&title=", onOpenCalendar)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add event
          </button>
          <button
            type="button"
            className="fh-home-bright__action fh-home-bright__action--message"
            onClick={() => go("/messages")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add message
          </button>
        </nav>

        <div className="fh-home-bright__weather" aria-label="Weather placeholder">
          <WeatherIcon className="h-6 w-6" aria-hidden />
          <div>
            <strong>{weather.title}</strong>
            <span>{weather.detail}</span>
          </div>
        </div>
      </header>

      <div className="fh-home-bright__main">
        <div className="fh-home-bright__ops">
          <StartPageWidget
            className="fh-fridge-home__shopping fh-home-bright__card fh-home-bright__card--shop"
            aria-labelledby="fh-home-shop"
            header={
              <WidgetHeader
                titleId="fh-home-shop"
                title="Shopping"
                subtitle={shoppingItemLabel}
                showMenu={false}
                icon={
                  <WidgetIconTile tone="aqua">
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
            <div className="fh-home-bright__metrics" aria-label="Shopping summary">
              <span className="fh-home-bright__chip fh-home-bright__chip--cyan">
                {shopping.open.length} to buy
              </span>
              <span className="fh-home-bright__chip fh-home-bright__chip--orange">
                {shopping.dueSoon.length} due now
              </span>
              {shopping.restock.length > 0 ? (
                <span className="fh-home-bright__chip fh-home-bright__chip--green">
                  {shopping.restock.length} restock
                </span>
              ) : null}
            </div>

            {shopping.preview.length === 0 ? (
              <WidgetEmptyState>Shopping list is clear.</WidgetEmptyState>
            ) : (
              <ul className="fh-fridge-home__shop-list fh-home-pro__list">
                {shopping.preview.map((item) => {
                  const qty = [item.quantity, item.unit].filter(Boolean).join(" ") || "1";
                  const due = isShoppingItemDueSoon(item, todayIso);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="fh-pro-list-row fh-home-pro__shop-row"
                        onClick={() => go("/shopping", onOpenShopping)}
                      >
                        <span className="fh-home-pro__shop-main">
                          <span className="fh-pro-list-row__title">{item.name}</span>
                          <span className="fh-home-bright__row-meta">
                            {due ? <span className="fh-home-bright__badge fh-home-bright__badge--due">Due</span> : null}
                            {item.sourcePantryItemId ? (
                              <span className="fh-home-bright__badge fh-home-bright__badge--soon">Restock</span>
                            ) : null}
                            {item.category ? (
                              <span className="fh-pro-list-row__meta">{item.category}</span>
                            ) : null}
                          </span>
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
                ref={shoppingInputRef}
                aria-label="Quick add shopping item"
                autoComplete="off"
                onChange={(event) => setShoppingDraft(event.target.value)}
                placeholder="Add milk, bread, eggs…"
                value={shoppingDraft}
              />
              <button type="submit" className="fh-pro-btn fh-pro-btn--primary" aria-label="Add shopping item">
                Add
              </button>
            </form>
          </StartPageWidget>

          <StartPageWidget
            className="fh-fridge-home__storage fh-home-bright__card fh-home-bright__card--pantry"
            aria-labelledby="fh-home-pantry"
            header={
              <WidgetHeader
                titleId="fh-home-pantry"
                title="Pantry"
                subtitle="What’s low, out, or needs restocking"
                showMenu={false}
                icon={
                  <WidgetIconTile tone="mint">
                    <Package className="h-4 w-4" />
                  </WidgetIconTile>
                }
                action={
                  <WidgetActionPill onClick={() => go("/pantry", onOpenPantry)}>
                    Open pantry
                  </WidgetActionPill>
                }
              />
            }
          >
            <div className="fh-home-bright__metrics" aria-label="Pantry summary">
              <span className="fh-home-bright__chip fh-home-bright__chip--rose">
                {pantry.out.length} out
              </span>
              <span className="fh-home-bright__chip fh-home-bright__chip--yellow">
                {pantry.low.length} low
              </span>
              <span className="fh-home-bright__chip fh-home-bright__chip--orange">
                {pantry.expiring.length} use soon
              </span>
              <span className="fh-home-bright__chip fh-home-bright__chip--green">
                {pantry.activeCount} tracked
              </span>
            </div>

            {pantry.attention.length === 0 ? (
              <WidgetEmptyState>
                {pantry.activeCount === 0
                  ? "Open pantry to start tracking household inventory."
                  : "Nothing is low or out right now."}
              </WidgetEmptyState>
            ) : (
              <ul className="fh-fridge-home__activity-list fh-home-pro__list">
                {pantry.attention.map((row) => (
                  <li key={row.item.id}>
                    <button
                      type="button"
                      className="fh-pro-list-row"
                      onClick={() => go("/pantry", onOpenPantry)}
                    >
                      <span className="fh-pro-list-row__title">{row.item.name}</span>
                      <span className="fh-home-bright__row-meta">
                        <span className={pantryBadgeClass(row.badge)}>{row.badge}</span>
                        <span className="fh-pro-list-row__meta">
                          {[row.item.quantity, row.item.unit].filter(Boolean).join(" ") || row.item.storageArea}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </StartPageWidget>
        </div>

        <div className="fh-home-bright__schedule">
          <StartPageWidget
            className="fh-home-bright__card fh-home-bright__card--events"
            aria-labelledby="fh-home-next"
            header={
              <WidgetHeader
                titleId="fh-home-next"
                title="What’s happening next"
                subtitle="Upcoming household events"
                showMenu={false}
                icon={
                  <WidgetIconTile tone="amber">
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
          >
            {upcomingEvents.length === 0 ? (
              <WidgetEmptyState>No upcoming events on the planner.</WidgetEmptyState>
            ) : (
              <ul className="fh-fridge-home__activity-list fh-home-pro__list">
                {upcomingEvents.map((event) => {
                  const chip = eventWhenChip(event.date, todayIso);
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        className="fh-pro-list-row"
                        onClick={() => go("/calendar", onOpenCalendar)}
                      >
                        <span className="fh-pro-list-row__title">{event.title}</span>
                        <span className="fh-home-bright__row-meta">
                          <span
                            className={
                              chip === "Today"
                                ? "fh-home-bright__badge fh-home-bright__badge--today"
                                : "fh-home-bright__badge fh-home-bright__badge--soon"
                            }
                          >
                            {chip}
                          </span>
                          <span className="fh-pro-list-row__meta">
                            {[event.time || (event.event.isAllDay ? "All day" : null), event.assigneeLabel]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </StartPageWidget>

          <StartPageWidget
            className="fh-fridge-home__calendar fh-home-bright__card fh-home-bright__card--calendar"
            aria-labelledby="fh-home-calendar"
            header={
              <WidgetHeader
                titleId="fh-home-calendar"
                title="Calendar"
                subtitle="Jump into the full household schedule"
                showMenu={false}
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
          >
            <button
              type="button"
              className="fh-fridge-home__mini-cal fh-home-pro__mini-cal"
              onClick={() => go("/calendar", onOpenCalendar)}
              aria-label={`${miniMonth.monthLabel} calendar, open full calendar`}
            >
              <p className="fh-fridge-home__mini-cal-label">{miniMonth.monthLabel}</p>
              <div className="fh-fridge-home__mini-cal-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="fh-fridge-home__mini-cal-grid">
                {miniMonth.weeks.flat().map((day) => (
                  <span
                    key={day.iso}
                    className={[
                      "fh-fridge-home__mini-cal-day",
                      day.inMonth ? "" : "is-muted",
                      day.isToday ? "is-today" : "",
                      day.hasEvents ? "has-events" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {day.day}
                  </span>
                ))}
              </div>
            </button>
          </StartPageWidget>
        </div>
      </div>

      <div className="fh-home-bright__secondary" aria-label="More household tools">
        <StartPageWidget
          className="fh-home-bright__card fh-home-bright__card--messages"
          aria-labelledby="fh-home-messages"
          header={
            <WidgetHeader
              titleId="fh-home-messages"
              title="Messages"
              subtitle={
                importantMessages.length === 1
                  ? "1 important note"
                  : `${importantMessages.length} important notes`
              }
              showMenu={false}
              icon={
                <WidgetIconTile tone="violet">
                  <MessageCircle className="h-4 w-4" />
                </WidgetIconTile>
              }
              action={
                <WidgetActionPill onClick={() => go("/messages")}>Open messages</WidgetActionPill>
              }
            />
          }
        >
          {importantMessages.length === 0 ? (
            <WidgetEmptyState>No pinned or urgent messages right now.</WidgetEmptyState>
          ) : (
            <ul className="fh-fridge-home__activity-list fh-home-pro__list">
              {importantMessages.map((message) => (
                <li key={message.id}>
                  <button type="button" className="fh-pro-list-row" onClick={() => go("/messages")}>
                    <span className="fh-pro-list-row__title">{message.title || message.message}</span>
                    <span className="fh-pro-list-row__meta">{message.category || message.priority}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </StartPageWidget>

        <StartPageWidget
          className="fh-fridge-home__kitchen fh-home-bright__card fh-home-bright__card--chores"
          aria-labelledby="fh-home-chores"
          header={
            <WidgetHeader
              titleId="fh-home-chores"
              title="Chores"
              subtitle={
                openChoreCount === 1 ? "1 chore open today" : `${openChoreCount} chores open today`
              }
              showMenu={false}
              icon={
                <WidgetIconTile tone="amber">
                  <Sparkles className="h-4 w-4" />
                </WidgetIconTile>
              }
              action={
                <WidgetActionPill onClick={() => go("/tasks", onOpenTasks)}>Open chores</WidgetActionPill>
              }
            />
          }
        >
          {todayRows.length === 0 ? (
            <WidgetEmptyState>Nothing due for today yet.</WidgetEmptyState>
          ) : (
            <ul className="fh-fridge-home__activity-list fh-home-pro__list">
              {todayRows.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <button type="button" className="fh-pro-list-row" onClick={() => go("/tasks", onOpenTasks)}>
                    <span className="fh-pro-list-row__title">{item.title}</span>
                    <span className="fh-pro-list-row__meta">
                      {item.time} · {item.done ? "Done" : "Open"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </StartPageWidget>

        <StartPageWidget
          as="aside"
          className="fh-home-bright__card fh-home-bright__card--tools"
          aria-labelledby="fh-home-tools"
          header={
            <WidgetHeader
              titleId="fh-home-tools"
              title="More tools"
              subtitle="Secondary household pages"
              showMenu={false}
              icon={
                <WidgetIconTile tone="rose">
                  <Sparkles className="h-4 w-4" />
                </WidgetIconTile>
              }
            />
          }
        >
          <div className="fh-home-bright__tools">
            <button type="button" className="fh-home-bright__tool" onClick={() => go("/tasks", onOpenTasks)}>
              Cleaning / Kitchen
            </button>
            <button type="button" className="fh-home-bright__tool" onClick={() => go("/emergency")}>
              Emergency
            </button>
            <button type="button" className="fh-home-bright__tool" onClick={() => go("/family")}>
              Family
            </button>
          </div>
        </StartPageWidget>
      </div>
    </NotionPageCanvas>
  );
}
