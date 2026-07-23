import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  ListChecks,
  MessageCircle,
  Package,
  PackagePlus,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import {
  buildFamilyHubDashboardModel,
  orderWakePageMembers,
} from "../lib/familyHubDashboardData";
import { trackFamilyHubDashboardView } from "../lib/familyHubDashboardAnalytics";
import { getAppDisplayName } from "../lib/customization";
import {
  getTodayKitchenWeekdayLocal,
  labelKitchenWeekday,
} from "../lib/kitchenDuty";
import {
  toggleKitchenChecklistItemForDate,
  visibleKitchenChecklistItems,
} from "../lib/kitchenChecklistDisplay";
import { getMemberColor } from "../lib/memberColors";
import { findMemberById, getMemberFullName, getMemberInitials } from "../lib/utils";
import { createActivity } from "../lib/activity";
import { selectImportantMessagesForHome } from "../lib/familyDataSelectors";
import { dedupeNotificationsForDisplay } from "../lib/householdNotify";
import { createShoppingItemFromName } from "./shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../services/rulesEngine";
import "../components/cards/kiosk.css";
import { WidgetPageShell } from "../components/widgets";
import "../components/familyHub/family-hub-dashboard.css";
import type { PageProps } from "./pageTypes";

export type FamilyHubDashboardProps = Pick<
  PageProps,
  | "data"
  | "setData"
  | "navigateWithinApp"
  | "onOpenPantry"
  | "onOpenTasks"
  | "onOpenCalendar"
  | "onOpenShopping"
  | "onOpenMemberDashboard"
>;

const SHOPPING_PREVIEW_LIMIT = 6;
const MESSAGE_PREVIEW_LIMIT = 4;
const NOTIFICATION_PREVIEW_LIMIT = 5;
const EVENT_PREVIEW_LIMIT = 6;

