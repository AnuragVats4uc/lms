"use client";

import { ReactNode } from "react";
import {
  FieldValues,
  FormProvider,
  UseFormReturn,
} from "react-hook-form";

interface AppFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: ReactNode;
  onSubmit: (values: T) => void | Promise<void>;
}

export function AppForm<T extends FieldValues>({
  form,
  children,
  onSubmit,
}: AppFormProps<T>) {
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
