import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type SectionShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  columns?: 1 | 2;
};

/** Spacious section wrapper with optional heading row (BankDash “See all” pattern). */
export function SectionShell({
  children,
  title,
  subtitle,
  action,
  columns = 1,
  className,
  ...rest
}: SectionShellProps) {
  const body =
    columns === 2 ? (
      <div className="bd-section-shell__grid bd-section-shell__grid--2">{children}</div>
    ) : (
      <div className="bd-section-shell__body">{children}</div>
    );

  return (
    <section className={cn("bd-section-shell", className)} {...rest}>
      {title ? (
        <div className="bd-section-shell__head">
          <div>
            <h2 className="bd-section-shell__title">{title}</h2>
            {subtitle ? <p className="bd-section-shell__subtitle">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {body}
    </section>
  );
}
