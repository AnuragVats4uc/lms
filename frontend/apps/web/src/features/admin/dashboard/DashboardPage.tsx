"use client";

import {
  DashboardStats,
  PageContainer,
} from "@repo/ui/dashboard";
import type {
  BreadcrumbItem,
  FolderCardProps,
  QuickActionsProps,
  RoleCardProps,
  StatCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";
import type { DashboardContext, DashboardContextOptions, DashboardQuery } from "@repo/types";

import { ResourceManagementSection } from "./ResourceManagementSection";
import { RolesPermissionSection } from "./RolesPermissionSection";

interface DashboardPageProps {
  breadcrumbs: BreadcrumbItem[];
  context: DashboardContext;
  selectedContext: DashboardQuery;
  contextOptions: DashboardContextOptions;
  contextLoading?: boolean;
  folders: FolderCardProps[];
  quickActions: QuickActionsProps;
  roles: RoleCardProps[];
  statistics: StatCardProps[];
  tree: TreeNodeItem[];
  onAddFolder?: () => void;
  onMore?: () => void;
  onRefresh?: () => void;
  onContextChange?: (context: DashboardQuery) => void;
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
  context,
  selectedContext,
  contextOptions,
  contextLoading,
  folders,
  quickActions,
  roles,
  statistics,
  tree,
  onAddFolder,
  onMore,
  onRefresh,
  onContextChange,
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
        context={context}
        selectedContext={selectedContext}
        contextOptions={contextOptions}
        contextLoading={contextLoading}
        folders={folders}
        onAddFolder={onAddFolder}
        onMore={onMore}
        onRefresh={onRefresh}
        onContextChange={onContextChange}
        onSelectTree={onSelectTree}
        onToggleTree={onToggleTree}
        onViewTree={onViewTree}
        tree={tree}
        treeOnly={treeOnly}
        refreshing={refreshing}
        upload={upload}
      />
      <RolesPermissionSection onViewAllRoles={onViewAllRoles} roles={roles} />
      {/* <HelpCard {...support} /> */}
    </PageContainer>
  );
}
