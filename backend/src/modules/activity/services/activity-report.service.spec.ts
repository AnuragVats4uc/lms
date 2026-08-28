import { ForbiddenException } from '@nestjs/common';
import {
  ActivityDeviceType,
  ActivityRecordSource,
  ActivitySessionEndReason,
  AuthenticationAttemptOutcome,
} from '@prisma/client';

import { ActivityReportRepository } from '../repositories/activity-report.repository';
import { ActivityReportService } from './activity-report.service';

describe('ActivityReportService', () => {
  let repository: jest.Mocked<ActivityReportRepository>;
  let service: ActivityReportService;

  const student = {
    id: 20,
    uuid: '81b429f0-a208-4472-9368-bbb4e18648af',
    userId: 10,
    organizationId: 4,
    studentCode: 'STD-001',
    admissionNumber: 'ADM-001',
    rollNumber: '12',
    status: 'ACTIVE',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    user: {
      firstName: 'Asha',
      lastName: 'Patel',
      email: 'asha@example.com',
    },
    profile: { firstName: 'Asha', lastName: 'Patel', phone: '9999999999' },
    organization: { id: 4, name: 'Northstar', code: 'NORTHSTAR' },
  };
  const range = {
    from: '2026-08-01T00:00:00.000Z',
    to: '2026-08-27T23:00:00.000Z',
  };

  beforeEach(() => {
    repository = {
      findStudent: jest.fn().mockResolvedValue(student),
      findPolicy: jest.fn().mockResolvedValue(null),
      findActorActivitySession: jest.fn().mockResolvedValue(null),
      createReportAccessEvent: jest.fn().mockResolvedValue({}),
      findTeacherStudentCourseIds: jest.fn().mockResolvedValue([21]),
      authenticationAttempts: jest.fn().mockResolvedValue([]),
      countAuthenticationAttempts: jest.fn().mockResolvedValue([]),
      userSessions: jest.fn().mockResolvedValue([]),
      endedUserSessions: jest.fn().mockResolvedValue([]),
      countEndedUserSessions: jest.fn().mockResolvedValue(0),
      summarizeUserSessions: jest.fn().mockResolvedValue({
        _count: { _all: 0 },
        _sum: {
          elapsedDurationSeconds: null,
          activeDurationSeconds: null,
          idleDurationSeconds: null,
        },
        _min: { loginAt: null },
        _max: { lastSeenAt: null },
      }),
      resourceSessions: jest.fn().mockResolvedValue([]),
      summarizeResourceSessions: jest.fn().mockResolvedValue({
        _count: { _all: 0 },
        _sum: { activeDurationSeconds: null, idleDurationSeconds: null },
        _min: { startedAt: null },
        _max: { lastHeartbeatAt: null },
      }),
      resourceBreakdown: jest.fn().mockResolvedValue([]),
      courseOptions: jest.fn().mockResolvedValue([]),
      countDocumentPageVisits: jest.fn().mockResolvedValue(0),
      activityEvents: jest.fn().mockResolvedValue([]),
      countActivityEvents: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<ActivityReportRepository>;
    service = new ActivityReportService(repository);
  });

  it('aggregates login, duration, resource, and activity totals', async () => {
    repository.countAuthenticationAttempts.mockResolvedValue([
      {
        outcome: AuthenticationAttemptOutcome.SUCCESS,
        _count: { _all: 2 },
      },
      {
        outcome: AuthenticationAttemptOutcome.FAILED,
        _count: { _all: 1 },
      },
    ] as never);
    repository.summarizeUserSessions.mockResolvedValue({
      _count: { _all: 2 },
      _sum: {
        elapsedDurationSeconds: 900,
        activeDurationSeconds: 600,
        idleDurationSeconds: 300,
      },
      _min: { loginAt: new Date('2026-08-10T10:00:00.000Z') },
      _max: { lastSeenAt: new Date('2026-08-10T10:15:00.000Z') },
    });
    repository.countEndedUserSessions.mockResolvedValue(2);
    repository.summarizeResourceSessions.mockResolvedValue({
      _count: { _all: 3 },
      _sum: { activeDurationSeconds: 420, idleDurationSeconds: 30 },
      _min: { startedAt: new Date('2026-08-10T10:01:00.000Z') },
      _max: { lastHeartbeatAt: new Date('2026-08-10T10:12:00.000Z') },
    });
    repository.resourceBreakdown.mockResolvedValue([
      {
        resourceId: 8,
        resourceTitleSnapshot: 'Algebra video',
        resourceTypeCodeSnapshot: 'VIDEO',
        courseNameSnapshot: 'Mathematics',
        _count: { _all: 3 },
        _sum: { activeDurationSeconds: 420, idleDurationSeconds: 30 },
        _max: { lastHeartbeatAt: new Date('2026-08-10T10:12:00.000Z') },
      },
    ] as never);
    repository.countDocumentPageVisits.mockResolvedValue(4);
    repository.countActivityEvents.mockResolvedValue(7);

    const result = await service.getStudentReport(
      {
        userId: 1,
        email: 'admin@example.com',
        organizationId: 4,
        roles: ['ADMIN'],
      },
      student.uuid,
      range,
    );

    expect(result.data.summary).toEqual({
      successfulLogins: 2,
      failedLogins: 1,
      authenticationSessions: 2,
      endedSessions: 2,
      totalElapsedDurationSeconds: 900,
      totalActiveDurationSeconds: 600,
      totalIdleDurationSeconds: 300,
      resourceSessions: 3,
      resourceActiveDurationSeconds: 420,
      resourceIdleDurationSeconds: 30,
      distinctResources: 1,
      documentPageVisits: 4,
      activityLogEntries: 12,
    });
    expect(result.data.durationCalculation).toMatchObject({
      mode: 'ADDITIVE_SESSION_TIME',
      concurrentTabsAndDevicesIncluded: true,
    });
    expect(repository.createReportAccessEvent.mock.calls[0][0]).toMatchObject({
      organizationId: 4,
      studentId: 20,
      eventType: 'REPORT_VIEW',
      metadata: {
        actorUserId: 1,
        actorEmail: 'admin@example.com',
      },
    });
  });

  it('rejects a teacher who is not assigned to the student', async () => {
    repository.findTeacherStudentCourseIds.mockResolvedValue([]);

    await expect(
      service.getStudentReport(
        {
          userId: 2,
          email: 'teacher@example.com',
          organizationId: 4,
          roles: ['TEACHER'],
        },
        student.uuid,
        range,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('limits teacher activity queries to assigned courses', async () => {
    await service.getStudentReport(
      {
        userId: 2,
        email: 'teacher@example.com',
        organizationId: 4,
        roles: ['TEACHER'],
      },
      student.uuid,
      { ...range, sessionCourseId: 21 },
    );

    expect(repository.activityEvents.mock.calls[0]).toEqual([
      expect.objectContaining({
        allowedSessionCourseIds: [21],
        sessionCourseId: 21,
      }),
      50,
    ]);
  });

  it('exports failed-login device details to CSV', async () => {
    repository.authenticationAttempts.mockResolvedValue([
      {
        id: 1,
        uuid: '2abf6d3f-142e-455d-8f85-ec570266c646',
        organizationId: 4,
        userId: 10,
        studentId: 20,
        attemptedEmail: student.user.email,
        outcome: AuthenticationAttemptOutcome.FAILED,
        failureReason: 'INVALID_PASSWORD',
        occurredAt: new Date('2026-08-20T08:00:00.000Z'),
        ipAddress: '203.0.113.10',
        userAgent: 'Browser UA',
        deviceType: ActivityDeviceType.DESKTOP,
        browser: 'Chrome',
        operatingSystem: 'Windows',
        requestId: null,
        createdAt: new Date('2026-08-20T08:00:00.000Z'),
      },
    ]);

    const result = await service.exportStudentReport(
      {
        userId: 3,
        email: 'counselor@example.com',
        organizationId: 4,
        roles: ['COUNSELOR'],
      },
      student.uuid,
      { ...range, format: 'csv', activityTypes: ['LOGIN_FAILED'] },
    );
    const csv = result.buffer.toString('utf8');

    expect(result.filename).toMatch(/^student-activity-STD-001-.*\.csv$/);
    expect(csv).toContain('LOGIN_FAILED');
    expect(csv).toContain('203.0.113.10');
    expect(csv).toContain('Chrome');
    expect(csv).toContain('INVALID_PASSWORD');
    expect(repository.createReportAccessEvent.mock.calls).toHaveLength(1);
    expect(repository.createReportAccessEvent.mock.calls[0][0]).toMatchObject({
      eventType: 'REPORT_EXPORT',
      metadata: { format: 'csv' },
    });
  });

  it('creates an XLSX workbook with the report sheets', async () => {
    repository.userSessions.mockResolvedValue([
      {
        id: 1,
        uuid: 'fce12941-e213-4f50-9297-81618b2a7f11',
        organizationId: 4,
        userId: 10,
        studentId: 20,
        loginAt: new Date('2026-08-20T08:00:00.000Z'),
        lastSeenAt: new Date('2026-08-20T08:10:00.000Z'),
        endedAt: new Date('2026-08-20T08:10:00.000Z'),
        elapsedDurationSeconds: 600,
        activeDurationSeconds: 500,
        idleDurationSeconds: 100,
        endReason: ActivitySessionEndReason.MANUAL_LOGOUT,
        ipAddress: null,
        userAgent: null,
        deviceType: ActivityDeviceType.DESKTOP,
        browser: null,
        operatingSystem: null,
        source: ActivityRecordSource.LIVE,
        createdAt: new Date('2026-08-20T08:00:00.000Z'),
        updatedAt: new Date('2026-08-20T08:10:00.000Z'),
      },
    ]);

    const result = await service.exportStudentReport(
      {
        userId: 1,
        email: 'admin@example.com',
        organizationId: 4,
        roles: ['ADMIN'],
      },
      student.uuid,
      { ...range, format: 'xlsx' },
    );

    expect(result.filename).toMatch(/\.xlsx$/);
    expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
