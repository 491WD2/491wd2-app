import type { PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

/** Semantic accents — all tuned for dark admin panels */
export type BadgeTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple";

const tones: Record<BadgeTone, string> = {
  neutral:
    "border-white/[0.12] bg-white/[0.06] text-[#CBD5E1]",
  blue: "border-[#2388C8]/40 bg-[#2388C8]/14 text-[#bae6fd]",
  green: "border-[#22C55E]/40 bg-[#22C55E]/12 text-[#bbf7d0]",
  amber: "border-[#FFB900]/45 bg-[#FFB900]/12 text-[#fde68a]",
  red: "border-[#E2504E]/45 bg-[#E2504E]/12 text-[#fecaca]",
  purple: "border-[#7C3AED]/40 bg-[#7C3AED]/14 text-[#e9d5ff]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
