import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "warning";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-gradient-to-r from-[var(--fs-gradient-start,#FF6F28)] to-[var(--fs-gradient-end,#FF5325)] text-white shadow-[0_6px_15px_rgba(36,37,38,0.08)] hover:brightness-[1.06] focus-visible:ring-[var(--fs-sidebar-active-text,#FE9F43)]/55 focus-visible:ring-offset-[var(--fs-page-bg,#f7f7f7)] dark:focus-visible:ring-offset-[#05070A]",
  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.14] dark:bg-white/[0.06] dark:text-[#F8FAFC] dark:hover:bg-white/[0.1] dark:hover:border-white/[0.2] focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#05070A]",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#CBD5E1] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC] focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#05070A]",
  danger:
    "border border-[#E2504E] bg-[#E2504E] text-white hover:bg-[#c93438] hover:border-[#c93438] focus-visible:ring-[#E2504E]/55 focus-visible:ring-offset-[#05070A]",
  success:
    "border border-[#22C55E] bg-[#22C55E] text-[#05070A] hover:bg-[#16a34a] hover:border-[#16a34a] focus-visible:ring-[#22C55E]/55 focus-visible:ring-offset-[#05070A]",
  warning:
    "border border-[#FFB900] bg-[#FFB900] text-[#05070A] hover:bg-[#e6a800] hover:border-[#e6a800] focus-visible:ring-[#FFB900]/55 focus-visible:ring-offset-[#05070A]",
};

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  }
>;

export function Button({
  children,
  className,
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "motion-button inline-flex min-h-9 items-center justify-center gap-2 rounded-[8px] px-3 py-2 text-[14px] font-semibold tracking-[0.01em] transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
