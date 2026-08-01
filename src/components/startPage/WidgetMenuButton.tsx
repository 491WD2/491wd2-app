import { MoreHorizontal } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type WidgetMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Helper shown when layout editing is not available yet. */
  helperText?: string;
};

/**
 * Optional 3-dot widget menu control.
 * Preview-only by default — full hide/move/reorder comes later.
 */
export function WidgetMenuButton({
  className,
  helperText = "Layout editing coming later.",
  disabled = true,
  title,
  "aria-label": ariaLabel = "Widget options",
  ...rest
}: WidgetMenuButtonProps) {
  return (
    <button
      type="button"
      className={cn("fh-start-widget__menu", className)}
      disabled={disabled}
      title={title ?? helperText}
      aria-label={ariaLabel}
      {...rest}
    >
      <MoreHorizontal className="h-4 w-4" aria-hidden />
    </button>
  );
}
