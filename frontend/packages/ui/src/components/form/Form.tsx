"use client";

import {
  FormProvider,
  UseFormReturn,
  FieldValues,
} from "react-hook-form";

interface AppFormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: React.ReactNode;
  onSubmit: (values: T) => void | Promise<void>;
}

export function AppForm<T extends FieldValues>({
  form,
  children,
  onSubmit,
}: AppFormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}