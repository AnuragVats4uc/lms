"use client";

import { MoreHorizontal, Network, Plus, RefreshCw } from "lucide-react";
import {
  AppCard,
  AppHeading,
  AppText,
} from "@repo/ui/primitives";
import {
  BreadcrumbNavigation,
  DashboardSection,
  ResourceFolderGrid,
  TreeView,
  UploadDropzone,
} from "@repo/ui/dashboard";
import { Button, XStack, YStack } from "@repo/ui";
import type {
  BreadcrumbItem,
  FolderCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";

interface ResourceManagementSectionProps {
  breadcrumbs: BreadcrumbItem[];
  folders: FolderCardProps[];
  onAddFolder?: () => void;
  onMore?: () => void;
  onSelectTree?: (id: string) => void;
  onToggleTree?: (id: string) => void;
  onViewTree?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  tree: TreeNodeItem[];
  treeOnly?: boolean;
  upload: UploadDropzoneProps;
}

export function ResourceManagementSection({
  breadcrumbs,
  folders,
  onAddFolder,
  onMore,
  onSelectTree,
  onToggleTree,
  onViewTree,
  onRefresh,
  refreshing = false,
  tree,
  treeOnly = false,
  upload,
}: ResourceManagementSectionProps) {
  return (
    <DashboardSection
      action={
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <Button
            aria-label="Refresh dashboard content"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            borderWidth={1}
            disabled={refreshing}
            height={40}
            onPress={onRefresh}
            px="$3"
            rounded="$3"
          >
            <RefreshCw aria-hidden="true" color="#047857" size={16} />
            <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button.Text>
          </Button>
          <Button
            aria-label="View as Tree"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            borderWidth={1}
            height={40}
            px="$4"
            rounded="$3"
            onPress={onViewTree}
          >
            <Network aria-hidden="true" color="#059669" size={16} />
            <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
              {treeOnly ? "View folders" : "View as Tree"}
            </Button.Text>
          </Button>
          <Button
            aria-label="More resource actions"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            borderWidth={1}
            height={40}
            px="$3"
            rounded="$3"
            onPress={onMore}
          >
            <MoreHorizontal aria-hidden="true" color="#0F1D3A" size={18} />
          </Button>
        </XStack>
      }
      description="Manage content across your organization, sessions, courses and resources."
      title="Resource Management"
    >
      <YStack gap="$4">
        <BreadcrumbNavigation items={breadcrumbs} />
        <XStack
          className="lms-resource-management-grid"
          gap="$4"
          style={{
            display: "grid",
            gridTemplateColumns: treeOnly ? "minmax(0, 1fr)" : "minmax(240px, 280px) minmax(0, 1fr)",
            minWidth: 0,
          }}
        >
          <AppCard
            className="lms-resource-tree-panel"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{ borderRadius: 12, minHeight: 420, minWidth: 0 }}
          >
            <YStack gap="$3">
              <AppHeading level={3} fontSize="$caption" lineHeight="$caption">
                Content Hierarchy
              </AppHeading>
              {tree.length ? (
                <TreeView items={tree} onSelect={onSelectTree} onToggle={onToggleTree} />
              ) : (
                <AppText color="#52627A" fontSize="$caption">
                  No content hierarchy is available yet.
                </AppText>
              )}
              <Button
                aria-label="Add New Folder"
                background="#FFFFFF"
                borderColor="#10B981"
                borderWidth={1}
                height={42}
                mt="$3"
                onPress={onAddFolder}
                rounded="$3"
              >
                <Plus aria-hidden="true" color="#059669" size={15} />
                <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
                  Add New Folder
                </Button.Text>
              </Button>
            </YStack>
          </AppCard>
          {!treeOnly ? <AppCard
            className="lms-resource-folders-panel"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{ borderRadius: 12, minWidth: 0 }}
          >
            <YStack gap="$4">
              <XStack
                className="lms-resource-folders-header"
                style={{
                  alignItems: "flex-start",
                  gap: 12,
                  justifyContent: "space-between",
                  minWidth: 0,
                }}
              >
                <YStack gap="$1" style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <AppHeading level={3} fontSize="$label" lineHeight="$label">
                    Resource Folders in "Data Structures"
                  </AppHeading>
                  <AppText color="#52627A" fontSize="$caption" lineHeight="$caption">
                    Select a folder to view and manage its resources.
                  </AppText>
                </YStack>
                <Button
                  aria-label="Add Folder"
                  background="#059669"
                  height={40}
                  px="$4"
                  rounded="$3"
                  style={{ flexShrink: 0 }}
                >
                  <Plus aria-hidden="true" color="#FFFFFF" size={16} />
                  <Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">
                    Add Folder
                  </Button.Text>
                </Button>
              </XStack>
              {folders.length ? (
                <ResourceFolderGrid folders={folders} />
              ) : (
                <AppText color="#52627A" fontSize="$caption">
                  No root folders are available for the selected course.
                </AppText>
              )}
              <UploadDropzone {...upload} />
            </YStack>
          </AppCard> : null}
        </XStack>
      </YStack>
    </DashboardSection>
  );
}
