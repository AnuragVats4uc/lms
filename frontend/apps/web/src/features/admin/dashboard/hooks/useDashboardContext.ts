import { useState } from "react";
import type { DashboardQuery } from "@repo/types";

export const useDashboardContext = () => {
  const [dashboardContext, setDashboardContext] = useState<DashboardQuery>({});
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [treeOnly, setTreeOnly] = useState(false);

  const toggleTreeNode = (id: string) => {
    setCollapsedTreeIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    collapsedTreeIds,
    dashboardContext,
    selectedTreeId,
    setDashboardContext,
    setSelectedTreeId,
    setTreeOnly,
    toggleTreeNode,
    treeOnly,
  };
};
