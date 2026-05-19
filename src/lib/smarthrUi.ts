/**
 * SmartHR UI tokens (Tailwind template visual reference only).
 * Class strings keep literal hex/arbitrary segments so Tailwind JIT can see them.
 * When adding new utilities, mirror hex in `SMARTHR_UI_COLORS` and/or `@theme` in `styles.css`.
 */

/** Canonical hex — documentation, CSS, and parity checks for class literals below. */
export const SMARTHR_UI_COLORS = {
  primary: "#F26522",
  primaryGradientStart: "#FF6F28",
  primaryGradientEnd: "#FF5325",
  primaryTransparent: "#FEF1EB",
  accent: "#FE9F43",
  accentSoftBg: "rgba(254, 159, 67, 0.2)",
  border: "#E5E7EB",
  /** Template `gray-300` — hover edge on bordered chips */
  borderHover: "#D1D5DB",
  /** Template `bg-dark-transparent` — menubar / sidebar row hover */
  menubarHoverWash: "#E8E9EA",
  /** Legacy gray-200; prefer `border` for new work */
  borderLegacy: "#ededed",
  pageBg: "#f7f7f7",
  lightBg: "#F8F9FA",
  lightHover: "#f3f4f6",
  cardBg: "#ffffff",
  text: "#1f1f1f",
  textBody: "#575757",
  textMuted: "#6B7280",
  /** Sidebar icon / caption — aligns with `--fs-text-muted` fallback */
  textMutedSidebar: "#637381",
  textNav: "#4B5563",
  textGroupLabel: "#94a3b8",
  /** Overdue chore rail / emphasis */
  choreOverdue: "#d97706",
  placeholder: "#6B7280",
  labelUpper: "#637381",
  /** Sheet / drawer chrome on dark shell */
  sheetDarkBg: "#1c2028",
} as const;

function cnClasses(...parts: string[]): string {
  return parts.join(" ");
}

/** Inline gradient only (pair with borders / text colors in callers) */
export const SMARTHR_GRADIENT_PRIMARY_INLINE =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325]";

export const SMARTHR_FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]";

export const SMARTHR_FOCUS_RING_ACCENT_40 = "focus-visible:ring-[#FE9F43]/40";
export const SMARTHR_FOCUS_RING_ACCENT_45 = "focus-visible:ring-[#FE9F43]/45";
export const SMARTHR_FOCUS_RING_ACCENT_50 = "focus-visible:ring-[#FE9F43]/50";
export const SMARTHR_FOCUS_RING_ACCENT_INSET_55 = "focus-visible:ring-[#FE9F43]/55";

/** Primary gradient (buttons, active tabs) */
export const SMARTHR_GRADIENT_PRIMARY =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]";

/** Header “cloud” primary — dark shell */
export const SMARTHR_HEADER_PRIMARY_BTN_DARK = cnClasses(
  "border-white/12",
  SMARTHR_GRADIENT_PRIMARY_INLINE,
  "text-white",
  "hover:brightness-[1.05]",
  SMARTHR_FOCUS_RING_ACCENT_50,
);

/** Header “cloud” primary — light shell */
export const SMARTHR_HEADER_PRIMARY_BTN_LIGHT = cnClasses(
  "border-[#FF6F28]/35",
  SMARTHR_GRADIENT_PRIMARY_INLINE,
  "text-white",
  "hover:brightness-[1.03]",
  SMARTHR_FOCUS_RING_ACCENT_50,
);

/** Page column canvas */
export const SMARTHR_PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";

/** Card radius — matches template `border-radius-xl` (~8px) */
export const SMARTHR_RADIUS_CARD = "rounded-[8px]";

/** Default elevated card shadow */
export const SMARTHR_SHADOW_CARD = "shadow-[0_1px_1px_rgba(0,0,0,0.12)]";

/** Slightly softer shadow (sidebar brand tile, compact surfaces) */
export const SMARTHR_SHADOW_CARD_SOFT = "shadow-[0_1px_1px_rgba(0,0,0,0.08)]";

/** Default SmartHR border (Tailwind `--color-borderColor`) */
export const SMARTHR_BORDER_DEFAULT = "border-[#E5E7EB]";

