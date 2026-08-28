import { Injectable } from '@nestjs/common';
import {
  ActivitySessionEndReason,
  Prisma,
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

const activityPolicySelect = {
  activityRetentionDays: true,
  failedLoginRetentionDays: true,
  idleThresholdSeconds: true,
  authHeartbeatSeconds: true,
  resourceHeartbeatSeconds: true,
  exportExpiryHours: true,
} satisfies Prisma.OrganizationActivityPolicySelect;

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPolicyByOrganizationId(organizationId: number) {
    return this.prisma.organizationActivityPolicy.findUnique({
      where: { organizationId },
      select: activityPolicySelect,
    });
  }

  findUserContext(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        student: { select: { id: true, organizationId: true } },
      },
    });
  }

  createAuthenticationAttempt(
    data: Prisma.AuthenticationAttemptUncheckedCreateInput,
  ) {
    return this.prisma.authenticationAttempt.create({ data });
  }

  createSuccessfulLogin(
    attempt: Prisma.AuthenticationAttemptUncheckedCreateInput,
    session: Prisma.UserActivitySessionUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.authenticationAttempt.create({ data: attempt });
      const createdSession = await transaction.userActivitySession.create({
        data: session,
      });

      if (createdSession.organizationId && createdSession.studentId) {
        await transaction.studentActivityEvent.create({
          data: {
            organizationId: createdSession.organizationId,
            studentId: createdSession.studentId,
            userActivitySessionId: createdSession.id,
            eventType: StudentActivityEventType.LOGIN_SUCCESS,
            occurredAt: createdSession.loginAt,
          },
        });
      }

      return createdSession;
    });
  }

  createUserSession(data: Prisma.UserActivitySessionUncheckedCreateInput) {
    return this.prisma.userActivitySession.create({ data });
  }

  findOpenUserSession(sessionUuid: string) {
    return this.prisma.userActivitySession.findFirst({
      where: { uuid: sessionUuid, endedAt: null },
    });
  }

  updateUserSessionHeartbeat(
    id: number,
    expectedLastSeenAt: Date,
    data: Prisma.UserActivitySessionUpdateManyMutationInput,
  ) {
    return this.prisma.userActivitySession.updateMany({
      where: { id, endedAt: null, lastSeenAt: expectedLastSeenAt },
      data,
    });
  }

  endUserSession(
    id: number,
    expectedLastSeenAt: Date,
    data: Prisma.UserActivitySessionUpdateManyMutationInput,
    eventType: StudentActivityEventType,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.userActivitySession.updateMany({
        where: { id, endedAt: null, lastSeenAt: expectedLastSeenAt },
        data,
      });

      if (updated.count === 0) return updated;

      const session = await transaction.userActivitySession.findUniqueOrThrow({
        where: { id },
      });
      if (session.organizationId && session.studentId) {
        await transaction.studentActivityEvent.create({
          data: {
            organizationId: session.organizationId,
            studentId: session.studentId,
            userActivitySessionId: session.id,
            eventType,
            occurredAt: session.endedAt ?? new Date(),
          },
        });
      }

      return updated;
    });
  }

  findResourceContext(resourceId: number) {
    return this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        title: true,
        resourceType: { select: { code: true } },
        folder: {
          select: {
            id: true,
            name: true,
            sessionCourse: {
              select: {
                id: true,
                displayName: true,
                course: { select: { name: true } },
                session: { select: { organizationId: true } },
              },
            },
          },
        },
      },
    });
  }

  findStudentContext(studentId: number) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, organizationId: true, userId: true },
    });
  }

  findStudentUserSession(sessionUuid: string, studentId: number) {
    return this.prisma.userActivitySession.findFirst({
      where: { uuid: sessionUuid, studentId, endedAt: null },
      select: { id: true },
    });
  }

  findResourceSessionByUuid(sessionUuid: string) {
    return this.prisma.studentResourceActivitySession.findUnique({
      where: { uuid: sessionUuid },
    });
  }

  findOpenResourceSession(sessionUuid: string) {
    return this.prisma.studentResourceActivitySession.findFirst({
      where: { uuid: sessionUuid, endedAt: null },
    });
  }

  createResourceSession(
    session: Prisma.StudentResourceActivitySessionUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.studentResourceActivitySession.create({
        data: session,
      });
      await transaction.studentActivityEvent.create({
        data: {
          organizationId: created.organizationId,
          studentId: created.studentId,
          userActivitySessionId: created.userActivitySessionId,
          resourceActivitySessionId: created.id,
          sessionCourseId: created.sessionCourseId,
          resourceId: created.resourceId,
          eventType: StudentActivityEventType.RESOURCE_OPEN,
          occurredAt: created.startedAt,
          videoPositionSeconds: created.startPositionSeconds,
          resourceTitleSnapshot: created.resourceTitleSnapshot,
          resourceTypeCodeSnapshot: created.resourceTypeCodeSnapshot,
          courseNameSnapshot: created.courseNameSnapshot,
        },
      });
      return created;
    });
  }

  updateResourceSessionHeartbeat(
    id: number,
    expectedLastHeartbeatAt: Date,
    data: Prisma.StudentResourceActivitySessionUpdateManyMutationInput,
    pageHeartbeat?: {
      id: number;
      expectedLastHeartbeatAt: Date;
      activeDurationSeconds: number;
      occurredAt: Date;
    },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updated =
        await transaction.studentResourceActivitySession.updateMany({
          where: {
            id,
            endedAt: null,
            lastHeartbeatAt: expectedLastHeartbeatAt,
          },
          data,
        });
      if (updated.count === 1 && pageHeartbeat) {
        await transaction.studentDocumentPageActivity.updateMany({
          where: {
            id: pageHeartbeat.id,
            exitedAt: null,
            lastHeartbeatAt: pageHeartbeat.expectedLastHeartbeatAt,
          },
          data: {
            lastHeartbeatAt: pageHeartbeat.occurredAt,
            activeDurationSeconds: {
              increment: pageHeartbeat.activeDurationSeconds,
            },
          },
        });
      }
      return updated;
    });
  }

  findOpenDocumentPage(resourceActivitySessionId: number) {
    return this.prisma.studentDocumentPageActivity.findFirst({
      where: { resourceActivitySessionId, exitedAt: null },
      orderBy: { visitSequence: 'desc' },
    });
  }

  endResourceSession(
    id: number,
    expectedLastHeartbeatAt: Date,
    data: Prisma.StudentResourceActivitySessionUpdateManyMutationInput,
    occurredAt: Date,
    pageHeartbeat?: {
      id: number;
      expectedLastHeartbeatAt: Date;
      activeDurationSeconds: number;
    },
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updated =
        await transaction.studentResourceActivitySession.updateMany({
          where: {
            id,
            endedAt: null,
            lastHeartbeatAt: expectedLastHeartbeatAt,
          },
          data,
        });
      if (updated.count === 0) return updated;

      const session =
        await transaction.studentResourceActivitySession.findUniqueOrThrow({
          where: { id },
        });
      const openPages = await transaction.studentDocumentPageActivity.findMany({
        where: { resourceActivitySessionId: id, exitedAt: null },
      });
      if (pageHeartbeat) {
        await transaction.studentDocumentPageActivity.updateMany({
          where: {
            id: pageHeartbeat.id,
            exitedAt: null,
            lastHeartbeatAt: pageHeartbeat.expectedLastHeartbeatAt,
          },
          data: {
            exitedAt: occurredAt,
            lastHeartbeatAt: occurredAt,
            activeDurationSeconds: {
              increment: pageHeartbeat.activeDurationSeconds,
            },
          },
        });
      }
      await transaction.studentDocumentPageActivity.updateMany({
        where: { resourceActivitySessionId: id, exitedAt: null },
        data: { exitedAt: occurredAt, lastHeartbeatAt: occurredAt },
      });
      for (const page of openPages) {
        await transaction.studentActivityEvent.create({
          data: {
            organizationId: session.organizationId,
            studentId: session.studentId,
            userActivitySessionId: session.userActivitySessionId,
            resourceActivitySessionId: session.id,
            sessionCourseId: session.sessionCourseId,
            resourceId: session.resourceId,
            eventType: StudentActivityEventType.DOCUMENT_PAGE_EXIT,
            occurredAt,
            activeDurationDeltaSeconds:
              page.id === pageHeartbeat?.id
                ? pageHeartbeat.activeDurationSeconds
                : 0,
            pageNumber: page.pageNumber,
            resourceTitleSnapshot: session.resourceTitleSnapshot,
            resourceTypeCodeSnapshot: session.resourceTypeCodeSnapshot,
            courseNameSnapshot: session.courseNameSnapshot,
          },
        });
      }
      await transaction.studentActivityEvent.create({
        data: {
          organizationId: session.organizationId,
          studentId: session.studentId,
          userActivitySessionId: session.userActivitySessionId,
          resourceActivitySessionId: session.id,
          sessionCourseId: session.sessionCourseId,
          resourceId: session.resourceId,
          eventType: StudentActivityEventType.RESOURCE_CLOSE,
          occurredAt,
          pageNumber: session.lastDocumentPage,
          videoPositionSeconds: session.finalPositionSeconds,
          metadata: { reason: session.endReason },
          resourceTitleSnapshot: session.resourceTitleSnapshot,
          resourceTypeCodeSnapshot: session.resourceTypeCodeSnapshot,
          courseNameSnapshot: session.courseNameSnapshot,
        },
      });
      return updated;
    });
  }

  async createEventIdempotently(
    data: Prisma.StudentActivityEventUncheckedCreateInput,
  ) {
    try {
      return await this.prisma.studentActivityEvent.create({ data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        data.clientEventId
      ) {
        return this.prisma.studentActivityEvent.findUniqueOrThrow({
          where: { clientEventId: data.clientEventId },
        });
      }
      throw error;
    }
  }

  getNextPageVisitSequence(resourceActivitySessionId: number) {
    return this.prisma.studentDocumentPageActivity.aggregate({
      where: { resourceActivitySessionId },
      _max: { visitSequence: true },
    });
  }

  switchDocumentPage(
    resourceActivitySessionId: number,
    pageNumber: number,
    visitSequence: number,
    occurredAt: Date,
    maximumActiveCreditSeconds: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const session =
        await transaction.studentResourceActivitySession.findFirstOrThrow({
          where: { id: resourceActivitySessionId, endedAt: null },
        });
      const openPages = await transaction.studentDocumentPageActivity.findMany({
        where: { resourceActivitySessionId, exitedAt: null },
      });

      for (const page of openPages) {
        const duration = Math.min(
          maximumActiveCreditSeconds,
          Math.max(
            0,
            Math.floor(
              (occurredAt.getTime() - page.lastHeartbeatAt.getTime()) / 1000,
            ),
          ),
        );
        await transaction.studentDocumentPageActivity.update({
          where: { id: page.id },
          data: {
            exitedAt: occurredAt,
            lastHeartbeatAt: occurredAt,
            activeDurationSeconds: { increment: duration },
          },
        });
        await transaction.studentActivityEvent.create({
          data: {
            organizationId: session.organizationId,
            studentId: session.studentId,
            userActivitySessionId: session.userActivitySessionId,
            resourceActivitySessionId,
            sessionCourseId: session.sessionCourseId,
            resourceId: session.resourceId,
            eventType: StudentActivityEventType.DOCUMENT_PAGE_EXIT,
            occurredAt,
            pageNumber: page.pageNumber,
            activeDurationDeltaSeconds: duration,
            resourceTitleSnapshot: session.resourceTitleSnapshot,
            resourceTypeCodeSnapshot: session.resourceTypeCodeSnapshot,
            courseNameSnapshot: session.courseNameSnapshot,
          },
        });
      }

      const createdPage = await transaction.studentDocumentPageActivity.create({
        data: {
          resourceActivitySessionId,
          pageNumber,
          visitSequence,
          enteredAt: occurredAt,
          lastHeartbeatAt: occurredAt,
        },
      });
      await transaction.studentResourceActivitySession.update({
        where: { id: resourceActivitySessionId },
        data: { lastDocumentPage: pageNumber },
      });
      await transaction.studentActivityEvent.create({
        data: {
          organizationId: session.organizationId,
          studentId: session.studentId,
          userActivitySessionId: session.userActivitySessionId,
          resourceActivitySessionId,
          sessionCourseId: session.sessionCourseId,
          resourceId: session.resourceId,
          eventType: StudentActivityEventType.DOCUMENT_PAGE_ENTER,
          occurredAt,
          pageNumber,
          resourceTitleSnapshot: session.resourceTitleSnapshot,
          resourceTypeCodeSnapshot: session.resourceTypeCodeSnapshot,
          courseNameSnapshot: session.courseNameSnapshot,
        },
      });

      return createdPage;
    });
  }

  findStaleUserSessions(cutoff: Date, take: number) {
    return this.prisma.userActivitySession.findMany({
      where: { endedAt: null, lastSeenAt: { lte: cutoff } },
      orderBy: { lastSeenAt: 'asc' },
      take,
    });
  }

  findStaleResourceSessions(cutoff: Date, take: number) {
    return this.prisma.studentResourceActivitySession.findMany({
      where: { endedAt: null, lastHeartbeatAt: { lte: cutoff } },
      orderBy: { lastHeartbeatAt: 'asc' },
      take,
    });
  }

  finalizeStaleUserSession(
    id: number,
    lastSeenAt: Date,
    elapsedDurationSeconds: number,
  ) {
    return this.endUserSession(
      id,
      lastSeenAt,
      {
        endedAt: lastSeenAt,
        endReason: ActivitySessionEndReason.DISCONNECTED,
        elapsedDurationSeconds,
      },
      StudentActivityEventType.SESSION_TIMEOUT,
    );
  }

  finalizeStaleResourceSession(id: number, lastHeartbeatAt: Date) {
    return this.endResourceSession(
      id,
      lastHeartbeatAt,
      {
        endedAt: lastHeartbeatAt,
        endReason: ResourceActivityEndReason.DISCONNECTED,
      },
      lastHeartbeatAt,
      undefined,
    );
  }
}
