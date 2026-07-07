"use client";

import { useForm } from "react-hook-form";
import { AppButton, AppForm, FormField } from "@repo/ui";

type TestForm = {
  email: string;
};

export default function Home() {
  const form = useForm<TestForm>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: TestForm) => {  
    console.log("anurag", values);
  };

  return (
    <div style={{ padding: 40, maxWidth: 400 }}>
      <AppForm form={form} onSubmit={onSubmit}>
        <FormField
          name="email"
          label="Email"
          placeholder="Enter your email"
        />
        <AppButton type="submit">
          Submit
        </AppButton>
      </AppForm>
    </div>
  );
}