"use client";

import { ReactNode } from "react";
import { Button, ButtonProps, Spinner } from "tamagui";

interface AppButtonProps extends ButtonProps {
  children: ReactNode;
  loading?: boolean;
}

export function AppButton({
  children,
  disabled,
  loading = false,
  type,
  ...props
}: AppButtonProps) {
  return (
    <Button
      theme="blue"
      type={type}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner color="white" size="small" />
      ) : (
        <Button.Text
          fontSize="$label"
          fontWeight="$button"
          letterSpacing="$button"
        >
          {children}
        </Button.Text>
      )}
    </Button>
  );
}
