import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppearancePreferences } from "../lib/appearancePreferences";
import {
  applyAppearanceCssVars,
  applyTextPreset,
  mergeAppearanceDelta,
  readAppearanceFromStorage,
  SMARTHR_DEFAULT_APPEARANCE,
  writeAppearanceToStorage,
  type TextColorPreset,
} from "../lib/appearancePreferences";
import type {
  PageLayoutGlobal,
  PageLayoutPreferences,
  PageLayoutRouteKey,
} from "../lib/pageLayoutPreferences";
import {
  DEFAULT_PAGE_LAYOUT,
  readPageLayoutFromStorage,
  writePageLayoutToStorage,
} from "../lib/pageLayoutPreferences";
import { writeSidebarCollapsedPreference } from "../lib/sidebarUi";
import type { ShellRoute } from "../components/layout/shellRoutes";

type UiCustomizationContextValue = {
  appearance: AppearancePreferences;
  setAppearance: (next: AppearancePreferences) => void;
  updateAppearance: (patch: Partial<AppearancePreferences>) => void;
  setTextPreset: (preset: TextColorPreset) => void;
  resetAppearance: () => void;

  pageLayout: PageLayoutPreferences;
  setPageLayout: (next: PageLayoutPreferences) => void;
  updateGlobalLayout: (patch: Partial<PageLayoutGlobal>) => void;
  updatePageLayoutEntry: (
    route: PageLayoutRouteKey,
    patch: Partial<NonNullable<PageLayoutPreferences["pages"][PageLayoutRouteKey]>>,
  ) => void;
  resetPageLayouts: () => void;

  /** Resolved per shell route (merges per-page overrides with global defaults). */
  resolveLayoutForRoute: (route: ShellRoute | string) => {
    density: PageLayoutPreferences["global"]["cardDensity"];
    width: PageLayoutPreferences["global"]["pageWidth"];
  };
};

const UiCustomizationContext = createContext<UiCustomizationContextValue | null>(null);

function shellRouteToLayoutKey(route: ShellRoute | string): PageLayoutRouteKey | null {
  switch (route) {
    case "dashboard":
      return "home";
    case "messages":
      return "messages";
    case "calendar":
    case "planner":
      return "calendar";
    case "shopping":
      return "shopping";
    case "pantry":
      return "pantry";
    case "tasks":
    case "kitchen":
    case "kitchenSchedule":
      return "tasks";
    case "notifications":
      return "home";
    case "pets":
      return "pets";
    case "settings":
    case "subscriptions":
      return "settings";
    default:
      return null;
  }
}

export function UiCustomizationProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearancePreferences>(() =>
    readAppearanceFromStorage(),
  );
  const [pageLayout, setPageLayoutState] = useState<PageLayoutPreferences>(() =>
    readPageLayoutFromStorage(),
  );

  useEffect(() => {
    applyAppearanceCssVars(appearance);
  }, [appearance]);

  const setAppearance = useCallback((next: AppearancePreferences) => {
    setAppearanceState(next);
    writeAppearanceToStorage(next);
    applyAppearanceCssVars(next);
  }, []);

  const updateAppearance = useCallback((patch: Partial<AppearancePreferences>) => {
    setAppearanceState((prev) => {
      const next = mergeAppearanceDelta(prev, patch);
      writeAppearanceToStorage(next);
      applyAppearanceCssVars(next);
      return next;
    });
  }, []);

  const setTextPreset = useCallback((preset: TextColorPreset) => {
    setAppearanceState((prev) => {
      const next = applyTextPreset(prev, preset);
      writeAppearanceToStorage(next);
      applyAppearanceCssVars(next);
      return next;
    });
  }, []);

  const resetAppearance = useCallback(() => {
    const next = { ...SMARTHR_DEFAULT_APPEARANCE };
    setAppearanceState(next);
    writeAppearanceToStorage(next);
    applyAppearanceCssVars(next);
  }, []);

  const setPageLayout = useCallback((next: PageLayoutPreferences) => {
    setPageLayoutState(next);
    writePageLayoutToStorage(next);
    writeSidebarCollapsedPreference(next.global.sidebarCollapsed);
  }, []);

  const updateGlobalLayout = useCallback((patch: Partial<PageLayoutGlobal>) => {
    setPageLayoutState((prev) => {
      const next: PageLayoutPreferences = {
        ...prev,
        global: { ...prev.global, ...patch },
      };
      writePageLayoutToStorage(next);
      if (patch.sidebarCollapsed !== undefined) {
        writeSidebarCollapsedPreference(patch.sidebarCollapsed);
      }
      return next;
    });
  }, []);

  const updatePageLayoutEntry = useCallback(
    (
      route: PageLayoutRouteKey,
      patch: Partial<NonNullable<PageLayoutPreferences["pages"][PageLayoutRouteKey]>>,
    ) => {
      setPageLayoutState((prev) => {
        const pages = { ...prev.pages };
        const cur = pages[route] ?? {};
        const mergedSections =
          patch.sections != null
            ? { ...cur.sections, ...patch.sections }
            : cur.sections;
        pages[route] = { ...cur, ...patch, sections: mergedSections };
        const next = { ...prev, pages };
        writePageLayoutToStorage(next);
        return next;
      });
    },
    [],
  );

  const resetPageLayouts = useCallback(() => {
    setPageLayoutState((prev) => {
      const next: PageLayoutPreferences = {
        ...DEFAULT_PAGE_LAYOUT,
        global: {
          ...DEFAULT_PAGE_LAYOUT.global,
          sidebarCollapsed: prev.global.sidebarCollapsed,
        },
      };
      writePageLayoutToStorage(next);
      writeSidebarCollapsedPreference(next.global.sidebarCollapsed);
      return next;
    });
  }, []);

  const resolveLayoutForRoute = useCallback(
    (route: ShellRoute | string) => {
      const key = shellRouteToLayoutKey(route);
      const g = pageLayout.global;
      const page = key ? pageLayout.pages[key] : undefined;
      return {
        density: page?.cardDensity ?? g.cardDensity,
        width: page?.pageWidth ?? g.pageWidth,
      };
    },
    [pageLayout],
  );

  const value = useMemo((): UiCustomizationContextValue => {
    return {
      appearance,
      setAppearance,
      updateAppearance,
      setTextPreset,
      resetAppearance,
      pageLayout,
      setPageLayout,
      updateGlobalLayout,
      updatePageLayoutEntry,
      resetPageLayouts,
      resolveLayoutForRoute,
    };
  }, [
    appearance,
    setAppearance,
    updateAppearance,
    setTextPreset,
    resetAppearance,
    pageLayout,
    setPageLayout,
    updateGlobalLayout,
    updatePageLayoutEntry,
    resetPageLayouts,
    resolveLayoutForRoute,
  ]);

  return (
    <UiCustomizationContext.Provider value={value}>{children}</UiCustomizationContext.Provider>
  );
}

export function useUiCustomization(): UiCustomizationContextValue {
  const ctx = useContext(UiCustomizationContext);
  if (!ctx) {
    throw new Error("useUiCustomization requires UiCustomizationProvider");
  }
  return ctx;
}

export function shellRouteToPageLayoutKey(route: ShellRoute | string): PageLayoutRouteKey | null {
  return shellRouteToLayoutKey(route);
}
