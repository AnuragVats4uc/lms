import { Network, Plus } from "lucide-react";
import { Button, XStack, YStack } from "@repo/ui";
import { AppCard, AppEmptyState, AppHeading } from "@repo/ui/primitives";
import { TreeView } from "@repo/ui/dashboard";
import type { TreeNodeItem } from "@repo/ui/dashboard";

export const ResourceTreeView = ({
  onAddFolder,
  onSelectTree,
  onToggleTree,
  tree,
}: {
  onAddFolder?: () => void;
  onSelectTree?: (id: string) => void;
  onToggleTree?: (id: string) => void;
  tree: TreeNodeItem[];
}) => (
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
        <TreeView
          items={tree}
          onSelect={onSelectTree}
          onToggle={onToggleTree}
        />
      ) : (
        <AppEmptyState
          description="Create sessions, courses and folders to build the content hierarchy for this workspace."
          icon={
            <XStack
              background="#ECFDF5"
              height={46}
              rounded="$10"
              style={{
                alignItems: "center",
                color: "#059669",
                justifyContent: "center",
              }}
              width={46}
            >
              <Network aria-hidden="true" size={22} strokeWidth={2.1} />
            </XStack>
          }
          title="No hierarchy yet"
        />
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
);
