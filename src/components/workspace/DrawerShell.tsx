import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/utils";

const backdropFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40";

const drawerPanelClass =
  "fixed z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col border-white/[0.12] bg-[#10161D] shadow-[0_24px_80px_rgba(0,0,0,0.55)] max-lg:inset-0 max-lg:border-l-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:border-l lg:max-w-4xl";

export function DrawerBackdrop({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]",
        backdropFocusRing,
      )}
      onClick={onClick}
      type="button"
    />
  );
}

export type DrawerPanelProps = ComponentPropsWithoutRef<"aside"> & {
  children: ReactNode;
  className?: string;
};

export function DrawerPanel({ children, className, ...rest }: DrawerPanelProps) {
  return (
    <aside className={cn(drawerPanelClass, className)} {...rest}>
      {children}
    </aside>
  );
}

export function DrawerHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  titleId,
  className,
  dark,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing: ReactNode;
  /** When `title` is a string, sets the heading `id` for `aria-labelledby` on the panel. */
  titleId?: string;
  className?: string;
  /** Premium dark drawer chrome (matches Calendar / household drawers). */
  dark?: boolean;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:gap-4 sm:px-6 sm:py-5",
        dark
          ? "border-white/10 bg-[#0d131a]"
          : "border-slate-200 bg-white",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.18em]",
              dark ? "text-slate-500" : "text-slate-600",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-1.5">
          {typeof title === "string" ? (
            <h2
              id={titleId}
              className={cn(
                "text-2xl font-semibold tracking-tight sm:text-[1.65rem]",
                dark ? "text-slate-50" : "text-slate-950",
              )}
            >
              {title}
            </h2>
          ) : (
            title
          )}
        </div>
        {subtitle ? (
          <div className={cn("mt-2 text-sm leading-6", dark ? "text-slate-400" : "text-slate-600")}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 pt-0.5">{trailing}</div>
    </header>
  );
}

export function DrawerBody({
  children,
  className,
  dark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-5",
        dark ? "bg-[#0b1117]" : "bg-slate-50/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DrawerFooter({
  children,
  className,
  dark,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        dark ? "border-white/10 bg-[#0d131a]" : "border-slate-200 bg-white",
        className,
      )}
    >
      {children}
    </footer>
  );
}
