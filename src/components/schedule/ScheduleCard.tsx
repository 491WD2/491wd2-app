import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { SoftStatusBadge, type SoftStatusBadgeTone } from "./SoftStatusBadge";

export type ScheduleCardTone =
  | "pastel-blue"
  | "pastel-teal"
  | "pastel-lavender"
  | "pastel-peach"
  | "pastel-green"
  | "pastel-slate"
  | "travel";

export type ScheduleCardProps = {
  title: string;
  meta?: string;
  tone?: ScheduleCardTone;
  badges?: Array<{ label: string; tone?: SoftStatusBadgeTone }>;
  tentative?: boolean;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
};

/** Pastel schedule / activity card used in upcoming lists and calendar side panels. */
export function ScheduleCard({
  title,
  meta,
  tone = "pastel-slate",
  badges,
  tentative = false,
  className,
  onClick,
  children,
}: ScheduleCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "fh-sched-card",
        `fh-sched-card--${tone}`,
        tentative && "fh-sched-card--tentative",
        className,
      )}
      onClick={onClick}
    >
      <div className="fh-sched-card__row">
        {badges?.map((badge) => (
          <SoftStatusBadge key={badge.label} tone={badge.tone ?? "neutral"}>
            {badge.label}
          </SoftStatusBadge>
        ))}
        {tentative ? <SoftStatusBadge tone="tentative">Tentative</SoftStatusBadge> : null}
      </div>
      <p className="fh-sched-card__title">{title}</p>
      {meta ? <p className="fh-sched-card__meta">{meta}</p> : null}
      {children}
    </button>
  );
}
