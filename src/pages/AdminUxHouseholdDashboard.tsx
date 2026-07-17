import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Refrigerator,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminUxFullCalendar } from "../components/calendar/AdminUxFullCalendar";
import { DragulaShoppingBoard } from "../components/dashboard/DragulaShoppingBoard";
import { HouseholdOverviewChart } from "../components/dashboard/HouseholdOverviewChart";
import { HouseholdScheduleGrid } from "../components/dashboard/HouseholdScheduleGrid";
import { FeatherIconTile } from "../components/icons/FeatherIcon";
import {
  DateRangePickerField,
  defaultLast7Days,
  type DateRangeValue,
} from "../components/ui/DateRangePickerField";
import { AdminUxDropzone } from "../components/ui/AdminUxDropzone";
import { HouseholdSmartWizard } from "../components/ui/HouseholdSmartWizard";
import { InlineSingleCalendar } from "../components/ui/InlineSingleCalendar";
import {
  ProgressBarCircle,
  ProgressBarLine,
} from "../components/ui/ProgressBarCircle";
import type { FamilyData } from "../data/familyData";
import { useInventory } from "../hooks/useInventory";
import { getAppDisplayName } from "../lib/customization";
import { getMemberFullName } from "../lib/utils";
import {
  formatInventoryExpiryLabel,
  getInventoryExpiryStatus,
} from "../types/inventory";
export type AdminUxHouseholdDashboardProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  navigateWithinApp: (href: string) => void;
  onOpenPantry: () => void;
  onOpenShopping: () => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
};

