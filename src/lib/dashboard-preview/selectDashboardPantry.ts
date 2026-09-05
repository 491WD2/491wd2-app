import type { FamilyHubDashboardModel } from "../familyHubDashboardData";

export type DashboardPantryAlertKind = "expiring" | "low-stock";

export type DashboardPantryAlertRow = {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: DashboardPantryAlertKind;
};

export type DashboardPantrySelection = {
  lowStockCount: number;
  expiringCount: number;
  alertCount: number;
  rows: DashboardPantryAlertRow[];
  summaryLabel: string;
  emptyLabel: string;
};

/**
 * Small pantry snapshot from the shared hub model.
 * Expiring items first, then low stock. No invented inventory.
 */
export function selectDashboardPantry(
  hubModel: Pick<FamilyHubDashboardModel, "overview" | "expiringFood" | "lowStock">,
  limit = 4,
): DashboardPantrySelection {
  const expiringCount = hubModel.overview?.expiringFood ?? 0;
  const lowStockCount = hubModel.overview?.lowStock ?? 0;
  const seen = new Set<string>();
  const rows: DashboardPantryAlertRow[] = [];

  for (const item of hubModel.expiringFood ?? []) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    rows.push({
      id: `expiring-${item.id}`,
      title: item.name,
      detail: item.detail,
      href: "/pantry?view=pantry",
      kind: "expiring",
    });
  }

  for (const item of hubModel.lowStock ?? []) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    rows.push({
      id: `low-${item.id}`,
      title: item.name,
      detail: item.detail,
      href: "/pantry?view=pantry",
      kind: "low-stock",
    });
  }

  const emptyLabel = "No pantry alerts right now.";
  const summaryLabel = `${lowStockCount} low · ${expiringCount} expiring`;

  return {
    lowStockCount,
    expiringCount,
    alertCount: lowStockCount + expiringCount,
    rows: rows.slice(0, limit),
    summaryLabel,
    emptyLabel,
  };
}
