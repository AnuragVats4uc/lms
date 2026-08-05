"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { AppTextArea, AppTextAreaProps } from "../input";
import { FormControllerField, FormFieldBaseProps } from "./FormField";

export interface FormTextAreaProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
>
  extends
    FormFieldBaseProps<T, TName>,
    Omit<
      AppTextAreaProps,
      "id" | "name" | "value" | "onBlur" | "onChangeText"
    > {}

export function FormTextArea<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({ id, label, labelProps, name, ...props }: FormTextAreaProps<T, TName>) {
  return (
    <FormControllerField<T, TName>
      id={id}
      label={label}
      labelProps={labelProps}
      name={name}
    >
      {({ field, fieldState, errorId, inputId }) => (
        <AppTextArea
          {...props}
          ref={field.ref}
          id={inputId}
          aria-describedby={fieldState.error ? errorId : undefined}
          aria-invalid={fieldState.invalid}
          value={field.value == null ? "" : String(field.value)}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
        />
      )}
    </FormControllerField>
  );
}
