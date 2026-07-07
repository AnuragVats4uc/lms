"use client";

import {
  Controller,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";

import { AppInput, AppInputProps } from "../input";
import { FormLabel } from "./FormLabel";
import { FormMessage } from "./FormMessage";

interface FormFieldProps<T extends FieldValues>
  extends Omit<AppInputProps, "form"> {
  name: FieldPath<T>;
  label?: string;
}

export function FormField<T extends FieldValues>({
  name,
  label,
  ...props
}: FormFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <>
          {label && <FormLabel>{label}</FormLabel>}

          <AppInput
            {...props}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
          />

          <FormMessage message={fieldState.error?.message} />
        </>
      )}
    />
  );
}