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
    <section className="dp-widget dp-widget--pantry" aria-label="Pantry and storage">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--pantry" aria-hidden="true">
            <Package />
          </span>
          <div>
            <h2 className="dp-widget__title">Pantry &amp; storage</h2>
            <p className="dp-widget__meta">{pantryModel.summaryLabel}</p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={() => go("/pantry", onOpenPantry)}>
          Open storage
        </button>
      </header>

      <div className="dp-pantry">
        <div className="dp-pantry__summary" aria-label="Pantry summary">
          <div className="dp-pantry__stat">
            <strong>{lowStockCount}</strong>
            <span>Low stock</span>
          </div>
          <div className="dp-pantry__stat">
            <strong>{expiringCount}</strong>
            <span>Expiring</span>
          </div>
        </div>

        {hasAlerts ? (
          <ul className="dp-pantry__alerts" aria-label="Pantry alerts">
            {alertRows.map((alert) => (
              <li key={alert.id}>
                <button type="button" className="dp-pantry__alert" onClick={() => go(alert.href, onOpenPantry)}>
                  <span className="dp-pantry__alert-dot" aria-hidden="true" />
                  <span className="dp-pantry__alert-copy">
                    <span className="dp-pantry__alert-title">{alert.title}</span>
                    {alert.detail ? <span className="dp-pantry__alert-meta">{alert.detail}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dp-empty">{pantryModel.emptyLabel}</p>
        )}

        {storageZoneStats ? (
          <div className="dp-pantry__zones" aria-label="Storage zones">
            <button type="button" className="dp-zone" onClick={() => go("/pantry?view=pantry", onOpenPantry)}>
              <strong>{storageZoneStats.pantry}</strong>
              <span>Pantry</span>
            </button>
            <button type="button" className="dp-zone" onClick={() => go("/pantry?view=fridge", onOpenPantry)}>
              <strong>{storageZoneStats.fridge}</strong>
              <span>Fridge</span>
            </button>
            <button type="button" className="dp-zone" onClick={() => go("/pantry?view=freezer", onOpenPantry)}>
              <strong>{storageZoneStats.freezer}</strong>
              <span>Freezer</span>
            </button>
          </div>
        ) : (
          <p className="dp-empty dp-empty--inline">Open Storage to start tracking pantry, fridge, and freezer items.</p>
        )}
      </div>

      <nav className="dp-pantry__links" aria-label="Quick links">
        <button type="button" className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => go("/calendar", onOpenCalendar)}>
          Calendar
        </button>
        <button type="button" className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => go("/tasks", onOpenTasks)}>
          Chores
        </button>
        <button type="button" className="dp-btn dp-btn--ghost dp-btn--sm" onClick={() => go("/shopping", onOpenShopping)}>
          Shopping
        </button>
      </nav>
    </section>
  );
}
