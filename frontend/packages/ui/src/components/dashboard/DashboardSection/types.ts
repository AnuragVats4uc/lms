import type { ReactNode } from "react";

export interface DashboardSectionProps {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}