/**
 * AdminUX-inspired Command Center for FamilySite_491.
 * Uses real household inventory, shopping, chores, and member data.
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
  onOpenDashboard,
}: AdminUxHouseholdDashboardProps) {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => defaultLast7Days());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const householdName = getAppDisplayName(data.adminSettings);
  const { items } = useInventory({
    search: "",
    sortKey: "expiryDate",
    sortDirection: "asc",
    filterPreset: "all",
    categoryFilter: null,
  });

  const members = useMemo(
    () => data.familyMembers.filter((m) => m.status !== "archived"),
    [data.familyMembers],
  );

  const shoppingOpen = useMemo(
    () => data.shopping.filter((s) => !s.purchased),
    [data.shopping],
  );

  const openTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) => t.status !== "Done" && t.status !== "Completed" && t.status !== "Skipped",
      ),
    [data.tasks],
  );

  const choresOnSelectedDay = useMemo(() => {
    const key = selectedDay.toISOString().slice(0, 10);
    return openTasks.filter((t) => {
      const due = (t.dueDate || t.nextDueDate || "").slice(0, 10);
      return due === key;
    });
  }, [openTasks, selectedDay]);

  const notifications = useMemo(() => {
    const start = dateRange.start.getTime();
    const end = dateRange.end.getTime();
    return data.notifications
      .filter((n) => {
        if (n.dismissedAt) return false;
        const ts = n.createdAt ? new Date(n.createdAt).getTime() : NaN;
        if (Number.isNaN(ts)) return true;
        return ts >= start && ts <= end;
      })
      .slice(0, 6);
  }, [data.notifications, dateRange.end, dateRange.start]);

  const stats = useMemo(() => {
    let expired = 0;
    let soon = 0;
    let ok = 0;
    const byLocation = { pantry: 0, fridge: 0, freezer: 0 };
    const byCategory = new Map<string, number>();

    for (const item of items) {
      const status = getInventoryExpiryStatus(item.expiryDate);
      if (status === "expired") expired += 1;
      else if (status === "soon") soon += 1;
      else ok += 1;
      byLocation[item.location] += 1;
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    }

    const topCategories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total: items.length,
      expired,
      soon,
      ok,
      byLocation,
      topCategories,
      healthPct: items.length ? Math.round((ok / items.length) * 100) : 100,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 10);
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [items, search]);

  const greetingName =
    members[0] != null ? getMemberFullName(members[0]).split(" ")[0] : "family";

  return (
    <div>
      <nav aria-label="breadcrumb" style={{ ["--bs-breadcrumb-divider" as string]: "'/'" }}>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/adminux" onClick={(e) => { e.preventDefault(); navigateWithinApp("/adminux"); }}>
              Home
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Command Center
          </li>
        </ol>
      </nav>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="aux-muted mb-1">Household command center</p>
          <h1 className="text-3xl sm:text-4xl">
            <span className="aux-gradient-text">{householdName}</span>
          </h1>
          <p className="aux-muted mt-1">
            Bright AdminUX-style layout on your 491WD household data.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <DateRangePickerField
            value={dateRange}
            onChange={setDateRange}
            label="Activity range"
          />
          <button type="button" className="btn btn-light-color btn-secondary" onClick={onOpenDashboard}>
            Classic dashboard
          </button>
          <button type="button" className="btn btn-theme" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
      </div>

      <ul className="nav nav-pills mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link active" aria-current="page">
            <FeatherIconTile name="layout" tone="lavender" size={14} /> Overview
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link" onClick={onOpenPantry}>
            <FeatherIconTile name="package" tone="mint" size={14} /> Inventory
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link" onClick={onOpenShopping}>
            <FeatherIconTile name="shopping-cart" tone="peach" size={14} /> Shopping
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link" onClick={onOpenTasks}>
            <FeatherIconTile name="zap" tone="yellow" size={14} /> Cleaning
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link" onClick={onOpenCalendar}>
            <FeatherIconTile name="calendar" tone="cyan" size={14} /> Calendar
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button type="button" className="nav-link" onClick={() => navigateWithinApp("/family")}>
            <FeatherIconTile name="users" tone="pink" size={14} /> Members
          </button>
        </li>
      </ul>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">SmartWizard Dots</h2>
          <p className="aux-muted mb-0 text-sm">
            Household setup — details, location, hours, and modules
          </p>
        </div>
      </div>
      <HouseholdSmartWizard data={data} setData={setData} />

      <div className="aux-card mb-4">
        <div className="aux-card-header">
          <FeatherIconTile name="activity" tone="lavender" size={16} />
          <div>
            <h3 className="text-base">Progress rings</h3>
            <p className="aux-muted">Inventory, shopping, and chores health</p>
          </div>
        </div>
        <div className="aux-card-body">
          <div className="aux-pb-grid mb-4">
            <ProgressBarCircle
              value={stats.healthPct / 100}
              label="Inventory fresh"
              color="#3b6ef5"
            />
            <ProgressBarCircle
              value={
                data.shopping.length
                  ? (data.shopping.length - shoppingOpen.length) / data.shopping.length
                  : 1
              }
              label="Shopping done"
              color="#12b76a"
              trailColor="rgba(18, 183, 106, 0.15)"
            />
            <ProgressBarCircle
              value={
                data.tasks.length
                  ? (data.tasks.length - openTasks.length) / data.tasks.length
                  : 1
              }
              label="Chores complete"
              color="#ff6b9d"
              trailColor="rgba(255, 107, 157, 0.15)"
            />
          </div>
          <ProgressBarLine
            value={stats.healthPct / 100}
            label="Overall stock health"
            color="#7c5cff"
            trailColor="rgba(124, 92, 255, 0.15)"
          />
        </div>
      </div>

      {/* Welcome + KPIs + inline calendar */}
      <div className="mb-4 grid gap-3 xl:grid-cols-[1.25fr_1fr_minmax(260px,0.9fr)]">
        <div className="aux-card">
          <div className="aux-card-body">
            <p className="text-lg text-slate-600">Welcome,</p>
            <h2 className="aux-gradient-text text-4xl sm:text-5xl">{greetingName}</h2>
            <p className="aux-muted mt-2">
              {members.length} household members · {shoppingOpen.length} shopping items ·{" "}
              {openTasks.length} open chores
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {members.slice(0, 5).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="aux-nav-chip"
                  onClick={() => navigateWithinApp(`/family/${encodeURIComponent(m.id)}`)}
                >
                  {getMemberFullName(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 content-start">
          <div className="aux-card aux-bg-theme text-center">
            <div className="aux-card-body">
              <div className="aux-avatar mx-auto mb-2" style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
                <Package size={18} />
              </div>
              <div className="aux-metric text-white">{stats.total}</div>
              <p className="text-sm text-white/85">In stock</p>
            </div>
          </div>
          <div className="aux-card aux-bg-accent text-center">
            <div className="aux-card-body">
              <div className="aux-avatar mx-auto mb-2" style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>
                <AlertTriangle size={18} />
              </div>
              <div className="aux-metric text-white">{stats.soon}</div>
              <p className="text-sm text-white/85">Expiring</p>
            </div>
          </div>
          <div className="aux-card bg-success-subtle text-center">
            <div className="aux-card-body">
              <div className="aux-avatar mx-auto mb-2 theme-green">
                <CheckCircle2 size={18} />
              </div>
              <div className="aux-metric">{stats.healthPct}%</div>
              <p className="aux-muted">Fresh</p>
            </div>
          </div>
          <div className="aux-card col-span-3 bg-gradient-3">
            <div className="aux-card-body">
              <p className="mb-1 text-sm font-bold">Due on selected day</p>
              {choresOnSelectedDay.length === 0 ? (
                <p className="aux-muted mb-0 text-sm">No open chores for this date.</p>
              ) : (
                <ul className="mb-0 space-y-1">
                  {choresOnSelectedDay.slice(0, 4).map((t) => (
                    <li key={t.id} className="text-sm font-semibold">
                      {t.title}
                      <span className="aux-muted font-medium"> · {t.zone || t.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn btn-light-color btn-theme mt-3" onClick={onOpenTasks}>
                Open cleaning
              </button>
            </div>
          </div>
        </div>

        <div className="aux-card bg-gradient-1">
          <div className="aux-card-header">
            <FeatherIconTile name="calendar" tone="cyan" size={16} />
            <div>
              <h3 className="text-base">Inline calendar</h3>
              <p className="aux-muted">Pick a day for chores</p>
            </div>
          </div>
          <div className="aux-card-body">
            <InlineSingleCalendar value={selectedDay} onChange={setSelectedDay} />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <HouseholdOverviewChart
          ok={stats.ok}
          soon={stats.soon}
          expired={stats.expired}
          shoppingOpen={shoppingOpen.length}
          openTasks={openTasks.length}
        />
      </div>

      {/* Summary cards — AdminUX inventory style */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="aux-card bg-gradient-2">
          <div className="aux-card-header">
            <FeatherIconTile name="shopping-cart" tone="peach" size={18} />
            <div>
              <h3 className="text-base">Shopping summary</h3>
              <p className="aux-muted">Open list this week</p>
            </div>
          </div>
          <div className="aux-card-body grid grid-cols-2 gap-3">
            <Metric
              label="On list"
              value={String(shoppingOpen.length)}
              theme="theme-yellow"
              icon={<ShoppingCart size={18} />}
            />
            <Metric
              label="Purchased"
              value={String(data.shopping.length - shoppingOpen.length)}
              theme="theme-green"
              icon={<CheckCircle2 size={18} />}
            />
            <Metric
              label="Open chores"
              value={String(openTasks.length)}
              theme="theme-pink"
              icon={<Sparkles size={18} />}
            />
            <Metric
              label="Members"
              value={String(members.length)}
              theme="theme-purple"
              icon={<Users size={18} />}
            />
          </div>
        </div>

        <div className="aux-card">
          <div className="aux-card-header">
            <div className="aux-avatar theme-red">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-base">Inventory overview</h3>
              <p className="aux-muted">Stock health by expiry</p>
            </div>
          </div>
          <div className="aux-card-body">
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="aux-metric text-xl">{stats.ok}</div>
                <p className="aux-muted">OK</p>
              </div>
              <div>
                <div className="aux-metric text-xl">{stats.soon}</div>
                <p className="aux-muted">Soon</p>
              </div>
              <div>
                <div className="aux-metric text-xl">{stats.expired}</div>
                <p className="aux-muted">Expired</p>
              </div>
            </div>
            <div className="aux-progress mb-2">
              <span style={{ width: `${stats.healthPct}%` }} />
            </div>
            <p className="aux-muted">{stats.healthPct}% of items are in good shape</p>
            <button type="button" className="aux-btn aux-btn-theme mt-3" onClick={onOpenPantry}>
              Open inventory <Package size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Location KPIs */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Pantry"
          subtitle="Shelf stock"
          value={stats.byLocation.pantry}
          icon={<Package size={18} />}
          theme=""
        />
        <KpiCard
          title="Fridge"
          subtitle="Cold items"
          value={stats.byLocation.fridge}
          icon={<Refrigerator size={18} />}
          theme="theme-purple"
        />
        <KpiCard
          title="Freezer"
          subtitle="Frozen stock"
          value={stats.byLocation.freezer}
          icon={<Snowflake size={18} />}
          theme="theme-pink"
        />
        <KpiCard
          title="Expired"
          subtitle="Needs action"
          value={stats.expired}
          icon={<AlertTriangle size={18} />}
          theme="theme-red"
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        {/* Top shopping */}
        <div className="aux-card">
          <div className="aux-card-header">
            <div className="aux-avatar theme-yellow">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-base">Shopping list</h3>
              <p className="aux-muted">Needs buying</p>
            </div>
          </div>
          <div className="aux-card-body">
            {shoppingOpen.length === 0 ? (
              <p className="aux-muted">List is clear — nice work.</p>
            ) : (
              shoppingOpen.slice(0, 6).map((row) => (
                <div key={row.id} className="aux-list-row">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="aux-muted">
                      {row.quantity || "1"}
                      {row.unit ? ` ${row.unit}` : ""} · {row.storeSection || "General"}
                    </p>
                  </div>
                </div>
              ))
            )}
            <button type="button" className="aux-btn aux-btn-link mt-2 px-0" onClick={onOpenShopping}>
              Visit shopping →
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="aux-card">
          <div className="aux-card-header">
            <div className="aux-avatar theme-pink">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base">Household</h3>
              <p className="aux-muted">Lorraine · Herschel · Stella · Nox · Jeremiah</p>
            </div>
          </div>
          <div className="aux-card-body">
            {members.slice(0, 6).map((m) => (
              <div key={m.id} className="aux-list-row">
                <div>
                  <p className="font-medium">{getMemberFullName(m)}</p>
                  <p className="aux-muted">{m.role || m.ageGroup || "Member"}</p>
                </div>
                <button
                  type="button"
                  className="aux-btn aux-btn-link px-0"
                  onClick={() => navigateWithinApp(`/family/${encodeURIComponent(m.id)}`)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="aux-card">
          <div className="aux-card-header">
            <div className="aux-avatar theme-red">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base">Top categories</h3>
              <p className="aux-muted">Popular in stock</p>
            </div>
          </div>
          <div className="aux-card-body">
            {stats.topCategories.length === 0 ? (
              <p className="aux-muted">Add pantry items to see categories.</p>
            ) : (
              stats.topCategories.map(([name, count]) => (
                <div key={name} className="aux-list-row">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="aux-muted">{count} items</p>
                  </div>
                  <div className="aux-progress w-24">
                    <span
                      style={{
                        width: `${Math.min(100, Math.round((count / Math.max(stats.total, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            <button type="button" className="aux-btn aux-btn-link mt-2 px-0" onClick={onOpenTasks}>
              Visit cleaning →
            </button>
          </div>
        </div>
      </div>

      <AdminUxFullCalendar
        data={data}
        onOpenCalendar={onOpenCalendar}
        onDateSelect={(iso) => {
          const [y, m, d] = iso.split("-").map(Number);
          if (y && m && d) {
            setSelectedDay(new Date(y, m - 1, d));
          }
        }}
      />

      <AdminUxDropzone
        title="Household uploads"
        subtitle="Receipts, school forms, product photos — Dropzone"
        onFilesReady={(files) => {
          if (files.length === 0) return;
          setData((prev) => {
            const existingTitles = new Set(prev.docs.map((d) => d.title));
            const additions = files
              .filter((f) => !existingTitles.has(f.name))
              .map((f) => ({
                id: f.id,
                title: f.name,
                content: f.type.startsWith("image/")
                  ? `Uploaded image (${Math.round(f.size / 1024)} KB)`
                  : `Uploaded file (${Math.round(f.size / 1024)} KB)`,
                body: f.dataUrl.slice(0, 200) + (f.dataUrl.length > 200 ? "…" : ""),
                category: "house" as const,
                tags: ["upload", "dropzone"],
                pinned: false,
                relatedMemberIds: [] as string[],
                relatedProjectId: "",
                visibility: "household" as const,
                createdAt: f.addedAt,
                updatedAt: f.addedAt,
                source: "manual" as const,
              }));
            if (additions.length === 0) return prev;
            return { ...prev, docs: [...additions, ...prev.docs] };
          });
        }}
      />

      <DragulaShoppingBoard
        items={data.shopping}
        onOpenShopping={onOpenShopping}
        onSetPurchased={(id, purchased) => {
          setData((prev) => ({
            ...prev,
            shopping: prev.shopping.map((row) =>
              row.id === id ? { ...row, purchased } : row,
            ),
          }));
        }}
      />

      <HouseholdScheduleGrid
        data={data}
        onOpenMember={(id) => navigateWithinApp(`/family/${encodeURIComponent(id)}`)}
        onOpenTasks={onOpenTasks}
      />

      {/* Orders-style inventory table */}
      <div className="aux-card mb-4">
        <div className="aux-card-header flex-wrap">
          <div className="aux-avatar">
            <Package size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-base">Inventory items</h3>
            <p className="aux-muted">Stock across pantry, fridge, and freezer</p>
          </div>
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="aux-card-body aux-table-wrap">
          <table className="aux-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Location</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="aux-muted py-6">
                    No inventory items match. Add stock from Inventory.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getInventoryExpiryStatus(item.expiryDate);
                  return (
                    <tr key={item.id}>
                      <td>
                        <p className="mb-0 font-medium">{item.name}</p>
                        <p className="aux-muted">{item.source === "scan" ? "Scanned" : "Manual"}</p>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        {item.quantity} {item.unit}
                      </td>
                      <td className="capitalize">{item.location}</td>
                      <td>{formatInventoryExpiryLabel(item.expiryDate)}</td>
                      <td>
                        <span
                          className={
                            status === "ok"
                              ? "aux-badge aux-badge-ok"
                              : status === "soon"
                                ? "aux-badge aux-badge-soon"
                                : "aux-badge aux-badge-expired"
                          }
                        >
                          {status === "ok" ? "OK" : status === "soon" ? "Soon" : "Expired"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications strip */}
      <div className="aux-card">
        <div className="aux-card-header">
          <div className="aux-avatar theme-yellow">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base">Notifications</h3>
            <p className="aux-muted">{notifications.length} recent updates</p>
          </div>
        </div>
        <div className="aux-card-body">
          {notifications.length === 0 ? (
            <p className="aux-muted">No active notifications.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="aux-list-row">
                <div>
                  <p className="font-medium">{n.title || "Update"}</p>
                  <p className="aux-muted">{n.body || ""}</p>
                </div>
              </div>
            ))
          )}
          <button
            type="button"
            className="aux-btn aux-btn-link mt-2 px-0"
            onClick={() => navigateWithinApp("/notifications")}
          >
            Open notifications →
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  theme,
  icon,
}: {
  label: string;
  value: string;
  theme: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`aux-avatar ${theme}`}>{icon}</div>
      <div>
        <p className="aux-muted mb-0">{label}</p>
        <p className="aux-metric text-xl">{value}</p>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  subtitle,
  value,
  icon,
  theme,
}: {
  title: string;
  subtitle: string;
  value: number;
  icon: ReactNode;
  theme: string;
}) {
  return (
    <div className="aux-card">
      <div className="aux-card-header">
        <div className={`aux-avatar ${theme}`}>{icon}</div>
        <div>
          <h3 className="text-base">{title}</h3>
          <p className="aux-muted">{subtitle}</p>
        </div>
      </div>
      <div className="aux-card-body">
        <div className="aux-metric">{value}</div>
      </div>
    </div>
  );
}
