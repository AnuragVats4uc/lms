"use client";

import { Button } from "tamagui";

export function AppButton({ children, type }: { type: "submit" | "reset" | "button", children: any }) {
  return (
    <Button theme="blue" type={type}>
      <Button.Text
        fontSize="$label"
        fontWeight="$button"
        letterSpacing="$button"
      >
      {children}
      </Button.Text>
    </Button>
  );
}
