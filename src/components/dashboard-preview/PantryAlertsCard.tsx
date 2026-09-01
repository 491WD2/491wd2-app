import { Package } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type PantryAlertsCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenPantry: () => void;
  onOpenCalendar: () => void;
  onOpenTasks?: () => void;
  onOpenShopping: () => void;
};

export function PantryAlertsCard({
  model,
  go,
  onOpenPantry,
  onOpenCalendar,
  onOpenTasks,
  onOpenShopping,
}: PantryAlertsCardProps) {
  const { pantryModel, storageZoneStats } = model;
  const { lowStockCount, expiringCount, alertRows } = pantryModel;
  const hasAlerts = alertRows.length > 0;

  return (
    <section
      className="dashboard-preview__card dashboard-preview__card--pantry-primary"
      aria-label="Pantry and storage"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <span className="dashboard-preview__icon-badge dashboard-preview__icon-badge--pantry" aria-hidden="true">
            <Package className="dashboard-preview__icon-badge-svg" />
          </span>
          <div>
            <h2 className="dashboard-preview__section-title">Pantry &amp; storage</h2>
            <p className="dashboard-preview__meta">
              {lowStockCount} low · {expiringCount} expiring
            </p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/pantry", onOpenPantry)}>
          Open storage
        </button>
      </header>

      <div className="dashboard-preview__pantry-body">
        <div className="dashboard-preview__pantry-stats" aria-label="Pantry summary">
          <div className="dashboard-preview__pantry-stat">
            <strong>{lowStockCount}</strong>
            <span>Low stock</span>
          </div>
          <div className="dashboard-preview__pantry-stat">
            <strong>{expiringCount}</strong>
            <span>Expiring</span>
          </div>
        </div>

        {hasAlerts ? (
          <ul className="dashboard-preview__list dashboard-preview__pantry-alerts" aria-label="Pantry alerts">
            {alertRows.map((alert) => (
              <li key={alert.id}>
                <button
                  type="button"
                  className="dashboard-preview__row dashboard-preview__row--alert"
                  onClick={() => go(alert.href, onOpenPantry)}
                >
                  <span className="dashboard-preview__row-dot dashboard-preview__row-dot--alert" aria-hidden="true" />
                  <span className="dashboard-preview__row-main">
                    <span className="dashboard-preview__row-title">{alert.title}</span>
                    {alert.detail ? (
                      <span className="dashboard-preview__row-meta">{alert.detail}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-preview__placeholder">No pantry alerts right now.</p>
        )}

        {storageZoneStats ? (
          <div className="dashboard-preview__pantry-zones" aria-label="Storage zones">
            <button
              type="button"
              className="dashboard-preview__pantry-zone"
              onClick={() => go("/pantry?view=pantry", onOpenPantry)}
            >
              <strong>{storageZoneStats.pantry}</strong>
              <span>Pantry</span>
            </button>
            <button
              type="button"
              className="dashboard-preview__pantry-zone"
              onClick={() => go("/pantry?view=fridge", onOpenPantry)}
            >
              <strong>{storageZoneStats.fridge}</strong>
              <span>Fridge</span>
            </button>
            <button
              type="button"
              className="dashboard-preview__pantry-zone"
              onClick={() => go("/pantry?view=freezer", onOpenPantry)}
            >
              <strong>{storageZoneStats.freezer}</strong>
              <span>Freezer</span>
            </button>
          </div>
        ) : (
          <p className="dashboard-preview__placeholder dashboard-preview__placeholder--inline">
            Open Storage to start tracking pantry, fridge, and freezer items.
          </p>
        )}
      </div>

      <nav className="dashboard-preview__pantry-links" aria-label="Quick links">
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/calendar", onOpenCalendar)}>
          Calendar
        </button>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/tasks", onOpenTasks)}>
          Chores
        </button>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/shopping", onOpenShopping)}>
          Shopping
        </button>
      </nav>
    </section>
  );
}
