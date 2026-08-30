import type {
  ApiResponse,
  StudentActivityReport,
  StudentActivityReportQuery,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const REPORTS_ENDPOINT = "/reports/students";

export const activityReportsApi = {
  findStudentActivity(
    studentId: number,
    studentUuid: string,
    query?: StudentActivityReportQuery,
  ) {
    return api
      .get<ApiResponse<StudentActivityReport>>(
        `${REPORTS_ENDPOINT}/${studentId}/${studentUuid}/activity`,
        { params: query },
      )
      .then(unwrapApiData);
  },

  exportStudentActivity(
    studentId: number,
    studentUuid: string,
    format: "csv" | "xlsx",
    query?: StudentActivityReportQuery,
  ) {
    return api
      .get<Blob>(
        `${REPORTS_ENDPOINT}/${studentId}/${studentUuid}/activity/export`,
        {
          params: { ...query, format },
          responseType: "blob",
        },
      )
      .then((response) => response.data);
  },
};
