import { MessageCircle } from "lucide-react";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type MessagesNotificationsCardProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
};

export function MessagesNotificationsCard({ model, go }: MessagesNotificationsCardProps) {
  const { importantMessages, attentionNotifications, messagesAndAlertsCount } = model;
  const hasContent = importantMessages.length > 0 || attentionNotifications.length > 0;
  const countLabel =
    messagesAndAlertsCount === 1 ? "1 item" : `${messagesAndAlertsCount} items`;

  return (
    <section
      className="dashboard-preview__card dashboard-preview__card--messages"
      aria-label="Messages and notifications"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <span className="dashboard-preview__icon-badge dashboard-preview__icon-badge--messages" aria-hidden="true">
            <MessageCircle className="dashboard-preview__icon-badge-svg" />
          </span>
          <div>
            <h2 className="dashboard-preview__section-title">Messages</h2>
            <p className="dashboard-preview__meta">{countLabel} pinned or unread</p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/messages")}>
          Open
        </button>
      </header>

      {!hasContent ? (
        <p className="dashboard-preview__placeholder">No pinned messages or unread alerts.</p>
      ) : (
        <ul className="dashboard-preview__list dashboard-preview__list--messages">
          {importantMessages.map((msg) => (
            <li key={msg.id}>
              <button type="button" className="dashboard-preview__row" onClick={() => go("/messages")}>
                <span className="dashboard-preview__row-badge dashboard-preview__row-badge--message">
                  {msg.pinned ? "Pinned" : "Message"}
                </span>
                <span className="dashboard-preview__row-main">
                  <span className="dashboard-preview__row-title">
                    {msg.title?.trim() || msg.message}
                  </span>
                  <span className="dashboard-preview__row-meta">
                    {msg.pinned ? "Pinned note" : msg.priority}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {attentionNotifications.map((note) => (
            <li key={note.id}>
              <button type="button" className="dashboard-preview__row" onClick={() => go("/notifications")}>
                <span className="dashboard-preview__row-badge dashboard-preview__row-badge--notification">
                  Alert
                </span>
                <span className="dashboard-preview__row-main">
                  <span className="dashboard-preview__row-title">{note.title}</span>
                  <span className="dashboard-preview__row-meta">Unread notification</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
