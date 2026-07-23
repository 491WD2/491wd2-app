import { CalendarDays, MapPin, Users } from "lucide-react";
import type { UpcomingEventRow } from "../../lib/upcomingEvents";
import { cn } from "../../lib/utils";

export type UpcomingEventsListProps = {
  events: UpcomingEventRow[];
  emptyText?: string;
  className?: string;
  listClassName?: string;
  onOpenEvent?: (eventId: string) => void;
  /** Compact density for kiosk sheets. */
  compact?: boolean;
};

/**
 * Shared upcoming events list — today first, then next.
 * Used on member home and other household surfaces.
 */
export function UpcomingEventsList({
  events,
  emptyText = "No upcoming events.",
  className,
  listClassName,
  onOpenEvent,
  compact = false,
}: UpcomingEventsListProps) {
  if (!events || events.length === 0) {
    return (
      <p
        className={cn(
          "rounded-[12px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600",
          className,
        )}
      >
        {emptyText}
      </p>
    );
  }

  return (
    <ul
      className={cn("m-0 flex list-none flex-col gap-2 p-0", listClassName, className)}
      role="list"
    >
      {events.map((row) => {
        const content = (
          <>
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700",
                compact ? "h-9 w-9" : "h-10 w-10",
              )}
              aria-hidden
            >
              <CalendarDays className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <strong className="block text-[0.98rem] font-extrabold tracking-[-0.02em] text-slate-900">
                {row.title}
              </strong>
              <span className="mt-0.5 block text-sm font-semibold text-slate-600">
                {row.isToday ? "Today · " : ""}
                {row.whenLabel}
                {row.category ? ` · ${row.category}` : ""}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {row.assigneeLabel}
                  {row.scope === "household" ? " · Household" : ""}
                </span>
                {row.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {row.location}
                  </span>
                ) : null}
              </span>
            </span>
          </>
        );

        if (onOpenEvent) {
          return (
            <li key={row.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-[12px] border border-slate-200 bg-white text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40",
                  compact ? "px-3 py-2.5" : "px-3.5 py-3",
                  row.isToday && "border-sky-200 bg-sky-50/50",
                )}
                onClick={() => onOpenEvent(row.id)}
              >
                {content}
              </button>
            </li>
          );
        }

        return (
          <li
            key={row.id}
            className={cn(
              "flex items-start gap-3 rounded-[12px] border border-slate-200 bg-white shadow-sm",
              compact ? "px-3 py-2.5" : "px-3.5 py-3",
              row.isToday && "border-sky-200 bg-sky-50/50",
            )}
          >
            {content}
          </li>
        );
      })}
    </ul>
  );
}

export default UpcomingEventsList;
