import { Prisma, StudentActivityEventType } from '@prisma/client';

import { ReportActivityType } from '../dto/student-activity-report.dto';

export type ActivityReportRange = {
  from: Date;
  authenticationFrom: Date;
  to: Date;
};

export type ActivityReportFilters = ActivityReportRange & {
  studentId: number;
  studentEmail: string;
  organizationId: number;
  allowedSessionCourseIds?: number[];
  sessionCourseId?: number;
  resourceType?: string;
  activityTypes?: ReportActivityType[];
};

export type ActivityTimelineItem = {
  id: string;
  occurredAt: Date;
  activityType: ReportActivityType;
  category:
    | 'AUTHENTICATION'
    | 'SESSION'
    | 'RESOURCE'
    | 'DOCUMENT'
    | 'VIDEO'
    | 'EXAM'
    | 'REPORT';
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
  metadata: Prisma.JsonValue | null;
};

export const REPORT_EVENT_EXCLUSIONS: StudentActivityEventType[] = [
  StudentActivityEventType.LOGIN_SUCCESS,
  StudentActivityEventType.LOGOUT,
  StudentActivityEventType.SESSION_TIMEOUT,
];
