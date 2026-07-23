import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type StickyNoteVariant = "dark" | "blue" | "yellow" | "green";

export type StickyNoteProps = {
  title: string;
  dateLabel?: string;
  reason?: string;
  variant?: StickyNoteVariant;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
};

/**
 * School / No School sticky-note visual.
 * Dark = No School · Blue = Conferences · Yellow = Staff / prep · Green = First/Last day.
 */
export function StickyNote({
  title,
  dateLabel,
  reason,
  variant = "dark",
  className,
  onClick,
  children,
}: StickyNoteProps) {
  const body = (
    <>
      <p className="fh-sticky__title">{title}</p>
      {dateLabel ? <p className="fh-sticky__date">{dateLabel}</p> : null}
      {children}
      {reason ? <p className="fh-sticky__reason">{reason}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn("fh-sticky", `fh-sticky--${variant}`, className)}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={cn("fh-sticky", `fh-sticky--${variant}`, className)}>{body}</div>
  );
}
