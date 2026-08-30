import {
  ActivityDeviceType,
  ActivityRecordSource,
  ActivitySessionEndReason,
  AuthenticationAttemptOutcome,
  AuthenticationFailureReason,
  ExamAttemptStatus,
  PrismaClient,
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

import { PrismaService } from '../src/prisma/prisma.service';
import { ActivityReportRepository } from '../src/modules/activity/repositories/activity-report.repository';
import { ActivityReportService } from '../src/modules/activity/services/activity-report.service';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { code: 'LMS-DEMO' },
  });
  const student = await prisma.student.findFirstOrThrow({
    where: {
      organizationId: organization.id,
      studentCode: 'LMS-DEMO-STUDENT-001',
    },
    include: { user: true },
  });
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@lmsdemo.example.com' },
  });

  const identity = {
    organizationId: organization.id,
    OR: [
      { studentId: student.id },
      { attemptedEmail: student.user.email.toLowerCase() },
    ],
  };
  const [
    authenticationAttempts,
    userSessions,
    resourceSessions,
    documentPages,
    events,
    examAttempts,
  ] = await Promise.all([
    prisma.authenticationAttempt.findMany({ where: identity }),
    prisma.userActivitySession.findMany({
      where: { organizationId: organization.id, studentId: student.id },
      orderBy: { loginAt: 'asc' },
    }),
    prisma.studentResourceActivitySession.findMany({
      where: { organizationId: organization.id, studentId: student.id },
    }),
    prisma.studentDocumentPageActivity.findMany({
      where: {
        resourceActivitySession: {
          organizationId: organization.id,
          studentId: student.id,
        },
      },
    }),
    prisma.studentActivityEvent.findMany({
      where: { organizationId: organization.id, studentId: student.id },
    }),
    prisma.studentExamAttempt.findMany({
      where: { studentId: student.id, exam: { code: 'DEMO-FOUNDATION-CHECK' } },
    }),
  ]);

  assertIncludesAll(
    'authentication outcomes',
    authenticationAttempts.map(({ outcome }) => outcome),
    Object.values(AuthenticationAttemptOutcome),
  );
  assertIncludesAll(
    'authentication failure reasons',
    authenticationAttempts.flatMap(({ failureReason }) =>
      failureReason ? [failureReason] : [],
    ),
    Object.values(AuthenticationFailureReason),
  );
  assertIncludesAll(
    'authentication devices',
    authenticationAttempts.map(({ deviceType }) => deviceType),
    Object.values(ActivityDeviceType),
  );
  assertIncludesAll(
    'user session end reasons',
    userSessions.flatMap(({ endReason }) => (endReason ? [endReason] : [])),
    Object.values(ActivitySessionEndReason),
  );
  assertIncludesAll(
    'resource session end reasons',
    resourceSessions.flatMap(({ endReason }) => (endReason ? [endReason] : [])),
    Object.values(ResourceActivityEndReason),
  );
  assertIncludesAll(
    'resource types',
    resourceSessions.map(({ resourceTypeCodeSnapshot }) =>
      resourceTypeCodeSnapshot.toUpperCase(),
    ),
    ['DOCUMENT', 'VIDEO', 'EXAM'],
  );
  assertIncludesAll(
    'record sources',
    [
      ...userSessions.map(({ source }) => source),
      ...resourceSessions.map(({ source }) => source),
      ...events.map(({ source }) => source),
    ],
    Object.values(ActivityRecordSource),
  );
  assertIncludesAll(
    'activity event types',
    events.map(({ eventType }) => eventType),
    Object.values(StudentActivityEventType),
  );
  assertIncludesAll(
    'exam attempt statuses',
    examAttempts.map(({ status }) => status),
    [
      ExamAttemptStatus.EVALUATED,
      ExamAttemptStatus.AUTO_SUBMITTED,
      ExamAttemptStatus.CANCELLED,
    ],
  );

  if (!userSessions.some(({ endedAt }) => endedAt === null)) {
    throw new Error('Missing open user session scenario');
  }
  if (!resourceSessions.some(({ endedAt }) => endedAt === null)) {
    throw new Error('Missing open resource session scenario');
  }
  if (!hasOverlappingSessions(userSessions)) {
    throw new Error('Missing concurrent tab/device session scenario');
  }
  if (
    documentPages.length < 4 ||
    new Set(documentPages.map(({ pageNumber }) => pageNumber)).size < 3
  ) {
    throw new Error('Document page-change history is incomplete');
  }

  const reportRepository = new ActivityReportRepository(
    prisma as unknown as PrismaService,
  );
  const reportService = new ActivityReportService(reportRepository);
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86_400_000);
  const report = await reportService.getStudentReport(
    {
      userId: admin.id,
      email: admin.email,
      organizationId: organization.id,
      roles: ['ADMIN'],
    },
    student.id,
    student.uuid,
    {
      from: from.toISOString(),
      to: to.toISOString(),
      activityTypes: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'SESSION_TIMEOUT',
      ],
      page: 1,
      limit: 100,
    },
    false,
  );
  const visibleTypes = new Set(
    report.data.activityLog.map(({ activityType }) => activityType),
  );
  const fixtureEvents = events.filter(({ clientEventId }) =>
    clientEventId?.startsWith('demo-activity-event-'),
  );
  if (fixtureEvents.length !== 59) {
    throw new Error(
      `Expected 59 deterministic fixture events, found ${fixtureEvents.length}`,
    );
  }
  assertIncludesAll(
    'report timeline activity types',
    [...visibleTypes],
    ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'SESSION_TIMEOUT'],
  );
  if (report.data.resourceBreakdown.length < 3) {
    throw new Error(
      'Report resource breakdown does not contain all resource types',
    );
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        student: {
          id: student.id,
          uuid: student.uuid,
          studentCode: student.studentCode,
          email: student.user.email,
        },
        routes: {
          admin: `/admin/students/${student.id}/${student.uuid}/activity`,
          teacher: `/teacher/students/${student.id}/${student.uuid}/activity`,
        },
        records: {
          authenticationAttempts: authenticationAttempts.length,
          userSessions: userSessions.length,
          resourceSessions: resourceSessions.length,
          documentPageVisits: documentPages.length,
          activityEvents: events.length,
          fixtureActivityEvents: fixtureEvents.length,
          liveActivityEvents: events.length - fixtureEvents.length,
          examAttempts: examAttempts.length,
        },
        reportSummary: report.data.summary,
        reportTimelineTypes: [...visibleTypes].sort(),
        verification: 'ALL_SCENARIOS_PRESENT',
      },
      null,
      2,
    )}\n`,
  );
}

function assertIncludesAll<T>(label: string, actual: T[], expected: T[]) {
  const actualSet = new Set(actual);
  const missing = expected.filter((value) => !actualSet.has(value));
  if (missing.length) {
    throw new Error(`${label} missing: ${missing.join(', ')}`);
  }
}

function hasOverlappingSessions(
  sessions: Array<{ loginAt: Date; endedAt: Date | null; lastSeenAt: Date }>,
) {
  return sessions.some((left, leftIndex) =>
    sessions.some((right, rightIndex) => {
      if (leftIndex >= rightIndex) return false;
      const leftEnd = left.endedAt ?? left.lastSeenAt;
      const rightEnd = right.endedAt ?? right.lastSeenAt;
      return left.loginAt < rightEnd && right.loginAt < leftEnd;
    }),
  );
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
