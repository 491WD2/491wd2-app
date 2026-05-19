import { cn } from "../../lib/utils";
import type { CardAction } from "../../types/cards";

export type KioskActionCardProps = {
  actions: CardAction[];
  reveal?: "always" | "hover";
  analyticsSurface?: string;
  onActionClick?: (actionId: string) => void;
  className?: string;
};

/**
 * Touch-friendly action row for kiosk cards (edit, scan, reorder, complete).
 */
export function KioskActionCard({
  actions,
  reveal = "always",
  onActionClick,
  className,
}: KioskActionCardProps) {
  if (!actions.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "fh-kiosk-actions",
        reveal === "hover" && "max-sm:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          className={cn(
            "fh-kiosk-btn",
            action.variant === "primary" && "fh-kiosk-btn--primary",
            action.variant === "secondary" && "fh-kiosk-btn--secondary",
          )}
          onClick={() => {
            onActionClick?.(action.id);
            action.onClick();
          }}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
