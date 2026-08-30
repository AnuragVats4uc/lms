import { Injectable } from '@nestjs/common';
import {
  AuthenticationAttemptOutcome,
  Prisma,
  StudentActivityEventType,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  ActivityReportFilters,
  REPORT_EVENT_EXCLUSIONS,
} from '../types/activity-report.types';

@Injectable()
export class ActivityReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStudent(studentId: number, studentUuid: string) {
    return this.prisma.student.findFirst({
      where: { id: studentId, uuid: studentUuid },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        profile: { select: { firstName: true, lastName: true, phone: true } },
        organization: { select: { id: true, name: true, code: true } },
      },
    });
  }

  findPolicy(organizationId: number) {
    return this.prisma.organizationActivityPolicy.findUnique({
      where: { organizationId },
    });
  }

  findActorActivitySession(sessionUuid: string, userId: number) {
    return this.prisma.userActivitySession.findFirst({
      where: { uuid: sessionUuid, userId },
      select: { id: true },
    });
  }

  createReportAccessEvent(data: {
    organizationId: number;
    studentId: number;
    userActivitySessionId: number | null;
    eventType:
      | typeof StudentActivityEventType.REPORT_VIEW
      | typeof StudentActivityEventType.REPORT_EXPORT;
    metadata: Prisma.InputJsonValue;
  }) {
    return this.prisma.studentActivityEvent.create({ data });
  }

  async findTeacherStudentCourseIds(
    teacherUserId: number,
    studentId: number,
    organizationId: number,
  ) {
    const rows = await this.prisma.studentCourseEnrollment.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          studentId,
          organizationId,
          isActive: true,
          status: 'ACTIVE',
        },
        sessionCourse: {
          isActive: true,
          instructors: { some: { instructorId: teacherUserId } },
        },
      },
      select: { sessionCourseId: true },
    });
    return rows.map((row) => row.sessionCourseId);
  }

  authenticationAttempts(filters: ActivityReportFilters, take?: number) {
    const where = this.authenticationWhere(filters);
    return this.prisma.authenticationAttempt.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      ...(take ? { take } : {}),
    });
  }

  countAuthenticationAttempts(filters: ActivityReportFilters) {
    return this.prisma.authenticationAttempt.groupBy({
      by: ['outcome'],
      where: this.authenticationWhere(filters),
      _count: { _all: true },
    });
  }

  userSessions(filters: ActivityReportFilters, take?: number) {
    return this.prisma.userActivitySession.findMany({
      where: this.userSessionWhere(filters),
      orderBy: [{ loginAt: 'desc' }, { id: 'desc' }],
      ...(take ? { take } : {}),
    });
  }

  endedUserSessions(filters: ActivityReportFilters, take?: number) {
    return this.prisma.userActivitySession.findMany({
      where: this.endedUserSessionWhere(filters),
      orderBy: [{ endedAt: 'desc' }, { id: 'desc' }],
      ...(take ? { take } : {}),
    });
  }

  countEndedUserSessions(filters: ActivityReportFilters) {
    return this.prisma.userActivitySession.count({
      where: this.endedUserSessionWhere(filters),
    });
  }

  summarizeUserSessions(filters: ActivityReportFilters) {
    return this.prisma.userActivitySession.aggregate({
      where: this.userSessionWhere(filters),
      _count: { _all: true },
      _sum: {
        elapsedDurationSeconds: true,
        activeDurationSeconds: true,
        idleDurationSeconds: true,
      },
      _min: { loginAt: true },
      _max: { lastSeenAt: true },
    });
  }

  userSessionDeviceBreakdown(filters: ActivityReportFilters) {
    return this.prisma.userActivitySession.groupBy({
      by: ['deviceType', 'browser', 'operatingSystem'],
      where: this.userSessionWhere(filters),
      _count: { _all: true },
      _sum: {
        activeDurationSeconds: true,
        idleDurationSeconds: true,
      },
    });
  }

  resourceSessions(filters: ActivityReportFilters, take?: number) {
    return this.prisma.studentResourceActivitySession.findMany({
      where: this.resourceSessionWhere(filters),
      include: {
        documentPages: { orderBy: { visitSequence: 'asc' } },
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      ...(take ? { take } : {}),
    });
  }

  summarizeResourceSessions(filters: ActivityReportFilters) {
    return this.prisma.studentResourceActivitySession.aggregate({
      where: this.resourceSessionWhere(filters),
      _count: { _all: true },
      _sum: { activeDurationSeconds: true, idleDurationSeconds: true },
      _min: { startedAt: true },
      _max: { lastHeartbeatAt: true },
    });
  }

  resourceBreakdown(filters: ActivityReportFilters) {
    return this.prisma.studentResourceActivitySession.groupBy({
      by: [
        'resourceId',
        'resourceTitleSnapshot',
        'resourceTypeCodeSnapshot',
        'courseNameSnapshot',
      ],
      where: this.resourceSessionWhere(filters),
      _count: { _all: true },
      _sum: { activeDurationSeconds: true, idleDurationSeconds: true },
      _max: { lastHeartbeatAt: true },
    });
  }

  resourceSessionTrendRows(filters: ActivityReportFilters) {
    return this.prisma.studentResourceActivitySession.findMany({
      where: this.resourceSessionWhere(filters),
      select: {
        startedAt: true,
        activeDurationSeconds: true,
        idleDurationSeconds: true,
      },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
    });
  }

  courseOptions(filters: ActivityReportFilters) {
    const courseIds = filters.allowedSessionCourseIds;
    return this.prisma.studentCourseEnrollment.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        enrollment: {
          studentId: filters.studentId,
          organizationId: filters.organizationId,
          isActive: true,
        },
        ...(courseIds ? { sessionCourseId: { in: courseIds } } : {}),
      },
      select: {
        sessionCourse: {
          select: {
            id: true,
            displayName: true,
            course: { select: { name: true, code: true } },
            session: { select: { name: true } },
          },
        },
      },
      orderBy: { sessionCourseId: 'asc' },
    });
  }

  countDocumentPageVisits(filters: ActivityReportFilters) {
    return this.prisma.studentDocumentPageActivity.count({
      where: { resourceActivitySession: this.resourceSessionWhere(filters) },
    });
  }

  activityEvents(filters: ActivityReportFilters, take?: number) {
    return this.prisma.studentActivityEvent.findMany({
      where: this.activityEventWhere(filters),
      include: {
        userActivitySession: {
          select: {
            uuid: true,
            ipAddress: true,
            deviceType: true,
            browser: true,
            operatingSystem: true,
            userAgent: true,
          },
        },
        resourceActivitySession: { select: { uuid: true } },
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      ...(take ? { take } : {}),
    });
  }

  countActivityEvents(filters: ActivityReportFilters) {
    return this.prisma.studentActivityEvent.count({
      where: this.activityEventWhere(filters),
    });
  }

  activityEventCounts(filters: ActivityReportFilters) {
    return this.prisma.studentActivityEvent.groupBy({
      by: ['eventType'],
      where: this.activityEventWhere(filters),
      _count: { _all: true },
    });
  }

  private authenticationWhere(
    filters: ActivityReportFilters,
  ): Prisma.AuthenticationAttemptWhereInput {
    const requested = new Set(filters.activityTypes ?? []);
    let outcome: AuthenticationAttemptOutcome | undefined;
    if (requested.size) {
      const success = requested.has('LOGIN_SUCCESS');
      const failed = requested.has('LOGIN_FAILED');
      if (!success && !failed) return { id: -1 };
      if (success !== failed) {
        outcome = success
          ? AuthenticationAttemptOutcome.SUCCESS
          : AuthenticationAttemptOutcome.FAILED;
      }
    }
    const identity: Prisma.AuthenticationAttemptWhereInput = {
      organizationId: filters.organizationId,
      OR: [
        { studentId: filters.studentId },
        { attemptedEmail: filters.studentEmail.toLowerCase() },
      ],
    };
    if (outcome) {
      return {
        ...identity,
        outcome,
        occurredAt: {
          gte:
            outcome === AuthenticationAttemptOutcome.FAILED
              ? filters.authenticationFrom
              : filters.from,
          lte: filters.to,
        },
      };
    }
    return {
      AND: [
        identity,
        {
          OR: [
            {
              outcome: AuthenticationAttemptOutcome.SUCCESS,
              occurredAt: { gte: filters.from, lte: filters.to },
            },
            {
              outcome: AuthenticationAttemptOutcome.FAILED,
              occurredAt: {
                gte: filters.authenticationFrom,
                lte: filters.to,
              },
            },
          ],
        },
      ],
    };
  }

  private userSessionWhere(
    filters: ActivityReportFilters,
  ): Prisma.UserActivitySessionWhereInput {
    return {
      organizationId: filters.organizationId,
      studentId: filters.studentId,
      loginAt: { gte: filters.from, lte: filters.to },
    };
  }

  private endedUserSessionWhere(
    filters: ActivityReportFilters,
  ): Prisma.UserActivitySessionWhereInput {
    const requested = new Set(filters.activityTypes ?? []);
    const acceptsLogout = requested.has('LOGOUT');
    const acceptsTimeout = requested.has('SESSION_TIMEOUT');
    if (requested.size && !acceptsLogout && !acceptsTimeout) return { id: -1 };
    return {
      organizationId: filters.organizationId,
      studentId: filters.studentId,
      endedAt: { gte: filters.from, lte: filters.to },
      ...(requested.size && acceptsLogout !== acceptsTimeout
        ? {
            endReason: acceptsTimeout
              ? 'IDLE_TIMEOUT'
              : { not: 'IDLE_TIMEOUT' as const },
          }
        : {}),
    };
  }

  private resourceSessionWhere(
    filters: ActivityReportFilters,
  ): Prisma.StudentResourceActivitySessionWhereInput {
    const courseIds = this.scopedCourseIds(filters);
    return {
      organizationId: filters.organizationId,
      studentId: filters.studentId,
      startedAt: { gte: filters.from, lte: filters.to },
      ...(courseIds ? { sessionCourseId: { in: courseIds } } : {}),
      ...(filters.resourceType
        ? { resourceTypeCodeSnapshot: filters.resourceType.toUpperCase() }
        : {}),
    };
  }

  private activityEventWhere(
    filters: ActivityReportFilters,
  ): Prisma.StudentActivityEventWhereInput {
    const courseIds = this.scopedCourseIds(filters);
    const selectedEventTypes = (filters.activityTypes ?? []).filter(
      (type): type is StudentActivityEventType =>
        type !== 'LOGIN_FAILED' &&
        type !== 'LOGIN_SUCCESS' &&
        type !== 'LOGOUT' &&
        Object.values(StudentActivityEventType).includes(
          type as StudentActivityEventType,
        ),
    );
    if (filters.activityTypes?.length && !selectedEventTypes.length) {
      return { id: -1 };
    }
    return {
      organizationId: filters.organizationId,
      studentId: filters.studentId,
      occurredAt: { gte: filters.from, lte: filters.to },
      eventType: {
        ...(selectedEventTypes.length
          ? { in: selectedEventTypes }
          : { notIn: REPORT_EVENT_EXCLUSIONS }),
      },
      ...(courseIds ? { sessionCourseId: { in: courseIds } } : {}),
      ...(filters.resourceType
        ? { resourceTypeCodeSnapshot: filters.resourceType.toUpperCase() }
        : {}),
    };
  }

  private scopedCourseIds(filters: ActivityReportFilters) {
    if (filters.allowedSessionCourseIds) {
      return filters.sessionCourseId
        ? filters.allowedSessionCourseIds.filter(
            (id) => id === filters.sessionCourseId,
          )
        : filters.allowedSessionCourseIds;
    }
    return filters.sessionCourseId ? [filters.sessionCourseId] : undefined;
  }
}
