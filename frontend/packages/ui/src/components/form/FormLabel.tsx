"use client";

import { Label } from "tamagui";

interface Props {
  children: React.ReactNode;
}

export function FormLabel({ children }: Props) {
  return (
    <Label
      mb="$2"
      fontSize="$label"
      fontWeight="$label"
      letterSpacing="$body"
    >
      {children}
    </Label>
  );
}
