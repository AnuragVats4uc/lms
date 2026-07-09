"use client";

import { AppInput } from "./Input";

export function PasswordInput(
  {
    secureTextEntry = true,
    ...props
  }: React.ComponentProps<typeof AppInput>
) {
  return (
    <AppInput
      {...props}
      secureTextEntry={secureTextEntry}
      type={secureTextEntry ? "password" : "text"}
    />
  );
}
