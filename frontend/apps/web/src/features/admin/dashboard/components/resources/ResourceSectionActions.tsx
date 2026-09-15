import { MoreHorizontal, Network, RefreshCw } from "lucide-react";
import { Button, XStack } from "@repo/ui";

interface ResourceSectionActionsProps {
  onMore?: () => void;
  onRefresh?: () => void;
  onViewTree?: () => void;
  refreshing?: boolean;
  treeOnly?: boolean;
}

export const ResourceSectionActions = ({
  onMore,
  onRefresh,
  onViewTree,
  refreshing = false,
  treeOnly = false,
}: ResourceSectionActionsProps) => (
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
      onPress={onViewTree}
      px="$4"
      rounded="$3"
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
      onPress={onMore}
      px="$3"
      rounded="$3"
    >
      <MoreHorizontal aria-hidden="true" color="#0F1D3A" size={18} />
    </Button>
  </XStack>
);
