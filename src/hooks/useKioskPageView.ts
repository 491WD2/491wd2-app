import { useEffect, useRef } from "react";
import { trackKioskPageView } from "../lib/kioskAnalytics";

/** Records a page view once per mount / surface change. */
export function useKioskPageView(surface: string, metadata?: Record<string, string | number | boolean>) {
  const metaRef = useRef(metadata);
  metaRef.current = metadata;

  useEffect(() => {
    trackKioskPageView(surface, metaRef.current);
  }, [surface]);
}
