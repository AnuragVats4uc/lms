"use client";

import { XStack, YStack } from "@repo/ui";
import { BreadcrumbNavigation, DashboardSection } from "@repo/ui/dashboard";
import type {
  BreadcrumbItem,
  FolderCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";
import type {
  DashboardContext,
  DashboardContextOptions,
  DashboardQuery,
} from "@repo/types";

import { DashboardContextFilters } from "../context/DashboardContextFilters";
import { ResourceFolderView } from "./ResourceFolderView";
import { ResourceSectionActions } from "./ResourceSectionActions";
import { ResourceTreeView } from "./ResourceTreeView";

export interface ResourceManagementSectionProps {
  breadcrumbs: BreadcrumbItem[];
  context: DashboardContext;
  contextLoading?: boolean;
  contextOptions: DashboardContextOptions;
  folders: FolderCardProps[];
  onAddFolder?: () => void;
  onContextChange?: (context: DashboardQuery) => void;
  onMore?: () => void;
  onRefresh?: () => void;
  onSelectTree?: (id: string) => void;
  onToggleTree?: (id: string) => void;
  onViewTree?: () => void;
  refreshing?: boolean;
  selectedContext: DashboardQuery;
  tree: TreeNodeItem[];
  treeOnly?: boolean;
  upload: UploadDropzoneProps;
}

export const ResourceManagementSection = ({
  breadcrumbs,
  context,
  contextLoading,
  contextOptions,
  folders,
  onAddFolder,
  onContextChange,
  onMore,
  onRefresh,
  onSelectTree,
  onToggleTree,
  onViewTree,
  refreshing,
  selectedContext,
  tree,
  treeOnly = false,
  upload,
}: ResourceManagementSectionProps) => (
  <DashboardSection
    action={
      <ResourceSectionActions
        onMore={onMore}
        onRefresh={onRefresh}
        onViewTree={onViewTree}
        refreshing={refreshing}
        treeOnly={treeOnly}
      />
    }
    description="Manage content across your organization, sessions, courses and resources."
    title="Resource Management"
  >
    <YStack gap="$4">
      <BreadcrumbNavigation items={breadcrumbs} />
      <DashboardContextFilters
        contextLoading={contextLoading}
        contextOptions={contextOptions}
        onContextChange={onContextChange}
        selectedContext={selectedContext}
      />
      <XStack
        className="lms-resource-management-grid"
        gap="$4"
        style={{
          display: "grid",
          gridTemplateColumns: treeOnly
            ? "minmax(0, 1fr)"
            : "minmax(240px, 280px) minmax(0, 1fr)",
          minWidth: 0,
        }}
      >
        <ResourceTreeView
          onAddFolder={onAddFolder}
          onSelectTree={onSelectTree}
          onToggleTree={onToggleTree}
          tree={tree}
        />
        {!treeOnly ? (
          <ResourceFolderView
            context={context}
            folders={folders}
            onAddFolder={onAddFolder}
            upload={upload}
          />
        ) : null}
      </XStack>
    </YStack>
  </DashboardSection>
);
