import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { cancelScheduledFrame, scheduleAnimationFrame } from "../lib/chorePerf";
import { trackSwipe } from "../lib/kioskAnalytics";
import { prefersReducedMotion } from "../lib/choreMotion";

const SWIPE_THRESHOLD_PX = 48;
const SWIPE_MAX_VERTICAL_PX = 40;
const SWIPE_VISUAL_MAX_PX = 72;

export function useChoreSwipe({
  surface,
  onSwipeLeft,
  onSwipeRight,
}: {
  surface: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);

  useEffect(() => () => cancelScheduledFrame(rafRef), []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    startRef.current = { x: touch.clientX, y: touch.clientY };
    setOffsetX(0);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const start = startRef.current;
    const touch = e.touches[0];
    if (!start || !touch || prefersReducedMotion()) {
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > SWIPE_MAX_VERTICAL_PX) {
      return;
    }
    if (!onSwipeLeft && dx > 0) {
      return;
    }
    if (!onSwipeRight && dx < 0) {
      return;
    }
    const clamped =
      dx < 0
        ? Math.max(dx, -SWIPE_VISUAL_MAX_PX)
        : Math.min(dx, SWIPE_VISUAL_MAX_PX);
    scheduleAnimationFrame(rafRef, () => setOffsetX(clamped));
  }, [onSwipeLeft, onSwipeRight]);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      setOffsetX(0);
      const touch = e.changedTouches[0];
      if (!start || !touch) {
        return;
      }
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) > SWIPE_MAX_VERTICAL_PX) {
        return;
      }
      if (dx <= -SWIPE_THRESHOLD_PX) {
        trackSwipe(surface, "left", onSwipeLeft ? "action" : "navigate");
        onSwipeLeft?.();
      } else if (dx >= SWIPE_THRESHOLD_PX) {
        trackSwipe(surface, "right", onSwipeRight ? "action" : "navigate");
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, surface],
  );

  const isSwiping = Math.abs(offsetX) > 8;

  return { onTouchStart, onTouchMove, onTouchEnd, offsetX, isSwiping };
}
