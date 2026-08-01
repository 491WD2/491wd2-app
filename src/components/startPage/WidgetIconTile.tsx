import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetIconTileTone = "blue" | "aqua" | "mint" | "amber" | "rose" | "violet";

export type WidgetIconTileProps = {
  children: ReactNode;
  tone?: WidgetIconTileTone;
  className?: string;
};

const TONE_CLASS: Record<WidgetIconTileTone, string> = {
  blue: "fh-icon-tile",
  aqua: "fh-icon-tile fh-icon-tile--aqua",
  mint: "fh-icon-tile fh-icon-tile--mint",
  amber: "fh-icon-tile fh-icon-tile--amber",
  rose: "fh-icon-tile fh-icon-tile--rose",
  violet: "fh-icon-tile fh-icon-tile--violet",
};

/** Colored icon tile used in Start Page widget headers. */
export function WidgetIconTile({ children, tone = "blue", className }: WidgetIconTileProps) {
  return (
    <span className={cn("fh-start-widget__icon", TONE_CLASS[tone], className)} aria-hidden>
      {children}
    </span>
  );
}
