import { useState } from "react";
import { activityReportsApi, getApiErrorMessage } from "@repo/api";
import type { StudentActivityReportData } from "@repo/types";
import type { ActivityReportFilterState } from "./useActivityReportFilters";
import { toActivityReportQuery } from "./useStudentActivityReport";

export type ActivityReportExportFormat = "csv" | "xlsx";

export const useActivityReportExport = ({
  filters,
  report,
  studentId,
  studentUuid,
}: {
  filters: ActivityReportFilterState;
  report?: StudentActivityReportData;
  studentId: number;
  studentUuid: string;
}) => {
  const [exporting, setExporting] = useState<ActivityReportExportFormat | null>(
    null,
  );
  const [exportError, setExportError] = useState<string | null>(null);
  const downloadReport = async (format: ActivityReportExportFormat) => {
    setExportError(null);
    setExporting(format);
    try {
      const blob = await activityReportsApi.exportStudentActivity(
        studentId,
        studentUuid,
        format,
        toActivityReportQuery(filters),
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `student-activity-${report?.student.studentCode ?? studentUuid}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        getApiErrorMessage(error, "The report could not be exported."),
      );
    } finally {
      setExporting(null);
    }
  };
  return { downloadReport, exportError, exporting };
};
