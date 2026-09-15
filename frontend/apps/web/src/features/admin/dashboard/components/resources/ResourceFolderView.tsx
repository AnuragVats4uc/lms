import { Plus } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard, AppHeading, AppText } from "@repo/ui/primitives";
import { ResourceFolderGrid, UploadDropzone } from "@repo/ui/dashboard";
import type { FolderCardProps, UploadDropzoneProps } from "@repo/ui/dashboard";
import type { DashboardContext } from "@repo/types";

import { ResourceEmptyState } from "./ResourceEmptyState";

export const ResourceFolderView = ({
  context,
  folders,
  onAddFolder,
  upload,
}: {
  context: DashboardContext;
  folders: FolderCardProps[];
  onAddFolder?: () => void;
  upload: UploadDropzoneProps;
}) => (
  <AppCard
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
            Resource Folders in &quot;
            {context.course?.name ?? "selected course"}&quot;
          </AppHeading>
          <AppText color="#52627A" fontSize="$caption" lineHeight="$caption">
            Select a folder to view and manage its resources.
          </AppText>
        </YStack>
        <Button
          aria-label="Add Folder"
          background="#059669"
          height={40}
          onPress={onAddFolder}
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
        <ResourceEmptyState onAddFolder={onAddFolder} />
      )}
      <UploadDropzone {...upload} />
    </YStack>
  </AppCard>
);
