import {
  ActivityRecordSource,
  ActivitySessionEndReason,
  AuthenticationFailureReason,
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

export type ActivityPolicy = {
  activityRetentionDays: number;
  failedLoginRetentionDays: number;
  idleThresholdSeconds: number;
  authHeartbeatSeconds: number;
  resourceHeartbeatSeconds: number;
  exportExpiryHours: number;
};

export type ActivityRequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type RecordFailedAuthenticationInput = ActivityRequestMetadata & {
  attemptedEmail: string;
  failureReason: AuthenticationFailureReason;
  organizationId?: number | null;
  userId?: number | null;
  studentId?: number | null;
  occurredAt?: Date;
};

export type StartUserActivitySessionInput = ActivityRequestMetadata & {
  userId: number;
  attemptedEmail: string;
  occurredAt?: Date;
};

export type StartResourceActivityInput = {
  studentId: number;
  resourceId: number;
  userActivitySessionUuid?: string | null;
  clientSessionUuid?: string | null;
  startPositionSeconds?: number | null;
  startedAt?: Date;
};

export type ResourceHeartbeatInput = {
  active: boolean;
  currentPositionSeconds?: number | null;
  pageNumber?: number | null;
  completed?: boolean;
  occurredAt?: Date;
};

export type EndResourceActivityInput = {
  reason: ResourceActivityEndReason;
  currentPositionSeconds?: number | null;
  pageNumber?: number | null;
  completed?: boolean;
  occurredAt?: Date;
};

export type RecordStudentEventInput = {
  organizationId: number;
  studentId: number;
  eventType: StudentActivityEventType;
  clientEventId?: string | null;
  userActivitySessionId?: number | null;
  resourceActivitySessionId?: number | null;
  sessionCourseId?: number | null;
  resourceId?: number | null;
  examAttemptId?: number | null;
  occurredAt?: Date;
  activeDurationDeltaSeconds?: number;
  pageNumber?: number | null;
  videoPositionSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
  resourceTitleSnapshot?: string | null;
  resourceTypeCodeSnapshot?: string | null;
  courseNameSnapshot?: string | null;
  source?: ActivityRecordSource;
};

export type EndUserActivityInput = {
  reason: ActivitySessionEndReason;
  occurredAt?: Date;
  active?: boolean;
};
