import { useCallback, useEffect, useRef, useState } from "react";
import { useChoreShell } from "../../context/ChoreShellContext";
import { CHORE_TOAST_AUTO_MS, CHORE_TOAST_EXIT_MS } from "../../lib/choreMotion";
import { choreClasses, choreCn } from "../../lib/choreUi";

/** Sliding success/info toasts with enter + exit animations. */
export function ChoreToastStack() {
  const { toasts, dismissToast } = useChoreShell();
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const beginExit = useCallback(
    (id: string) => {
      const timers = timersRef.current;
      const pending = timers.get(id);
      if (pending) {
        clearTimeout(pending);
        timers.delete(id);
      }
      setExitingIds((s) => {
        if (s.has(id)) {
          return s;
        }
        const next = new Set(s).add(id);
        window.setTimeout(() => {
          dismissToast(id);
          setExitingIds((current) => {
            const cleared = new Set(current);
            cleared.delete(id);
            return cleared;
          });
        }, CHORE_TOAST_EXIT_MS);
        return next;
      });
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    for (const toast of toasts) {
      if (timers.has(toast.id) || exitingIds.has(toast.id)) {
        continue;
      }
      timers.set(
        toast.id,
        window.setTimeout(() => beginExit(toast.id), CHORE_TOAST_AUTO_MS),
      );
    }
    const activeIds = new Set(toasts.map((t) => t.id));
    for (const [id, handle] of timers) {
      if (!activeIds.has(id)) {
        clearTimeout(handle);
        timers.delete(id);
      }
    }
  }, [toasts, exitingIds, beginExit]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const handle of timers.values()) {
        clearTimeout(handle);
      }
      timers.clear();
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="wd-chore-hh__toasts" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const exiting = exitingIds.has(toast.id);
        return (
          <div
            key={toast.id}
            className={choreCn(
              "wd-chore-hh__toast",
              `wd-chore-hh__toast--${toast.tone}`,
              !exiting && "wd-chore-hh__toast--enter",
              exiting && choreClasses.toastExit,
            )}
          >
            {toast.tone === "success" ? (
              <span className="wd-chore-hh__toast-check" aria-hidden>
                ✓
              </span>
            ) : null}
            {toast.tone === "warning" ? (
              <span className="wd-chore-hh__toast-icon wd-chore-hh__toast-icon--sync" aria-hidden>
                ↻
              </span>
            ) : null}
            <span className="wd-chore-hh__toast-msg">{toast.message}</span>
            <button
              type="button"
              className="wd-chore-hh__toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => beginExit(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
