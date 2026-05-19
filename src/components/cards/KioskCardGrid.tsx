import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import "./kiosk.css";

export type KioskGridColumns = 1 | 2 | 3 | 4;

export type KioskCardGridProps = {
  children: ReactNode;
  columns?: KioskGridColumns;
  className?: string;
  as?: "ul" | "div";
  "aria-label"?: string;
};

/**
 * Responsive kiosk card grid — 1 col mobile, 2 tablet, 3–4 desktop.
 */
export function KioskCardGrid({
  children,
  columns = 2,
  className,
  as: Tag = "ul",
  "aria-label": ariaLabel,
}: KioskCardGridProps) {
  return (
    <Tag
      className={cn(
        "fh-kiosk-grid",
        columns >= 2 && "fh-kiosk-grid--2",
        columns >= 3 && "fh-kiosk-grid--3",
        columns >= 4 && "fh-kiosk-grid--4",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  );
}
