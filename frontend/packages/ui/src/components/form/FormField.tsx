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

export interface FormFieldRenderProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  field: ControllerRenderProps<T, TName>;
  fieldState: ControllerFieldState;
  errorId: string;
  inputId: string;
}

export interface FormFieldBaseProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> {
  id?: string;
  label?: string;
  labelProps?: Omit<LabelProps, "children">;
  name: TName;
}

export interface FormFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
>
  extends
    FormFieldBaseProps<T, TName>,
    Omit<AppInputProps, "form" | "name" | "id" | "transform"> {
  children?: (props: FormFieldRenderProps<T, TName>) => ReactNode;
  transform?: (value: string) => string;
}

interface FormControllerFieldProps<
  T extends FieldValues,
  TName extends FieldPath<T>,
> extends FormFieldBaseProps<T, TName> {
  children: (props: FormFieldRenderProps<T, TName>) => ReactNode;
}

export function FormControllerField<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  children,
  id,
  label,
  labelProps,
  name,
}: FormControllerFieldProps<T, TName>) {
  const { control } = useFormContext<T>();
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;

  return (
    <Controller<T, TName>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <>
          {label && (
            <FormLabel htmlFor={inputId} {...labelProps}>
              {label}
            </FormLabel>
          )}

          {children({ field, fieldState, errorId, inputId })}

          <FormMessage id={errorId} message={fieldState.error?.message} />
        </>
      )}
    />
  );
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
  transform,
  ...props
}: FormFieldProps<T, TName>) {
  return (
    <FormControllerField<T, TName>
      id={id}
      label={label}
      labelProps={labelProps}
      name={name}
    >
      {({ field, fieldState, errorId, inputId }) =>
        children ? (
          children({ field, fieldState, errorId, inputId })
        ) : (
          <AppInput
            {...props}
            ref={field.ref}
            id={inputId}
            aria-describedby={fieldState.error ? errorId : undefined}
            aria-invalid={fieldState.invalid}
            value={field.value == null ? "" : String(field.value)}
            onBlur={field.onBlur}
            onChangeText={(value) =>
              field.onChange(transform ? transform(value) : value)
            }
          />
        )
      }
    </FormControllerField>
  );
}
