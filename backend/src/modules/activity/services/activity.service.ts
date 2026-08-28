import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityRecordSource,
  ActivitySessionEndReason,
  AuthenticationAttemptOutcome,
  Prisma,
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

import { CurrentUser } from '../../auth/types/current-user.types';
import {
  ACTIVITY_FINALIZER_BATCH_SIZE,
  DEFAULT_ACTIVITY_POLICY,
} from '../constants/activity.constants';
import { ActivityRepository } from '../repositories/activity.repository';
import {
  ActivityPolicy,
  EndResourceActivityInput,
  EndUserActivityInput,
  RecordFailedAuthenticationInput,
  RecordStudentEventInput,
  ResourceHeartbeatInput,
  StartResourceActivityInput,
  StartUserActivitySessionInput,
} from '../types/activity.types';
import {
  calculateHeartbeatDuration,
  secondsBetween,
} from '../utils/activity-duration';
import { parseDeviceMetadata } from '../utils/device-metadata';

@Injectable()
export class ActivityService {
  private readonly clientResourceEventTypes = new Set<StudentActivityEventType>(
    [
      StudentActivityEventType.RESOURCE_DOWNLOAD,
      StudentActivityEventType.DOCUMENT_FULLSCREEN_ENTER,
      StudentActivityEventType.DOCUMENT_FULLSCREEN_EXIT,
      StudentActivityEventType.VIDEO_PLAY,
      StudentActivityEventType.VIDEO_PAUSE,
      StudentActivityEventType.VIDEO_SEEK,
      StudentActivityEventType.VIDEO_COMPLETE,
    ],
  );

  constructor(private readonly activityRepository: ActivityRepository) {}

  async getPolicy(currentUser: CurrentUser): Promise<ActivityPolicy> {
    return this.resolvePolicy(currentUser.organizationId);
  }

  async recordFailedAuthentication(input: RecordFailedAuthenticationInput) {
    const occurredAt = input.occurredAt ?? new Date();
    const device = parseDeviceMetadata(input.userAgent);

    return this.activityRepository.createAuthenticationAttempt({
      organizationId: input.organizationId,
      userId: input.userId,
      studentId: input.studentId,
      attemptedEmail: input.attemptedEmail.trim().toLowerCase(),
      outcome: AuthenticationAttemptOutcome.FAILED,
      failureReason: input.failureReason,
      occurredAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
      ...device,
    });
  }

  async startUserSession(input: StartUserActivitySessionInput) {
    const user = await this.activityRepository.findUserContext(input.userId);
    if (!user) throw new NotFoundException('User not found');

    const occurredAt = input.occurredAt ?? new Date();
    const device = parseDeviceMetadata(input.userAgent);
    const organizationId = user.organizationId ?? user.student?.organizationId;

    return this.activityRepository.createSuccessfulLogin(
      {
        organizationId,
        userId: user.id,
        studentId: user.student?.id,
        attemptedEmail: input.attemptedEmail.trim().toLowerCase(),
        outcome: AuthenticationAttemptOutcome.SUCCESS,
        occurredAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        requestId: input.requestId,
        ...device,
      },
      {
        organizationId,
        userId: user.id,
        studentId: user.student?.id,
        loginAt: occurredAt,
        lastSeenAt: occurredAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        source: ActivityRecordSource.LIVE,
        ...device,
      },
    );
  }

  async startUserSessionContinuation(
    input: Omit<StartUserActivitySessionInput, 'attemptedEmail'>,
  ) {
    const user = await this.activityRepository.findUserContext(input.userId);
    if (!user) throw new NotFoundException('User not found');

    const occurredAt = input.occurredAt ?? new Date();
    const device = parseDeviceMetadata(input.userAgent);
    const organizationId = user.organizationId ?? user.student?.organizationId;

    return this.activityRepository.createUserSession({
      organizationId,
      userId: user.id,
      studentId: user.student?.id,
      loginAt: occurredAt,
      lastSeenAt: occurredAt,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      source: ActivityRecordSource.LIVE,
      ...device,
    });
  }

