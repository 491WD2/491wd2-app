import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type StatusBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: StatusBadgeTone;
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
  ...rest
}: StatusBadgeProps) {
  return (
    <span
      className={cn("fh-widget-badge", `fh-widget-badge--${tone}`, className)}
      {...rest}
    >
      {children}
    </span>
  );
}
