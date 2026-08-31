import { Search } from "lucide-react";
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
        <p className="dashboard-preview__intro-sub">
          {clock.dateLine} · household overview
        </p>
      </div>

      <div className="dashboard-preview__intro-utility" aria-label="Dashboard utilities">
        <label className="dashboard-preview__intro-search">
          <Search className="dashboard-preview__intro-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="dashboard-preview__intro-search-input"
            placeholder="Search household…"
            aria-label="Search household"
            readOnly
            tabIndex={-1}
          />
        </label>
        <p className="dashboard-preview__intro-time" aria-live="polite">
          {clock.time}
        </p>
      </div>
    </header>
  );

}
