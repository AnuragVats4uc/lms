"use client";

import { Label, LabelProps } from "tamagui";

interface FormLabelProps extends LabelProps {
  children: React.ReactNode;
}

export function FormLabel({ children, ...props }: FormLabelProps) {
  return (
    <Label
      mb="$0"
      fontSize="$caption"
      fontWeight="$button"
      letterSpacing="$body"
      {...props}
    >
      {children}
    </Label>
  );
}
