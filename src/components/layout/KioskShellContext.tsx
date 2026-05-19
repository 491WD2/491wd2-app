import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type KioskShellHeaderActions = {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showScan?: boolean;
  onScan?: () => void;
  showAdd?: boolean;
  addLabel?: string;
  onAdd?: () => void;
};

type KioskShellContextValue = {
  actions: KioskShellHeaderActions;
  setActions: (patch: KioskShellHeaderActions) => void;
  clearActions: () => void;
};

const KioskShellContext = createContext<KioskShellContextValue | null>(null);

export function KioskShellProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<KioskShellHeaderActions>({});

  const setActions = useCallback((patch: KioskShellHeaderActions) => {
    setActionsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearActions = useCallback(() => {
    setActionsState({});
  }, []);

  const value = useMemo(
    () => ({ actions, setActions, clearActions }),
    [actions, setActions, clearActions],
  );

  return <KioskShellContext.Provider value={value}>{children}</KioskShellContext.Provider>;
}

export function useKioskShell() {
  return useContext(KioskShellContext);
}

/** Register header actions while mounted (scan, search, add). */
export function useKioskShellActions(actions: KioskShellHeaderActions) {
  const ctx = useKioskShell();

  useEffect(() => {
    if (!ctx) {
      return;
    }
    ctx.setActions(actions);
    return () => ctx.clearActions();
  }, [ctx, actions]);
}
