/**
 * Chore kiosk performance helpers — rAF batching, passive-friendly patterns.
 */

/** Schedule callback on next animation frame (cancels prior pending). */
export function scheduleAnimationFrame(
  ref: { current: number },
  fn: () => void,
): void {
  if (typeof requestAnimationFrame !== "function") {
    fn();
    return;
  }
  if (ref.current) {
    cancelAnimationFrame(ref.current);
  }
  ref.current = requestAnimationFrame(() => {
    ref.current = 0;
    fn();
  });
}

export function cancelScheduledFrame(ref: { current: number }): void {
  if (ref.current) {
    cancelAnimationFrame(ref.current);
    ref.current = 0;
  }
}
