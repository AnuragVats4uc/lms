import type {
  ApiResponse,
  StudentActivityReport,
  StudentActivityReportQuery,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

const REPORTS_ENDPOINT = "/reports/students";

export const activityReportsApi = {
  findStudentActivity(studentUuid: string, query?: StudentActivityReportQuery) {
    return api
      .get<ApiResponse<StudentActivityReport>>(
        `${REPORTS_ENDPOINT}/${studentUuid}/activity`,
        { params: query },
      )
      .then(unwrapApiData);
  },

  exportStudentActivity(
    studentUuid: string,
    format: "csv" | "xlsx",
    query?: StudentActivityReportQuery,
  ) {
    return api
      .get<Blob>(`${REPORTS_ENDPOINT}/${studentUuid}/activity/export`, {
        params: { ...query, format },
        responseType: "blob",
      })
      .then((response) => response.data);
  },
};
