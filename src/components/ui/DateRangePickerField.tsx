import { useEffect, useId, useRef } from "react";
import $ from "jquery";
import moment from "moment";
import "daterangepicker";
import "daterangepicker/daterangepicker.css";
import { FeatherIcon } from "../icons/FeatherIcon";
import { cn } from "../../lib/utils";

export type DateRangeValue = {
  start: Date;
  end: Date;
};

type Props = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
  label?: string;
};

/**
 * AdminUX-style wrapper around dangrossman/daterangepicker (jQuery + moment).
 * Source also kept from Desktop/daterangepicker-master.zip via npm package.
 */
export function DateRangePickerField({
  value,
  onChange,
  className,
  label = "Date range",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const id = useId();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const $input = $(input);
    $input.daterangepicker(
      {
        startDate: moment(value.start),
        endDate: moment(value.end),
        alwaysShowCalendars: true,
        showDropdowns: true,
        autoApply: false,
        opens: "left",
        locale: {
          format: "MMM D, YYYY",
          separator: " – ",
          applyLabel: "Apply",
          cancelLabel: "Cancel",
          customRangeLabel: "Custom",
        },
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days": [moment().subtract(29, "days"), moment()],
          "This Month": [moment().startOf("month"), moment().endOf("month")],
          "Last Month": [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ],
        },
      },
      (start, end) => {
        onChangeRef.current({
          start: start.toDate(),
          end: end.toDate(),
        });
      },
    );

    return () => {
      const picker = $input.data("daterangepicker");
      if (picker) {
        picker.remove();
      }
    };
    // Initialize once; picker syncs via setStartDate/setEndDate below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const picker = $(input).data("daterangepicker");
    if (!picker) return;
    picker.setStartDate(moment(value.start));
    picker.setEndDate(moment(value.end));
  }, [value.start, value.end]);

  return (
    <div className={cn("aux-daterange", className)}>
      {label ? (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="aux-daterange__control">
        <span className="aux-daterange__icon" aria-hidden>
          <FeatherIcon name="calendar" size={16} />
        </span>
        <input
          id={id}
          ref={inputRef}
          type="text"
          className="form-control"
          readOnly
          aria-label={label || "Date range"}
        />
      </div>
    </div>
  );
}

export function defaultLast7Days(): DateRangeValue {
  return {
    start: moment().subtract(6, "days").startOf("day").toDate(),
    end: moment().endOf("day").toDate(),
  };
}
