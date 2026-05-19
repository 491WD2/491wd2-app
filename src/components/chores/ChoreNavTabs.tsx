import { memo, useCallback, type KeyboardEvent } from "react";
import { trackKioskEvent } from "../../lib/kioskAnalytics";
import { chorePanelId, choreTabId } from "../../lib/choreA11y";
import { CHORE_SHELL_TABS, type ChoreShellTab } from "../../lib/choreTheme";
import { choreClasses, choreCn, choreTw } from "../../lib/choreUi";

export type ChoreNavTabsProps = {
  active: ChoreShellTab;
  onChange: (tab: ChoreShellTab) => void;
  tourActive?: boolean;
};

/** Primary shell navigation — 76px touch targets, WAI-ARIA tabs. */
export const ChoreNavTabs = memo(function ChoreNavTabs({
  active,
  onChange,
  tourActive,
}: ChoreNavTabsProps) {
  const focusTab = useCallback((tabId: ChoreShellTab) => {
    document.getElementById(choreTabId(tabId))?.focus();
  }, []);

  const handleTabListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (tourActive) {
        return;
      }
      const idx = CHORE_SHELL_TABS.findIndex((t) => t.id === active);
      if (idx < 0) {
        return;
      }
      let nextIdx: number | null = null;
      if (e.key === "ArrowRight") {
        nextIdx = (idx + 1) % CHORE_SHELL_TABS.length;
      } else if (e.key === "ArrowLeft") {
        nextIdx = (idx - 1 + CHORE_SHELL_TABS.length) % CHORE_SHELL_TABS.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = CHORE_SHELL_TABS.length - 1;
      }
      if (nextIdx === null) {
        return;
      }
      e.preventDefault();
      const nextTab = CHORE_SHELL_TABS[nextIdx]!;
      trackKioskEvent({
        category: "page",
        action: "tab_change",
        surface: `chores:${nextTab.id}`,
      });
      onChange(nextTab.id);
      focusTab(nextTab.id);
    },
    [active, focusTab, onChange, tourActive],
  );

  return (
    <nav
      className={choreCn("wd-chore-hh__tabs", tourActive && "wd-chore-hh__tabs--tour")}
      role="tablist"
      aria-label="Chore sections"
      data-chore-tour="tabs"
      onKeyDown={handleTabListKeyDown}
    >
      {CHORE_SHELL_TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={choreTabId(tab.id)}
            className={choreCn(
              selected ? choreClasses.tabActive : choreClasses.tab,
              choreTw.focusRing,
            )}
            aria-selected={selected}
            aria-controls={chorePanelId(tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              trackKioskEvent({
                category: "page",
                action: "tab_change",
                surface: `chores:${tab.id}`,
              });
              onChange(tab.id);
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
});
