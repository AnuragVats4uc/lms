import type { ReactNode } from "react";

export interface BreadcrumbItem {
  icon?: ReactNode;
  label: string;
  subtitle?: string;
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}
