import { APPEARANCE_STORAGE_KEY } from "./uiCustomizationKeys";

export type TextColorPreset = "default" | "highContrast" | "soft";

export type AppearancePreferences = {
  version: 1;
  /** Primary accent (buttons, focus rings reference) */
  primary: string;
  gradientStart: string;
  gradientEnd: string;
  pageBackground: string;
  cardBackground: string;
  /** Sidebar active row background (CSS color, may include alpha) */
  sidebarActiveBg: string;
  sidebarActiveText: string;
  textPrimary: string;
  textMuted: string;
  textPreset: TextColorPreset;
};

export const SMARTHR_DEFAULT_APPEARANCE: AppearancePreferences = {
  version: 1,
  primary: "#F26522",
  gradientStart: "#FF6F28",
  gradientEnd: "#FF5325",
  pageBackground: "#f7f7f7",
  cardBackground: "#ffffff",
  sidebarActiveBg: "rgba(254, 159, 67, 0.08)",
  sidebarActiveText: "#FE9F43",
  textPrimary: "#1f1f1f",
  textMuted: "#637381",
  textPreset: "default",
};

const PRESET_TEXT: Record<
  TextColorPreset,
  Pick<AppearancePreferences, "textPrimary" | "textMuted">
> = {
  default: { textPrimary: "#1f1f1f", textMuted: "#637381" },
  highContrast: { textPrimary: "#0a0a0a", textMuted: "#4b5563" },
  soft: { textPrimary: "#374151", textMuted: "#8e8e8e" },
};

export function applyTextPreset(
  base: AppearancePreferences,
  preset: TextColorPreset,
): AppearancePreferences {
  const t = PRESET_TEXT[preset];
  return {
    ...base,
    textPreset: preset,
    textPrimary: t.textPrimary,
    textMuted: t.textMuted,
  };
}

export function mergeAppearance(
  partial: Partial<AppearancePreferences> | null | undefined,
): AppearancePreferences {
  const base = { ...SMARTHR_DEFAULT_APPEARANCE };
  if (!partial || typeof partial !== "object") {
    return base;
  }
  const next: AppearancePreferences = {
    ...base,
    ...partial,
    version: 1,
  };
  if (partial.textPreset) {
    const t = PRESET_TEXT[partial.textPreset];
    if (partial.textPrimary === undefined) {
      next.textPrimary = t.textPrimary;
    }
    if (partial.textMuted === undefined) {
      next.textMuted = t.textMuted;
    }
    next.textPreset = partial.textPreset;
  }
  return next;
}

/** Apply incremental edits without resetting unspecified fields to defaults. */
export function mergeAppearanceDelta(
  prev: AppearancePreferences,
  patch: Partial<AppearancePreferences>,
): AppearancePreferences {
  const merged: AppearancePreferences = { ...prev, ...patch, version: 1 };
  if (patch.textPreset !== undefined) {
    merged.textPreset = patch.textPreset;
    const t = PRESET_TEXT[patch.textPreset];
    if (patch.textPrimary === undefined) {
      merged.textPrimary = t.textPrimary;
    }
    if (patch.textMuted === undefined) {
      merged.textMuted = t.textMuted;
    }
  }
  return merged;
}

export function readAppearanceFromStorage(): AppearancePreferences {
  if (typeof window === "undefined") {
    return SMARTHR_DEFAULT_APPEARANCE;
  }
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw?.trim()) {
      return SMARTHR_DEFAULT_APPEARANCE;
    }
    const parsed = JSON.parse(raw) as Partial<AppearancePreferences>;
    return mergeAppearance(parsed);
  } catch {
    return SMARTHR_DEFAULT_APPEARANCE;
  }
}

export function writeAppearanceToStorage(prefs: AppearancePreferences): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

/** Push SmartHR CSS variables to `document.documentElement`. */
export function applyAppearanceCssVars(
  prefs: AppearancePreferences,
  target: HTMLElement = document.documentElement,
): void {
  const root = target;
  root.style.setProperty("--fs-primary", prefs.primary);
  root.style.setProperty("--fs-gradient-start", prefs.gradientStart);
  root.style.setProperty("--fs-gradient-end", prefs.gradientEnd);
  root.style.setProperty("--fs-page-bg", prefs.pageBackground);
  root.style.setProperty("--fs-card-bg", prefs.cardBackground);
  root.style.setProperty("--fs-sidebar-active-bg", prefs.sidebarActiveBg);
  root.style.setProperty("--fs-sidebar-active-text", prefs.sidebarActiveText);
  root.style.setProperty("--fs-text", prefs.textPrimary);
  root.style.setProperty("--fs-text-muted", prefs.textMuted);
}

export function clearAppearanceCssVars(target: HTMLElement = document.documentElement): void {
  const keys = [
    "--fs-primary",
    "--fs-gradient-start",
    "--fs-gradient-end",
    "--fs-page-bg",
    "--fs-card-bg",
    "--fs-sidebar-active-bg",
    "--fs-sidebar-active-text",
    "--fs-text",
    "--fs-text-muted",
  ];
  for (const k of keys) {
    target.style.removeProperty(k);
  }
}
