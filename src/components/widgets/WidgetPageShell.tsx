import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import "./widgets.css";

export type WidgetPageShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** iPad-style page canvas — soft background, consistent spacing, max width. */
export function WidgetPageShell({ children, className, ...rest }: WidgetPageShellProps) {
  return (
    <div className={cn("fh-widget-page", className)} {...rest}>
      <div className="fh-widget-page__inner">{children}</div>
    </div>
  );
}
