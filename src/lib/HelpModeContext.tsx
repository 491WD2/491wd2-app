import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const HELP_MODE_STORAGE_KEY = "491wd-help-mode-enabled";

type HelpModeContextValue = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  toggle: () => void;
};

const HelpModeContext = createContext<HelpModeContextValue | null>(null);

export function HelpModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(HELP_MODE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(HELP_MODE_STORAGE_KEY, enabled ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [enabled]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
  }, []);

  const toggle = useCallback(() => {
    setEnabledState((v) => !v);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggle,
    }),
    [enabled, setEnabled, toggle],
  );

  return <HelpModeContext.Provider value={value}>{children}</HelpModeContext.Provider>;
}

export function useHelpMode(): HelpModeContextValue {
  const ctx = useContext(HelpModeContext);
  if (!ctx) {
    throw new Error("useHelpMode must be used within HelpModeProvider");
  }
  return ctx;
}
