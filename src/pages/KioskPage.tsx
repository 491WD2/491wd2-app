import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Home,
  PackageSearch,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Table2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { FamilyData, Task } from "../data/familyData";
import { cn, formatShortDate } from "../lib/utils";
import { getAppDisplayName, getDashboardWelcomeMessage } from "../lib/customization";
import type { RouteKey } from "../components/layout/AppShell";
import {
  buildQuickActionHref,
} from "../services/quickActions";
import { LandscapeHint } from "../components/layout/LandscapeHint";
import {
  isInventoryExpiringSoon,
  isInventoryLowStock,
} from "./inventory/inventoryUtils";
import "../styles/guided-kiosk.css";

type KioskGuidedFlow = "priorities" | "chores" | "shopping" | "calendar" | "inventory";

type KioskPageProps = {
  data: FamilyData;
  onNavigate: (route: RouteKey) => void;
  openAppHref: (href: string) => void;
};

export function KioskPage({ data, onNavigate, openAppHref }: KioskPageProps) {
  const admin = data.adminSettings;
  const [now, setNow] = useState(() => new Date());
  const [showFullKiosk, setShowFullKiosk] = useState(false);
  const [guidedFlow, setGuidedFlow] = useState<KioskGuidedFlow | null>(null);
  const today = now.toISOString().slice(0, 10);
  const showClock = admin.showClock !== false;
  const showQuickActions = admin.showQuickActions !== false;
  const defaultView = admin.kioskDefaultView ?? "dashboard";

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const map: Record<string, string> = {
      dashboard: "kiosk-hero",
      today: "kiosk-priorities",
      chores: "kiosk-chores",
      shopping: "kiosk-shopping",
      calendar: "kiosk-calendar",
    };
    const elId = map[defaultView];
    if (!elId) {
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(elId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [defaultView]);

  const welcome = getDashboardWelcomeMessage(admin);
  const household = getAppDisplayName(admin);

  const openWork = data.tasks.filter(
    (task) =>
      task.status !== "Done" &&
      task.status !== "Completed" &&
      task.status !== "Skipped",
  );
  const topPriorities = useMemo(() => {
    return [...openWork]
      .sort((a, b) => taskDueKey(a).localeCompare(taskDueKey(b)))
      .slice(0, 6);
  }, [openWork]);

  const choresDueToday = useMemo(() => {
    return openWork.filter(
      (task) => task.type === "chore" && taskDueKey(task) === today,
    );
  }, [openWork, today]);

  const upcomingPlanner = useMemo(() => {
    return [...data.planner]
      .filter((event) => event.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5);
  }, [data.planner, today]);

  const groceryNeedCount = data.shopping.filter((item) => !item.purchased).length;
  const purchasedCount = data.shopping.filter(
    (item) => item.purchased || item.needsPutAway,
  ).length;
  const lowStock = data.pantry.filter(isInventoryLowStock);
  const expiring = data.pantry.filter(isInventoryExpiringSoon);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  function renderKioskFlowSheet() {
    if (!guidedFlow) {
      return null;
    }

    const titleByFlow: Record<KioskGuidedFlow, string> = {
      priorities: "Top priorities",
      chores: "Chores due today",
      shopping: "Shopping pulse",
      calendar: "Upcoming plans",
      inventory: "Inventory alerts",
    };

    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setGuidedFlow(null)}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiosk-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Kiosk overview</p>
              <h2 id="kiosk-flow-title">{titleByFlow[guidedFlow]}</h2>
              <p>Review one kiosk area, then jump into the station that handles it.</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close kiosk flow"
              onClick={() => setGuidedFlow(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {guidedFlow === "priorities" ? (
            <div className="wd-guided-kiosk__confirm">
              <ul className="grid gap-3">
                {topPriorities.length === 0 ? (
                  <KioskEmpty soft text="Nothing queued. You are clear for now." />
                ) : null}
                {topPriorities.map((task) => (
                  <KioskRow
                    key={task.id}
                    subtitle={`${task.type === "chore" ? "Chore" : "Task"} · due ${formatShortDate(taskDueKey(task))}`}
                    title={task.title}
                  />
                ))}
              </ul>
              <button type="button" className="wd-guided-kiosk__primary" onClick={() => openAppHref("/tasks")}>
                Open Cleaning
              </button>
            </div>
          ) : null}

          {guidedFlow === "chores" ? (
            <div className="wd-guided-kiosk__confirm">
              <ul className="grid gap-3">
                {choresDueToday.length === 0 ? (
                  <KioskEmpty soft text="No chores due today." />
                ) : null}
                {choresDueToday.map((task) => (
                  <KioskRow key={task.id} subtitle="Chore" title={task.title} />
                ))}
              </ul>
              <button type="button" className="wd-guided-kiosk__primary" onClick={() => openAppHref("/tasks")}>
                Open Cleaning
              </button>
            </div>
          ) : null}

          {guidedFlow === "shopping" ? (
            <div className="wd-guided-kiosk__confirm">
              <div className="grid gap-3 sm:grid-cols-2">
                <KioskInfoCard
                  detail={groceryNeedCount === 0 ? "List is clear" : "Items still to buy"}
                  label="Grocery list"
                  value={groceryNeedCount}
                />
                <KioskInfoCard
                  detail={purchasedCount === 0 ? "None yet" : "Add to inventory when stocked"}
                  label="Purchased"
                  value={purchasedCount}
                />
              </div>
              <button type="button" className="wd-guided-kiosk__primary" onClick={() => openAppHref("/shopping")}>
                Open Shopping
              </button>
            </div>
          ) : null}

          {guidedFlow === "calendar" ? (
            <div className="wd-guided-kiosk__confirm">
              <ul className="grid gap-3">
                {upcomingPlanner.length === 0 ? (
                  <KioskEmpty soft text="No upcoming planner items." />
                ) : null}
                {upcomingPlanner.map((event) => (
                  <KioskRow
                    key={event.id}
                    subtitle={`${formatShortDate(event.date)} · ${event.time}`}
                    title={event.title}
                  />
                ))}
              </ul>
              <button type="button" className="wd-guided-kiosk__primary" onClick={() => onNavigate("calendar")}>
                Open Calendar
              </button>
            </div>
          ) : null}

          {guidedFlow === "inventory" ? (
            <div className="wd-guided-kiosk__confirm">
              <div className="grid gap-3 sm:grid-cols-2">
                <KioskInfoCard detail="Staples below minimum" label="Low stock" value={lowStock.length} />
                <KioskInfoCard detail="Next 14 days" label="Expiring soon" value={expiring.length} />
              </div>
              <button type="button" className="wd-guided-kiosk__primary" onClick={() => openAppHref("/pantry")}>
                Open Pantry
              </button>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  if (!showFullKiosk) {
    return (
      <div className="wd-guided-kiosk wd-guided-kiosk--overview">
        <LandscapeHint />
        <section className="wd-guided-kiosk__hero" aria-labelledby="kiosk-station-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">{household}</p>
            <h1 id="kiosk-station-title">{showClock ? timeFormatter.format(now) : "Kiosk station"}</h1>
            <p>{dateFormatter.format(now)} · {welcome}</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{choresDueToday.length} chores today</span>
            <span>{groceryNeedCount} groceries</span>
            <span>{lowStock.length + expiring.length} stock alerts</span>
          </div>
        </section>

        <section className="wd-guided-kiosk__actions-grid" aria-label="Kiosk overview actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={() => setGuidedFlow("priorities")}>
            <span className="wd-guided-kiosk__action-icon"><Plus className="h-5 w-5" aria-hidden /></span>
            <span><strong>Top priorities</strong><small>Open today’s most important items</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("chores")}>
            <span className="wd-guided-kiosk__action-icon"><ClipboardList className="h-5 w-5" aria-hidden /></span>
            <span><strong>Chores today</strong><small>Review due chores</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("shopping")}>
            <span className="wd-guided-kiosk__action-icon"><ShoppingCart className="h-5 w-5" aria-hidden /></span>
            <span><strong>Shopping</strong><small>See grocery list status</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("calendar")}>
            <span className="wd-guided-kiosk__action-icon"><CalendarDays className="h-5 w-5" aria-hidden /></span>
            <span><strong>Calendar</strong><small>See upcoming plans</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("inventory")}>
            <span className="wd-guided-kiosk__action-icon"><PackageSearch className="h-5 w-5" aria-hidden /></span>
            <span><strong>Inventory alerts</strong><small>Low-stock and expiring food</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => openAppHref("/quick-add")}>
            <span className="wd-guided-kiosk__action-icon"><ShoppingBag className="h-5 w-5" aria-hidden /></span>
            <span><strong>Quick add</strong><small>Add a household item</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => onNavigate("dashboard")}>
            <span className="wd-guided-kiosk__action-icon"><Home className="h-5 w-5" aria-hidden /></span>
            <span><strong>Family Hub</strong><small>Open the main station</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullKiosk(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Kiosk overview</strong><small>Show the detailed kiosk board</small></span>
          </button>
        </section>

        {renderKioskFlowSheet()}
      </div>
    );
  }

  return (
    <div className="kiosk-prose pb-10 pt-2">
      <div className="workstation-shell space-y-8">
        <LandscapeHint />
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={() => setShowFullKiosk(false)}
        >
          Kiosk station
        </button>
      <section
        id="kiosk-hero"
        className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-950/[0.04] sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {household}
            </p>
            {showClock ? (
              <p
                className="text-5xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-6xl"
                aria-live="polite"
              >
                {timeFormatter.format(now)}
              </p>
            ) : null}
            <p className="text-lg font-medium text-slate-600 sm:text-xl">
              {dateFormatter.format(now)}
            </p>
            <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
              {welcome}
            </p>
          </div>
          <KioskStatCluster
            choreDueCount={choresDueToday.length}
            groceryNeedCount={groceryNeedCount}
            purchasedCount={purchasedCount}
            alertCount={lowStock.length + expiring.length}
          />
        </div>
      </section>

      {showQuickActions ? (
        <section aria-label="Quick actions" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KioskActionButton
              icon={<Plus className="h-6 w-6" />}
              label="Add Task"
              onClick={() => openAppHref(buildQuickActionHref({ type: "task", title: "" }))}
            />
            <KioskActionButton
              icon={<ShoppingBag className="h-6 w-6" />}
              label="Add Grocery"
              onClick={() => openAppHref(buildQuickActionHref({ type: "grocery", name: "" }))}
            />
            <KioskActionButton
              icon={<CalendarPlus className="h-6 w-6" />}
              label="Add Event"
              onClick={() => openAppHref(buildQuickActionHref({ type: "event", title: "" }))}
            />
            <KioskActionButton
              icon={<ClipboardList className="h-6 w-6" />}
              label="Open Chores"
              onClick={() => openAppHref("/tasks")}
            />
            <KioskActionButton
              icon={<ShoppingCart className="h-6 w-6" />}
              label="Open Shopping"
              onClick={() => openAppHref("/shopping")}
            />
            <KioskActionButton
              icon={<PackageSearch className="h-6 w-6" />}
              label="Open Inventory"
              onClick={() => openAppHref("/pantry")}
            />
            <KioskActionButton
              icon={<CalendarDays className="h-6 w-6" />}
              label="Open Calendar"
              onClick={() => onNavigate("calendar")}
            />
            <KioskActionButton
              icon={<Home className="h-6 w-6" />}
              label="Open Home"
              onClick={() => onNavigate("dashboard")}
            />
          </div>
        </section>
      ) : null}

      <section id="kiosk-priorities" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Today&apos;s top priorities
        </h2>
        <ul className="grid gap-3">
          {topPriorities.length === 0 ? (
            <KioskEmpty soft text="Nothing queued — you are clear for now." />
          ) : null}
          {topPriorities.map((task) => (
            <KioskRow
              key={task.id}
              subtitle={`${task.type === "chore" ? "Chore" : "Task"} · due ${formatShortDate(taskDueKey(task))}`}
              title={task.title}
            />
          ))}
        </ul>
      </section>

      <section id="kiosk-chores" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Chores due today
        </h2>
        <ul className="grid gap-3">
          {choresDueToday.length === 0 ? (
            <KioskEmpty soft text="No chores due today." />
          ) : null}
          {choresDueToday.map((task) => (
            <KioskRow
              key={task.id}
              subtitle="Chore"
              title={task.title}
            />
          ))}
        </ul>
      </section>

      <section id="kiosk-calendar" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Upcoming plans
        </h2>
        <ul className="grid gap-3">
          {upcomingPlanner.length === 0 ? (
            <KioskEmpty soft text="No upcoming planner items." />
          ) : null}
          {upcomingPlanner.map((event) => (
            <KioskRow
              key={event.id}
              subtitle={`${formatShortDate(event.date)} · ${event.time}`}
              title={event.title}
            />
          ))}
        </ul>
      </section>

      <section id="kiosk-shopping" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Shopping
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <KioskInfoCard
            detail={groceryNeedCount === 0 ? "List is clear" : "Items still to buy"}
            label="Grocery list"
            value={groceryNeedCount}
          />
          <KioskInfoCard
            detail={purchasedCount === 0 ? "None yet" : "Add to inventory when stocked"}
            label="Purchased"
            value={purchasedCount}
          />
        </div>
      </section>

      <section id="kiosk-inventory" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Inventory alerts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <KioskInfoCard
            detail="Staples below minimum"
            label="Low stock"
            value={lowStock.length}
          />
          <KioskInfoCard
            detail="Next 14 days"
            label="Expiring soon"
            value={expiring.length}
          />
        </div>
        {lowStock.length > 0 ? (
          <ul className="grid gap-2">
            {lowStock.slice(0, 4).map((item) => (
              <KioskRow
                key={item.id}
                subtitle={item.storageArea}
                title={item.name}
              />
            ))}
          </ul>
        ) : null}
      </section>

      </div>
    </div>
  );
}

