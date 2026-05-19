import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type ActionTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon?: ReactNode;
  accent?: boolean;
};

export function ActionTile({
  label,
  icon,
  accent = false,
  className,
  type = "button",
  ...rest
}: ActionTileProps) {
  return (
    <button
      type={type}
      className={cn(
        "fh-widget-action-tile",
        accent && "fh-widget-action-tile--accent",
        className,
      )}
      {...rest}
    >
      {icon ? <span className="fh-widget-action-tile__icon">{icon}</span> : null}
      {label}
    </button>
  );
}
