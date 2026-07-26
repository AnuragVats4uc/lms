import type { ReactNode } from "react";

export interface TreeNodeItem {
  children?: TreeNodeItem[];
  expanded?: boolean;
  icon?: ReactNode;
  id: string;
  label: string;
  selected?: boolean;
}

export interface TreeNodeProps {
  item: TreeNodeItem;
  level?: number;
  onSelect?: (id: string) => void;
  onToggle?: (id: string) => void;
}