/** Primary white card */
export const SMARTHR_CARD = cnClasses(
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white",
  SMARTHR_SHADOW_CARD,
);

/** Inset metric / filter well */
export const SMARTHR_WELL = cnClasses(
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#f8f9fa]",
  "shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]",
);

/** Eyebrow / section kicker */
export const SMARTHR_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";

export const SMARTHR_TITLE = "text-[#1f1f1f]";
export const SMARTHR_BODY = "text-[#6B7280]";
export const SMARTHR_MUTED = "text-[#6B7280]";

/** Form controls — light surfaces */
export const SMARTHR_INPUT = cnClasses(
  "min-h-10 w-full",
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
  "placeholder:text-[#6B7280] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25",
);

export const SMARTHR_TEXTAREA = `${SMARTHR_INPUT} min-h-[7rem] resize-y py-3 leading-relaxed`;

export const SMARTHR_SELECT = `${SMARTHR_INPUT} cursor-pointer appearance-none`;

/** Secondary button — white chip */
export const SMARTHR_BTN_SECONDARY =
  "border-[#E5E7EB] bg-white font-semibold text-[#575757] shadow-sm hover:bg-[#f8f9fa]";

/** Accent rail (page hero) */
export const SMARTHR_ACCENT_RAIL =
  "h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#FF6F28] to-[#FF5325]";

/** Table shell */
export const SMARTHR_TABLE_WRAP = cnClasses(
  "overflow-hidden",
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white",
  "shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
);

export const SMARTHR_TABLE = "w-full border-collapse text-left text-[14px] text-[#1f1f1f]";

export const SMARTHR_TABLE_HEAD_ROW = cnClasses(
  "border-b",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#f8f9fa] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#637381]",
);

export const SMARTHR_TABLE_CELL = "px-3 py-3 align-middle";
export const SMARTHR_TABLE_ROW = cnClasses(
  "border-b",
  SMARTHR_BORDER_DEFAULT,
  "transition hover:bg-[#fafafa] last:border-b-0",
);

/** Main column padding (inside AppShell) */
export const SMARTHR_MAIN_PADDING =
  "flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10";

/* --- App shell header (Tailwind `index.html`: `h-[50px] bg-white border-b border-gray-200`) --- */

/** Sticky top bar — light SmartHR border; dark variant when `html.dark` */
export const SMARTHR_SHELL_HEADER = cnClasses(
  "sticky top-0 z-20 antialiased backdrop-blur-xl",
  "border-b",
  SMARTHR_BORDER_DEFAULT,
  "bg-white/[0.98] text-[#1f1f1f] shadow-[0_1px_0_rgba(15,23,42,0.06)]",
  "dark:border-white/10 dark:bg-[rgb(8_20_32)]/78 dark:text-[#F8FAFC] dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]",
);

/** Inner header row — template `px-[15px]` / `sm:px-[30px]`, ~50px bar */
export const SMARTHR_HEADER_BAR_PADDING = "px-[15px] sm:px-[30px]";

export const SMARTHR_HEADER_BAR_MIN_H = "min-h-[50px]";

/** Kicker line (household / module) — template `text-gray-500` + tight caps */
export const SMARTHR_HEADER_KICKER = cnClasses(
  "truncate text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#6B7280]",
  "dark:text-zinc-500",
);

/** Primary title in header */
export const SMARTHR_HEADER_TITLE = cnClasses(
  "truncate font-semibold tracking-tight text-[#1f1f1f] dark:text-zinc-50",
);

/** Secondary line under title */
export const SMARTHR_HEADER_SUBTITLE = cnClasses(
  "truncate text-xs font-medium text-[#6B7280] dark:text-zinc-400",
);

/** Template `btn-menubar` — light shell */
export const SMARTHR_HEADER_ICON_BTN_LIGHT = cnClasses(
  "rounded-[5px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white text-[#6B7280] shadow-sm transition",
  "hover:bg-[#E8E9EA] hover:text-[#111827] hover:border-[#D1D5DB]",
);

/** Light header control — pressed state */
export const SMARTHR_HEADER_ICON_BTN_LIGHT_PRESS = cnClasses(
  SMARTHR_HEADER_ICON_BTN_LIGHT,
  "active:bg-[#E8E9EA]",
);

