import type { TreeNodeItem } from "../TreeNode";

export interface TreeViewProps {
  items: TreeNodeItem[];
  onSelect?: (id: string) => void;
  onToggle?: (id: string) => void;
}
