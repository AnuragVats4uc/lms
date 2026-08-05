"use client";

import type { FieldPath, FieldValues } from "react-hook-form";

import { FormField, FormFieldProps } from "./FormField";

export type FormInputProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> = FormFieldProps<T, TName>;

export function FormInput<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>(props: FormInputProps<T, TName>) {
  return <FormField {...props} />;
}
