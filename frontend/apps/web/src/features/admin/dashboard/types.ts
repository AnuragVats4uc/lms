import type {
  BreadcrumbItem,
  FolderCardProps,
  RoleCardProps,
  StatCardProps,
  TreeNodeItem,
} from "@repo/ui/dashboard";
import type { DashboardContext } from "@repo/types";

export interface DashboardOverviewViewModel {
  roles: RoleCardProps[];
  statistics: StatCardProps[];
}

export interface DashboardResourceViewModel {
  breadcrumbs: BreadcrumbItem[];
  context: DashboardContext;
  folders: FolderCardProps[];
  tree: TreeNodeItem[];
}
