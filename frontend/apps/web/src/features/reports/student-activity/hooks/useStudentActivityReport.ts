import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { activityReportsApi } from "@repo/api";
import type { StudentActivityReportQuery } from "@repo/types";
import type { ActivityReportFilterState } from "./useActivityReportFilters";

export const toActivityReportQuery = (
  filters: ActivityReportFilterState,
  page?: number,
  limit?: number,
): StudentActivityReportQuery => ({
  from: filters.from
    ? new Date(`${filters.from}T00:00:00.000`).toISOString()
    : undefined,
  to: filters.to
    ? new Date(`${filters.to}T23:59:59.999`).toISOString()
    : undefined,
  sessionCourseId: filters.sessionCourseId
    ? Number(filters.sessionCourseId)
    : undefined,
  resourceType: filters.resourceType || undefined,
  activityTypes: filters.activityType ? [filters.activityType] : undefined,
  page,
  limit,
});

export const useStudentActivityReport = (
  filters: ActivityReportFilterState,
  page: number,
  limit: number,
) => {
  const { studentId: rawStudentId, studentUuid } = useParams<{
    studentId: string;
    studentUuid: string;
  }>();
  const studentId = Number(rawStudentId);
  const query = useMemo(
    () => toActivityReportQuery(filters, page, limit),
    [filters, limit, page],
  );
  const reportQuery = useQuery({
    enabled:
      Number.isSafeInteger(studentId) && studentId > 0 && Boolean(studentUuid),
    placeholderData: keepPreviousData,
    queryFn: () =>
      activityReportsApi.findStudentActivity(studentId, studentUuid, query),
    queryKey: ["student-activity-report", studentId, studentUuid, query],
    staleTime: 30_000,
  });
  return {
    meta: reportQuery.data?.meta,
    report: reportQuery.data?.data,
    reportQuery,
    studentId,
    studentUuid,
  };
};
