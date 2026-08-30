import type { PaginationMeta } from "./api";

export type StudentReportActivityType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SESSION_TIMEOUT"
  | "RESOURCE_OPEN"
  | "RESOURCE_CLOSE"
  | "RESOURCE_DOWNLOAD"
  | "DOCUMENT_PAGE_ENTER"
  | "DOCUMENT_PAGE_EXIT"
  | "DOCUMENT_FULLSCREEN_ENTER"
  | "DOCUMENT_FULLSCREEN_EXIT"
  | "VIDEO_PLAY"
  | "VIDEO_PAUSE"
  | "VIDEO_SEEK"
  | "VIDEO_COMPLETE"
  | "EXAM_START"
  | "EXAM_RESUME"
  | "EXAM_SUBMIT"
  | "EXAM_AUTO_SUBMIT"
  | "EXAM_CANCEL"
  | "REPORT_VIEW"
  | "REPORT_EXPORT";

export type StudentReportActivityCategory =
  | "AUTHENTICATION"
  | "SESSION"
  | "RESOURCE"
  | "DOCUMENT"
  | "VIDEO"
  | "EXAM"
  | "REPORT";

export interface StudentActivityReportQuery {
  from?: string;
  to?: string;
  sessionCourseId?: number;
  resourceType?: string;
  activityTypes?: StudentReportActivityType[];
  page?: number;
  limit?: number;
}

export interface StudentActivityReportStudent {
  uuid: string;
  studentCode: string;
  admissionNumber: string | null;
  rollNumber: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
}

export interface StudentActivityTimelineItem {
  id: string;
  occurredAt: string;
  activityType: StudentReportActivityType;
  category: StudentReportActivityCategory;
  title: string;
  courseName: string | null;
  resourceTitle: string | null;
  resourceType: string | null;
  sessionUuid: string | null;
  resourceSessionUuid: string | null;
  pageNumber: number | null;
  videoPositionSeconds: number | null;
  activeDurationDeltaSeconds: number;
  outcome: string | null;
  reason: string | null;
  ipAddress: string | null;
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  userAgent: string | null;
  metadata: unknown;
}

export interface StudentActivityResourceBreakdown {
  resourceId: number | null;
  resourceTitle: string;
  resourceType: string;
  courseName: string | null;
  sessionCount: number;
  activeDurationSeconds: number;
  idleDurationSeconds: number;
  lastActivityAt: string | null;
}

export interface StudentActivityDailyTrendPoint {
  date: string;
  sessionCount: number;
  activeDurationSeconds: number;
  idleDurationSeconds: number;
}

export interface StudentActivityCategoryBreakdown {
  category: StudentReportActivityCategory;
  count: number;
}

export interface StudentActivityDeviceBreakdown {
  deviceType: string;
  browser: string | null;
  operatingSystem: string | null;
  sessionCount: number;
  activeDurationSeconds: number;
  idleDurationSeconds: number;
}

export interface StudentActivityResourceTypeBreakdown {
  resourceType: string;
  resourceCount: number;
  sessionCount: number;
  activeDurationSeconds: number;
  idleDurationSeconds: number;
}

export interface StudentActivityReportData {
  student: StudentActivityReportStudent;
  organization: { id: number; name: string; code: string };
  range: {
    from: string;
    to: string;
    authenticationFrom: string;
    retentionDays: number;
    failedLoginRetentionDays: number;
  };
  scope: {
    roleScope: "GLOBAL" | "ORGANIZATION" | "ASSIGNED_COURSES";
    sessionCourseIds: number[] | null;
  };
  durationCalculation: {
    mode: "ADDITIVE_SESSION_TIME";
    concurrentTabsAndDevicesIncluded: boolean;
    unit: "SECONDS";
  };
  summary: {
    successfulLogins: number;
    failedLogins: number;
    authenticationSessions: number;
    endedSessions: number;
    totalElapsedDurationSeconds: number;
    totalActiveDurationSeconds: number;
    totalIdleDurationSeconds: number;
    resourceSessions: number;
    resourceActiveDurationSeconds: number;
    resourceIdleDurationSeconds: number;
    distinctResources: number;
    documentPageVisits: number;
    activityLogEntries: number;
  };
  resourceBreakdown: StudentActivityResourceBreakdown[];
  analytics: {
    dailyTrend: StudentActivityDailyTrendPoint[];
    activityCategoryBreakdown: StudentActivityCategoryBreakdown[];
    deviceBreakdown: StudentActivityDeviceBreakdown[];
    resourceTypeBreakdown: StudentActivityResourceTypeBreakdown[];
  };
  filterOptions: {
    courses: Array<{
      sessionCourseId: number;
      name: string;
      code: string;
      sessionName: string;
    }>;
    resourceTypes: string[];
    activityTypes: StudentReportActivityType[];
  };
  activityLog: StudentActivityTimelineItem[];
}

export interface StudentActivityReport {
  data: StudentActivityReportData;
  meta: PaginationMeta;
}
