import type { DashboardData } from "@repo/types";

import { getDashboardResourcePath } from "../utils/dashboardPaths";

export const useDashboardNavigation = ({
  resourceData,
  router,
  setSelectedTreeId,
}: {
  resourceData?: DashboardData;
  router: { push: (href: string) => void };
  setSelectedTreeId: (id: string) => void;
}) => {
  const navigateToTreeNode = (id: string) => {
    setSelectedTreeId(id);
    if (id.startsWith("folder-")) {
      const folderId = Number(id.replace("folder-", ""));
      if (resourceData) {
        router.push(getDashboardResourcePath(resourceData, folderId));
      }
      return;
    }
    if (
      id.startsWith("session-course-") &&
      resourceData?.context.sessionCourseId
    ) {
      router.push(getDashboardResourcePath(resourceData));
    }
  };

  return { navigateToTreeNode };
};
