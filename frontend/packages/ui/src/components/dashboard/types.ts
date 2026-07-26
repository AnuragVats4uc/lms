import type { ReactNode } from "react";

export interface DashboardAction {
  icon?: ReactNode;
  label: string;
  onPress?: () => void;
}

export interface DashboardMetric {
  icon?: ReactNode;
  label: string;
  value: string | number;
}
