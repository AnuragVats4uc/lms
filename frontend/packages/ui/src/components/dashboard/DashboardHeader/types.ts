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

export interface DashboardHeaderProfileAction {
  closeOnPress?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  id: string;
  label: string;
  loading?: boolean;
  onPress: () => void;
}

export interface DashboardHeaderProps {
  actions?: DashboardHeaderAction[];
  leadingAction?: ReactNode;
  organizationLabel?: string;
  organizationIcon?: ReactNode;
  organizationOnPress?: () => void;
  profile: DashboardHeaderProfile;
  profileActions?: DashboardHeaderProfileAction[];
  profileOnPress?: () => void;
  searchPlaceholder?: string;
  onSearchSubmit?: (value: string) => void;
  shortcutLabel?: string;
}
