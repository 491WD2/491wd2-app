/**
 * FamilyHub-safe AdminUX palette + page background presets.
 * Mirrors AdminUX personalization (None / White / Theme / Grad-1…10)
 * without importing Bootstrap templates.
 */

export const ADMINUX_PAGE_BG_PRESETS = [
  "none",
  "white",
  "theme",
  "grad-1",
  "grad-2",
  "grad-3",
  "grad-4",
  "grad-5",
  "grad-6",
  "grad-7",
  "grad-8",
  "grad-9",
  "grad-10",
] as const;

export type AdminuxPageBgPreset = (typeof ADMINUX_PAGE_BG_PRESETS)[number];

export const ADMINUX_PAGE_BG_LABELS: Record<AdminuxPageBgPreset, string> = {
  none: "None",
  white: "White",
  theme: "Theme",
  "grad-1": "Grad-1",
  "grad-2": "Grad-2",
  "grad-3": "Grad-3",
  "grad-4": "Grad-4",
  "grad-5": "Grad-5",
  "grad-6": "Grad-6",
  "grad-7": "Grad-7",
  "grad-8": "Grad-8",
  "grad-9": "Grad-9",
  "grad-10": "Grad-10",
};

/** Swatch preview fills for Settings UI (approximate Grad-1…10). */
export const ADMINUX_PAGE_BG_SWATCH: Record<AdminuxPageBgPreset, string> = {
  none: "linear-gradient(135deg, #e2e8f0, #f8fafc)",
  white: "#ffffff",
  theme: "#dbeafe",
  "grad-1": "radial-gradient(circle at 30% 20%, #cfe8ff, #ffffff 62%)",
  "grad-2": "radial-gradient(circle at 70% 10%, #ffd6e8, #ffffff 60%)",
  "grad-3": "radial-gradient(circle at 40% 30%, #d8f5e5, #ffffff 58%)",
  "grad-4": "radial-gradient(circle at 20% 80%, #e4ddff, #ffffff 55%)",
  "grad-5": "radial-gradient(circle at 80% 40%, #ffe7c2, #ffffff 58%)",
  "grad-6": "radial-gradient(circle at 50% 0%, #c9f0ff, #fff5fb 70%)",
  "grad-7": "radial-gradient(circle at 10% 50%, #ffd0d8, #f3fff8 65%)",
  "grad-8": "radial-gradient(circle at 90% 20%, #fff1b8, #e8f4ff 60%)",
  "grad-9": "radial-gradient(circle at 40% 10%, #d2ffe8, #ffe9f4 62%)",
  "grad-10": "radial-gradient(circle at 60% 80%, #cdd9ff, #fff8e8 58%)",
};

export const ADMINUX_ACCENT_PRESETS = [
  "theme",
  "accent",
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "orange",
  "purple",
  "teal",
  "brown",
  "secondary",
] as const;

export type AdminuxAccentPreset = (typeof ADMINUX_ACCENT_PRESETS)[number];

export const ADMINUX_ACCENT_LABELS: Record<AdminuxAccentPreset, string> = {
  theme: "Theme",
  accent: "Accent",
  primary: "Primary",
  success: "Success",
  info: "Info",
  warning: "Warning",
  danger: "Danger",
  orange: "Orange",
  purple: "Purple",
  teal: "Teal",
  brown: "Brown",
  secondary: "Secondary",
};

/** Hex values aligned with `--aux-*` tokens in adminux-skin.css */
export const ADMINUX_ACCENT_HEX: Record<AdminuxAccentPreset, string> = {
  theme: "#3b6ef5",
  accent: "#1e3a8a",
  primary: "#4f46e5",
  success: "#12b76a",
  info: "#0ba5ec",
  warning: "#f79009",
  danger: "#f04438",
  orange: "#f97316",
  purple: "#7a5af8",
  teal: "#15b8a6",
  brown: "#b54708",
  secondary: "#64748b",
};

export function isAdminuxPageBgPreset(value: unknown): value is AdminuxPageBgPreset {
  return (
    typeof value === "string" &&
    (ADMINUX_PAGE_BG_PRESETS as readonly string[]).includes(value)
  );
}

export function isAdminuxAccentPreset(value: unknown): value is AdminuxAccentPreset {
  return (
    typeof value === "string" &&
    (ADMINUX_ACCENT_PRESETS as readonly string[]).includes(value)
  );
}

/** Map accent preset → primary + gradient stops for appearance prefs. */
export function accentPresetToAppearanceColors(accent: AdminuxAccentPreset): {
  primary: string;
  gradientStart: string;
  gradientEnd: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
} {
  const primary = ADMINUX_ACCENT_HEX[accent];
  const endMap: Record<AdminuxAccentPreset, string> = {
    theme: "#5b8cff",
    accent: "#3b6ef5",
    primary: "#818cf8",
    success: "#32d583",
    info: "#36bffa",
    warning: "#fdb022",
    danger: "#f97066",
    orange: "#fb923c",
    purple: "#a78bfa",
    teal: "#2dd4bf",
    brown: "#d97706",
    secondary: "#94a3b8",
  };
  return {
    primary,
    gradientStart: primary,
    gradientEnd: endMap[accent],
    sidebarActiveBg: `${primary}22`,
    sidebarActiveText: primary,
  };
}
