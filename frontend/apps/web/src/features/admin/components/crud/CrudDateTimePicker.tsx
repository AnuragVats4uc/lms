"use client";

import { useEffect, useId, useRef } from "react";
import { CalendarClock } from "lucide-react";
import { shift } from "@floating-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./CrudDateTimePicker.module.css";

export interface CrudDateTimePickerProps {
  describedBy?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  minDate?: Date | null;
  name: string;
  onBlur?: () => void;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  value: Date | null;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Keeps the submitted value compatible with a native datetime-local input.
 * The API layer can continue interpreting it in the user's local timezone.
 */
export const toLocalDateTimeValue = (value: Date | null) =>
  value
    ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
    : "";

export const fromLocalDateTimeValue = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const CrudDateTimePicker = ({
  describedBy,
  disabled = false,
  id,
  label,
  minDate,
  name,
  onBlur,
  onChange,
  placeholder = "Choose date and time",
  required = false,
  value,
}: CrudDateTimePickerProps) => {
  const inputId = id ?? name;
  const labelId = `${inputId}-label`;
  const pickerInstanceId = useId();
  const pickerRef = useRef<DatePicker | null>(null);

  useEffect(() => {
    const closeWhenAnotherPickerOpens = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== pickerInstanceId) {
        pickerRef.current?.setOpen(false);
      }
    };
    document.addEventListener(
      "lms-admin-datepicker-open",
      closeWhenAnotherPickerOpens,
    );
    return () =>
      document.removeEventListener(
        "lms-admin-datepicker-open",
        closeWhenAnotherPickerOpens,
      );
  }, [pickerInstanceId]);

  return (
    <div className={styles.field}>
      <label className={styles.label} id={labelId} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.control}>
        <DatePicker
          ariaDescribedBy={describedBy}
          ariaLabelledBy={labelId}
          autoComplete="off"
          calendarClassName={styles.calendar}
          className={styles.input}
          dateFormat="dd MMM yyyy, HH:mm"
          disabled={disabled}
          id={inputId}
          minDate={minDate ?? undefined}
          onCalendarOpen={() =>
            document.dispatchEvent(
              new CustomEvent("lms-admin-datepicker-open", {
                detail: pickerInstanceId,
              }),
            )
          }
          onBlur={onBlur}
          onChange={onChange}
          placeholderText={placeholder}
          popperClassName={styles.popper}
          popperModifiers={[shift({ padding: 12 })]}
          popperPlacement="bottom-start"
          popperProps={{ strategy: "fixed" }}
          portalId="lms-admin-datepicker-portal"
          ref={pickerRef}
          required={required}
          selected={value}
          showPopperArrow={false}
          showTimeSelect
          timeCaption="Time"
          timeFormat="HH:mm"
          timeIntervals={15}
          wrapperClassName={styles.wrapper}
        />
        <CalendarClock aria-hidden="true" className={styles.icon} size={16} />
      </div>
      <input name={name} type="hidden" value={toLocalDateTimeValue(value)} />
    </div>
  );
};
