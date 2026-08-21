"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";
import { FormMessage } from "@repo/ui";

import {
  CrudDateTimePicker,
  fromLocalDateTimeValue,
  toLocalDateTimeValue,
} from "./CrudDateTimePicker";

export interface CrudFormDateTimePickerProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  disabled?: boolean;
  id?: string;
  label: string;
  minDate?: Date | null;
  name: TName;
  placeholder?: string;
  required?: boolean;
}

export const CrudFormDateTimePicker = <
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  disabled = false,
  id,
  label,
  minDate,
  name,
  placeholder,
  required = false,
}: CrudFormDateTimePickerProps<T, TName>) => {
  const { control } = useFormContext<T>();
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? String(name);
  const errorId = `${inputId}-error`;

  return (
    <>
      <CrudDateTimePicker
        describedBy={fieldState.error ? errorId : undefined}
        disabled={disabled}
        id={inputId}
        label={label}
        minDate={minDate}
        name={String(name)}
        onBlur={field.onBlur}
        onChange={(value) => field.onChange(toLocalDateTimeValue(value))}
        placeholder={placeholder}
        required={required}
        value={fromLocalDateTimeValue(field.value)}
      />
      <FormMessage id={errorId} message={fieldState.error?.message} />
    </>
  );
};
