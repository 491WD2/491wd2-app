import "../styles/guided-kiosk.css";

type NotFoundPageProps = {
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
};

export function NotFoundPage({
  onOpenDashboard,
  onOpenSettings,
}: NotFoundPageProps) {
  return (
    <div className="wd-guided-kiosk wd-guided-kiosk--not-found">
      <section className="wd-guided-kiosk__hero" aria-labelledby="not-found-title">
        <div>
          <p className="wd-guided-kiosk__eyebrow">Navigation</p>
          <h1 id="not-found-title">Page not found</h1>
          <p>This address is not part of this household workspace. Your saved data is unchanged.</p>
        </div>
        <div className="wd-guided-kiosk__status">
          <span>Unknown route</span>
          <span>Data safe</span>
          <span>Choose next step</span>
        </div>
      </section>

      <section className="wd-guided-kiosk__actions-grid" aria-label="Not found actions">
        <button className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={onOpenDashboard} type="button">
          <span><strong>Back to Dashboard</strong><small>Open Family Hub</small></span>
        </button>
        <button className="wd-guided-kiosk__action" onClick={onOpenSettings} type="button">
          <span><strong>Open Settings</strong><small>Check app sections</small></span>
        </button>
      </section>
    </div>
  );
}
