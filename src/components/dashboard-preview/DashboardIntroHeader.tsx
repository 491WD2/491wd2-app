import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";

type DashboardIntroHeaderProps = {
  model: DashboardPreviewModel;
};

export function DashboardIntroHeader({ model }: DashboardIntroHeaderProps) {
  const { greeting, clock } = model;

  return (
    <header className="dashboard-preview__intro" aria-label="Dashboard introduction">
      <div className="dashboard-preview__intro-copy">
        <p className="dashboard-preview__intro-greeting">{greeting}</p>
        <h1 className="dashboard-preview__intro-title">Family Dashboard</h1>
        <p className="dashboard-preview__intro-sub">Household overview</p>
      </div>

      <div className="dashboard-preview__intro-utility" aria-label="Current time">
        <p className="dashboard-preview__intro-time" aria-live="polite">
          {clock.time}
        </p>
        <p className="dashboard-preview__intro-date">{clock.dateLine}</p>
      </div>
    </header>
  );
}
