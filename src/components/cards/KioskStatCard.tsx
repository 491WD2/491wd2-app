import { cn } from "../../lib/utils";
import type { CardCategory } from "../../types/cards";
import { KioskCard } from "./KioskCard";

export type KioskStatCardProps = {
  label: string;
  value: number | string;
  emoji?: string;
  category?: CardCategory;
  className?: string;
  analyticsSurface?: string;
};

/**
 * Large metric tile for member dashboards and hub summaries.
 */
export function KioskStatCard({
  label,
  value,
  emoji,
  category = "member-tasks",
  className,
  analyticsSurface,
}: KioskStatCardProps) {
  return (
    <KioskCard
      category={category}
      title={String(value)}
      subtitle={label}
      emoji={emoji}
      analyticsSurface={analyticsSurface}
      className={cn("fh-kiosk-stat", className)}
    />
  );
}