/** Muted field-style control — light shell (Lock, etc.) */
export const SMARTHR_HEADER_SOFT_BTN_LIGHT = cnClasses(
  SMARTHR_HEADER_ICON_BTN_LIGHT,
  "bg-[#F8F9FA]",
);

/** Glass chip — dark shell column over gradient */
export const SMARTHR_HEADER_ICON_BTN_DARK = cnClasses(
  "rounded-[5px] border border-white/12 bg-white/[0.06] text-zinc-100 transition",
  "hover:bg-white/10",
);

/** Mobile primary nav strip — light well under header */
export const SMARTHR_MOBILE_NAV_WELL = cnClasses(
  "rounded-[5px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#F8F9FA] shadow-inner",
  "dark:border-white/[0.08] dark:bg-[#14171c]/80",
);

/** Top edge only — sheet footers */
export const SMARTHR_BORDER_TOP = cnClasses("border-t", SMARTHR_BORDER_DEFAULT);

/** Mobile drawer / bottom sheet — dark shell */
export const SMARTHR_MOBILE_SHEET_SURFACE_DARK = "border-b border-white/[0.08] bg-[#1c2028]";

/** Mobile drawer / bottom sheet — light shell */
export const SMARTHR_MOBILE_SHEET_SURFACE_LIGHT = cnClasses(
  "border-b",
  SMARTHR_BORDER_DEFAULT,
  "bg-white",
);

/** Sticky bar inside mobile sheet — light */
export const SMARTHR_MOBILE_SHEET_HEADER_LIGHT = cnClasses(
  "border-b",
  SMARTHR_BORDER_DEFAULT,
  "bg-white",
);

/** Sticky bar inside mobile sheet — dark */
export const SMARTHR_MOBILE_SHEET_HEADER_DARK = SMARTHR_MOBILE_SHEET_SURFACE_DARK;

/** Bottom sheet — dark / light (top edge + shadow) */
export const SMARTHR_MOBILE_SHEET_BOTTOM_DARK =
  "border-t border-white/[0.08] bg-[#1c2028] shadow-[0_-8px_30px_rgba(0,0,0,0.35)]";

export const SMARTHR_MOBILE_SHEET_BOTTOM_LIGHT = cnClasses(
  SMARTHR_BORDER_TOP,
  "bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)]",
);

/* --- Dashboard hub (composed on top of SMARTHR_CARD) --- */

export const SMARTHR_HUB_CARD_TITLE =
  "text-[17px] font-semibold leading-snug tracking-tight text-[#1f1f1f] sm:text-[18px]";

export const SMARTHR_HUB_MUTED = "text-[13px] text-[#6B7280]";

export const SMARTHR_HUB_WIDGET_ICON = cnClasses(
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12",
  "bg-[rgba(254,159,67,0.2)] text-[#FE9F43]",
);

/* --- Dashboard Home (light; survives `html.dark` on Home only via parent) --- */

export const SMARTHR_DASH_HOME_CARD = cnClasses(
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "border-l-[3px] border-l-[#FE9F43]/35",
  "bg-white",
  SMARTHR_SHADOW_CARD_SOFT,
  "px-3.5 py-3 sm:px-4 sm:py-3.5",
);

/** Divider between member scope row and status / actions */
export const SMARTHR_DASH_HOME_SCOPE_DIVIDER = cnClasses(
  "mt-1.5 border-t pt-3 sm:mt-2 sm:pt-3.5",
  SMARTHR_BORDER_DEFAULT,
);

/** Eyebrow for kitchen duty, glance metrics, etc. */
export const SMARTHR_DASH_KICKER = "text-[11px] font-bold uppercase tracking-[0.12em] text-[#637381]";

export const SMARTHR_DASH_STATUS_DATE = "text-[12px] leading-snug text-[#6B7280] sm:text-[13px]";

export const SMARTHR_DASH_STATUS_TIME =
  "mt-0.5 text-[16px] font-semibold tabular-nums leading-snug text-[#1f1f1f] sm:text-[17px]";

