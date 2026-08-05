"use client";

import {
  DashboardStats,
  HelpCard,
  PageContainer,
} from "@repo/ui/dashboard";
import type {
  BreadcrumbItem,
  FolderCardProps,
  QuickActionsProps,
  RoleCardProps,
  StatCardProps,
  SupportCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";

import { ResourceManagementSection } from "./ResourceManagementSection";
import { RolesPermissionSection } from "./RolesPermissionSection";

interface DashboardPageProps {
  breadcrumbs: BreadcrumbItem[];
  folders: FolderCardProps[];
  quickActions: QuickActionsProps;
  roles: RoleCardProps[];
  statistics: StatCardProps[];
  support: SupportCardProps;
  tree: TreeNodeItem[];
  onAddFolder?: () => void;
  onMore?: () => void;
  onRefresh?: () => void;
  onSelectTree?: (id: string) => void;
  onToggleTree?: (id: string) => void;
  onViewAllRoles?: () => void;
  onViewTree?: () => void;
  treeOnly?: boolean;
  refreshing?: boolean;
  upload: UploadDropzoneProps;
}

export function DashboardPage({
  breadcrumbs,
  folders,
  quickActions,
  roles,
  statistics,
  support,
  tree,
  onAddFolder,
  onMore,
  onRefresh,
  onSelectTree,
  onToggleTree,
  onViewAllRoles,
  onViewTree,
  treeOnly,
  refreshing,
  upload,
}: DashboardPageProps) {
  return (
    <PageContainer>
      <DashboardStats
        quickActions={quickActions}
        stats={statistics}
      />
      <ResourceManagementSection
        breadcrumbs={breadcrumbs}
        folders={folders}
        onAddFolder={onAddFolder}
        onMore={onMore}
        onRefresh={onRefresh}
        onSelectTree={onSelectTree}
        onToggleTree={onToggleTree}
        onViewTree={onViewTree}
        tree={tree}
        treeOnly={treeOnly}
        refreshing={refreshing}
        upload={upload}
      />
      <RolesPermissionSection onViewAllRoles={onViewAllRoles} roles={roles} />
      <HelpCard {...support} />
    </PageContainer>
  );
}
