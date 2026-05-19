import { useEffect, useRef } from "react";
import { trackPerformance } from "../lib/kioskAnalytics";

/** Samples schedule-driven paint timing without blocking store updates. */
export function useKioskSchedulePerf(scheduleVersion: unknown) {
  const prev = useRef(scheduleVersion);

  useEffect(() => {
    if (prev.current === scheduleVersion) {
      return;
    }
    prev.current = scheduleVersion;
    const start = performance.now();
    const frame = requestAnimationFrame(() => {
      const ms = Math.round(performance.now() - start);
      if (ms >= 4) {
        trackPerformance("chores:shell", "schedule_paint", ms);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [scheduleVersion]);
}
