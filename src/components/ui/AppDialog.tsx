import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { GhostButton } from "./GhostButton";
import { PrimaryButton } from "./PrimaryButton";

export type AppDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  className?: string;
};

export function AppDialog({
  open,
  title,
  children,
  onClose,
  footer,
  primaryLabel,
  onPrimary,
  secondaryLabel = "Cancel",
  className,
}: AppDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="bd-dialog-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("bd-dialog", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bd-dialog__header">
          <h2 id={titleId} className="bd-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="bd-sticky-header__icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="bd-dialog__body">{children}</div>
        {footer ?? (primaryLabel || onPrimary) ? (
          <footer className="bd-dialog__footer">
            {footer ?? (
              <>
                <GhostButton type="button" onClick={onClose}>
                  {secondaryLabel}
                </GhostButton>
                {primaryLabel && onPrimary ? (
                  <PrimaryButton type="button" onClick={onPrimary}>
                    {primaryLabel}
                  </PrimaryButton>
                ) : null}
              </>
            )}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
