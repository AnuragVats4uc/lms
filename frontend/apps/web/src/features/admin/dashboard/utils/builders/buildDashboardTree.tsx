import type { TreeNodeItem } from "@repo/ui/dashboard";
import type { DashboardTreeNode } from "@repo/types";

import { getDashboardTreeIcon } from "../dashboardIcons";

export const buildDashboardTree = (
  node: DashboardTreeNode,
  selectedId: string | null,
  collapsedIds: Set<string>,
): TreeNodeItem => ({
  id: node.id,
  label: node.label,
  icon: getDashboardTreeIcon(node),
  expanded: !collapsedIds.has(node.id),
  selected: node.id === selectedId,
  children: node.children?.map((child) =>
    buildDashboardTree(child, selectedId, collapsedIds),
  ),
});
