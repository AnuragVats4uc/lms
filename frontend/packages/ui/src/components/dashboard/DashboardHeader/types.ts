import type { ReactNode } from "react";

export interface DashboardHeaderAction {
  icon: ReactNode;
  label: string;
  notificationCount?: number;
  onPress?: () => void;
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
  organizationOnPress?: () => void;
  profile: DashboardHeaderProfile;
  profileOnPress?: () => void;
  searchPlaceholder: string;
  onSearchSubmit?: (value: string) => void;
  shortcutLabel?: string;
}
