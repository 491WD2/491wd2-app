/**
 * Global dark admin design tokens — reference for TS + Tailwind class fragments.
 * FamilySite_491 · wall-display / household command center aesthetic.
 */

/** Canonical hex/RGBA palette */
export const colors = {
  /** Deepest gradient edge — ring-offset / fallback only */
  appBackground: "#02040D",
  /** Main column: transparent so global teal/navy gradient shows through */
  pageBackground: "transparent",
  /** Sidebar: dark glass over gradient */
  sidebarBackground: "rgba(7, 12, 29, 0.72)",
  cardBackground: "rgba(7, 12, 29, 0.76)",
  raisedCard: "rgba(12, 20, 44, 0.82)",
  softPanel: "rgba(255,255,255,0.06)",
  inputBackground: "rgba(4,8,22,0.62)",
  border: "rgba(218,236,255,0.18)",
  strongBorder: "rgba(218,236,255,0.30)",
  divider: "rgba(255,255,255,0.08)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  primary: "#7DF9FF",
  primaryHover: "#24F2C0",
  infoBlue: "#58D8FF",
  successGreen: "#24F2C0",
  warningYellow: "#FFD166",
  orange: "#FF7A1A",
  dangerRed: "#E2504E",
  purple: "#7C3AED",
  pink: "#E11DAD",
} as const;

/** Legacy compact exports (backward compatible with earlier passes) */
export const DS = {
  bgApp: colors.appBackground,
  bgSecondary: colors.pageBackground,
  bgSidebar: colors.sidebarBackground,
  bgCard: colors.cardBackground,
  bgCardRaised: colors.raisedCard,
  bgPanel: colors.softPanel,
  border: colors.border,
  borderStrong: colors.strongBorder,
  divider: colors.divider,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  textFaint: colors.textFaint,
  primary: colors.primary,
  primaryHover: colors.primaryHover,
  warningKitchen: colors.warningYellow,
  success: colors.successGreen,
  danger: colors.dangerRed,
  info: colors.infoBlue,
  purple: colors.purple,
} as const;

/** Card radius 14–18px band → 16px */
export const radius = {
  card: "16px",
  button: "12px",
  input: "12px",
  iconButton: "12px",
} as const;

