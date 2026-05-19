import type { ReactNode } from "react";
import { SMARTHR_BODY, SMARTHR_LABEL, SMARTHR_TITLE } from "../../lib/smarthrUi";
import { cn } from "../../lib/utils";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  /** `dark` = graphite hero (legacy). `smarthr` = light household page header. */
  variant?: "dark" | "smarthr";
};

/** Page-level title block — use inside main content */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  variant = "dark",
}: Props) {
  const smarthr = variant === "smarthr";

  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-4 pb-6",
        smarthr ? "border-b border-[#ededed]" : "border-b border-white/[0.08]",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={cn(
              "mb-1 text-[13px] font-semibold uppercase tracking-[0.12em]",
              smarthr ? SMARTHR_LABEL : "text-[#64748B]",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight",
            smarthr ? SMARTHR_TITLE : "text-[#F8FAFC]",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-2 max-w-3xl text-[17px] leading-relaxed",
              smarthr ? SMARTHR_BODY : "text-[#94A3B8]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
