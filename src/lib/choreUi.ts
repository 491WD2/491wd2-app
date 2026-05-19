/**
 * Chore kiosk UI tokens — Tailwind utilities layered on `wd-chore-hh*` CSS.
 * Palette: #FFD522 #FF4B6C #C516E1 #735DFF #1D1136 #FFFFFF
 */

export function choreCn(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(" ");
}

/** BEM-style class map — single source for chore shell markup */
export const choreClasses = {
  root: "wd-chore-hh",
  btn: "wd-chore-hh__btn",
  btnPrimary: "wd-chore-hh__btn wd-chore-hh__btn--primary",
  btnGhost: "wd-chore-hh__btn wd-chore-hh__btn--ghost",
  btnSuccess: "wd-chore-hh__btn wd-chore-hh__btn--success",
  btnAccent: "wd-chore-hh__btn wd-chore-hh__btn--accent",
  card: "wd-chore-hh__card",
  cardCompact: "wd-chore-hh__card wd-chore-hh__card--compact",
  cardDone: "wd-chore-hh__card--done",
  cardCompleting: "wd-chore-hh__card--completing",
  tab: "wd-chore-hh__tab",
  tabActive: "wd-chore-hh__tab wd-chore-hh__tab--active",
  segBtn: "wd-chore-hh__seg-btn",
  segBtnActive: "wd-chore-hh__seg-btn wd-chore-hh__seg-btn--active",
  dayPill: "wd-chore-hh__day-pill",
  dayPillActive: "wd-chore-hh__day-pill wd-chore-hh__day-pill--active",
  taskItem: "wd-chore-hh__task-item",
  taskItemCompleting: "wd-chore-hh__task-item wd-chore-hh__task-item--completing",
  modalBackdrop: "wd-chore-hh__modal-backdrop wd-chore-hh__modal-backdrop--open",
  modal: "wd-chore-hh__modal wd-chore-hh__modal--open",
  empty: "wd-chore-hh__empty",
  panelBadge: "wd-chore-hh__panel-badge",
  memberPanel: "wd-chore-hh__member-panel wd-chore-hh__member-panel--animated",
  dashboardGrid: "wd-chore-hh__dashboard-grid",
  cardDragging: "wd-chore-hh__card--dragging",
  cardSwiping: "wd-chore-hh__card--swiping",
  columnDropFlash: "wd-chore-hh__column--drop-flash",
  poolDropFlash: "wd-chore-hh__pool--drop-flash",
  statValuePop: "wd-chore-hh__stat-value--pop",
  toastExit: "wd-chore-hh__toast--exit",
  shellSynced: "wd-chore-hh--schedule-pulse",
} as const;

/** Layout shells */
export const choreLayout = {
  view: "wd-chore-hh__view max-w-6xl w-full mx-auto",
  viewGrid: "wd-chore-hh__view flex flex-col gap-4 md:gap-5 lg:gap-6 max-w-6xl w-full mx-auto",
  stats: "wd-chore-hh__stats grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4",
  panel: "wd-chore-hh__panel",
  taskList: "wd-chore-hh__task-list flex flex-col gap-3",
  sectionHead: "wd-chore-hh__section-head",
} as const;

/** Tailwind accents (use with household-* from tailwind.config) */
export const choreTw = {
  touch: "min-h-[76px] min-w-[76px]",
  heading: "text-household-ink font-black tracking-tight",
  subtext: "text-household-muted text-sm md:text-base",
  ctaRow: "flex flex-wrap gap-3 items-center",
  focusRing:
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-household-violet",
} as const;

export type ChoreCtaVariant = "primary" | "ghost" | "accent" | "success";

export function choreCtaClass(variant: ChoreCtaVariant): string {
  switch (variant) {
    case "primary":
      return choreClasses.btnPrimary;
    case "ghost":
      return choreClasses.btnGhost;
    case "accent":
      return choreClasses.btnAccent;
    case "success":
      return choreClasses.btnSuccess;
    default:
      return choreClasses.btn;
  }
}

export type ChoreStatAccent = "yellow" | "coral" | "magenta" | "violet";

export function choreStatClass(accent: ChoreStatAccent): string {
  return `wd-chore-hh__stat wd-chore-hh__stat--${accent}`;
}
