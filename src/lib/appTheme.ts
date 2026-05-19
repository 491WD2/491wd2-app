/** localStorage key for light/dark preference (signed-in + dashboard). */
export const APP_THEME_STORAGE_KEY = "familysite-theme";

export type AppThemeMode = "light" | "dark";

export function getStoredThemeMode(): AppThemeMode | null {
  try {
    const v = localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Resolve initial dark mode: saved preference, else system prefers-color-scheme. */
export function resolveInitialDark(): boolean {
  const stored = getStoredThemeMode();
  if (stored === "dark") {
    return true;
  }
  if (stored === "light") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function initAppThemeFromStorage() {
  applyDarkClass(resolveInitialDark());
}

export function setThemeMode(mode: AppThemeMode) {
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  applyDarkClass(mode === "dark");
}

export function toggleThemeMode(): AppThemeMode {
  const next: AppThemeMode = document.documentElement.classList.contains("dark") ? "light" : "dark";
  setThemeMode(next);
  return next;
}
