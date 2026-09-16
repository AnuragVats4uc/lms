import { Folder as FolderIcon } from "lucide-react";
import type { FolderTreeNode } from "@repo/types";
import type { TreeNodeItem } from "@repo/ui/dashboard";

export const flattenFolderTree = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)]);

export const getExpandableFolderIds = (nodes: FolderTreeNode[]): number[] =>
  nodes.flatMap((node) => [
    ...(node.children.length ? [node.id] : []),
    ...getExpandableFolderIds(node.children),
  ]);

export const buildFolderTreeItems = ({
  expandedIds,
  nodes,
  selectedFolderId,
}: {
  expandedIds: Set<number>;
  nodes: FolderTreeNode[];
  selectedFolderId: number | null;
}): TreeNodeItem[] =>
  nodes.map((node) => ({
    children: buildFolderTreeItems({
      expandedIds,
      nodes: node.children,
      selectedFolderId,
    }),
    expanded: expandedIds.has(node.id),
    icon: <FolderIcon aria-hidden="true" color="#64748B" size={15} />,
    id: `folder-${node.id}`,
    label: node.name,
    selected: selectedFolderId === node.id,
  }));
