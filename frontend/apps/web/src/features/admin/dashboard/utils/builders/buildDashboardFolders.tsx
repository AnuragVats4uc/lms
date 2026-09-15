import { Ellipsis, FileText, Folder } from "lucide-react";
import type { FolderCardProps } from "@repo/ui/dashboard";
import type { DashboardData } from "@repo/types";

import { formatDashboardUpdatedAt } from "../dashboardFormatting";
import {
  getDashboardFolderPath,
  getDashboardResourcePath,
} from "../dashboardPaths";

export const buildDashboardFolders = (
  data: DashboardData,
  navigate: (path: string) => void,
): FolderCardProps[] =>
  data.folders.map((folder) => ({
    actions: [
      {
        icon: <Folder size={15} />,
        label: "Open",
        onPress: () => navigate(getDashboardResourcePath(data, folder.id)),
      },
      {
        icon: <FileText size={15} />,
        label: "Resources",
        onPress: () => navigate(getDashboardResourcePath(data, folder.id)),
      },
      {
        icon: <Ellipsis size={15} />,
        label: "More",
        onPress: () =>
          navigate(getDashboardFolderPath(data, "edit", folder.id)),
      },
    ],
    badge: `${folder.resourceCount} resources`,
    description: folder.description ?? "No description available.",
    folderCount: folder.folderCount,
    icon: <Folder aria-hidden="true" size={34} strokeWidth={2.2} />,
    resourceCount: folder.resourceCount,
    title: folder.name,
    updatedAt: formatDashboardUpdatedAt(folder.updatedAt),
  }));
