import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type StartPageWidgetProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  as?: "section" | "aside" | "article";
};

/**
 * FamilyHub Start Page widget shell.
 * Visual anatomy for configurable dashboard cards — data wiring stays in the page.
 */
export function StartPageWidget({
  children,
  header,
  footer,
  as: Tag = "section",
  className,
  ...rest
}: StartPageWidgetProps) {
  return (
    <Tag className={cn("fh-start-widget fh-pro-card", className)} {...rest}>
      {header}
      <div className="fh-start-widget__body">{children}</div>
      {footer}
    </Tag>
  );
}
