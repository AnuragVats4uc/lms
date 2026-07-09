"use client";

import { ReactNode } from "react";
import { LabelProps } from "tamagui";
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";

import { AppInput, AppInputProps } from "../input";
import { FormLabel } from "./FormLabel";
import { FormMessage } from "./FormMessage";

interface FormFieldRenderProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  field: ControllerRenderProps<T, TName>;
  fieldState: ControllerFieldState;
  errorId: string;
  inputId: string;
}

interface FormFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
>
  extends Omit<AppInputProps, "form" | "name"> {
  children?: (
    props: FormFieldRenderProps<T, TName>
  ) => ReactNode;
  label?: string;
  labelProps?: Omit<LabelProps, "children">;
  name: TName;
}

export function FormField<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  children,
  id,
  name,
  label,
  labelProps,
  ...props
}: FormFieldProps<T, TName>) {
  const { control } = useFormContext<T>();
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <>
          {label && (
            <FormLabel htmlFor={inputId} {...labelProps}>
              {label}
            </FormLabel>
          )}

          {children ? (
            children({
              field,
              fieldState,
              errorId,
              inputId,
            })
          ) : (
            <AppInput
              {...props}
              id={inputId}
              aria-describedby={fieldState.error ? errorId : undefined}
              aria-invalid={fieldState.invalid}
              value={field.value == null ? "" : String(field.value)}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
            />
          )}

          <FormMessage
            id={errorId}
            message={fieldState.error?.message}
          />
        </>
      )}
    />
  );
}
