import { Bell } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type MessagesNotificationsCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
};

export function MessagesNotificationsCard({ model, go }: MessagesNotificationsCardProps) {
  const { importantMessages, attentionNotifications } = model;
  const hasContent = importantMessages.length > 0 || attentionNotifications.length > 0;

  return (
    <section className="dashboard-preview__card" aria-label="Messages and notifications">
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div>
          <h2 className="dashboard-preview__section-title">Messages &amp; alerts</h2>
          <p className="dashboard-preview__meta">Pinned notes and household alerts</p>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/messages")}>
          Messages
        </button>
      </header>

      {!hasContent ? (
        <p className="dashboard-preview__placeholder">No pinned messages or unread alerts.</p>
      ) : (
        <ul className="dashboard-preview__list">
          {importantMessages.map((msg) => (
            <li key={msg.id}>
              <button type="button" className="dashboard-preview__row" onClick={() => go("/messages")}>
                <span className="dashboard-preview__row-dot" aria-hidden="true" />
                <span className="dashboard-preview__row-main">
                  <span className="dashboard-preview__row-title">
                    {msg.title?.trim() || msg.message}
                  </span>
                  <span className="dashboard-preview__row-meta">
                    {msg.pinned ? "Pinned" : msg.priority}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {attentionNotifications.map((note) => (
            <li key={note.id}>
              <button type="button" className="dashboard-preview__row" onClick={() => go("/notifications")}>
                <Bell className="dashboard-preview__row-icon" aria-hidden="true" />
                <span className="dashboard-preview__row-main">
                  <span className="dashboard-preview__row-title">{note.title}</span>
                  <span className="dashboard-preview__row-meta">Notification</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
