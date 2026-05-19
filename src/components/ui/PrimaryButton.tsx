import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ children, className, type = "button", ...rest }: PrimaryButtonProps) {
  return (
    <button type={type} className={cn("bd-btn-primary", className)} {...rest}>
      {children}
    </button>
  );
}
