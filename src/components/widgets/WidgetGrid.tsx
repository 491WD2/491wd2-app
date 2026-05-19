import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetGridColumns = 2 | 3 | 4 | "2-col";

export type WidgetGridProps = HTMLAttributes<HTMLUListElement> & {
  children: ReactNode;
  columns?: WidgetGridColumns;
};

export function WidgetGrid({
  children,
  columns = 2,
  className,
  ...rest
}: WidgetGridProps) {
  const colClass =
    columns === 4
      ? "fh-widget-grid--4"
      : columns === 3
        ? "fh-widget-grid--3"
        : columns === "2-col"
          ? "fh-widget-grid--2-col"
          : "fh-widget-grid--2";

  return (
    <ul className={cn("fh-widget-grid", colClass, className)} {...rest}>
      {children}
    </ul>
  );
}
