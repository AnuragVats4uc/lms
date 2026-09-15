"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Text, YStack } from "@repo/ui";
import { PageContainer } from "@repo/ui/dashboard";
import { useAuthSession } from "@repo/auth";

import { EMPTY_DASHBOARD_CONTEXT_OPTIONS } from "./constants";
import { AdminDashboardSkeleton } from "./components/states/AdminDashboardSkeleton";
import { DashboardView } from "./DashboardView";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { useDashboardContext } from "./hooks/useDashboardContext";
import { useDashboardNavigation } from "./hooks/useDashboardNavigation";
import { useDashboardUpload } from "./hooks/useDashboardUpload";
import { buildDashboardBreadcrumbs } from "./utils/builders/buildDashboardBreadcrumbs";
import { buildDashboardFolders } from "./utils/builders/buildDashboardFolders";
import { buildDashboardQuickActions } from "./utils/builders/buildDashboardQuickActions";
import { buildDashboardRoles } from "./utils/builders/buildDashboardRoles";
import { buildDashboardStatistics } from "./utils/builders/buildDashboardStatistics";
import { buildDashboardTree } from "./utils/builders/buildDashboardTree";
import { getDashboardFolderPath } from "./utils/dashboardPaths";

export const AdminDashboardPage = () => {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));
  const {
    collapsedTreeIds,
    dashboardContext,
    selectedTreeId,
    setDashboardContext,
    setSelectedTreeId,
    setTreeOnly,
    toggleTreeNode,
    treeOnly,
  } = useDashboardContext();
  const {
    contextOptionsQuery,
    dashboardQuery,
    effectiveContext,
    resourceQuery,
  } = useAdminDashboard(dashboardContext);
  const resourceData = resourceQuery.data ?? dashboardQuery.data;
  const upload = useDashboardUpload(resourceData, router.push);
  const { navigateToTreeNode } = useDashboardNavigation({
    resourceData,
    router,
    setSelectedTreeId,
  });

  const overviewViewModel = useMemo(() => {
    if (!dashboardQuery.data) return null;
    return {
      roles: buildDashboardRoles(dashboardQuery.data, router.push),
      statistics: buildDashboardStatistics(
        dashboardQuery.data,
        router.push,
        isSuperAdmin,
      ),
    };
  }, [dashboardQuery.data, isSuperAdmin, router.push]);

  const quickActions = useMemo(
    () =>
      dashboardQuery.data
        ? buildDashboardQuickActions(
            dashboardQuery.data,
            router.push,
            isSuperAdmin,
          )
        : null,
    [dashboardQuery.data, isSuperAdmin, router.push],
  );

  const resourceViewModel = useMemo(() => {
    if (!resourceData) return null;
    const selectedId =
      selectedTreeId ??
      (resourceData.context.sessionCourseId
        ? `session-course-${resourceData.context.sessionCourseId}`
        : null);
    return {
      breadcrumbs: buildDashboardBreadcrumbs(resourceData),
      context: resourceData.context,
      folders: buildDashboardFolders(resourceData, router.push),
      tree: resourceData.tree.map((node) =>
        buildDashboardTree(node, selectedId, collapsedTreeIds),
      ),
    };
  }, [collapsedTreeIds, resourceData, router.push, selectedTreeId]);

  if (dashboardQuery.isPending) {
    return <AdminDashboardSkeleton statCount={isSuperAdmin ? 4 : 3} />;
  }

  if (
    dashboardQuery.isError ||
    !overviewViewModel ||
    !resourceViewModel ||
    !resourceData ||
    !quickActions ||
    !upload
  ) {
    return (
      <PageContainer>
        <YStack gap="$3" py="$6" style={{ alignItems: "center" }}>
          <Text color="#B91C1C" fontSize="$body">
            Unable to load dashboard data.
          </Text>
          <Button
            background="#059669"
            onPress={() => void dashboardQuery.refetch()}
            rounded="$3"
          >
            <Button.Text color="#FFFFFF">Retry</Button.Text>
          </Button>
        </YStack>
      </PageContainer>
    );
  }

  return (
    <DashboardView
      breadcrumbs={resourceViewModel.breadcrumbs}
      context={resourceViewModel.context}
      contextLoading={contextOptionsQuery.isFetching}
      contextOptions={
        contextOptionsQuery.data ?? EMPTY_DASHBOARD_CONTEXT_OPTIONS
      }
      folders={resourceViewModel.folders}
      onAddFolder={() =>
        router.push(getDashboardFolderPath(resourceData, "create"))
      }
      onContextChange={setDashboardContext}
      onMore={() => router.push("/admin/resources")}
      onRefresh={() => void resourceQuery.refetch()}
      onSelectTree={navigateToTreeNode}
      onToggleTree={toggleTreeNode}
      onViewAllRoles={() => router.push("/admin/roles")}
      onViewTree={() => setTreeOnly((current) => !current)}
      quickActions={quickActions}
      refreshing={resourceQuery.isFetching}
      roles={overviewViewModel.roles}
      selectedContext={effectiveContext}
      statistics={overviewViewModel.statistics}
      tree={resourceViewModel.tree}
      treeOnly={treeOnly}
      upload={upload}
    />
  );
};
