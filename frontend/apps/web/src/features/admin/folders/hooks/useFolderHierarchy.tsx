import { useMemo, useState } from "react";
import { Building2, CalendarDays, FolderTree } from "lucide-react";
import type { FolderTreeNode, SessionCourse } from "@repo/types";
import type { TreeNodeItem } from "@repo/ui/dashboard";

import {
  buildFolderTreeItems,
  getExpandableFolderIds,
} from "../utils/folderTree";

export const useFolderHierarchy = ({
  organizationId,
  organizationName,
  selectedFolderId,
  selectedSessionCourse,
  sessionName,
  tree,
}: {
  organizationId: number | null;
  organizationName: string;
  selectedFolderId: number | null;
  selectedSessionCourse?: SessionCourse;
  sessionName: string;
  tree: FolderTreeNode[];
}) => {
  const [expandedFolderIds, setExpandedFolderIds] =
    useState<Set<number> | null>(null);
  const expandedIds = useMemo(
    () => expandedFolderIds ?? new Set(getExpandableFolderIds(tree)),
    [expandedFolderIds, tree],
  );
  const items = useMemo<TreeNodeItem[]>(() => {
    const folderItems = buildFolderTreeItems({
      expandedIds,
      nodes: tree,
      selectedFolderId,
    });
    if (!selectedSessionCourse) return folderItems;
    return [
      {
        children: [
          {
            children: [
              {
                children: folderItems,
                expanded: true,
                icon: (
                  <FolderTree aria-hidden="true" color="#059669" size={15} />
                ),
                id: `session-course-${selectedSessionCourse.id}`,
                label:
                  selectedSessionCourse.displayName ??
                  selectedSessionCourse.course.name,
              },
            ],
            expanded: true,
            icon: <CalendarDays aria-hidden="true" color="#64748B" size={15} />,
            id: `session-${selectedSessionCourse.sessionId}`,
            label: sessionName,
          },
        ],
        expanded: true,
        icon: <Building2 aria-hidden="true" color="#64748B" size={15} />,
        id: `organization-${organizationId ?? "current"}`,
        label: organizationName,
      },
    ];
  }, [
    expandedIds,
    organizationId,
    organizationName,
    selectedFolderId,
    selectedSessionCourse,
    sessionName,
    tree,
  ]);

  const resetExpanded = () => setExpandedFolderIds(null);
  const toggleFolder = (id: number) =>
    setExpandedFolderIds((current) => {
      const next = new Set(current ?? expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return { items, resetExpanded, toggleFolder };
};