function formatClockTime(date: Date): { value: string; period: string } {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return {
    value: minute ? `${hour}:${minute}` : hour,
    period: dayPeriod,
  };
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * FamilyHub wake / command page — portrait-first Surface Pro kiosk home.
 * High-priority daily cards only. Pets, Subscriptions, Projects, Photos,
 * Planner, and Routines stay in the sidebar — never as large wake cards.
 * No PIN pad, welcome message, or business-template Location / Hours cards.
 */
export function FamilyHubDashboard({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenTasks,
  onOpenCalendar,
  onOpenShopping,
  onOpenMemberDashboard,
}: FamilyHubDashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [shoppingDraft, setShoppingDraft] = useState("");
  const [quickAddDraft, setQuickAddDraft] = useState("");
  const [checklistOpen, setChecklistOpen] = useState(false);

  const todayIso = localTodayIso(now);
  const model = useMemo(
    () => buildFamilyHubDashboardModel(data, todayIso),
    [data, todayIso],
  );
  const householdName = getAppDisplayName(data.adminSettings);
  const clock = formatClockTime(now);

  const wakeMembers = useMemo(
    () => orderWakePageMembers(data.familyMembers ?? []),
    [data.familyMembers],
  );

  const needToBuy = useMemo(
    () => (data.shopping ?? []).filter((item) => item && !item.purchased),
    [data.shopping],
  );
  const shoppingPreview = needToBuy.slice(0, SHOPPING_PREVIEW_LIMIT);

  const todayKitchenDay = getTodayKitchenWeekdayLocal(now);
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule?.weekdays?.find((entry) => entry.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;
  const kitchenLeadName = kitchenTodayMember
    ? firstName(getMemberFullName(kitchenTodayMember))
    : "Unassigned";

  const daytimeChecklistItems = useMemo(
    () => visibleKitchenChecklistItems(data.kitchenChecklist ?? []),
    [data.kitchenChecklist],
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

  const upcomingEvents = useMemo(
    () => (model.upcomingEvents ?? []).slice(0, EVENT_PREVIEW_LIMIT),
    [model.upcomingEvents],
  );

  const pantryAlertCount =
    (model.overview?.lowStock ?? 0) + (model.overview?.expiringFood ?? 0);

  useEffect(() => {
    trackFamilyHubDashboardView(householdName);
  }, [householdName]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  function go(href: string, fallback?: () => void) {
    if (navigateWithinApp) {
      navigateWithinApp(href);
      return;
    }
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
      setQuickAddDraft("");
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
    setQuickAddDraft("");
    return true;
  }

  function onQuickAddShopping(event: FormEvent) {
    event.preventDefault();
    addShoppingItem(quickAddDraft || shoppingDraft);
  }

  function onShoppingPreviewAdd(event: FormEvent) {
    event.preventDefault();
    addShoppingItem(shoppingDraft);
  }

  function toggleDaytimeChecklistItem(itemId: string) {
    setData((current) => ({
      ...current,
      kitchenChecklist: toggleKitchenChecklistItemForDate(
        current.kitchenChecklist,
        itemId,
        todayIso,
      ),
    }));
  }

  return (
    <WidgetPageShell className="fh-family-hub fh-family-hub--wake fh-family-hub--wake-light">
      <section className="fh-wake" aria-label={`${householdName} wake page`}>
        {/* 1. Top status — time, date, weather (no welcome / business Location card) */}
        <header className="fh-wake__status" aria-label="Time, date, and weather">
          <div className="fh-wake__clock">
            <strong className="fh-wake__time">
              <span>{clock.value}</span>
              {clock.period ? <em>{clock.period}</em> : null}
            </strong>
            <span className="fh-wake__date">{formatLongDate(now)}</span>
          </div>
          <div
            className="fh-wake__weather"
            aria-label="Weather placeholder"
          >
            <CloudSun className="h-6 w-6" aria-hidden />
            <div>
              <strong>Weather</strong>
              <span>Local forecast placeholder</span>
            </div>
          </div>
        </header>

        {/* 2. Family member buttons */}
        <section className="fh-wake__members" aria-labelledby="wake-members-title">
          <div className="fh-wake__section-head">
            <h2 id="wake-members-title">Family</h2>
            <span>Tap a person to open their home</span>
          </div>
          <div className="fh-wake__member-grid">
            {wakeMembers.length === 0 ? (
              <p className="fh-wake__empty">No active family members yet. Add them in Settings.</p>
            ) : (
              wakeMembers.map((member) => {
                const color = getMemberColor(member);
                return (
                  <button
                    key={member.id}
                    type="button"
                    className="fh-wake__member-card"
                    style={{ borderLeftColor: color }}
                    onClick={() => openMemberHome(member.id)}
                  >
                    <span
                      className="fh-wake__member-avatar"
                      style={{ backgroundColor: `${color}22`, color }}
                      aria-hidden
                    >
                      {getMemberInitials(member)}
                    </span>
                    <strong>{firstName(getMemberFullName(member))}</strong>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* 3. Prominent Quick Add */}
        <section className="fh-wake__quick-add" aria-labelledby="wake-quick-add-title">
          <div className="fh-wake__section-head">
            <h2 id="wake-quick-add-title">Quick Add</h2>
            <span>Add without opening a personal dashboard</span>
          </div>
          <form className="fh-wake__quick-form" onSubmit={onQuickAddShopping}>
            <label className="fh-wake__field">
              <span className="sr-only">Shopping item name</span>
              <input
                value={quickAddDraft}
                onChange={(e) => setQuickAddDraft(e.target.value)}
                placeholder="Milk, bread, eggs…"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="fh-wake__btn fh-wake__btn--primary">
              <ShoppingCart className="h-5 w-5" aria-hidden />
              Add to shopping
            </button>
          </form>
          <div className="fh-wake__quick-links">
            <button
              type="button"
              className="fh-wake__btn fh-wake__btn--secondary"
              onClick={() => go("/quick-add?type=grocery&name=", () => go("/shopping", onOpenShopping))}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Add shopping
            </button>
            <button
              type="button"
              className="fh-wake__btn fh-wake__btn--secondary"
              onClick={() => go("/quick-add?type=pantry&name=", onOpenPantry)}
            >
              <PackagePlus className="h-4 w-4" aria-hidden />
              Pantry / Inventory
            </button>
            <button
              type="button"
              className="fh-wake__btn fh-wake__btn--secondary"
              onClick={() => go("/pantry?tab=add-item", onOpenPantry)}
            >
              <Package className="h-4 w-4" aria-hidden />
              Inventory add
            </button>
          </div>
        </section>

        <div className="fh-wake__stack">
          {/* 4. Shopping preview */}
          <section className="fh-wake__card" aria-labelledby="wake-shopping-title">
            <div className="fh-wake__card-head">
              <div>
                <p className="fh-wake__kicker">Shopping</p>
                <h2 id="wake-shopping-title">Need to Buy</h2>
                <span>{needToBuy.length} item{needToBuy.length === 1 ? "" : "s"}</span>
              </div>
              <button type="button" onClick={() => go("/shopping", onOpenShopping)}>
                View all
              </button>
            </div>
            <ul className="fh-wake__list">
              {shoppingPreview.length === 0 ? (
                <li className="fh-wake__empty">Shopping list is clear.</li>
              ) : (
                shoppingPreview.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="fh-wake__list-row"
                      onClick={() => go("/shopping", onOpenShopping)}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      <span>{item.name}</span>
                      <small>
                        {[item.quantity, item.unit].filter(Boolean).join(" ")}
                      </small>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <form className="fh-wake__inline-add" onSubmit={onShoppingPreviewAdd}>
              <input
                value={shoppingDraft}
                onChange={(e) => setShoppingDraft(e.target.value)}
                placeholder="Quick add shopping item"
                autoComplete="off"
                aria-label="Quick add shopping item"
              />
              <button type="submit">Add</button>
            </form>
          </section>

          {/* 5. Pantry alerts */}
          <section className="fh-wake__card" aria-labelledby="wake-pantry-title">
            <div className="fh-wake__card-head">
              <div>
                <p className="fh-wake__kicker">Pantry</p>
                <h2 id="wake-pantry-title">Pantry Alerts</h2>
                <span>Low stock and expiring items</span>
              </div>
              <button type="button" onClick={() => go("/pantry?view=pantry", onOpenPantry)}>
                Open
              </button>
            </div>
            <div className="fh-wake__pantry-stat">
              <strong>{pantryAlertCount}</strong>
              <p>
                {pantryAlertCount === 0
                  ? "No pantry alerts right now."
                  : `${model.overview?.lowStock ?? 0} low stock · ${model.overview?.expiringFood ?? 0} expiring`}
              </p>
            </div>
            {pantryAlertCount > 0 ? (
              <button
                type="button"
                className="fh-wake__alert-strip"
                onClick={() => go("/pantry?view=pantry", onOpenPantry)}
              >
                <Bell className="h-4 w-4" aria-hidden />
                Review pantry alerts
              </button>
            ) : null}
          </section>

          {/* 6. Kitchen duty and chores */}
          <section className="fh-wake__card" aria-labelledby="wake-kitchen-title">
            <div className="fh-wake__card-head">
              <div>
                <p className="fh-wake__kicker">Kitchen &amp; chores</p>
                <h2 id="wake-kitchen-title">Today’s duty</h2>
                <span>
                  {todayKitchenDay ? labelKitchenWeekday(todayKitchenDay) : "Today"} ·{" "}
                  {kitchenLeadName}
                </span>
              </div>
              <button type="button" onClick={() => go("/tasks", onOpenTasks)}>
                Open
              </button>
            </div>
            <div className="fh-wake__duty-banner">
              <UtensilsCrossed className="h-5 w-5" aria-hidden />
              <div>
                <strong>{kitchenLeadName}</strong>
                <span>Kitchen lead today</span>
              </div>
              <button type="button" onClick={() => setChecklistOpen(true)}>
                <ListChecks className="h-4 w-4" aria-hidden />
                Checklist
              </button>
            </div>
            <ul className="fh-wake__list">
              {(model.choresToday ?? []).length === 0 ? (
                <li className="fh-wake__empty">No chores due today.</li>
              ) : (
                (model.choresToday ?? []).map((chore) => (
                  <li key={chore.id}>
                    <button
                      type="button"
                      className={[
                        "fh-wake__list-row",
                        chore.overdue ? "fh-wake__list-row--urgent" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => go("/tasks", onOpenTasks)}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden />
                      <span>{chore.title}</span>
                      <small>
                        {chore.assigneeLabel} · {chore.dueLabel}
                      </small>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 7. Messages and notifications */}
          <section className="fh-wake__card" aria-labelledby="wake-messages-title">
            <div className="fh-wake__card-head">
              <div>
                <p className="fh-wake__kicker">Messages</p>
                <h2 id="wake-messages-title">Pinned &amp; important</h2>
                <span>{importantMessages.length} showing</span>
              </div>
              <button type="button" onClick={() => go("/messages")}>
                Messages
              </button>
            </div>
            <ul className="fh-wake__list">
              {importantMessages.length === 0 ? (
                <li className="fh-wake__empty">No pinned or important messages.</li>
              ) : (
                importantMessages.map((msg) => (
                  <li key={msg.id}>
                    <button
                      type="button"
                      className="fh-wake__list-row"
                      onClick={() => go("/messages")}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      <span>{msg.title?.trim() || msg.message}</span>
                      <small>
                        {msg.pinned ? "Pinned" : msg.priority}
                        {msg.category ? ` · ${msg.category}` : ""}
                      </small>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="fh-wake__subhead">
              <Bell className="h-4 w-4" aria-hidden />
              <h3>Notifications</h3>
              <button type="button" onClick={() => go("/notifications")}>
                All
              </button>
            </div>
            <ul className="fh-wake__list">
              {attentionNotifications.length === 0 ? (
                <li className="fh-wake__empty">Nothing needs attention.</li>
              ) : (
                attentionNotifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="fh-wake__list-row"
                      onClick={() => go("/notifications")}
                    >
                      <Bell className="h-4 w-4" aria-hidden />
                      <span>{n.title}</span>
                      <small>{n.body}</small>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 8. Upcoming events */}
          <section className="fh-wake__card" aria-labelledby="wake-events-title">
            <div className="fh-wake__card-head">
              <div>
                <p className="fh-wake__kicker">Calendar</p>
                <h2 id="wake-events-title">Upcoming events</h2>
                <span>Today first, then next</span>
              </div>
              <button type="button" onClick={() => go("/calendar", onOpenCalendar)}>
                Calendar
              </button>
            </div>
            <ul className="fh-wake__list">
              {upcomingEvents.length === 0 ? (
                <li className="fh-wake__empty">No upcoming events.</li>
              ) : (
                upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className={[
                        "fh-wake__list-row fh-wake__list-row--event",
                        event.isToday ? "fh-wake__list-row--today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => go("/calendar", onOpenCalendar)}
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      <span>
                        <strong>{event.title}</strong>
                        <em>
                          {event.isToday ? "Today · " : ""}
                          {event.when}
                          {event.category ? ` · ${event.category}` : ""}
                          {event.assigneeLabel ? ` · ${event.assigneeLabel}` : ""}
                          {event.location ? ` · ${event.location}` : ""}
                        </em>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </section>

      {checklistOpen ? (
        <div
          className="fh-family-hub__checklist-modal"
          role="presentation"
          onMouseDown={() => setChecklistOpen(false)}
        >
          <section
            className="fh-family-hub__checklist-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wake-kitchen-checklist-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="fh-family-hub__checklist-dialog-head">
              <div>
                <p>Kitchen Station</p>
                <h2 id="wake-kitchen-checklist-title">Kitchen checklist</h2>
                <span>{kitchenLeadName} · {formatLongDate(now)}</span>
              </div>
              <button
                type="button"
                aria-label="Close kitchen checklist"
                onClick={() => setChecklistOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="fh-family-hub__checklist-popup-list">
              {daytimeChecklistItems.length === 0 ? (
                <p className="fh-wake__empty">No checklist items.</p>
              ) : (
                daytimeChecklistItems.map((item) => {
                  const done = item.checkedDate === todayIso;
                  return (
                    <article
                      key={item.id}
                      className={
                        done
                          ? "fh-family-hub__checklist-popup-row fh-family-hub__checklist-popup-row--done"
                          : "fh-family-hub__checklist-popup-row"
                      }
                    >
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
              )}
            </div>
          </section>
        </div>
      ) : null}
    </WidgetPageShell>
  );
}

export default FamilyHubDashboard;
