import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { DS_ICON_BUTTON } from "../../lib/designSystem";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** Visible label for accessibility — required for icon-only controls */
  "aria-label": string;
  /** Hover tooltip (matches aria-label when omitted) */
  title?: string;
  children: ReactNode;
};

export function IconButton({
  className,
  children,
  title,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      title={title ?? props["aria-label"]}
      className={cn(DS_ICON_BUTTON, className)}
      {...props}
    >
      {children}
    </button>
  );
}
