import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function NotionPageCanvas({
  children,
  className,
  maxWidth,
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={cn("fh-notion-page notion-page", className)}
      style={maxWidth ? { maxWidth } : undefined}
    >
      {children}
    </div>
  );
}

export function NotionPageIcon({ children }: { children: ReactNode }) {
  return (
    <div className="notion-page__icon fh-notion-page__icon" aria-hidden>
      {children}
    </div>
  );
}

export function NotionPageTitle({ children }: { children: ReactNode }) {
  return <h1 className="notion-page__title">{children}</h1>;
}

export function NotionPageSubtitle({ children }: { children: ReactNode }) {
  return <p className="notion-page__subtitle">{children}</p>;
}

export type NotionBreadcrumbItem = {
  id: string;
  label: string;
  onClick?: () => void;
};

export function NotionBreadcrumbs({ items }: { items: NotionBreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="notion-breadcrumbs">
        {items.map((item, index) => (
          <li key={item.id} className="notion-breadcrumbs__item">
            {index > 0 ? <span className="notion-breadcrumbs__sep" aria-hidden>/</span> : null}
            {item.onClick ? (
              <button type="button" className="notion-breadcrumbs__link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function NotionToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("notion-toolbar", className)}>{children}</div>;
}

export function NotionToolbarButton({
  children,
  onClick,
  primary,
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn("notion-toolbar__btn", primary && "notion-toolbar__btn--primary")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function NotionDivider() {
  return <hr className="notion-divider" />;
}
