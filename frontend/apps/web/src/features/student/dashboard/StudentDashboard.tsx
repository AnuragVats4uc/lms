"use client";

import { YStack } from "@repo/ui";

import { StudentDashboardBannerCarousel } from "./banners/StudentDashboardBannerCarousel";
import { ContentUpdatesSection } from "./components/content-updates/ContentUpdatesSection";
import { MyCoursesSection } from "./components/courses/MyCoursesSection";
import { DashboardErrorState } from "./components/DashboardErrorState";
import { DashboardLoadingState } from "./components/DashboardLoadingState";
import { NotificationsSection } from "./components/notifications/NotificationsSection";
import { WelcomeCard } from "./components/welcome/WelcomeCard";
import { useStudentDashboard } from "./hooks/useStudentDashboard";

export const StudentDashboard = () => {
  const dashboardQuery = useStudentDashboard();

  if (dashboardQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <DashboardErrorState onRetry={() => void dashboardQuery.refetch()} />
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <YStack className="student-dashboard-page">
      <YStack className="student-dashboard-main-column">
        {dashboard.banners.length ? (
          <StudentDashboardBannerCarousel banners={dashboard.banners} />
        ) : (
          <WelcomeCard
            batch={dashboard.student.batch ?? "Not assigned"}
            continuePath={dashboard.continueLearning.path}
            studentName={dashboard.student.name}
          />
        )}
        <MyCoursesSection courses={dashboard.courses} />
      </YStack>
      <YStack className="student-dashboard-side-column">
        <NotificationsSection notifications={dashboard.notifications} />
        <ContentUpdatesSection updates={dashboard.contentUpdates} />
      </YStack>
    </YStack>
  );
};