  async heartbeatUserSession(
    sessionUuid: string,
    userId: number,
    active: boolean,
    occurredAt = new Date(),
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const session =
        await this.activityRepository.findOpenUserSession(sessionUuid);
      if (!session) throw new NotFoundException('Activity session not found');
      if (session.userId !== userId) {
        throw new ForbiddenException(
          'Activity session belongs to another user',
        );
      }

      const policy = await this.resolvePolicy(session.organizationId);
      const duration = calculateHeartbeatDuration({
        previousAt: session.lastSeenAt,
        currentAt: occurredAt,
        active,
        heartbeatSeconds: policy.authHeartbeatSeconds,
        idleThresholdSeconds: policy.idleThresholdSeconds,
      });
      const result = await this.activityRepository.updateUserSessionHeartbeat(
        session.id,
        session.lastSeenAt,
        {
          lastSeenAt: occurredAt,
          elapsedDurationSeconds: secondsBetween(session.loginAt, occurredAt),
          activeDurationSeconds: { increment: duration.activeSeconds },
          idleDurationSeconds: { increment: duration.idleSeconds },
        },
      );

      if (result.count === 1) {
        const updated =
          await this.activityRepository.findOpenUserSession(sessionUuid);
        if (!updated)
          throw new ConflictException('Activity session was closed');
        return this.toHeartbeatResponse(updated);
      }
    }

