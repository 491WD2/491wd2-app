import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { WidgetMenuButton } from "./WidgetMenuButton";

export type StartPageWidgetHeaderProps = {
  title: string;
  titleId?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  showMenu?: boolean;
  className?: string;
};

/** Header row: icon tile · title · optional subtitle · action pill · optional menu. */
export function WidgetHeader({
  title,
  titleId,
  subtitle,
  icon,
  action,
  showMenu = true,
  className,
}: StartPageWidgetHeaderProps) {
  return (
    <header className={cn("fh-start-widget__header", className)}>
      <div className="fh-start-widget__header-lead">
        {icon}
        <div className="fh-start-widget__header-copy">
          <h2 id={titleId} className="fh-start-widget__title">
            {title}
          </h2>
          {subtitle ? <p className="fh-start-widget__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <div className="fh-start-widget__header-actions">
        {action}
        {showMenu ? <WidgetMenuButton /> : null}
      </div>
    </header>
  );
}
