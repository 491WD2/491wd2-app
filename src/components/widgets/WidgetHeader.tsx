import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WidgetHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  emoji?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleId?: string;
};

export function WidgetHeader({
  title,
  subtitle,
  eyebrow,
  emoji,
  icon,
  actions,
  className,
  titleId,
}: WidgetHeaderProps) {
  return (
    <header className={cn("fh-widget-header", className)}>
      <div className="fh-widget-header__lead">
        {icon ?? (emoji ? (
          <span className="fh-widget-header__icon" aria-hidden>
            {emoji}
          </span>
        ) : null)}
        <div className="min-w-0">
          {eyebrow ? <p className="fh-widget-header__eyebrow">{eyebrow}</p> : null}
          <h2 id={titleId} className="fh-widget-header__title">
            {title}
          </h2>
          {subtitle ? <p className="fh-widget-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="fh-widget-header__actions">{actions}</div> : null}
    </header>
  );
}
