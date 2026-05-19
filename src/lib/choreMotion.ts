/** Chore kiosk motion timings (ms) — keep in sync with CSS. */
export const CHORE_TOAST_AUTO_MS = 4200;
export const CHORE_TOAST_EXIT_MS = 280;
export const CHORE_COMPLETE_MS = 520;
export const CHORE_ASSIGN_FLASH_MS = 480;
export const CHORE_SCHEDULE_PULSE_MS = 650;
export const CHORE_DROP_FLASH_MS = 520;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
