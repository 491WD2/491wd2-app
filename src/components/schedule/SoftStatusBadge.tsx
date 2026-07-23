import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type SoftStatusBadgeTone =
  | "neutral"
  | "blue"
  | "teal"
  | "green"
  | "lavender"
  | "peach"
  | "amber"
  | "rose"
  | "tentative";

export type SoftStatusBadgeProps = {
  children: ReactNode;
  tone?: SoftStatusBadgeTone;
  className?: string;
};

/** Small pastel status / category badge for schedule cards. */
export function SoftStatusBadge({
  children,
  tone = "neutral",
  className,
}: SoftStatusBadgeProps) {
  return (
    <span className={cn("fh-soft-badge", `fh-soft-badge--${tone}`, className)}>{children}</span>
  );
}