    throw new ConflictException(
      'Activity session changed; retry the heartbeat',
    );
  }

  async endUserSession(
    sessionUuid: string,
    userId: number | null,
    input: EndUserActivityInput,
  ) {
    const occurredAt = input.occurredAt ?? new Date();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const session =
        await this.activityRepository.findOpenUserSession(sessionUuid);
      if (!session) return null;
      if (userId !== null && session.userId !== userId) {
        throw new ForbiddenException(
          'Activity session belongs to another user',
        );
      }

      const policy = await this.resolvePolicy(session.organizationId);
      const duration = calculateHeartbeatDuration({
        previousAt: session.lastSeenAt,
        currentAt: occurredAt,
        active: input.active ?? true,
        heartbeatSeconds: policy.authHeartbeatSeconds,
        idleThresholdSeconds: policy.idleThresholdSeconds,
      });
      const eventType =
        input.reason === ActivitySessionEndReason.MANUAL_LOGOUT
          ? StudentActivityEventType.LOGOUT
          : StudentActivityEventType.SESSION_TIMEOUT;
      const result = await this.activityRepository.endUserSession(
        session.id,
        session.lastSeenAt,
        {
          lastSeenAt: occurredAt,
          endedAt: occurredAt,
          endReason: input.reason,
          elapsedDurationSeconds: secondsBetween(session.loginAt, occurredAt),
          activeDurationSeconds: { increment: duration.activeSeconds },
          idleDurationSeconds: { increment: duration.idleSeconds },
        },
        eventType,
      );
      if (result.count === 1) return { sessionUuid, endedAt: occurredAt };
    }

    throw new ConflictException('Activity session changed; retry the request');
  }

  async startResourceSession(input: StartResourceActivityInput) {
    if (input.clientSessionUuid) {
      const existing = await this.activityRepository.findResourceSessionByUuid(
        input.clientSessionUuid,
      );
      if (existing) {
        if (existing.studentId !== input.studentId) {
          throw new ForbiddenException(
            'Resource session belongs to another student',
          );
        }
        return existing;
      }
    }

    const [student, resource] = await Promise.all([
      this.activityRepository.findStudentContext(input.studentId),
      this.activityRepository.findResourceContext(input.resourceId),
    ]);
    if (!student) throw new NotFoundException('Student not found');
    if (!resource) throw new NotFoundException('Resource not found');

    const organizationId = resource.folder.sessionCourse.session.organizationId;
    if (student.organizationId !== organizationId) {
      throw new ForbiddenException('Resource belongs to another organization');
    }

    const userActivitySession = input.userActivitySessionUuid
      ? await this.activityRepository.findStudentUserSession(
          input.userActivitySessionUuid,
          student.id,
        )
      : null;
    if (input.userActivitySessionUuid && !userActivitySession) {
      throw new NotFoundException('User activity session not found');
    }

    const startedAt = input.startedAt ?? new Date();
    const courseName =
      resource.folder.sessionCourse.displayName ??
      resource.folder.sessionCourse.course.name;

    try {
      return await this.activityRepository.createResourceSession({
        uuid: input.clientSessionUuid ?? undefined,
        organizationId,
        studentId: student.id,
        userActivitySessionId: userActivitySession?.id,
        sessionCourseId: resource.folder.sessionCourse.id,
        folderId: resource.folder.id,
        resourceId: resource.id,
        resourceTitleSnapshot: resource.title,
        resourceTypeCodeSnapshot: resource.resourceType.code,
        courseNameSnapshot: courseName,
        folderNameSnapshot: resource.folder.name,
        startedAt,
        lastHeartbeatAt: startedAt,
        startPositionSeconds: input.startPositionSeconds,
        finalPositionSeconds: input.startPositionSeconds,
        maxPositionSeconds: input.startPositionSeconds,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        input.clientSessionUuid
      ) {
        return this.activityRepository.findResourceSessionByUuid(
          input.clientSessionUuid,
        );
      }
      throw error;
    }
  }

  async heartbeatResourceSession(
    sessionUuid: string,
    userId: number,
    input: ResourceHeartbeatInput,
  ) {
    const occurredAt = input.occurredAt ?? new Date();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const session =
        await this.activityRepository.findOpenResourceSession(sessionUuid);
      if (!session) throw new NotFoundException('Resource session not found');
      await this.assertStudentOwnership(session.studentId, userId);

      const policy = await this.resolvePolicy(session.organizationId);
      const duration = calculateHeartbeatDuration({
        previousAt: session.lastHeartbeatAt,
        currentAt: occurredAt,
        active: input.active,
        heartbeatSeconds: policy.resourceHeartbeatSeconds,
        idleThresholdSeconds: policy.idleThresholdSeconds,
      });
      const position = input.currentPositionSeconds;
      const openPage = await this.activityRepository.findOpenDocumentPage(
        session.id,
      );
      const pageDuration = openPage
        ? calculateHeartbeatDuration({
            previousAt: openPage.lastHeartbeatAt,
            currentAt: occurredAt,
            active: input.active,
            heartbeatSeconds: policy.resourceHeartbeatSeconds,
            idleThresholdSeconds: policy.idleThresholdSeconds,
          })
        : null;
      const result =
        await this.activityRepository.updateResourceSessionHeartbeat(
          session.id,
          session.lastHeartbeatAt,
          {
            lastHeartbeatAt: occurredAt,
            activeDurationSeconds: { increment: duration.activeSeconds },
            idleDurationSeconds: { increment: duration.idleSeconds },
            finalPositionSeconds: position,
            maxPositionSeconds:
              position === undefined || position === null
                ? undefined
                : Math.max(session.maxPositionSeconds ?? 0, position),
            lastDocumentPage: input.pageNumber,
            completed: input.completed,
          },
          openPage && pageDuration
            ? {
                id: openPage.id,
                expectedLastHeartbeatAt: openPage.lastHeartbeatAt,
                activeDurationSeconds: pageDuration.activeSeconds,
                occurredAt,
              }
            : undefined,
        );
      if (result.count === 1) {
        return this.activityRepository.findOpenResourceSession(sessionUuid);
      }
    }

    throw new ConflictException(
      'Resource session changed; retry the heartbeat',
    );
  }

  async endResourceSession(
    sessionUuid: string,
    userId: number,
    input: EndResourceActivityInput,
  ) {
    const occurredAt = input.occurredAt ?? new Date();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const session =
        await this.activityRepository.findOpenResourceSession(sessionUuid);
      if (!session) return null;
      await this.assertStudentOwnership(session.studentId, userId);

      const policy = await this.resolvePolicy(session.organizationId);
      const duration = calculateHeartbeatDuration({
        previousAt: session.lastHeartbeatAt,
        currentAt: occurredAt,
        active: true,
        heartbeatSeconds: policy.resourceHeartbeatSeconds,
        idleThresholdSeconds: policy.idleThresholdSeconds,
      });
      const position = input.currentPositionSeconds;
      const openPage = await this.activityRepository.findOpenDocumentPage(
        session.id,
      );
      const pageDuration = openPage
        ? calculateHeartbeatDuration({
            previousAt: openPage.lastHeartbeatAt,
            currentAt: occurredAt,
            active: true,
            heartbeatSeconds: policy.resourceHeartbeatSeconds,
            idleThresholdSeconds: policy.idleThresholdSeconds,
          })
        : null;
      const result = await this.activityRepository.endResourceSession(
        session.id,
        session.lastHeartbeatAt,
        {
          lastHeartbeatAt: occurredAt,
          endedAt: occurredAt,
          endReason: input.reason,
          activeDurationSeconds: { increment: duration.activeSeconds },
          idleDurationSeconds: { increment: duration.idleSeconds },
          finalPositionSeconds: position,
          maxPositionSeconds:
            position === undefined || position === null
              ? undefined
              : Math.max(session.maxPositionSeconds ?? 0, position),
          lastDocumentPage: input.pageNumber,
          completed:
            input.completed ??
            input.reason === ResourceActivityEndReason.COMPLETED,
        },
        occurredAt,
        openPage && pageDuration
          ? {
              id: openPage.id,
              expectedLastHeartbeatAt: openPage.lastHeartbeatAt,
              activeDurationSeconds: pageDuration.activeSeconds,
            }
          : undefined,
      );
      if (result.count === 1) return { sessionUuid, endedAt: occurredAt };
    }

    throw new ConflictException('Resource session changed; retry the request');
  }

  async switchDocumentPage(
    sessionUuid: string,
    userId: number,
    pageNumber: number,
    occurredAt = new Date(),
  ) {
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new ConflictException('Page number must be a positive integer');
    }
    const session =
      await this.activityRepository.findOpenResourceSession(sessionUuid);
    if (!session) throw new NotFoundException('Resource session not found');
    await this.assertStudentOwnership(session.studentId, userId);
    if (session.resourceTypeCodeSnapshot !== 'DOCUMENT') {
      throw new ConflictException('Page activity requires a document session');
    }

    const openPage = await this.activityRepository.findOpenDocumentPage(
      session.id,
    );
    if (openPage?.pageNumber === pageNumber) return openPage;

    const sequence = await this.activityRepository.getNextPageVisitSequence(
      session.id,
    );
    const policy = await this.resolvePolicy(session.organizationId);
    return this.activityRepository.switchDocumentPage(
      session.id,
      pageNumber,
      (sequence._max.visitSequence ?? 0) + 1,
      occurredAt,
      Math.min(
        policy.idleThresholdSeconds,
        policy.resourceHeartbeatSeconds * 2,
      ),
    );
  }

  recordStudentEvent(input: RecordStudentEventInput) {
    return this.activityRepository.createEventIdempotently({
      organizationId: input.organizationId,
      studentId: input.studentId,
      eventType: input.eventType,
      clientEventId: input.clientEventId,
      userActivitySessionId: input.userActivitySessionId,
      resourceActivitySessionId: input.resourceActivitySessionId,
      sessionCourseId: input.sessionCourseId,
      resourceId: input.resourceId,
      examAttemptId: input.examAttemptId,
      occurredAt: input.occurredAt,
      activeDurationDeltaSeconds: input.activeDurationDeltaSeconds,
      pageNumber: input.pageNumber,
      videoPositionSeconds: input.videoPositionSeconds,
      metadata:
        input.metadata === null
          ? undefined
          : (input.metadata as Prisma.InputJsonValue | undefined),
      resourceTitleSnapshot: input.resourceTitleSnapshot,
      resourceTypeCodeSnapshot: input.resourceTypeCodeSnapshot,
      courseNameSnapshot: input.courseNameSnapshot,
      source: input.source,
    });
  }

  async recordResourceSessionEvent(
    sessionUuid: string,
    userId: number,
    input: {
      eventType: StudentActivityEventType;
      clientEventId?: string;
      videoPositionSeconds?: number;
      pageNumber?: number;
      metadata?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ) {
    if (!this.clientResourceEventTypes.has(input.eventType)) {
      throw new ForbiddenException('This activity event cannot be submitted');
    }

    const session =
      await this.activityRepository.findResourceSessionByUuid(sessionUuid);
    if (!session) throw new NotFoundException('Resource session not found');
    if (session.endedAt) {
      throw new ConflictException('Resource session is already closed');
    }
    await this.assertStudentOwnership(session.studentId, userId);
    this.assertEventMatchesResourceType(
      input.eventType,
      session.resourceTypeCodeSnapshot,
    );

    const event = await this.recordStudentEvent({
      organizationId: session.organizationId,
      studentId: session.studentId,
      eventType: input.eventType,
      clientEventId: input.clientEventId,
      userActivitySessionId: session.userActivitySessionId,
      resourceActivitySessionId: session.id,
      sessionCourseId: session.sessionCourseId,
      resourceId: session.resourceId,
      occurredAt: input.occurredAt,
      pageNumber: input.pageNumber ?? session.lastDocumentPage,
      videoPositionSeconds:
        input.videoPositionSeconds ?? session.finalPositionSeconds,
      metadata: input.metadata,
      resourceTitleSnapshot: session.resourceTitleSnapshot,
      resourceTypeCodeSnapshot: session.resourceTypeCodeSnapshot,
      courseNameSnapshot: session.courseNameSnapshot,
    });

    return { eventUuid: event.uuid, occurredAt: event.occurredAt };
  }

  async finalizeStaleSessions(now = new Date()) {
    const candidateCutoff = new Date(now.getTime() - 1000);
    const [userSessions, resourceSessions] = await Promise.all([
      this.activityRepository.findStaleUserSessions(
        candidateCutoff,
        ACTIVITY_FINALIZER_BATCH_SIZE,
      ),
      this.activityRepository.findStaleResourceSessions(
        candidateCutoff,
        ACTIVITY_FINALIZER_BATCH_SIZE,
      ),
    ]);
    const policies = new Map<number | null, ActivityPolicy>();
    let finalizedUserSessions = 0;
    let finalizedResourceSessions = 0;

    for (const session of resourceSessions) {
      const policy = await this.resolveCachedPolicy(
        policies,
        session.organizationId,
      );
      if (
        secondsBetween(session.lastHeartbeatAt, now) <
        policy.idleThresholdSeconds
      ) {
        continue;
      }
      const result = await this.activityRepository.finalizeStaleResourceSession(
        session.id,
        session.lastHeartbeatAt,
      );
      finalizedResourceSessions += result.count;
    }

    for (const session of userSessions) {
      const policy = await this.resolveCachedPolicy(
        policies,
        session.organizationId,
      );
      if (
        secondsBetween(session.lastSeenAt, now) < policy.idleThresholdSeconds
      ) {
        continue;
      }
      const result = await this.activityRepository.finalizeStaleUserSession(
        session.id,
        session.lastSeenAt,
        secondsBetween(session.loginAt, session.lastSeenAt),
      );
      finalizedUserSessions += result.count;
    }

    return { finalizedUserSessions, finalizedResourceSessions };
  }

  private async assertStudentOwnership(studentId: number, userId: number) {
    const student = await this.activityRepository.findStudentContext(studentId);
    if (!student || student.userId !== userId) {
      throw new ForbiddenException('Resource session belongs to another user');
    }
  }

  private assertEventMatchesResourceType(
    eventType: StudentActivityEventType,
    resourceTypeCode: string,
  ) {
    const documentEvents = new Set<StudentActivityEventType>([
      StudentActivityEventType.DOCUMENT_FULLSCREEN_ENTER,
      StudentActivityEventType.DOCUMENT_FULLSCREEN_EXIT,
    ]);
    const videoEvents = new Set<StudentActivityEventType>([
      StudentActivityEventType.VIDEO_PLAY,
      StudentActivityEventType.VIDEO_PAUSE,
      StudentActivityEventType.VIDEO_SEEK,
      StudentActivityEventType.VIDEO_COMPLETE,
    ]);

    if (documentEvents.has(eventType) && resourceTypeCode !== 'DOCUMENT') {
      throw new ConflictException('Document event requires a document session');
    }
    if (videoEvents.has(eventType) && resourceTypeCode !== 'VIDEO') {
      throw new ConflictException('Video event requires a video session');
    }
  }

  private async resolvePolicy(
    organizationId?: number | null,
  ): Promise<ActivityPolicy> {
    if (!organizationId) return { ...DEFAULT_ACTIVITY_POLICY };
    const policy =
      await this.activityRepository.findPolicyByOrganizationId(organizationId);
    return policy ?? { ...DEFAULT_ACTIVITY_POLICY };
  }

  private async resolveCachedPolicy(
    cache: Map<number | null, ActivityPolicy>,
    organizationId: number | null,
  ) {
    const cached = cache.get(organizationId);
    if (cached) return cached;
    const policy = await this.resolvePolicy(organizationId);
    cache.set(organizationId, policy);
    return policy;
  }

  private toHeartbeatResponse(session: {
    uuid: string;
    lastSeenAt: Date;
    elapsedDurationSeconds: number;
    activeDurationSeconds: number;
    idleDurationSeconds: number;
  }) {
    return {
      sessionUuid: session.uuid,
      lastSeenAt: session.lastSeenAt,
      elapsedDurationSeconds: session.elapsedDurationSeconds,
      activeDurationSeconds: session.activeDurationSeconds,
      idleDurationSeconds: session.idleDurationSeconds,
    };
  }
}
