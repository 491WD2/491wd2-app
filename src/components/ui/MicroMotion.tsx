import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type MicroMotionVariant = "none" | "fade-up" | "pressable";

export type MicroMotionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: MicroMotionVariant;
};

export function MicroMotion({
  children,
  variant = "none",
  className,
  ...rest
}: MicroMotionProps) {
  return (
    <div
      className={cn(
        "bd-micro-motion",
        variant === "fade-up" && "bd-micro-motion--fade-up",
        variant === "pressable" && "bd-micro-motion--pressable",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
