import type { ReactNode } from "react";
import type { AppCardProps } from "../../primitives";
import type { DashboardAction, DashboardMetric } from "../types";

export interface FolderCardProps extends AppCardProps {
  actions?: DashboardAction[];
  badge: string;
  description: string;
  folderCount: number;
  icon: ReactNode;
  resourceCount: number;
  title: string;
  updatedAt: string;
}
