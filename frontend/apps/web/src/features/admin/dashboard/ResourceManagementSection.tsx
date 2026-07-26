"use client";

import { MoreHorizontal, Network, Plus } from "lucide-react";
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
  tree: TreeNodeItem[];
  upload: UploadDropzoneProps;
}

export function ResourceManagementSection({
  breadcrumbs,
  folders,
  tree,
  upload,
}: ResourceManagementSectionProps) {
  return (
    <DashboardSection
      action={
        <XStack gap="$3" style={{ alignItems: "center" }}>
          <Button
            aria-label="View as Tree"
            background="#FFFFFF"
            borderColor="#E1E7F0"
            borderWidth={1}
            height={40}
            px="$4"
            rounded="$3"
          >
            <Network aria-hidden="true" color="#059669" size={16} />
            <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
              View as Tree
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
          gap="$4"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
            minWidth: 0,
          }}
        >
          <AppCard
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{ borderRadius: 12, minHeight: 420, minWidth: 0 }}
          >
            <YStack gap="$3">
              <AppHeading level={3} fontSize="$caption" lineHeight="$caption">
                Content Hierarchy
              </AppHeading>
              <TreeView items={tree} />
              <Button
                aria-label="Add New Folder"
                background="#FFFFFF"
                borderColor="#10B981"
                borderWidth={1}
                height={42}
                mt="$3"
                rounded="$3"
              >
                <Plus aria-hidden="true" color="#059669" size={15} />
                <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
                  Add New Folder
                </Button.Text>
              </Button>
            </YStack>
          </AppCard>
          <AppCard
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{ borderRadius: 12, minWidth: 0 }}
          >
            <YStack gap="$4">
              <XStack
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
              <ResourceFolderGrid folders={folders} />
              <UploadDropzone {...upload} />
            </YStack>
          </AppCard>
        </XStack>
      </YStack>
    </DashboardSection>
  );
}