function taskDueKey(task: Task) {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}

function KioskStatCluster({
  groceryNeedCount,
  purchasedCount,
  choreDueCount,
  alertCount,
}: {
  groceryNeedCount: number;
  purchasedCount: number;
  choreDueCount: number;
  alertCount: number;
}) {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
      <KioskMiniMetric label="Groceries" value={groceryNeedCount} />
      <KioskMiniMetric label="Purchased" value={purchasedCount} />
      <KioskMiniMetric label="Chores today" value={choreDueCount} />
      <KioskMiniMetric label="Stock alerts" value={alertCount} />
    </div>
  );
}

function KioskMiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-center shadow-inner">
      <p className="text-3xl font-semibold tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function KioskActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold text-slate-900 shadow-sm transition",
        "active:scale-[0.99] active:bg-slate-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
        {icon}
      </span>
      <span className="leading-snug">{label}</span>
    </button>
  );
}

function KioskRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-lg font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </li>
  );
}

function KioskInfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function KioskEmpty({ text, soft }: { text: string; soft?: boolean }) {
  return (
    <li
      className={cn(
        "rounded-xl border px-4 py-4 text-base",
        soft
          ? "border-slate-200 bg-slate-50/80 text-slate-600"
          : "border-slate-200 bg-white text-slate-700",
      )}
    >
      {text}
    </li>
  );
}
