import type { Folder } from "@repo/types";
import { Text, YStack } from "@repo/ui";
import { FolderAppearanceDetails } from "./FolderAppearanceDetails";
import { FolderHierarchyDetails } from "./FolderHierarchyDetails";
import { FolderHistoryDetails } from "./FolderHistoryDetails";

export const FolderDetails = ({ folder }: { folder: Folder }) => (
  <YStack gap="$3">
    <FolderHierarchyDetails folder={folder} />
    <FolderAppearanceDetails folder={folder} />
    <FolderHistoryDetails folder={folder} />
    <Text color="#52627A" fontSize="$caption" style={{ display: "none" }}>
      Description: {folder.description ?? "—"}
    </Text>
  </YStack>
);
