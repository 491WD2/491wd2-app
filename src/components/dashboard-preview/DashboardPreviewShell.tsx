import type { ReactNode } from "react";

/**
 * Inner desktop application surface for DashboardPreview.
 * AppShell remains the only app-level navigation — no duplicate sidebar or top bar.
 */
export function DashboardPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-preview" data-testid="dashboard-preview-root">
      <div className="dashboard-preview__viewport">
        <div className="dashboard-preview__frame">
          <div className="dashboard-preview__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
