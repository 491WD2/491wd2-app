import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

/** Section title inside a card or panel */
export function SectionHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[17px] font-semibold tracking-tight text-[#F8FAFC] sm:text-[18px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[16px] leading-relaxed text-[#94A3B8]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