export const SMARTHR_DASH_QUICK_ADD_BTN = cnClasses(
  "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-transparent px-3 py-2 text-[13px] font-semibold text-white",
  SMARTHR_GRADIENT_PRIMARY_INLINE,
  "shadow-[0_4px_14px_rgba(242,101,34,0.22)] transition duration-150 ease-out hover:brightness-[1.03]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/45 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_TOOL_BTN = cnClasses(
  "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white px-3 py-2 text-[12px] font-semibold text-[#1f1f1f] shadow-sm transition duration-150 ease-out hover:bg-[#fafafa]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_ICON_BTN = cnClasses(
  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white text-[#1f1f1f] shadow-sm transition hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_KITCHEN_CARD = cnClasses(
  SMARTHR_RADIUS_CARD,
  "border border-[#FE9F43]/40 bg-white",
  SMARTHR_SHADOW_CARD,
  "px-4 py-2.5 sm:px-5 sm:py-3",
);

export const SMARTHR_DASH_KITCHEN_ICON_WRAP = cnClasses(
  "flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-[8px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white text-[#F26522] shadow-sm",
);

export const SMARTHR_DASH_ACCENT_RAIL_NEUTRAL = "w-1 shrink-0 self-stretch rounded-full bg-[#E5E7EB]";

export const SMARTHR_DASH_WELL_METRIC = cnClasses(
  SMARTHR_WELL,
  "min-h-[68px] min-w-0 flex-1 p-2.5 shadow-sm transition sm:min-w-[112px]",
  "hover:border-[#D1D5DB] hover:bg-white hover:shadow-[0_1px_1px_rgba(0,0,0,0.1)]",
);

export const SMARTHR_DASH_WELL_METRIC_BUTTON = cnClasses(
  SMARTHR_DASH_WELL_METRIC,
  "cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_METRIC_VALUE_DEFAULT =
  "mt-1 text-[18px] font-semibold tabular-nums leading-none tracking-tight text-[#1f1f1f] sm:text-[19px]";

export const SMARTHR_DASH_METRIC_VALUE_ATTENTION =
  "mt-1 text-[18px] font-semibold tabular-nums leading-none tracking-tight text-[#F26522] sm:text-[19px]";

export const SMARTHR_DASH_ATTENTION_DETAIL = "mt-1 text-[11px] font-semibold leading-snug text-[#c2410c]";

export const SMARTHR_DASH_BACKUP_CALLOUT = cnClasses(
  "mt-3 flex flex-col gap-2 rounded-[8px] border border-dashed border-[#FE9F43]/40 bg-[#fef0e9] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
);

export const SMARTHR_DASH_BACKUP_CALLOUT_TEXT = "text-[13px] leading-snug text-[#575757]";

export const SMARTHR_DASH_BACKUP_CALLOUT_BTN = cnClasses(
  "shrink-0 rounded-[8px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white px-3 py-2 text-[12px] font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40",
);

/** Date/time readout — compact “status” surface */
export const SMARTHR_DASH_STATUS_WELL = cnClasses(
  "min-w-0 rounded-[8px] border px-3 py-2 text-center sm:text-left",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#F8F9FA] sm:bg-white sm:shadow-sm",
);

/** Session / active member chip */
export const SMARTHR_DASH_MEMBER_CHIP = cnClasses(
  "flex max-w-[13rem] items-center gap-1 rounded-[8px] border py-1 pl-2 pr-1.5",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#F8F9FA]",
);

export const SMARTHR_DASH_MEMBER_NAME = cnClasses("truncate text-[12px] font-semibold", SMARTHR_TITLE);

export const SMARTHR_DASH_PILL_CAPTION = cnClasses(
  "shrink-0 rounded-md border bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#637381]",
  SMARTHR_BORDER_DEFAULT,
);

/** Muted icon on light dashboard chips (Scan, etc.) */
export const SMARTHR_DASH_ICON_MUTED = "text-[#637381]";

/** Long-form empty states / helper copy */
export const SMARTHR_DASH_BODY_PARAGRAPH = "text-[14px] leading-relaxed text-[#575757]";

export const SMARTHR_DASH_LINK_ACCENT = cnClasses(
  "rounded-sm text-[13px] font-semibold text-[#F26522] underline-offset-2 hover:underline",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_LINK_MUTED = cnClasses(
  "rounded-sm text-[13px] font-semibold text-[#637381] underline-offset-2 hover:underline",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6F28]/35 focus-visible:ring-offset-2",
);

export const SMARTHR_DASH_CHECKLIST_META = "mt-1 text-[13px] tabular-nums text-[#575757]";

export const SMARTHR_DASH_KITCHEN_SUBLINE_STRONG = "font-semibold text-[#F26522]";

export const SMARTHR_DASH_KITCHEN_HEADLINE_DEFAULT =
  "mt-1 text-[14px] font-semibold leading-snug text-[#1f1f1f] sm:text-[15px]";

export const SMARTHR_DASH_KITCHEN_HEADLINE_MUTED =
  "mt-1 text-[14px] font-semibold leading-snug text-[#637381] sm:text-[15px]";

export const SMARTHR_DASH_KITCHEN_HEADLINE_SUCCESS =
  "mt-1 text-[14px] font-semibold leading-snug text-emerald-700 sm:text-[15px]";

export const SMARTHR_DASH_GLANCE_SECTION = cnClasses(SMARTHR_CARD, "px-4 py-3.5 sm:px-5 sm:py-4");

/* --- Hub widgets on Home (light; pair with `hubCardClass` / SMARTHR_CARD) --- */

export const SMARTHR_HUB_FOOTER_DIVIDER = cnClasses("mt-4 border-t pt-3", SMARTHR_BORDER_TOP);

/** Pantry search — same treatment as {@link SMARTHR_INPUT}, room for leading icon */
export const SMARTHR_HUB_SEARCH_INPUT = cnClasses(
  SMARTHR_INPUT,
  "py-2 pl-9 pr-3 text-[15px] shadow-inner",
);

/** Dense grid tile (pantry preview) */
export const SMARTHR_HUB_TILE = cnClasses(
  SMARTHR_RADIUS_CARD,
  "border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white p-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.08)] transition hover:border-[#D1D5DB]",
);

export const SMARTHR_HUB_TILE_TITLE = cnClasses("min-w-0 truncate text-[14px] font-semibold", SMARTHR_TITLE);

export const SMARTHR_HUB_TILE_QTY = cnClasses(
  "mt-2 text-[20px] font-semibold tabular-nums leading-none sm:text-[22px]",
  SMARTHR_TITLE,
);

export const SMARTHR_HUB_NOTE_TINY = "mt-1 line-clamp-2 text-[11px] text-[#6B7280]";

/** Shopping category tabs */
export const SMARTHR_HUB_TABLIST_DIVIDER = cnClasses(
  "mt-3 flex flex-wrap gap-1 border-b pb-2",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_TAB_BUTTON = cnClasses(
  "min-h-9 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
);

export const SMARTHR_HUB_TAB_ACTIVE = cnClasses(
  SMARTHR_GRADIENT_PRIMARY_INLINE,
  "text-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
);

export const SMARTHR_HUB_TAB_IDLE = "text-[#6B7280] hover:bg-[#f7f7f7]";

export const SMARTHR_HUB_LIST_SHELL = cnClasses(SMARTHR_RADIUS_CARD, "border", SMARTHR_BORDER_DEFAULT, SMARTHR_SHADOW_CARD);

export const SMARTHR_HUB_LIST_ROW = cnClasses(
  "flex items-start gap-2 border-b px-2.5 py-2 last:border-b-0",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_CHECKBOX_SLOT = cnClasses(
  "mt-0.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_CHECKBOX = cnClasses(
  "h-4 w-4 cursor-pointer rounded border text-[#F26522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_STORE_BADGE = cnClasses(
  "shrink-0 rounded-md border bg-[#f7f7f7] px-2 py-0.5 text-[12px] font-medium capitalize text-[#575757]",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_ITEM_TITLE = cnClasses("text-[15px] font-semibold", SMARTHR_TITLE);

/** Week strip nav */
export const SMARTHR_HUB_CHEVRON_BTN = cnClasses(
  "inline-flex h-9 w-9 items-center justify-center rounded-[8px] border bg-white text-[#4B5563] shadow-sm transition hover:bg-[#fafafa]",
  SMARTHR_BORDER_DEFAULT,
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40",
);

export const SMARTHR_HUB_MONTH_LABEL = cnClasses("min-w-[7rem] text-center text-[14px] font-semibold tabular-nums", SMARTHR_TITLE);

export const SMARTHR_HUB_DAY_CELL = cnClasses(
  "flex min-w-[5.25rem] shrink-0 flex-col rounded-[8px] border px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45",
);

export const SMARTHR_HUB_DAY_CELL_SELECTED =
  "border-[#FE9F43] bg-[#FEF0E9] shadow-[inset_0_2px_0_0_rgba(254,159,67,0.35)]";

export const SMARTHR_HUB_DAY_CELL_IDLE = cnClasses("border bg-white hover:border-[#D1D5DB]", SMARTHR_BORDER_DEFAULT);

export const SMARTHR_HUB_DAY_NUM_SELECTED = "text-[#c2410c]";

export const SMARTHR_HUB_DAY_NUM_IDLE = SMARTHR_TITLE;

export const SMARTHR_HUB_DAY_CAPTION =
  "mt-1 line-clamp-2 rounded-md bg-[#f7f7f7] px-1 py-0.5 text-[10px] font-medium leading-tight text-[#575757]";

/** Accent text links in hub headers (alias of dash link) */
export const SMARTHR_HUB_LINK_ACCENT = SMARTHR_DASH_LINK_ACCENT;

export const SMARTHR_HUB_EMPTY_WELL = cnClasses(
  "rounded-md border border-dashed px-3 py-6 text-center text-[14px]",
  SMARTHR_BORDER_DEFAULT,
  "bg-[#fafafa]",
  SMARTHR_HUB_MUTED,
);

export const SMARTHR_HUB_SURFACE_PRIMARY = cnClasses("rounded-md border px-3 py-2", SMARTHR_BORDER_DEFAULT, "bg-[#fafafa]");

export const SMARTHR_HUB_SURFACE_SHARED = "rounded-md border border-[#e8e8e8] bg-[#fbfbfb] px-3 py-2";

export const SMARTHR_HUB_SURFACE_MUTED =
  "rounded-md border border-[#E5E7EB]/70 bg-[#f4f4f4]/90 px-3 py-2 opacity-[0.92]";

export const SMARTHR_HUB_MSG_BELL_PRIMARY = "text-[#FE9F43]";

export const SMARTHR_HUB_MSG_BELL_MUTED = "text-[#b0b8c1]";

export const SMARTHR_HUB_PIN_LABEL = "ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#637381]";

export const SMARTHR_HUB_TITLE_SHARED = "text-[#242424]";

export const SMARTHR_HUB_TITLE_MUTED = "text-[#575757]";

export const SMARTHR_HUB_ASSIGNMENT_META = "text-[#637381]";

export const SMARTHR_HUB_ASSIGNMENT_META_SOFT = "text-[#6B7280]";

export const SMARTHR_HUB_ALERT_ROW_READ =
  "rounded-[8px] border border-[#E5E7EB]/70 bg-[#fafafa] text-[#575757]";

export const SMARTHR_HUB_CHORE_TRACKER_LINK = cnClasses(
  SMARTHR_DASH_LINK_ACCENT,
  "inline-flex min-h-11 min-w-[7.5rem] items-center justify-end gap-1 rounded-[8px] px-1",
);

export const SMARTHR_HUB_SECTION_OVERDUE = "mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#92400e]";

/** Inline “Past due” kicker on chore rows */
export const SMARTHR_HUB_CHORE_PAST_DUE_KICKER =
  "mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]";

export const SMARTHR_HUB_SECTION_DUE = cnClasses("mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]", "text-[#637381]");

export const SMARTHR_HUB_META_SEPARATOR = "text-[#d4d4d4]";

/** Chores status `<select>` — matches {@link SMARTHR_SELECT} density */
export const SMARTHR_HUB_CHORE_SELECT = cnClasses(SMARTHR_SELECT, "min-h-11 min-w-[9rem] text-[14px] font-medium");

/** Notifications panel — light shell */
export const SMARTHR_HUB_ALERT_HEADER = cnClasses("text-[15px] font-semibold tracking-tight", "text-[#637381]");

export const SMARTHR_HUB_ALERT_COUNT_BADGE =
  "rounded-md bg-[#E8E9EA] px-2 py-0.5 text-[13px] font-semibold tabular-nums text-[#1f1f1f]";

export const SMARTHR_HUB_ALERT_ICON_WRAP = cnClasses(
  "flex h-10 w-10 items-center justify-center rounded-[8px] border bg-[#F8F9FA]",
  SMARTHR_BORDER_DEFAULT,
  SMARTHR_BODY,
);

export const SMARTHR_HUB_ALERT_ROW_DEFAULT = cnClasses("rounded-[8px] border px-3 py-2", SMARTHR_BORDER_DEFAULT, "bg-[#f8f9fa]", SMARTHR_TITLE);

export const SMARTHR_HUB_ALERT_DISMISS = cnClasses(
  "min-h-10 shrink-0 rounded-[8px] px-3 py-2 text-[0.65rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "text-[#4B5563] hover:bg-[#f3f4f6] hover:text-[#1f1f1f]",
);

export const SMARTHR_HUB_ALERT_VIEW_ALL = cnClasses(
  "min-h-10 w-full rounded-[8px] border text-[15px] font-semibold",
  SMARTHR_BORDER_DEFAULT,
  "bg-white text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
);

export const SMARTHR_HUB_LAYOUT_EDIT_BTN = cnClasses(
  "min-h-11 w-full justify-center rounded-[8px] border bg-white font-semibold shadow-[0_1px_1px_rgba(0,0,0,0.12)] transition hover:bg-[#fafafa] sm:w-auto sm:min-w-[9rem]",
  SMARTHR_BORDER_DEFAULT,
  SMARTHR_TITLE,
);

export const SMARTHR_HUB_LAYOUT_DONE_BTN = cnClasses(
  "min-h-11 flex-1 rounded-[8px] border bg-white font-semibold shadow-sm transition hover:bg-[#fafafa] sm:flex-none",
  SMARTHR_BORDER_DEFAULT,
  SMARTHR_TITLE,
);

export const SMARTHR_HUB_LAYOUT_RESET_GHOST = "min-h-11 flex-1 font-semibold text-[#575757] hover:bg-[#f0f0f0] sm:flex-none";

export const SMARTHR_HUB_LAYOUT_ROW_WELL = cnClasses(
  "flex flex-col gap-3 rounded-[8px] border bg-[#fafafa] p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:p-3.5",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_LAYOUT_DRAG_RING = "ring-2 ring-[#FE9F43]/55 ring-offset-2 ring-offset-[#f7f7f7]";

export const SMARTHR_HUB_LAYOUT_GRIP_ACTIVE = cnClasses(
  "flex shrink-0 touch-none flex-col justify-center rounded-[6px] border bg-white px-1 py-2 shadow-sm select-none cursor-grab text-[#637381] hover:border-[#FE9F43]/40 hover:text-[#F26522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/55 active:cursor-grabbing",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_LAYOUT_GRIP_DISABLED = "cursor-not-allowed border-[#E5E7EB]/80 bg-[#f5f5f5] text-[#b0b0b0]";

export const SMARTHR_HUB_LAYOUT_CHECKBOX = cnClasses(
  "mt-1 h-5 w-5 shrink-0 rounded border text-[#F26522] focus:ring-2 focus:ring-[#FE9F43]/55 focus:ring-offset-2 focus:ring-offset-[#fafafa]",
  SMARTHR_BORDER_DEFAULT,
);

export const SMARTHR_HUB_LAYOUT_ICON_BTN = cnClasses(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border bg-white shadow-sm transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/55 disabled:opacity-35",
  SMARTHR_BORDER_DEFAULT,
  SMARTHR_TITLE,
);

export const SMARTHR_HUB_LAYOUT_SELECT = cnClasses(
  SMARTHR_SELECT,
  "min-h-11 min-w-[9.5rem] px-2.5 py-2 text-[13px] font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-45",
);

/** Weekly reset / metric strip — primary module icon */
export const SMARTHR_HUB_METRIC_ICON = "h-4 w-4 text-[#F26522]";

export const SMARTHR_HUB_WEEKLY_WELL = cnClasses(
  SMARTHR_WELL,
  "p-3 shadow-[0_1px_1px_rgba(0,0,0,0.08)]",
);

/** Nav row base — callers add padding / collapsed layout */
export const SMARTHR_SIDEBAR_NAV_ROW_BASE = cnClasses(
  "group relative flex min-h-10 w-full items-center rounded-[5px] text-left text-[clamp(0.95rem,1.05vw,1.1rem)] font-extrabold leading-normal transition-all duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2",
  SMARTHR_FOCUS_RING_ACCENT_40,
  "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
);

export const SMARTHR_SIDEBAR_ACTIVE_BG =
  "bg-[var(--fs-sidebar-active-bg,rgba(254,159,67,0.08))]";

export const SMARTHR_SIDEBAR_ACTIVE_TEXT =
  "text-[var(--fs-sidebar-active-text,#FE9F43)]";

/** Template `hover:bg-dark-transparent` — subtle row wash */
export const SMARTHR_ROW_HOVER_WASH = "hover:bg-[#E8E9EA]";

export const SMARTHR_SIDEBAR_ROW_HOVER = SMARTHR_ROW_HOVER_WASH;

/** Full-width row in mobile module picker — light idle */
export const SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE = cnClasses(
  "border border-transparent bg-[#F8F9FA] text-[#4B5563]",
  SMARTHR_ROW_HOVER_WASH,
  "hover:border-[#D1D5DB]",
);

/** Active row — peach wash + accent text + light ring (template primary cue) */
export const SMARTHR_SIDEBAR_ACTIVE_ROW = cnClasses(
  SMARTHR_SIDEBAR_ACTIVE_BG,
  SMARTHR_SIDEBAR_ACTIVE_TEXT,
  "shadow-[0_1px_2px_rgba(242,101,34,0.08)] ring-1 ring-inset ring-[#F26522]/12",
);

export const SMARTHR_SIDEBAR_ASIDE = cnClasses(
  "hidden shrink-0 flex-col border-r",
  SMARTHR_BORDER_DEFAULT,
  "bg-white antialiased transition-[width,padding] duration-200 ease-out md:flex",
);

export const SMARTHR_SIDEBAR_BRAND_CARD = cnClasses(
  "mb-4 flex border",
  SMARTHR_RADIUS_CARD,
  SMARTHR_BORDER_DEFAULT,
  "bg-white",
  SMARTHR_SHADOW_CARD_SOFT,
);

export const SMARTHR_SIDEBAR_LOGO_TILE = cnClasses(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px]",
  SMARTHR_GRADIENT_PRIMARY_INLINE,
  "text-white shadow-sm",
);

export const SMARTHR_SIDEBAR_TOGGLE_BTN = cnClasses(
  "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[5px] border",
  SMARTHR_BORDER_DEFAULT,
  "bg-white text-[#6B7280] shadow-sm transition",
  "hover:bg-[#E8E9EA] hover:text-[#111827] hover:border-[#D1D5DB] focus-visible:outline-none focus-visible:ring-2",
  SMARTHR_FOCUS_RING_ACCENT_40,
  "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
);

export const SMARTHR_SIDEBAR_DIVIDER = cnClasses("border-t", SMARTHR_BORDER_DEFAULT);

export const SMARTHR_SIDEBAR_GROUP_LABEL =
  "mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]";

export const SMARTHR_SIDEBAR_COLLAPSED_RULE = "mx-auto mb-2 h-px w-8 bg-[#E5E7EB]";

export const SMARTHR_SIDEBAR_TEXT_PRIMARY =
  "text-[16px] font-semibold tracking-tight text-[#1f1f1f]";

export const SMARTHR_SIDEBAR_TEXT_TAGLINE = "text-[12px] font-medium text-[#637381]";

export const SMARTHR_SIDEBAR_TEXT_HOUSEHOLD = "truncate text-[13px] font-medium text-[#4B5563]";

export const SMARTHR_SIDEBAR_ICON_MUTED = "text-[var(--fs-text-muted,#637381)]";

export const SMARTHR_SIDEBAR_ICON_NAV = "text-[#4B5563]";

/** Inactive row label + icon hover (sidebar) */
export const SMARTHR_SIDEBAR_ROW_LABEL_IDLE = SMARTHR_SIDEBAR_ICON_NAV;

export const SMARTHR_SIDEBAR_ICON_GROUP_HOVER = "group-hover:text-[#4B5563]";
