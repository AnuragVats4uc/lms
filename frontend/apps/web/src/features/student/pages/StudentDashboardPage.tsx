"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, Spinner, Text, YStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";

import {
  StudentDashboard,
  useStudentDashboard,
} from "@/features/student/dashboard";

export function StudentDashboardPage() {
  const { currentUser } = useAuthSession();
  const dashboardQuery = useStudentDashboard(currentUser);

  if (dashboardQuery.isPending) {
    return (
      <YStack className="student-dashboard-state">
        <Spinner color="#059669" size="large" />
        <Text color="#52627A" fontSize={14}>
          Loading student dashboard...
        </Text>
      </YStack>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <YStack className="student-dashboard-state">
        <AlertCircle color="#B91C1C" size={30} strokeWidth={2.2} />
        <Text color="#172033" fontSize={18} fontWeight="700">
          Unable to load dashboard
        </Text>
        <Text color="#647084" fontSize={14}>
          Please try refreshing the student dashboard.
        </Text>
        <Button
          background="#059669"
          onPress={() => void dashboardQuery.refetch()}
          rounded="$3"
        >
          <RefreshCw aria-hidden="true" color="#FFFFFF" size={16} />
          <Button.Text color="#FFFFFF" fontWeight="700">
            Retry
          </Button.Text>
        </Button>
      </YStack>
    );
  }

  return <StudentDashboard data={dashboardQuery.data} />;
}
