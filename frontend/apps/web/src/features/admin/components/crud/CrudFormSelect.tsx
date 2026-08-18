"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import { useController, useFormContext } from "react-hook-form";
import type { LabelProps } from "tamagui";
import { FormLabel, FormMessage } from "@repo/ui";

import { CrudSelect, type CrudSelectOption } from "./CrudSelect";

export interface CrudFormSelectProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  disabled?: boolean;
  id?: string;
  label?: string;
  labelProps?: Omit<LabelProps, "children">;
  loading?: boolean;
  name: TName;
  options: readonly CrudSelectOption[];
  placeholder?: string;
}

export const CrudFormSelect = <
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  disabled = false,
  id,
  label,
  labelProps,
  loading = false,
  name,
  options,
  placeholder = "Select an option",
}: CrudFormSelectProps<T, TName>) => {
  const { control } = useFormContext<T>();
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? String(name);
  const errorId = `${inputId}-error`;

  return (
    <>
      {label ? (
        <FormLabel htmlFor={inputId} {...labelProps}>
          {label}
        </FormLabel>
      ) : null}
      <CrudSelect
        ariaLabel={label ?? String(name)}
        describedBy={fieldState.error ? errorId : undefined}
        disabled={disabled}
        id={inputId}
        loading={loading}
        onBlur={field.onBlur}
        onChange={field.onChange}
        options={options}
        placeholder={placeholder}
        value={field.value == null ? "" : String(field.value)}
        variant="form"
      />
      <FormMessage id={errorId} message={fieldState.error?.message} />
    </>
  );
};
