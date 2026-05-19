import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type LandscapeHintProps = {
  className?: string;
};

const DISMISS_KEY = "familysite-491:landscape-hint:dismissed";

export function LandscapeHint({ className }: LandscapeHintProps) {
  const [dismissed, setDismissed] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const query = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : window.matchMedia(
            // Tablet-sized portrait only (avoid phone + desktop landscape).
            "(min-width: 640px) and (max-width: 1199px) and (orientation: portrait)",
          ),
    [],
  );

  useEffect(() => {
    if (!query) return;

    const apply = () => setEligible(query.matches);
    apply();

    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [query]);

  if (dismissed || !eligible) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-950/[0.03] backdrop-blur-[2px]",
        className,
      )}
      role="note"
      aria-label="Landscape hint"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Rotate for workstation view</p>
          <p className="mt-1 text-sm text-slate-600">
            Landscape gives you the full Home layout.
          </p>
        </div>
        <button
          type="button"
          className="motion-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => {
            setDismissed(true);
            try {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              // ignore
            }
          }}
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

