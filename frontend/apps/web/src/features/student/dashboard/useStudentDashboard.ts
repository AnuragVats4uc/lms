"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@repo/auth";

import { getUserDisplayName } from "@/features/shared/access";
import {
  STUDENT_BATCH_LABEL,
  studentContentUpdates,
  studentCourses,
  studentNotifications,
} from "./data";
import type { StudentDashboardViewModel } from "./types";

function buildStudentDashboardData(
  currentUser: AuthUser | null,
): StudentDashboardViewModel {
  const displayName = getUserDisplayName(currentUser) || "Aarav Sharma";

  return {
    hero: {
      batchLabel: STUDENT_BATCH_LABEL,
      greeting: "Welcome back,",
      studentName: displayName,
      subtitle: "You're doing great! Keep learning and growing.",
    },
    courses: studentCourses,
    notifications: studentNotifications,
    contentUpdates: studentContentUpdates,
  };
}

export function useStudentDashboard(currentUser: AuthUser | null) {
  const queryKey = useMemo(
    () => ["student-dashboard", currentUser?.id ?? "anonymous"],
    [currentUser?.id],
  );

  return useQuery({
    queryKey,
    queryFn: async () => buildStudentDashboardData(currentUser),
    staleTime: 5 * 60_000,
  });
}
