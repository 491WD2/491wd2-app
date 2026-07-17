import "../styles/guided-kiosk.css";

type Props = {
  /** Short label shown in the card header for legacy deep links. */
  title: string;
  onGoHome: () => void;
  onGoSettings: () => void;
};

/** Shown when a legacy route is visited directly; no data is deleted. */
export function HiddenModulePage({ title, onGoHome, onGoSettings }: Props) {
  return (
    <div className="wd-guided-kiosk wd-guided-kiosk--hidden-module">
      <section className="wd-guided-kiosk__hero" aria-labelledby="hidden-module-title">
        <div>
          <p className="wd-guided-kiosk__eyebrow">Not in household navigation</p>
          <h1 id="hidden-module-title">{title}</h1>
          <p>This old area is no longer part of the main app layout. Your saved records are unchanged.</p>
        </div>
        <div className="wd-guided-kiosk__status">
          <span>Legacy link</span>
          <span>Data safe</span>
          <span>Choose next step</span>
        </div>
      </section>

      <section className="wd-guided-kiosk__actions-grid" aria-label="Legacy page actions">
        <button className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={onGoHome} type="button">
          <span><strong>Back to Home</strong><small>Return to Family Hub</small></span>
        </button>
        <button className="wd-guided-kiosk__action" onClick={onGoSettings} type="button">
          <span><strong>Open Settings</strong><small>Adjust visible modules</small></span>
        </button>
      </section>
    </div>
  );
}
