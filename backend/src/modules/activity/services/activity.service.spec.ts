import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

import { ActivityRepository } from '../repositories/activity.repository';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let repository: jest.Mocked<ActivityRepository>;
  let service: ActivityService;

  beforeEach(() => {
    repository = {
      findPolicyByOrganizationId: jest.fn(),
      findOpenUserSession: jest.fn(),
      updateUserSessionHeartbeat: jest.fn(),
      findOpenResourceSession: jest.fn(),
      findOpenDocumentPage: jest.fn(),
      endResourceSession: jest.fn(),
      findResourceSessionByUuid: jest.fn(),
      findStudentContext: jest.fn(),
      createEventIdempotently: jest.fn(),
    } as unknown as jest.Mocked<ActivityRepository>;
    service = new ActivityService(repository);
  });

  it('uses the default policy when the user has no organization', async () => {
    await expect(
      service.getPolicy({ userId: 1, email: 'admin@example.com' }),
    ).resolves.toMatchObject({
      idleThresholdSeconds: 300,
      authHeartbeatSeconds: 60,
      resourceHeartbeatSeconds: 15,
    });
    expect(repository.findPolicyByOrganizationId.mock.calls).toHaveLength(0);
  });

  it('caps heartbeat credit and uses compare-and-set persistence', async () => {
    const original = {
      id: 7,
      uuid: 'ad72dc56-70aa-4ef7-819f-f90d8f0ccf37',
      userId: 3,
      organizationId: 11,
      loginAt: new Date('2026-08-27T10:00:00.000Z'),
      lastSeenAt: new Date('2026-08-27T10:00:00.000Z'),
      elapsedDurationSeconds: 0,
      activeDurationSeconds: 0,
      idleDurationSeconds: 0,
    };
    const updated = {
      ...original,
      lastSeenAt: new Date('2026-08-27T10:05:00.000Z'),
      elapsedDurationSeconds: 300,
      activeDurationSeconds: 120,
      idleDurationSeconds: 180,
    };
    repository.findOpenUserSession
      .mockResolvedValueOnce(original as never)
      .mockResolvedValueOnce(updated as never);
    repository.findPolicyByOrganizationId.mockResolvedValue(null);
    repository.updateUserSessionHeartbeat.mockResolvedValue({ count: 1 });

    await expect(
      service.heartbeatUserSession(original.uuid, 3, true, updated.lastSeenAt),
    ).resolves.toEqual({
      sessionUuid: original.uuid,
      lastSeenAt: updated.lastSeenAt,
      elapsedDurationSeconds: 300,
      activeDurationSeconds: 120,
      idleDurationSeconds: 180,
    });
    expect(repository.updateUserSessionHeartbeat.mock.calls[0]).toEqual([
      7,
      original.lastSeenAt,
      expect.objectContaining({
        activeDurationSeconds: { increment: 120 },
        idleDurationSeconds: { increment: 180 },
      }),
    ]);
  });

  it('rejects a heartbeat for another user session', async () => {
    repository.findOpenUserSession.mockResolvedValue({
      id: 7,
      uuid: 'ad72dc56-70aa-4ef7-819f-f90d8f0ccf37',
      userId: 99,
    } as never);

    await expect(
      service.heartbeatUserSession(
        'ad72dc56-70aa-4ef7-819f-f90d8f0ccf37',
        3,
        true,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('records an idempotent video event against its owned resource session', async () => {
    repository.findResourceSessionByUuid.mockResolvedValue({
      id: 12,
      uuid: '123c6a30-caba-4921-b012-4df28a9d7478',
      organizationId: 4,
      studentId: 20,
      userActivitySessionId: 30,
      sessionCourseId: 40,
      resourceId: 50,
      resourceTypeCodeSnapshot: 'VIDEO',
      resourceTitleSnapshot: 'Lesson',
      courseNameSnapshot: 'Course',
      finalPositionSeconds: 90,
      lastDocumentPage: null,
    } as never);
    repository.findStudentContext.mockResolvedValue({
      id: 20,
      userId: 10,
      organizationId: 4,
    });
    repository.createEventIdempotently.mockResolvedValue({
      uuid: '488f64ec-0f57-414e-ac69-25072b07a696',
      occurredAt: new Date('2026-08-27T10:00:00.000Z'),
    } as never);

    await service.recordResourceSessionEvent(
      '123c6a30-caba-4921-b012-4df28a9d7478',
      10,
      {
        eventType: StudentActivityEventType.VIDEO_PAUSE,
        clientEventId: '7c5f2511-fef6-4ad1-bdb7-635df73973d1',
        videoPositionSeconds: 92,
      },
    );

    expect(repository.createEventIdempotently.mock.calls[0][0]).toMatchObject({
      studentId: 20,
      resourceActivitySessionId: 12,
      eventType: StudentActivityEventType.VIDEO_PAUSE,
      videoPositionSeconds: 92,
      clientEventId: '7c5f2511-fef6-4ad1-bdb7-635df73973d1',
    });
  });

  it('rejects server-owned and resource-type-mismatched client events', async () => {
    await expect(
      service.recordResourceSessionEvent('session', 10, {
        eventType: StudentActivityEventType.LOGIN_SUCCESS,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    repository.findResourceSessionByUuid.mockResolvedValue({
      studentId: 20,
      resourceTypeCodeSnapshot: 'DOCUMENT',
    } as never);
    repository.findStudentContext.mockResolvedValue({
      id: 20,
      userId: 10,
      organizationId: 4,
    });

    await expect(
      service.recordResourceSessionEvent('session', 10, {
        eventType: StudentActivityEventType.VIDEO_PLAY,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not credit paused video time as active when the session ends', async () => {
    const startedAt = new Date('2026-08-30T10:00:00.000Z');
    const endedAt = new Date('2026-08-30T10:00:15.000Z');
    repository.findOpenResourceSession.mockResolvedValue({
      id: 12,
      uuid: '123c6a30-caba-4921-b012-4df28a9d7478',
      organizationId: 4,
      studentId: 20,
      lastHeartbeatAt: startedAt,
      maxPositionSeconds: 90,
    } as never);
    repository.findStudentContext.mockResolvedValue({
      id: 20,
      userId: 10,
      organizationId: 4,
    });
    repository.findPolicyByOrganizationId.mockResolvedValue(null);
    repository.findOpenDocumentPage.mockResolvedValue(null);
    repository.endResourceSession.mockResolvedValue({ count: 1 });

    await service.endResourceSession(
      '123c6a30-caba-4921-b012-4df28a9d7478',
      10,
      {
        reason: ResourceActivityEndReason.NAVIGATED_AWAY,
        active: false,
        currentPositionSeconds: 90,
        occurredAt: endedAt,
      },
    );

    expect(repository.endResourceSession.mock.calls[0][2]).toMatchObject({
      activeDurationSeconds: { increment: 0 },
      idleDurationSeconds: { increment: 15 },
    });
  });
});
