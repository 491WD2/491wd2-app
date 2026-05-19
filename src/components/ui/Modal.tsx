import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  open: boolean;
  title: string;
  titleId?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
  /** `dark` graphite modal (default). `smarthr` white SmartHR panel. */
  variant?: "dark" | "smarthr";
};

/** Accessible modal shell — pair with your open state. */
export function Modal({
  open,
  title,
  titleId = "modal-title",
  children,
  onClose,
  footer,
  className,
  variant = "dark",
}: Props) {
  if (!open) return null;

  const smarthr = variant === "smarthr";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        className={cn(
          "absolute inset-0 backdrop-blur-[2px]",
          smarthr ? "bg-black/45" : "bg-black/60",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-[101] flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden",
          smarthr
            ? "rounded-[8px] border border-[#ededed] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            : "rounded-2xl border border-white/[0.12] bg-[#10161D] shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          className,
        )}
      >
        <header
          className={cn(
            "flex items-start justify-between gap-3 px-5 py-4 sm:px-6",
            smarthr ? "border-b border-[#ededed]" : "border-b border-white/[0.10]",
          )}
        >
          <h2
            id={titleId}
            className={cn(
              "min-w-0 flex-1 pr-2 text-[20px] font-semibold tracking-tight",
              smarthr ? "text-[#1f1f1f]" : "text-[#F8FAFC]",
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[8px] border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/50 focus-visible:ring-offset-2",
              smarthr
                ? "border-[#ededed] bg-white text-[#1f1f1f] hover:bg-[#f7f7f7] focus-visible:ring-offset-white"
                : "border-white/15 bg-white/[0.06] text-[#F8FAFC] hover:bg-white/10 focus-visible:ring-offset-[#10161D]",
            )}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[17px] leading-relaxed sm:px-6",
            smarthr ? "text-[#575757]" : "text-[#CBD5E1]",
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer
            className={cn(
              "px-5 py-4 sm:px-6",
              smarthr ? "border-t border-[#ededed] bg-[#fafafa]" : "border-t border-white/[0.10]",
            )}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
