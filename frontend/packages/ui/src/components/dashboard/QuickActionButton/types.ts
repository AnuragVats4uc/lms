import type { ReactNode } from "react";

export interface QuickActionButtonProps {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  variant?: "default" | "primary";
}
