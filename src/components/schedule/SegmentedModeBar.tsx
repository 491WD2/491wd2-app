import { cn } from "../../lib/utils";

export type SegmentedModeOption<T extends string> = {
  id: T;
  label: string;
};

export type SegmentedModeBarProps<T extends string> = {
  options: SegmentedModeOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  "aria-label"?: string;
};

/** Compact top segmented navigation for schedule-style dashboards. */
export function SegmentedModeBar<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "View mode",
}: SegmentedModeBarProps<T>) {
  return (
    <div className={cn("fh-sched-modes", className)} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn("fh-sched-modes__btn", active && "fh-sched-modes__btn--active")}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
