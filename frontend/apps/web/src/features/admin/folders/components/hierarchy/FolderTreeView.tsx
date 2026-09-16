import { TreeView } from "@repo/ui/dashboard";
import type { TreeNodeItem } from "@repo/ui/dashboard";
import { FolderTreeEmptyState } from "./FolderTreeEmptyState";

export const FolderTreeView = ({
  items,
  onSelectFolder,
  onToggleFolder,
}: {
  items: TreeNodeItem[];
  onSelectFolder: (id: number) => void;
  onToggleFolder: (id: number) => void;
}) =>
  items.length ? (
    <TreeView
      items={items}
      onSelect={(id) => {
        if (id.startsWith("folder-"))
          onSelectFolder(Number(id.replace("folder-", "")));
      }}
      onToggle={(id) => {
        if (id.startsWith("folder-"))
          onToggleFolder(Number(id.replace("folder-", "")));
      }}
    />
  ) : (
    <FolderTreeEmptyState />
  );
