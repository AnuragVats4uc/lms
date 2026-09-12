"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, UsersRound, Zap } from "lucide-react";
import { teacherApi } from "@repo/api";
import { YStack } from "@repo/ui";
import { DashboardStats, PageContainer } from "@repo/ui/dashboard";
import type { QuickActionsProps, StatCardProps } from "@repo/ui/dashboard";
import { AssignedCourses } from "./components/AssignedCourses";
import { RecentResources } from "./components/RecentResources";
import { RecentStudents } from "./components/RecentStudents";
import { TeacherHeader } from "./components/TeacherHeader";
import { TeacherDashboardError } from "./components/TeacherDashboardError";
import { TeacherDashboardLoading } from "./components/TeacherDashboardLoading";

export const TeacherDashboardPage = () => {
  const router = useRouter();
  const dashboardQuery = useQuery({
    queryFn: teacherApi.findDashboard,
    queryKey: ["teacher-dashboard"],
    staleTime: 60_000,
  });

  if (dashboardQuery.isLoading) {
    return <TeacherDashboardLoading />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <TeacherDashboardError onPress={() => void dashboardQuery.refetch()} />
    );
  }

  const dashboard = dashboardQuery.data;

  const stats: StatCardProps[] = [
    {
      color: "green",
      icon: <BookOpen aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View courses",
      onPress: () => router.push("/teacher/courses"),
      subtitle: `${dashboard.statistics.activeCourses} active assignments`,
      title: "Assigned Courses",
      value: dashboard.statistics.assignedCourses,
    },
    {
      color: "blue",
      icon: <UsersRound aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View students",
      onPress: () => router.push("/teacher/students"),
      subtitle: `${dashboard.statistics.courseEnrollments} course enrollments`,
      title: "Students",
      value: dashboard.statistics.enrolledStudents,
    },
    {
      color: "purple",
      icon: <FileText aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "View resources",
      onPress: () => router.push("/teacher/resources"),
      subtitle: `${dashboard.statistics.publishedResources} published`,
      title: "Resources",
      value: dashboard.statistics.resources,
    },
  ];

  const quickActions: QuickActionsProps = {
    icon: <Zap aria-hidden="true" size={18} strokeWidth={2.2} />,
    title: "Teacher Workspace",
    actions: [
      {
        icon: <BookOpen size={22} strokeWidth={2.2} />,
        label: "My Courses",
        onPress: () => router.push("/teacher/courses"),
      },
      {
        icon: <FileText size={22} strokeWidth={2.2} />,
        label: "Resources",
        onPress: () => router.push("/teacher/resources"),
      },
      {
        icon: <UsersRound size={22} strokeWidth={2.2} />,
        label: "Students",
        onPress: () => router.push("/teacher/students"),
      },
    ],
  };

  return (
    <PageContainer>
      <YStack gap="$5">
        <TeacherHeader />
        <DashboardStats quickActions={quickActions} stats={stats} />
        <div
          style={{
            alignItems: "start",
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.8fr)",
          }}
        >
          <AssignedCourses courses={dashboard.courses} />
          <YStack gap="$4">
            <RecentResources resources={dashboard.recentResources} />
            <RecentStudents students={dashboard.recentStudents} />
          </YStack>
        </div>
      </YStack>
    </PageContainer>
  );
};
