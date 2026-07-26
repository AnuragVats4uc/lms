import type { ReactNode } from "react";

export interface AppEmptyStateProps {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
}
