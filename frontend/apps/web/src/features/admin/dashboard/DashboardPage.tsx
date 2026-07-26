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
        tree={tree}
        upload={upload}
      />
      <RolesPermissionSection roles={roles} />
      <HelpCard {...support} />
    </PageContainer>
  );
}
