import { DashboardPage } from "@/features/admin/dashboard";
import {
  dashboardBreadcrumbs,
  dashboardFolders,
  dashboardQuickActions,
  dashboardRoles,
  dashboardStatistics,
  dashboardSupport,
  dashboardTree,
  dashboardUpload,
} from "@/mocks/dashboard";

export function AdminDashboardPage() {
  return (
    <DashboardPage
      breadcrumbs={dashboardBreadcrumbs}
      folders={dashboardFolders}
      quickActions={dashboardQuickActions}
      roles={dashboardRoles}
      statistics={dashboardStatistics}
      support={dashboardSupport}
      tree={dashboardTree}
      upload={dashboardUpload}
    />
  );
}
