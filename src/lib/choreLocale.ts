/**
 * Chore kiosk locale — UI strings are English; dates/numbers use browser Intl.
 * Add locales to `CHORE_UI_STRINGS` when translating the shell.
 */
export type ChoreLocaleCode = "en";

const CHORE_UI_STRINGS = {
  en: {
    offlineBanner:
      "Offline — showing your last saved chore data from this device.",
    analyticsLoading: "Loading analytics…",
    tabLoading: "Loading…",
  },
} as const;

export function getChoreLocale(): ChoreLocaleCode {
  if (typeof navigator === "undefined") {
    return "en";
  }
  const lang = navigator.language?.toLowerCase() ?? "en";
  if (lang.startsWith("en")) {
    return "en";
  }
  return "en";
}

export function choreString<K extends keyof (typeof CHORE_UI_STRINGS)["en"]>(
  key: K,
): string {
  return CHORE_UI_STRINGS[getChoreLocale()][key];
}

export function formatChoreDateTime(
  ts: number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(ts).toLocaleString(getChoreLocale(), options);
}
