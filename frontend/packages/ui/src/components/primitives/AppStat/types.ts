import type { ReactNode } from "react";

export interface AppStatProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
}
