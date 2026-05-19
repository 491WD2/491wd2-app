import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { DS_CARD } from "../../lib/designSystem";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: Props) {
  return (
    <div
      className={cn(
        DS_CARD,
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center sm:px-8",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] text-[#94A3B8]">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-[18px] font-semibold text-[#F8FAFC]">{title}</p>
        {description ? (
          <p className="mt-2 max-w-md text-[17px] leading-relaxed text-[#94A3B8]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
