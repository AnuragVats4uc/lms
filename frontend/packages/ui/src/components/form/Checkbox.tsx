"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { AppCheckbox, AppCheckboxProps } from "../checkbox/Checkbox";
import { FormControllerField, FormFieldBaseProps } from "./FormField";

export interface FormCheckboxProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
>
  extends
    Omit<FormFieldBaseProps<T, TName>, "label" | "labelProps">,
    Omit<
      AppCheckboxProps,
      "checked" | "id" | "label" | "name" | "onCheckedChange"
    > {
  checkboxLabel?: string;
}

export function FormCheckbox<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({ checkboxLabel, id, name, ...props }: FormCheckboxProps<T, TName>) {
  return (
    <FormControllerField<T, TName> id={id} name={name}>
      {({ field, inputId }) => (
        <AppCheckbox
          {...props}
          checked={Boolean(field.value)}
          id={inputId}
          label={checkboxLabel}
          onCheckedChange={(checked) => field.onChange(checked === true)}
        />
      )}
    </FormControllerField>
  );
}
