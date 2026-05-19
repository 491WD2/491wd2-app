import type { ReactNode } from "react";
import { choreCn, choreTw } from "../../lib/choreUi";

export type ChoreViewHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** Right-side actions (CTAs, segmented controls) */
  actions?: ReactNode;
  /** Stack actions below title on narrow screens */
  stacked?: boolean;
};

/**
 * Consistent page header for Home, Dashboard, Schedule, and Users tabs.
 */
export function ChoreViewHeader({ title, subtitle, actions, stacked = true }: ChoreViewHeaderProps) {
  return (
    <header
      className={choreCn(
        "wd-chore-hh__view-head",
        stacked && "wd-chore-hh__view-head--stack",
        !stacked && "wd-chore-hh__view-head--row",
      )}
    >
      <div className="wd-chore-hh__view-head-copy">
        <h2 className={choreTw.heading}>{title}</h2>
        {subtitle ? <p className={choreTw.subtext}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={choreCn(choreTw.ctaRow, "wd-chore-hh__view-head-actions")}>{actions}</div> : null}
    </header>
  );
}
