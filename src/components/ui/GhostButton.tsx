import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function GhostButton({ children, className, type = "button", ...rest }: GhostButtonProps) {
  return (
    <button type={type} className={cn("bd-btn-ghost", className)} {...rest}>
      {children}
    </button>
  );
}
