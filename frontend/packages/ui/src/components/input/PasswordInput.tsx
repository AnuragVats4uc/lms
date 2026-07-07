"use client";

import { AppInput } from "./Input";

export function PasswordInput(
  props: React.ComponentProps<typeof AppInput>
) {
  return (
    <AppInput
      secureTextEntry
      {...props}
    />
  );
}