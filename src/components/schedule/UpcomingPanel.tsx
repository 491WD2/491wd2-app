import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type UpcomingPanelSection = {
  id: string;
  label: string;
  content: ReactNode;
};

export type UpcomingPanelProps = {
  title?: string;
  subtitle?: string;
  sections: UpcomingPanelSection[];
  emptyText?: string;
  className?: string;
  headerAction?: ReactNode;
};

/**
 * Right-side “Upcoming / Needs attention” panel for the schedule dashboard.
 * Renders polished empty states when a section has no content.
 */
export function UpcomingPanel({
  title = "Upcoming / Needs attention",
  subtitle = "School notes, activities, travel, and chores due soon",
  sections,
  emptyText = "Nothing needs attention right now.",
  className,
  headerAction,
}: UpcomingPanelProps) {
  const hasAny = sections.some((section) => Boolean(section.content));

  return (
    <aside className={cn("fh-sched-upcoming", className)} aria-label={title}>
      <div className="fh-sched-upcoming__head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {headerAction}
      </div>

      {!hasAny ? <p className="fh-sched-upcoming__empty">{emptyText}</p> : null}

      {sections.map((section) =>
        section.content ? (
          <div key={section.id} className="fh-sched-upcoming__section">
            <p className="fh-sched-upcoming__label">{section.label}</p>
            {section.content}
          </div>
        ) : null,
      )}
    </aside>
  );
}
