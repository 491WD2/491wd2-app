import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetActionPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Ghost pill action used in Start Page widget headers. */
export function WidgetActionPill({ children, className, type = "button", ...rest }: WidgetActionPillProps) {
  return (
    <button
      type={type}
      className={cn("fh-start-widget__action fh-pro-btn fh-pro-btn--ghost", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
