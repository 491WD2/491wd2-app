import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { MicroMotion } from "../ui/MicroMotion";
import "./widgets.css";

export type WidgetCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  header?: ReactNode;
  flushBody?: boolean;
  as?: "section" | "article";
  animated?: boolean;
};

export function WidgetCard({
  children,
  header,
  flushBody = false,
  animated = true,
  as: Tag = "section",
  className,
  ...rest
}: WidgetCardProps) {
  const card = (
    <Tag className={cn("fh-widget-card", className)} {...rest}>
      {header}
      <div
        className={cn(
          "fh-widget-card__body",
          flushBody && "fh-widget-card__body--flush",
        )}
      >
        {children}
      </div>
    </Tag>
  );

  if (!animated) {
    return card;
  }

  return (
    <MicroMotion variant="fade-up" className="min-w-0">
      {card}
    </MicroMotion>
  );
}
