import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

export type StickyHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  trailing?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  className?: string;
};

/**
 * BankDash-style sticky page header — title, optional search pill, and actions.
 */
export function StickyHeader({
  title,
  eyebrow,
  subtitle,
  trailing,
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  showSearch = false,
  className,
}: StickyHeaderProps) {
  return (
    <header className={cn("bd-sticky-header", className)}>
      <div className="bd-sticky-header__lead">
        {eyebrow ? <p className="bd-sticky-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="bd-sticky-header__title">{title}</h1>
        {subtitle ? <p className="bd-sticky-header__subtitle">{subtitle}</p> : null}
      </div>
      <div className="bd-sticky-header__tools">
        {showSearch ? (
          <label className="bd-sticky-header__search">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <input
              type="search"
              value={searchValue ?? ""}
              placeholder={searchPlaceholder}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </label>
        ) : null}
        {trailing}
      </div>
    </header>
  );
}
