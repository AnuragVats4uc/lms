"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { AppSelect, AppSelectProps } from "../input";
import { FormControllerField, FormFieldBaseProps } from "./FormField";

export interface FormSelectProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
>
  extends
    FormFieldBaseProps<T, TName>,
    Omit<
      AppSelectProps,
      "id" | "name" | "value" | "defaultValue" | "onValueChange"
    > {}

export function FormSelect<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  id,
  label,
  labelProps,
  name,
  triggerProps,
  ...props
}: FormSelectProps<T, TName>) {
  return (
    <FormControllerField<T, TName>
      id={id}
      label={label}
      labelProps={labelProps}
      name={name}
    >
      {({ field, fieldState, errorId, inputId }) => (
        <AppSelect
          {...props}
          name={inputId}
          value={
            field.value == null || field.value === ""
              ? undefined
              : String(field.value)
          }
          onValueChange={field.onChange}
          triggerProps={{
            ...triggerProps,
            ref: field.ref,
            id: inputId,
            onBlur: field.onBlur,
          }}
        />
      )}
    </FormControllerField>
  );
}
