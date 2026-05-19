import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { DS_CARD, DS_CARD_RAISED } from "../../lib/designSystem";

type CardTone = "light" | "premiumDark";

type CardProps = PropsWithChildren<{
  className?: string;
  /** Default is dark admin (`premiumDark`). Use `light` only for legacy/light surfaces. */
  tone?: CardTone;
  /** Use raised graphite surface */
  raised?: boolean;
}>;

export function Card({
  children,
  className,
  tone = "premiumDark",
  raised = false,
}: CardProps) {
  return (
    <section
      className={cn(
        tone === "premiumDark"
          ? cn(raised ? DS_CARD_RAISED : DS_CARD, "p-5 sm:p-6")
          : "motion-card rounded-[8px] border border-[#ededed] bg-[var(--fs-card-bg,#ffffff)] p-5 shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  eyebrow,
  action,
  tone = "premiumDark",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  tone?: CardTone;
}) {
  const dark = tone === "premiumDark";
  return (
    <div
      className={cn(
        "mb-5 flex items-start justify-between gap-4 pb-4",
        dark ? "border-b border-white/[0.08]" : "border-b border-[#ededed]",
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={cn(
              "mb-1 text-[13px] font-semibold uppercase tracking-[0.12em]",
              dark ? "text-[#64748B]" : "text-[var(--fs-text-muted,#637381)]",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-[17px] font-semibold tracking-tight sm:text-[18px]",
            dark ? "text-[#F8FAFC]" : "text-[var(--fs-text,#1f1f1f)]",
          )}
        >
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
