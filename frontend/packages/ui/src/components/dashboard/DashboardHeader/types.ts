import type { ReactNode } from "react";

export interface DashboardHeaderAction {
  icon: ReactNode;
  label: string;
  notificationCount?: number;
}

export interface DashboardHeaderProfile {
  imageSrc?: string;
  name: string;
  role: string;
}

export interface DashboardHeaderProps {
  actions?: DashboardHeaderAction[];
  leadingAction?: ReactNode;
  organizationLabel: string;
  organizationIcon?: ReactNode;
  profile: DashboardHeaderProfile;
  searchPlaceholder: string;
  shortcutLabel?: string;
}
