import type { ReactNode } from "react";
import { StickyHeader } from "./StickyHeader";

export type KioskPageTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

/**
 * Kiosk page heading — delegates to BankDash StickyHeader.
 */
export function KioskPageTitle({
  eyebrow,
  title,
  description,
  actions,
  className,
  showSearch,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: KioskPageTitleProps) {
  return (
    <StickyHeader
      className={className}
      eyebrow={eyebrow}
      title={title}
      subtitle={description}
      trailing={actions}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
    />
  );
}
