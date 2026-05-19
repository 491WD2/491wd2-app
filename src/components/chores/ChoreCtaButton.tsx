import type { ButtonHTMLAttributes, ReactNode } from "react";
import { choreCn, choreCtaClass, choreTw, type ChoreCtaVariant } from "../../lib/choreUi";

export type ChoreCtaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ChoreCtaVariant;
  children: ReactNode;
};

/** Touch-friendly CTA (76px min height via CSS). */
export function ChoreCtaButton({
  variant = "primary",
  className,
  children,
  type = "button",
  ...rest
}: ChoreCtaButtonProps) {
  return (
    <button type={type} className={choreCn(choreCtaClass(variant), choreTw.focusRing, className)} {...rest}>
      {children}
    </button>
  );
}
