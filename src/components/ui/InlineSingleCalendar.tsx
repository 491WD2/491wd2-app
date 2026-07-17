import { useEffect, useId, useRef } from "react";
import $ from "jquery";
import moment from "moment";
import "daterangepicker";
import "daterangepicker/daterangepicker.css";
import { cn } from "../../lib/utils";

type Props = {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
  minYear?: number;
};

/**
 * AdminUX inline calendar: singleDatePicker + parentEl wrapper.
 * Mirrors their `.inlinewrap1` / `#inlinewrap1` pattern.
 */
export function InlineSingleCalendar({
  value,
  onChange,
  className,
  minYear = 2023,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const wrapClass = useId().replace(/:/g, "");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const input = inputRef.current;
    const wrap = wrapRef.current;
    if (!input || !wrap) return;

    const parentSelector = `.${wrapClass}`;
    const $input = $(input);

    $input.daterangepicker(
      {
        singleDatePicker: true,
        minYear,
        autoApply: true,
        linkedCalendars: false,
        alwaysShowCalendars: true,
        parentEl: parentSelector,
        startDate: moment(value),
        endDate: moment(value),
        opens: "center",
        drops: "down",
        buttonClasses: ["btn"],
        applyButtonClasses: "btn-theme",
        locale: {
          format: "DD/MM/YYYY",
        },
        // AdminUX template option (not in @types/daterangepicker)
        cancelClass: "btn-light",
      } as Parameters<JQuery["daterangepicker"]>[0],
      (start) => {
        onChangeRef.current(start.toDate());
      },
    );

    // Open immediately so the calendar renders inline (AdminUX pattern).
    window.setTimeout(() => {
      $input.trigger("click");
    }, 0);

    return () => {
      const picker = $input.data("daterangepicker");
      if (picker) {
        picker.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minYear, wrapClass]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const picker = $(input).data("daterangepicker");
    if (!picker) return;
    picker.setStartDate(moment(value));
    picker.setEndDate(moment(value));
  }, [value]);

  return (
    <div className={cn("aux-inline-calendar", className)}>
      <div
        ref={wrapRef}
        className={cn("inlinewrap1 inline-calendar mx-auto", wrapClass)}
      />
      <input
        ref={inputRef}
        type="text"
        className="d-none"
        readOnly
        aria-hidden
        tabIndex={-1}
      />
      <p className="aux-inline-calendar__selected aux-muted mt-2 text-center text-sm">
        Selected{" "}
        <strong className="text-[var(--aux-text)]">
          {moment(value).format("ddd, D MMM YYYY")}
        </strong>
      </p>
    </div>
  );
}
