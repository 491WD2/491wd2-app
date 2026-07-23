import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Bell,
  CalendarDays,
  CloudSun,
  FolderKanban,
  MessageCircle,
  Package,
  Plus,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { UpcomingEventsList } from "../components/events/UpcomingEventsList";
import type { FamilyData } from "../data/familyData";
import { createActivity } from "../lib/activity";
import { getChoreDueDate } from "../lib/choreTrackerUtils";
import { getAppDisplayName } from "../lib/customization";
import { selectImportantMessagesForHome } from "../lib/familyDataSelectors";
import {
  buildFamilyHubDashboardModel,
  orderWakePageMembers,
} from "../lib/familyHubDashboardData";
import { dedupeNotificationsForDisplay } from "../lib/householdNotify";
import {
  getTodayKitchenWeekdayLocal,
  labelKitchenWeekday,
} from "../lib/kitchenDuty";
import { getMemberColor } from "../lib/memberColors";
import { readSubscriptionAccount } from "../lib/subscriptionAccountStorage";
import { selectUpcomingEventsForHousehold } from "../lib/upcomingEvents";
import {
  findMemberById,
  getMemberFullName,
  getMemberInitials,
} from "../lib/utils";
import {
  isInventoryExpiringSoon,
  isInventoryLowStock,
} from "./inventory/inventoryUtils";
import { createShoppingItemFromName } from "./shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../services/rulesEngine";
import { summarizePantryByZone } from "../lib/pantryStorageZones";
import type { DemoPantryZone } from "../data/demoPantryInventory";
import "../styles/adminux-command.css";

export type AdminUxHouseholdDashboardProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  navigateWithinApp: (href: string) => void;
  onOpenPantry: () => void;
  onOpenShopping: () => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
  onOpenMemberDashboard?: (memberId: string) => void;
};

type StatTone =
  | "orange"
  | "warning"
  | "success"
  | "purple"
  | "info"
  | "danger"
  | "blue"
  | "brown"
  | "theme"
  | "teal";

function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function memberProfileMeta(member: {
  role?: string;
  roleLabel?: string;
  ageGroup?: string;
  nickname?: string;
  status?: string;
}): { subtitle: string; badge: string } {
  const badge =
    member.roleLabel?.trim() ||
    member.role?.trim() ||
    member.ageGroup?.trim() ||
    (member.status === "away" ? "Away" : "Family");
  const subtitle =
    member.nickname?.trim() ||
    member.ageGroup?.trim() ||
    "Household member";
  return { subtitle, badge };
}

function badgeToneForIndex(index: number): string {
  const tones = ["blue", "orange", "rose", "pink", "teal", "purple"];
  return tones[index % tones.length] ?? "blue";
}

function isOpenTask(status: string | undefined): boolean {
  return status !== "Done" && status !== "Completed" && status !== "Skipped";
}

/**
 * Premium household command dashboard for /adminux.
 * White workspace cards + colored icon tiles — no business-template copy.
 */
