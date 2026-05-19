import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** Styled checkbox for dark admin forms — visible border + cyan accent */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-5 w-5 cursor-pointer rounded border border-white/[0.14] bg-[#1B2028] text-[#00B7C7]",
        "accent-[#00B7C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}
