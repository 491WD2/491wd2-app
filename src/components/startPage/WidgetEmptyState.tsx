import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetEmptyStateProps = {
  children: ReactNode;
  className?: string;
};

/** Soft inset empty panel for Start Page widgets. */
export function WidgetEmptyState({ children, className }: WidgetEmptyStateProps) {
  return <p className={cn("fh-start-widget__empty fh-pro-empty", className)}>{children}</p>;
}
