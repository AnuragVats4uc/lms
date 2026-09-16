import { Plus } from "lucide-react";
import { Button, Text, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui/primitives";
import type { TreeNodeItem } from "@repo/ui/dashboard";
import { FolderTreeView } from "./FolderTreeView";

export const FolderHierarchyPanel = ({
  items,
  onAddFolder,
  onSelectFolder,
  onToggleFolder,
}: {
  items: TreeNodeItem[];
  onAddFolder: () => void;
  onSelectFolder: (id: number) => void;
  onToggleFolder: (id: number) => void;
}) => (
  <AppCard
    className="lms-folder-hierarchy-card"
    background="#FFFFFF"
    borderColor="#E1E7F0"
    p="$4"
    style={{ borderRadius: 12, minHeight: 420, width: 280 }}
  >
    <YStack gap="$3">
      <Text color="#0F1D3A" fontSize="$caption" fontWeight="$button">
        Content Hierarchy
      </Text>
      <FolderTreeView
        items={items}
        onSelectFolder={onSelectFolder}
        onToggleFolder={onToggleFolder}
      />
      <Button
        aria-label="Add New Folder"
        background="#FFFFFF"
        borderColor="#10B981"
        borderWidth={1}
        height={42}
        mt="$3"
        onPress={onAddFolder}
        rounded="$3"
        width="100%"
      >
        <Plus aria-hidden="true" color="#059669" size={15} />
        <Button.Text color="#047857" fontSize="$caption" fontWeight="$button">
          Add New Folder
        </Button.Text>
      </Button>
    </YStack>
  </AppCard>
);