export function AdminUxHouseholdDashboard({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenShopping,
  onOpenTasks,
  onOpenCalendar,
  onOpenSettings,
  onOpenMemberDashboard,
}: AdminUxHouseholdDashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [shoppingDraft, setShoppingDraft] = useState("");

  const todayIso = localTodayIso(now);
  const householdName = getAppDisplayName(data.adminSettings);
  const model = useMemo(
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

  const activePantry = useMemo(
    () => (data.pantry ?? []).filter((p) => p && !p.inactiveInInventory),
    [data.pantry],
  );

  const lowStockCount = useMemo(
    () =>
      activePantry.filter(
        (p) => p.status === "Low" || p.status === "Out" || isInventoryLowStock(p),
      ).length,
    [activePantry],
  );

  const outOfStockCount = useMemo(
    () => activePantry.filter((p) => p.status === "Out").length,
    [activePantry],
  );

  const lowOnlyCount = useMemo(
    () =>
      activePantry.filter(
        (p) => p.status === "Low" || (isInventoryLowStock(p) && p.status !== "Out"),
      ).length,
    [activePantry],
  );

  const purchasedItemsToAdd = useMemo(
    () =>
      (data.shopping ?? []).filter(
        (item) => item && (item.purchased === true || item.needsPutAway === true),
      ),
    [data.shopping],
  );

  const pantryZoneSummaries = useMemo(
    () => summarizePantryByZone(data.pantry ?? []),
    [data.pantry],
  );

  const expiringSoonCount = useMemo(
    () => activePantry.filter((p) => isInventoryExpiringSoon(p)).length,
    [activePantry],
  );

  const openTasks = useMemo(
    () => (data.tasks ?? []).filter((t) => t && isOpenTask(t.status)),
    [data.tasks],
  );

  const choresDueToday = useMemo(
    () => openTasks.filter((t) => getChoreDueDate(t) === todayIso),
    [openTasks, todayIso],
  );

  const choresOverdue = useMemo(
    () => openTasks.filter((t) => {
      const due = getChoreDueDate(t);
      return Boolean(due) && due < todayIso;
    }),
    [openTasks, todayIso],
  );

  const importantMessages = useMemo(
    () => selectImportantMessagesForHome(data, 4),
    [data],
  );

  const attentionNotifications = useMemo(() => {
    const raw = (data.notifications ?? []).filter(
      (n) => n && !n.dismissedAt && !n.readAt,
    );
    return dedupeNotificationsForDisplay(raw).slice(0, 5);
  }, [data.notifications]);

  const notificationCount = useMemo(() => {
    return (data.notifications ?? []).filter((n) => n && !n.dismissedAt).length;
  }, [data.notifications]);

  const upcomingEvents = useMemo(
    () => selectUpcomingEventsForHousehold(data, todayIso, 8),
    [data, todayIso],
  );

  const activeProjects = useMemo(
    () =>
      (data.projects ?? []).filter(
        (p) => p && (p.status === "active" || p.status === "planned" || p.status === "waiting"),
      ),
    [data.projects],
  );

  const subscriptionDue = useMemo(() => {
    const account = readSubscriptionAccount();
    const renewal = account.renewalDate?.trim() || "";
    const name = account.subscriptionServiceName?.trim() || "";
    if (!renewal && !name) {
      return null;
    }
    const horizon = new Date(`${todayIso}T12:00:00`);
    horizon.setDate(horizon.getDate() + 45);
    const horizonIso = localTodayIso(horizon);
    const withinWindow = Boolean(renewal) && renewal >= todayIso && renewal <= horizonIso;
    return {
      label: name || "Subscription",
      renewal,
      dueSoon: withinWindow,
    };
  }, [todayIso]);

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

  const pantryAlertCount =
    (model.overview?.lowStock ?? lowStockCount) +
    (model.overview?.expiringFood ?? expiringSoonCount);

  const kitchenOpenCount = choresDueToday.length + choresOverdue.length;

  const summaryCards: Array<{
    key: string;
    tone: StatTone;
    icon: ReactNode;
    value: string | number;
    label: string;
    helper: string;
    onClick: () => void;
  }> = [
    {
      key: "shopping",
      tone: "orange",
      icon: <ShoppingCart className="h-5 w-5" aria-hidden />,
      value: needToBuy.length,
      label: "Need to Buy",
      helper: needToBuy.length === 0 ? "List is clear" : "Open shopping list",
      onClick: () => go("/shopping", onOpenShopping),
    },
    {
      key: "pantry",
      tone: "warning",
      icon: <Package className="h-5 w-5" aria-hidden />,
      value: pantryAlertCount,
      label: "Pantry Alerts",
      helper:
        pantryAlertCount === 0
          ? "Pantry looks fine"
          : `${model.overview?.lowStock ?? lowStockCount} low · ${model.overview?.expiringFood ?? expiringSoonCount} expiring`,
      onClick: () => go("/pantry", onOpenPantry),
    },
    {
      key: "kitchen",
      tone: "success",
      icon: <UtensilsCrossed className="h-5 w-5" aria-hidden />,
      value: kitchenOpenCount,
      label: "Kitchen / Chores",
      helper:
        kitchenOpenCount === 0
          ? `${kitchenLeadName} on duty`
          : `${choresDueToday.length} today · ${choresOverdue.length} overdue`,
      onClick: () => go("/tasks", onOpenTasks),
    },
    {
      key: "messages",
      tone: "purple",
      icon: <MessageCircle className="h-5 w-5" aria-hidden />,
      value: importantMessages.length,
      label: "Messages",
      helper:
        importantMessages.length === 0
          ? "No pinned items"
          : "Pinned & important",
      onClick: () => go("/messages"),
    },
    {
      key: "events",
      tone: "info",
      icon: <CalendarDays className="h-5 w-5" aria-hidden />,
      value: upcomingEvents.length,
      label: "Upcoming Events",
      helper: upcomingEvents.length === 0 ? "Calendar is clear" : "Today first, then next",
      onClick: () => go("/calendar", onOpenCalendar),
    },
    {
      key: "notifications",
      tone: attentionNotifications.length > 0 ? "danger" : "blue",
      icon: <Bell className="h-5 w-5" aria-hidden />,
      value: notificationCount,
      label: "Notifications",
      helper:
        attentionNotifications.length === 0
          ? "All caught up"
          : `${attentionNotifications.length} need attention`,
      onClick: () => go("/notifications"),
    },
    {
      key: "subscriptions",
      tone: "brown",
      icon: <Wallet className="h-5 w-5" aria-hidden />,
      value: subscriptionDue?.renewal
        ? subscriptionDue.renewal.slice(5)
        : subscriptionDue
          ? "Set"
          : "—",
      label: "Subscriptions",
      helper: subscriptionDue?.label || "Household subscriptions",
      onClick: () => go("/subscriptions"),
    },
    {
      key: "projects",
      tone: "theme",
      icon: <FolderKanban className="h-5 w-5" aria-hidden />,
      value: activeProjects.length,
      label: "Projects",
      helper:
        activeProjects.length > 0
          ? activeProjects[0]?.title || "Active projects"
          : "No active projects",
      onClick: () => go("/projects"),
    },
  ];

  return (
    <div className="aux-command aux-command--pro aux-command--premium" aria-label={`${householdName} command center`}>
      {/* 1. Compact elegant hero */}
      <header className="aux-command__hero">
        <div className="aux-command__hero-copy">
          <p className="aux-command__eyebrow">FamilyHub</p>
          <h1>Welcome, {householdName}</h1>
          <p>Household dashboard</p>
          <div className="aux-command__hero-meta">
            <span className="aux-command__pill">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatLongDate(now)}
            </span>
            <span className="aux-command__pill">
              {formatClockTime(now)}
            </span>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={onOpenSettings}
            >
              Settings
            </button>
          </div>
        </div>
        <div className="aux-command__hero-kpis" aria-label="Quick household stats">
          <div className="aux-command__kpi">
            <span className="aux-command__kpi-ico aux-command__kpi-ico--blue">
              <ShoppingCart className="h-4 w-4" aria-hidden />
            </span>
            <strong>{needToBuy.length}</strong>
            <span>Need to buy</span>
          </div>
          <div className="aux-command__kpi">
            <span className="aux-command__kpi-ico aux-command__kpi-ico--green">
              <UtensilsCrossed className="h-4 w-4" aria-hidden />
            </span>
            <strong>{kitchenOpenCount}</strong>
            <span>Chores open</span>
          </div>
          <div className="aux-command__kpi">
            <span className="aux-command__kpi-ico aux-command__kpi-ico--pink">
              <Bell className="h-4 w-4" aria-hidden />
            </span>
            <strong>{notificationCount}</strong>
            <span>Alerts</span>
          </div>
        </div>
        <div className="aux-command__weather" aria-label="Weather placeholder">
          <span className="aux-command__ico aux-command__ico--sky">
            <CloudSun className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <strong>Weather</strong>
            <span>Local forecast placeholder</span>
          </div>
        </div>
      </header>

      {/* 2. Family profile cards */}
      <section className="aux-command__section" aria-labelledby="aux-family-title">
        <div className="aux-command__section-head">
          <div className="aux-command__section-title">
            <span className="aux-command__section-ico" aria-hidden>
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 id="aux-family-title">Family</h2>
              <p>Open someone’s home — no PIN required</p>
            </div>
          </div>
        </div>
        <div className="aux-command__members">
          {wakeMembers.length === 0 ? (
            <p className="aux-command__empty aux-command__empty--inline">
              No active family members yet.
            </p>
          ) : null}
          {wakeMembers.map((member, index) => {
              const color = getMemberColor(member);
              const fullName = getMemberFullName(member);
              const meta = memberProfileMeta(member);
              const tone = badgeToneForIndex(index);
              return (
                <button
                  key={member.id}
                  type="button"
                  className="aux-command__member"
                  onClick={() => openMemberHome(member.id)}
                >
                  <span
                    className="aux-command__member-photo"
                    style={{
                      background: `linear-gradient(145deg, ${color}33 0%, ${color}18 45%, #ffffff 100%)`,
                      color,
                    }}
                    aria-hidden
                  >
                    <span className="aux-command__member-initials">
                      {getMemberInitials(member)}
                    </span>
                  </span>
                  <strong className="aux-command__member-name">{firstName(fullName)}</strong>
                  <span className="aux-command__member-sub">{meta.subtitle}</span>
                  <span className={`aux-command__member-badge aux-command__member-badge--${tone}`}>
                    {meta.badge}
                  </span>
                </button>
              );
            })}
          <button
            type="button"
            className="aux-command__member aux-command__member--add"
            onClick={() => go("/settings?members=1#members_pins", onOpenSettings)}
            aria-label="Add family member"
          >
            <span className="aux-command__member-photo aux-command__member-photo--add" aria-hidden>
              <span className="aux-command__member-add-ico">
                <Plus className="h-7 w-7" />
              </span>
            </span>
            <strong className="aux-command__member-name">Add</strong>
            <span className="aux-command__member-sub">Add family member</span>
            <span className="aux-command__member-badge aux-command__member-badge--teal">
              New person
            </span>
          </button>
        </div>
      </section>

      {/* 3. Colorful summary cards */}
      <section className="aux-command__section" aria-labelledby="aux-summary-title">
        <div className="aux-command__section-head">
          <div className="aux-command__section-title">
            <span className="aux-command__section-ico aux-command__section-ico--mint" aria-hidden>
              <Package className="h-4 w-4" />
            </span>
            <div>
              <h2 id="aux-summary-title">Household snapshot</h2>
              <p>Shortcuts with live counts — tap any card to open</p>
            </div>
          </div>
        </div>
        <div className="aux-command__stats">
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`aux-command__stat aux-command__stat--${card.tone} aux-command__stat--refined`}
              onClick={card.onClick}
            >
              <span className="aux-command__stat-top">
                <span className="aux-command__stat-icon">{card.icon}</span>
                <span className="aux-command__stat-dots" aria-hidden />
              </span>
              <strong>{card.value}</strong>
              <em>{card.label}</em>
              <span>{card.helper}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Today / Upcoming Events */}
      <section className="aux-command__section" aria-labelledby="aux-events-title">
        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3 id="aux-events-title">Today &amp; upcoming</h3>
              <p>Household agenda — today first</p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/calendar", onOpenCalendar)}
            >
              Calendar
            </button>
          </div>
          <div className="aux-command__card-body">
            <UpcomingEventsList
              events={upcomingEvents}
              emptyText="No upcoming events on the planner."
              onOpenEvent={() => go("/calendar", onOpenCalendar)}
            />
          </div>
        </div>
      </section>

      {/* 5. Shopping preview + Pantry alerts */}
      <section className="aux-command__section aux-command__split" aria-label="Shopping and pantry alerts">
        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3>Shopping</h3>
              <p>
                {needToBuy.length} Need to Buy · {purchasedItemsToAdd.length} Purchased Items to Add
              </p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/shopping", onOpenShopping)}
            >
              Shopping
            </button>
          </div>
          <div className="aux-command__card-body">
            <p className="aux-command__list-label">Need to Buy</p>
            <ul className="aux-command__list">
              {needToBuy.length === 0 ? (
                <li>
                  <p className="aux-command__empty">Shopping list is clear.</p>
                </li>
              ) : (
                needToBuy.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="aux-command__row"
                      onClick={() => go("/shopping", onOpenShopping)}
                    >
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {[item.quantity, item.unit].filter(Boolean).join(" ") || "1"}
                          {item.storeSection ? ` · ${item.storeSection}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <form className="aux-command__inline-add" onSubmit={onShoppingAdd}>
              <input
                value={shoppingDraft}
                onChange={(e) => setShoppingDraft(e.target.value)}
                placeholder="Quick add shopping item"
                autoComplete="off"
                aria-label="Quick add shopping item"
              />
              <button type="submit">Add</button>
            </form>
          </div>
        </div>

        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3>Pantry alerts</h3>
              <p>Low stock, out of stock, and purchased items to add</p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/pantry", onOpenPantry)}
            >
              Pantry
            </button>
          </div>
          <div className="aux-command__card-body">
            <div className="aux-command__pantry-stats">
              <button
                type="button"
                className="aux-command__pantry-stat aux-command__pantry-stat--btn aux-command__pantry-stat--amber"
                onClick={() => go("/pantry?tab=shopping-needs", onOpenPantry)}
              >
                <strong>{model.overview?.lowStock ?? lowOnlyCount}</strong>
                <span>Low stock</span>
              </button>
              <button
                type="button"
                className="aux-command__pantry-stat aux-command__pantry-stat--btn aux-command__pantry-stat--rose"
                onClick={() => go("/pantry?tab=shopping-needs", onOpenPantry)}
              >
                <strong>{outOfStockCount}</strong>
                <span>Out of stock</span>
              </button>
              <button
                type="button"
                className="aux-command__pantry-stat aux-command__pantry-stat--btn aux-command__pantry-stat--orange"
                onClick={() => go("/shopping", onOpenShopping)}
              >
                <strong>{purchasedItemsToAdd.length}</strong>
                <span>Purchased Items to Add</span>
              </button>
            </div>
            {(model.overview?.expiringFood ?? expiringSoonCount) > 0 ? (
              <p className="aux-command__soft-note">
                {model.overview?.expiringFood ?? expiringSoonCount} item
                {(model.overview?.expiringFood ?? expiringSoonCount) === 1 ? "" : "s"}{" "}
                need attention for use-soon dates
              </p>
            ) : null}
            <button
              type="button"
              className="aux-command__primary-btn"
              onClick={() => go("/pantry", onOpenPantry)}
            >
              <Package className="h-4 w-4" aria-hidden />
              Open Pantry &amp; Inventory
            </button>
          </div>
        </div>
      </section>

      {/* 5b. Pantry storage overview */}
      <section className="aux-command__section" aria-labelledby="aux-storage-title">
        <div className="aux-command__section-head">
          <div className="aux-command__section-title">
            <span className="aux-command__section-ico aux-command__section-ico--mint" aria-hidden>
              <Package className="h-4 w-4" />
            </span>
            <div>
              <h2 id="aux-storage-title">Pantry storage</h2>
              <p>Fridge, freezer, and kitchen pantry — tap to open inventory</p>
            </div>
          </div>
          <button
            type="button"
            className="aux-command__link-btn"
            onClick={() => go("/pantry", onOpenPantry)}
          >
            All pantry
          </button>
        </div>
        <div className="aux-command__zones">
          {pantryZoneSummaries.map((zone) => (
            <button
              key={zone.zone}
              type="button"
              className={`aux-command__zone aux-command__zone--${zone.accent}`}
              onClick={() =>
                go(
                  `/pantry?tab=inventory&zone=${encodeURIComponent(zone.zone as DemoPantryZone)}`,
                  onOpenPantry,
                )
              }
            >
              <span className="aux-command__zone-ico" aria-hidden>
                {zone.icon}
              </span>
              <strong>{zone.zone}</strong>
              <em>
                {zone.count} item{zone.count === 1 ? "" : "s"}
              </em>
              {zone.low + zone.out > 0 ? (
                <small>
                  {zone.low > 0 ? `${zone.low} low` : null}
                  {zone.low > 0 && zone.out > 0 ? " · " : null}
                  {zone.out > 0 ? `${zone.out} out` : null}
                </small>
              ) : (
                <small className="aux-command__zone-ok">Looking good</small>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 6. Kitchen / Chores */}
      <section className="aux-command__section" aria-labelledby="aux-kitchen-title">
        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3 id="aux-kitchen-title">Kitchen / Chores</h3>
              <p>
                {todayKitchenDay ? labelKitchenWeekday(todayKitchenDay) : "Today"} ·{" "}
                {kitchenLeadName} on kitchen duty
              </p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/tasks", onOpenTasks)}
            >
              Cleaning / Kitchen
            </button>
          </div>
          <div className="aux-command__card-body">
            <div className="aux-command__duty">
              <span className="aux-command__ico aux-command__ico--amber">
                <UtensilsCrossed className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <strong>{kitchenLeadName}</strong>
                <span>Today’s kitchen duty</span>
              </div>
            </div>
            <ul className="aux-command__list">
              {choresDueToday.length === 0 && choresOverdue.length === 0 ? (
                <li>
                  <p className="aux-command__empty">No chores due today — nice work.</p>
                </li>
              ) : (
                <>
                  {choresOverdue.slice(0, 3).map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="aux-command__row aux-command__row--urgent"
                        onClick={() => go("/tasks", onOpenTasks)}
                      >
                        <span>
                          <strong>{task.title}</strong>
                          <small>Overdue · {task.zone || task.status}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                  {choresDueToday.slice(0, 4).map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="aux-command__row"
                        onClick={() => go("/tasks", onOpenTasks)}
                      >
                        <span>
                          <strong>{task.title}</strong>
                          <small>Due today · {task.zone || task.status}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 7. Messages / Notifications */}
      <section className="aux-command__section aux-command__split" aria-label="Messages and notifications">
        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3>Messages</h3>
              <p>Pinned and important</p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/messages")}
            >
              Messages
            </button>
          </div>
          <div className="aux-command__card-body">
            <ul className="aux-command__list">
              {importantMessages.length === 0 ? (
                <li>
                  <p className="aux-command__empty">No pinned or important messages.</p>
                </li>
              ) : (
                importantMessages.map((msg) => (
                  <li key={msg.id}>
                    <button
                      type="button"
                      className="aux-command__row"
                      onClick={() => go("/messages")}
                    >
                      <span>
                        <strong>{msg.title?.trim() || msg.message}</strong>
                        <small>
                          {msg.pinned ? "Pinned" : msg.priority}
                          {msg.category ? ` · ${msg.category}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="aux-command__card">
          <div className="aux-command__card-head">
            <div>
              <h3>Notifications</h3>
              <p>Urgent and unread</p>
            </div>
            <button
              type="button"
              className="aux-command__link-btn"
              onClick={() => go("/notifications")}
            >
              Notifications
            </button>
          </div>
          <div className="aux-command__card-body">
            <ul className="aux-command__list">
              {attentionNotifications.length === 0 ? (
                <li>
                  <p className="aux-command__empty">Nothing needs attention.</p>
                </li>
              ) : (
                attentionNotifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className="aux-command__row"
                      onClick={() => go("/notifications")}
                    >
                      <span>
                        <strong>{n.title || "Update"}</strong>
                        <small>{n.body || ""}</small>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Subtle future finance placeholder — no full budget logic */}
      <p className="aux-command__finance-note" role="note">
        Budget tools coming later · Pantry spending placeholder
      </p>
    </div>
  );
}

export default AdminUxHouseholdDashboard;