/** Spacing scale (px) */
export const spacing = {
  xs: 8,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Typography scale — minimum body 16px */
export const fontSize = {
  bodyMin: "16px",
  row: "17px",
  cardTitle: "17px",
  pageTitle: "36px",
  greeting: "28px",
  metric: "28px",
  labelUpper: "13px",
} as const;

export const shadow = {
  card: "0 20px 60px rgba(0,0,0,0.35)",
  header: "0 1px 0 rgba(255,255,255,0.06)",
} as const;

/** Primary dashboard card — thin outline, graphite fill (add padding per surface: e.g. `p-5 sm:p-6`). */
export const DS_CARD =
  "rounded-[28px] border border-white/[0.16] bg-[linear-gradient(140deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035)_46%,rgba(255,255,255,0.065)),radial-gradient(circle_at_92%_0%,rgba(125,249,255,0.14),transparent_14rem),rgba(7,12,29,0.74)] shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_34px_rgba(125,249,255,0.055),inset_0_1px_0_rgba(255,255,255,0.13)] backdrop-blur-xl transition-colors hover:border-white/[0.24]";

export const DS_CARD_COMPACT =
  "rounded-[22px] border border-white/[0.16] bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.032)),rgba(7,12,29,0.62)] shadow-[0_16px_44px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl transition-colors";

export const DS_CARD_RAISED =
  "rounded-[28px] border border-white/[0.18] bg-[linear-gradient(140deg,rgba(255,255,255,0.14),rgba(255,255,255,0.045)_46%,rgba(255,255,255,0.075)),rgba(12,20,44,0.82)] shadow-[0_28px_80px_rgba(0,0,0,0.48),0_0_42px_rgba(125,249,255,0.075),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl transition-colors";

/**
 * Home dashboard panels — SmartHR-style white cards on peach wash (light); dark mode graphite.
 */
/** Kitchen / unused hubs — light SmartHR card only (Dashboard Home forces light regardless of theme). */
export const HOME_PANEL =
  "rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.2)] transition-[border-color,background-color,box-shadow] duration-150 ease-out";

export const HOME_PANEL_HEADER = "text-[20px] font-medium leading-snug text-[#1f1f1f]";

export const HOME_BODY = "text-[15px] leading-snug text-[#575757]";

export const HOME_KITCHEN_DAY_TILE =
  "rounded-lg border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)] transition-[border-color,background-color] duration-150 ease-out";

export const DS_PAGE_BG = "bg-transparent";

/** Main content column (inside shell, beside sidebar) */
export const DS_MAIN_COLUMN = "bg-transparent";

export const DS_SIDEBAR_BG = "bg-[rgb(7_16_24)]/78 backdrop-blur-xl";

/** Top chrome inside signed-in shell */
export const DS_HEADER =
  "border-b border-slate-200/80 bg-white/90 backdrop-blur-xl text-slate-900 dark:border-white/[0.10] dark:bg-[rgb(8_20_32)]/72 dark:text-[#F8FAFC]";

export const DS_BTN_PRIMARY =
  "min-h-11 rounded-xl border border-[#00B7C7] bg-[#00B7C7] px-4 text-[17px] font-semibold text-white shadow-sm transition hover:border-[#00D5E8] hover:bg-[#00D5E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C7]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1C2B] disabled:cursor-not-allowed disabled:opacity-45";

export const DS_BTN_SECONDARY =
  "min-h-11 rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 text-[16px] font-semibold text-[#F8FAFC] transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1C2B] disabled:cursor-not-allowed disabled:opacity-45";

export const DS_INPUT =
  "w-full min-h-[44px] rounded-2xl border border-white/[0.16] bg-white/[0.055] px-3 py-2.5 text-[17px] leading-snug text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none backdrop-blur-xl transition placeholder:text-[#B1C1DA]/65 focus:border-[#7DF9FF]/60 focus:ring-2 focus:ring-[#7DF9FF]/25 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

export const DS_TEXTAREA = `${DS_INPUT} min-h-[7rem] resize-y py-3 leading-relaxed`;

export const DS_SELECT = `${DS_INPUT} cursor-pointer appearance-none`;

/** Nav row active (sidebar) */
export const DS_NAV_ACTIVE =
  "border border-[rgba(0,183,199,0.35)] bg-[rgba(0,183,199,0.12)] text-[#F8FAFC]";

/** Table / list row */
export const DS_TABLE_ROW =
  "border-b border-white/[0.08] bg-transparent px-4 py-3 text-[17px] text-[#F8FAFC] transition hover:bg-white/[0.04]";

/** Icon button shell */
export const DS_ICON_BUTTON =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.05] text-[#CBD5E1] transition hover:border-white/[0.22] hover:bg-white/[0.08] hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C7]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1C2B] disabled:opacity-45";

/** SmartHR light household kit — see `components/smarthr` */
export {
  SMARTHR_ACCENT_RAIL,
  SMARTHR_BODY,
  SMARTHR_BTN_SECONDARY,
  SMARTHR_CARD,
  SMARTHR_FOCUS_RING,
  SMARTHR_GRADIENT_PRIMARY,
  SMARTHR_INPUT,
  SMARTHR_LABEL,
  SMARTHR_MAIN_PADDING,
  SMARTHR_MUTED,
  SMARTHR_PAGE_BG,
  SMARTHR_SELECT,
  SMARTHR_TABLE,
  SMARTHR_TABLE_CELL,
  SMARTHR_TABLE_HEAD_ROW,
  SMARTHR_TABLE_ROW,
  SMARTHR_TABLE_WRAP,
  SMARTHR_TEXTAREA,
  SMARTHR_TITLE,
  SMARTHR_WELL,
} from "./smarthrUi";
