import { memo, type ReactNode } from "react";
import { chorePanelId, choreTabId } from "../../lib/choreA11y";
import type { ChoreShellTab } from "../../lib/choreTheme";

/**
 * Tab panel linked to {@link ChoreNavTabs} via `aria-labelledby` / `aria-controls`.
 */
export const ChoreTabPanel = memo(function ChoreTabPanel({
  tabKey,
  children,
}: {
  tabKey: ChoreShellTab;
  children: ReactNode;
}) {
  return (
    <div
      key={tabKey}
      id={chorePanelId(tabKey)}
      role="tabpanel"
      aria-labelledby={choreTabId(tabKey)}
      tabIndex={0}
      className="wd-chore-hh__tab-panel"
    >
      {children}
    </div>
  );
});
