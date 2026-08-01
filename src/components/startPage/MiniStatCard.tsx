import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type MiniStatCardTone = "aqua" | "mint" | "blue" | "amber";

export type MiniStatCardProps = {
  value: ReactNode;
  label: string;
  tone?: MiniStatCardTone;
  className?: string;
};

/** Compact metric tile for Start Page widgets (Pantry / Fridge / Freezer). */
export function MiniStatCard({
  value,
  label,
  tone = "aqua",
  className,
}: MiniStatCardProps) {
  return (
    <div className={cn("fh-pro-stat fh-mini-stat", `fh-mini-stat--${tone}`, className)}>
      <strong className="fh-mini-stat__value">{value}</strong>
      <span className="fh-mini-stat__label">{label}</span>
    </div>
  );
}
