import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetFooterProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/** Footer / meta chip row for Start Page widgets. */
export function WidgetFooter({ children, className, "aria-label": ariaLabel }: WidgetFooterProps) {
  return (
    <footer className={cn("fh-start-widget__footer", className)} aria-label={ariaLabel}>
      {children}
    </footer>
  );
}

export type WidgetMetaChipProps = {
  children: ReactNode;
  className?: string;
};

export function WidgetMetaChip({ children, className }: WidgetMetaChipProps) {
  return <span className={cn("fh-start-widget__meta-chip", className)}>{children}</span>;
}
