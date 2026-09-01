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
    <section className="dp-widget dp-widget--messages" aria-label="Messages and notifications">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--messages" aria-hidden="true">
            <MessageCircle />
          </span>
          <div>
            <h2 className="dp-widget__title">Messages</h2>
            <p className="dp-widget__meta">{countLabel} pinned or unread</p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={() => go("/messages")}>
          Open
        </button>
      </header>

      {!hasContent ? (
        <p className="dp-empty">No pinned messages or unread alerts.</p>
      ) : (
        <ul className="dp-inbox">
          {importantMessages.map((msg) => (
            <li key={msg.id}>
              <button type="button" className="dp-inbox__row" onClick={() => go("/messages")}>
                <span className="dp-inbox__badge dp-inbox__badge--message">
                  {msg.pinned ? "Pinned" : "Message"}
                </span>
                <span className="dp-inbox__copy">
                  <span className="dp-inbox__title">{msg.title?.trim() || msg.message}</span>
                  <span className="dp-inbox__meta">{msg.pinned ? "Pinned note" : msg.priority}</span>
                </span>
              </button>
            </li>
          ))}
          {attentionNotifications.map((note) => (
            <li key={note.id}>
              <button type="button" className="dp-inbox__row" onClick={() => go("/notifications")}>
                <span className="dp-inbox__badge dp-inbox__badge--alert">Alert</span>
                <span className="dp-inbox__copy">
                  <span className="dp-inbox__title">{note.title}</span>
                  <span className="dp-inbox__meta">Unread notification</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
