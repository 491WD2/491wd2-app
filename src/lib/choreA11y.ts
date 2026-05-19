import type { ChoreShellTab } from "./choreTheme";

export function choreTabId(tab: ChoreShellTab): string {
  return `chore-tab-${tab}`;
}

export function chorePanelId(tab: ChoreShellTab): string {
  return `chore-panel-${tab}`;
}
