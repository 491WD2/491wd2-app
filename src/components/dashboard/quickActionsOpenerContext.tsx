import { createContext, useContext } from "react";

type QuickActionsOpenerContextValue = {
  openQuickActions: () => void;
};

export const QuickActionsOpenerContext =
  createContext<QuickActionsOpenerContextValue | null>(null);

/** Opens the shared Quick actions modal when rendered inside AppShell. */
export function useOpenQuickActions(): () => void {
  const ctx = useContext(QuickActionsOpenerContext);
  return ctx?.openQuickActions ?? (() => {});
}
