import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHelpMode } from "../lib/HelpModeContext";

export type HelpHintLayout = "block" | "inline";

const DELAY_MS = 1000;

type HelpHintProps = {
  title: string;
  description: string;
  placement?: "top" | "bottom";
  layout?: HelpHintLayout;
  /** When true, no tooltip is shown even if global help mode is on. */
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Hover + keyboard-focus tooltips when global help mode is on.
 * Tooltips appear after a short delay and hide immediately on leave, blur, or Escape.
 */
export function HelpHint({
  title,
  description,
  placement = "bottom",
  layout = "block",
  disabled = false,
  children,
}: HelpHintProps) {
  const { enabled } = useHelpMode();
  const reactId = useId();
  const tipId = `wd-help-tip-${reactId.replace(/:/g, "")}`;
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearShowTimer();
    setVisible(false);
  }, [clearShowTimer]);

  const scheduleShow = useCallback(() => {
    clearShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null;
      setVisible(true);
    }, DELAY_MS);
  }, [clearShowTimer]);

  useEffect(() => clearShowTimer, [clearShowTimer]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hide, visible]);

  if (disabled || !enabled) {
    return <>{children}</>;
  }

  const onFocusIn = () => {
    scheduleShow();
  };

  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) {
      return;
    }
    hide();
  };

  return (
    <div
      className={[
        "wd-help-hint",
        "wd-help-hint--on",
        `wd-help-hint--${placement}`,
        `wd-help-hint--layout-${layout}`,
        visible ? "wd-help-hint--visible" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-describedby={tipId}
      onMouseEnter={scheduleShow}
      onMouseLeave={hide}
      onFocusCapture={onFocusIn}
      onBlurCapture={onBlur}
    >
      {children}
      <div
        id={tipId}
        role="tooltip"
        className="wd-help-hint-pop"
        aria-hidden={!visible}
      >
        <strong className="wd-help-hint-pop__title">{title}</strong>
        <p className="wd-help-hint-pop__desc">{description}</p>
      </div>
    </div>
  );
}
