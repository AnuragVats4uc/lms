import type { ReactNode } from "react";
import type { AppCardProps } from "../../primitives";
import type { DashboardAction } from "../types";

export interface RoleCardProps extends Omit<AppCardProps, "role"> {
  actions?: DashboardAction[];
  badge: string;
  badgeTone?: "green" | "blue" | "purple" | "orange" | "gray";
  description: string;
  icon: ReactNode;
  permissions: string;
  role: string;
}
