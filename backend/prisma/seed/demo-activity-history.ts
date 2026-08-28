import {
  ActivityDeviceType,
  ActivityRecordSource,
  ActivitySessionEndReason,
  AuthenticationAttemptOutcome,
  AuthenticationFailureReason,
  ExamAttemptStatus,
  ExamSubmissionReason,
  Prisma,
  PrismaClient,
  ResourceActivityEndReason,
  StudentActivityEventType,
} from '@prisma/client';

import { seedDemoExamAttemptDetails } from './demo-exam-attempt-details';

type DemoActivityContext = {
  organizationId: number;
  studentId: number;
  studentUserId: number;
  studentEmail: string;
  adminUserId: number;
  counselorUserId: number;
  sessionCourseId: number;
  examId: number;
};

type TestDevice = {
  ipAddress: string;
  userAgent: string | null;
  deviceType: ActivityDeviceType;
  browser: string | null;
  operatingSystem: string | null;
};

type DemoResource = Prisma.ResourceGetPayload<{
  include: { folder: true; resourceType: true };
}>;

type SessionTemplate = {
  key: string;
  loginMinutesAgo: number;
  elapsed: number;
  active: number;
  idle: number;
  endReason: ActivitySessionEndReason | null;
  device: TestDevice;
  source: ActivityRecordSource;
};

type ResourceTemplate = {
  key: string;
  resource: DemoResource;
  userSessionKey: string;
  startMinutesAgo: number;
  active: number;
  idle: number;
  endReason: ResourceActivityEndReason | null;
  completed: boolean;
  startPosition: number | null;
  finalPosition: number | null;
  maxPosition: number | null;
  page: number | null;
  source: ActivityRecordSource;
};

const RESOURCE_UUIDS = {
  document: '10000000-0000-4000-8000-000000000101',
  video: '10000000-0000-4000-8000-000000000102',
  exam: '10000000-0000-4000-8000-000000000301',
} as const;

const TEST_DEVICES: Record<
  'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown',
  TestDevice
> = {
  desktop: {
    ipAddress: '203.0.113.10',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
    deviceType: ActivityDeviceType.DESKTOP,
    browser: 'Chrome 140',
    operatingSystem: 'Windows 11',
  },
  mobile: {
    ipAddress: '198.51.100.24',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile Safari/604.1',
    deviceType: ActivityDeviceType.MOBILE,
    browser: 'Mobile Safari 18',
    operatingSystem: 'iOS 18',
  },
  tablet: {
    ipAddress: '192.0.2.45',
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Tablet) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
    deviceType: ActivityDeviceType.TABLET,
    browser: 'Chrome 140',
    operatingSystem: 'Android 16',
  },
  bot: {
    ipAddress: '192.0.2.90',
    userAgent: 'curl/8.14.1 activity-fixture-monitor',
    deviceType: ActivityDeviceType.BOT,
    browser: 'curl 8',
    operatingSystem: 'Linux',
  },
  unknown: {
    ipAddress: '198.51.100.99',
    userAgent: null,
    deviceType: ActivityDeviceType.UNKNOWN,
    browser: null,
    operatingSystem: null,
  },
} as const;

export async function seedDemoActivityHistory(
  prisma: PrismaClient,
  context: DemoActivityContext,
) {
  const anchor = new Date();
  anchor.setUTCSeconds(0, 0);
  const ago = (minutes: number) =>
    new Date(anchor.getTime() - minutes * 60_000);
  const uuid = (group: string, sequence: number) =>
    `${group}000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;

  const resources = await prisma.resource.findMany({
    where: { uuid: { in: Object.values(RESOURCE_UUIDS) } },
    include: { folder: true, resourceType: true },
  });
  const resourceByUuid = new Map(
    resources.map((resource) => [resource.uuid, resource]),
  );
  const document = resourceByUuid.get(RESOURCE_UUIDS.document);
  const video = resourceByUuid.get(RESOURCE_UUIDS.video);
  const examResource = resourceByUuid.get(RESOURCE_UUIDS.exam);
  if (!document || !video || !examResource) {
    throw new Error(
      'Demo learning resources must be seeded before activity history',
    );
  }

  const sessionTemplates: SessionTemplate[] = [
    {
      key: 'manual',
      loginMinutesAgo: 20_160,
      elapsed: 2_700,
      active: 2_280,
      idle: 420,
      endReason: ActivitySessionEndReason.MANUAL_LOGOUT,
      device: TEST_DEVICES.desktop,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'idle',
      loginMinutesAgo: 14_400,
      elapsed: 1_800,
      active: 720,
      idle: 1_080,
      endReason: ActivitySessionEndReason.IDLE_TIMEOUT,
      device: TEST_DEVICES.mobile,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'token',
      loginMinutesAgo: 10_080,
      elapsed: 1_200,
      active: 1_020,
      idle: 180,
      endReason: ActivitySessionEndReason.TOKEN_EXPIRED,
      device: TEST_DEVICES.tablet,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'forced',
      loginMinutesAgo: 7_200,
      elapsed: 900,
      active: 840,
      idle: 60,
      endReason: ActivitySessionEndReason.FORCED_LOGOUT,
      device: TEST_DEVICES.desktop,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'disabled',
      loginMinutesAgo: 5_760,
      elapsed: 600,
      active: 510,
      idle: 90,
      endReason: ActivitySessionEndReason.ACCOUNT_DISABLED,
      device: TEST_DEVICES.unknown,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'disconnected',
      loginMinutesAgo: 2_880,
      elapsed: 2_100,
      active: 1_800,
      idle: 300,
      endReason: ActivitySessionEndReason.DISCONNECTED,
      device: TEST_DEVICES.mobile,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'unknown',
      loginMinutesAgo: 1_440,
      elapsed: 480,
      active: 420,
      idle: 60,
      endReason: ActivitySessionEndReason.UNKNOWN,
      device: TEST_DEVICES.bot,
      source: ActivityRecordSource.LEGACY_APPROXIMATE,
    },
    {
      key: 'concurrent-desktop',
      loginMinutesAgo: 180,
      elapsed: 3_600,
      active: 3_000,
      idle: 600,
      endReason: ActivitySessionEndReason.MANUAL_LOGOUT,
      device: TEST_DEVICES.desktop,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'concurrent-mobile',
      loginMinutesAgo: 170,
      elapsed: 2_400,
      active: 2_040,
      idle: 360,
      endReason: ActivitySessionEndReason.MANUAL_LOGOUT,
      device: TEST_DEVICES.mobile,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'current',
      loginMinutesAgo: 20,
      elapsed: 1_200,
      active: 900,
      idle: 300,
      endReason: null,
      device: TEST_DEVICES.tablet,
      source: ActivityRecordSource.LIVE,
    },
  ];

  const sessionByKey = new Map<string, { id: number; uuid: string }>();
  for (const [index, template] of sessionTemplates.entries()) {
    const loginAt = ago(template.loginMinutesAgo);
    const endedAt = template.endReason
      ? new Date(loginAt.getTime() + template.elapsed * 1_000)
      : null;
    const sessionUuid = uuid('32', index + 1);
    const data = {
      organizationId: context.organizationId,
      userId: context.studentUserId,
      studentId: context.studentId,
      loginAt,
      lastSeenAt: endedAt ?? anchor,
      endedAt,
      elapsedDurationSeconds: template.elapsed,
      activeDurationSeconds: template.active,
      idleDurationSeconds: template.idle,
      endReason: template.endReason,
      ...template.device,
      source: template.source,
    };
    const session = await prisma.userActivitySession.upsert({
      where: { uuid: sessionUuid },
      update: data,
      create: { uuid: sessionUuid, ...data },
    });
    sessionByKey.set(template.key, session);

    await prisma.authenticationAttempt.upsert({
      where: { uuid: uuid('31', index + 1) },
      update: {
        organizationId: context.organizationId,
        userId: context.studentUserId,
        studentId: context.studentId,
        attemptedEmail: context.studentEmail,
        outcome: AuthenticationAttemptOutcome.SUCCESS,
        failureReason: null,
        occurredAt: loginAt,
        requestId: `demo-login-success-${index + 1}`,
        ...template.device,
      },
      create: {
        uuid: uuid('31', index + 1),
        organizationId: context.organizationId,
        userId: context.studentUserId,
        studentId: context.studentId,
        attemptedEmail: context.studentEmail,
        outcome: AuthenticationAttemptOutcome.SUCCESS,
        occurredAt: loginAt,
        requestId: `demo-login-success-${index + 1}`,
        ...template.device,
      },
    });
  }

  const failureReasons = Object.values(AuthenticationFailureReason);
  for (const [index, failureReason] of failureReasons.entries()) {
    const device =
      Object.values(TEST_DEVICES)[index % Object.values(TEST_DEVICES).length];
    const unmatched =
      failureReason === AuthenticationFailureReason.USER_NOT_FOUND;
    await prisma.authenticationAttempt.upsert({
      where: { uuid: uuid('31', 101 + index) },
      update: {
        organizationId: context.organizationId,
        userId: unmatched ? null : context.studentUserId,
        studentId: unmatched ? null : context.studentId,
        attemptedEmail: context.studentEmail,
        outcome: AuthenticationAttemptOutcome.FAILED,
        failureReason,
        occurredAt: ago(1_200 - index * 45),
        requestId: `demo-login-failure-${failureReason.toLowerCase()}`,
        ...device,
      },
      create: {
        uuid: uuid('31', 101 + index),
        organizationId: context.organizationId,
        userId: unmatched ? null : context.studentUserId,
        studentId: unmatched ? null : context.studentId,
        attemptedEmail: context.studentEmail,
        outcome: AuthenticationAttemptOutcome.FAILED,
        failureReason,
        occurredAt: ago(1_200 - index * 45),
        requestId: `demo-login-failure-${failureReason.toLowerCase()}`,
        ...device,
      },
    });
  }

  const staffSessions = await Promise.all([
    upsertStaffSession(prisma, {
      uuid: uuid('32', 101),
      organizationId: context.organizationId,
      userId: context.adminUserId,
      loginAt: ago(90),
      endedAt: ago(30),
      device: TEST_DEVICES.desktop,
    }),
    upsertStaffSession(prisma, {
      uuid: uuid('32', 102),
      organizationId: context.organizationId,
      userId: context.counselorUserId,
      loginAt: ago(80),
      endedAt: ago(35),
      device: TEST_DEVICES.mobile,
    }),
  ]);

  const examAttempts = await Promise.all([
    upsertExamAttempt(prisma, context, examResource.id, 1, {
      uuid: uuid('36', 1),
      status: ExamAttemptStatus.EVALUATED,
      startedAt: ago(1_000),
      submittedAt: ago(980),
      submissionReason: ExamSubmissionReason.STUDENT_SUBMITTED,
      score: 10,
      reportFixture: 'PASSED_STUDENT_SUBMISSION',
    }),
    upsertExamAttempt(prisma, context, examResource.id, 2, {
      uuid: uuid('36', 2),
      status: ExamAttemptStatus.AUTO_SUBMITTED,
      startedAt: ago(800),
      submittedAt: ago(785),
      submissionReason: ExamSubmissionReason.EXAM_TIMEOUT,
      score: 3,
      reportFixture: 'FAILED_TIMEOUT_WITH_UNANSWERED',
    }),
    upsertExamAttempt(prisma, context, examResource.id, 3, {
      uuid: uuid('36', 3),
      status: ExamAttemptStatus.CANCELLED,
      startedAt: ago(600),
      submittedAt: null,
      submissionReason: null,
      score: null,
    }),
  ]);
  await seedDemoExamAttemptDetails(
    prisma,
    context.examId,
    examAttempts.slice(0, 2).map((attempt) => attempt.id),
  );

  const resourceTemplates: ResourceTemplate[] = [
    {
      key: 'document-completed',
      resource: document,
      userSessionKey: 'manual',
      startMinutesAgo: 20_150,
      active: 960,
      idle: 120,
      endReason: ResourceActivityEndReason.COMPLETED,
      completed: true,
      startPosition: null,
      finalPosition: null,
      maxPosition: null,
      page: 3,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'video-completed',
      resource: video,
      userSessionKey: 'disconnected',
      startMinutesAgo: 2_870,
      active: 1_500,
      idle: 180,
      endReason: ResourceActivityEndReason.COMPLETED,
      completed: true,
      startPosition: 0,
      finalPosition: 55,
      maxPosition: 55,
      page: null,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'exam-closed',
      resource: examResource,
      userSessionKey: 'concurrent-desktop',
      startMinutesAgo: 165,
      active: 1_200,
      idle: 120,
      endReason: ResourceActivityEndReason.CLOSED,
      completed: true,
      startPosition: null,
      finalPosition: null,
      maxPosition: null,
      page: null,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'document-navigated',
      resource: document,
      userSessionKey: 'token',
      startMinutesAgo: 10_070,
      active: 540,
      idle: 60,
      endReason: ResourceActivityEndReason.NAVIGATED_AWAY,
      completed: false,
      startPosition: null,
      finalPosition: null,
      maxPosition: null,
      page: 2,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'video-idle',
      resource: video,
      userSessionKey: 'idle',
      startMinutesAgo: 14_390,
      active: 300,
      idle: 900,
      endReason: ResourceActivityEndReason.IDLE_TIMEOUT,
      completed: false,
      startPosition: 0,
      finalPosition: 18,
      maxPosition: 31,
      page: null,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'document-disconnected',
      resource: document,
      userSessionKey: 'forced',
      startMinutesAgo: 7_195,
      active: 360,
      idle: 90,
      endReason: ResourceActivityEndReason.DISCONNECTED,
      completed: false,
      startPosition: null,
      finalPosition: null,
      maxPosition: null,
      page: 1,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'legacy-unknown',
      resource: video,
      userSessionKey: 'unknown',
      startMinutesAgo: 1_435,
      active: 240,
      idle: 60,
      endReason: ResourceActivityEndReason.UNKNOWN,
      completed: false,
      startPosition: 8,
      finalPosition: 20,
      maxPosition: 25,
      page: null,
      source: ActivityRecordSource.LEGACY_APPROXIMATE,
    },
    {
      key: 'concurrent-document',
      resource: document,
      userSessionKey: 'current',
      startMinutesAgo: 15,
      active: 600,
      idle: 300,
      endReason: null,
      completed: false,
      startPosition: null,
      finalPosition: null,
      maxPosition: null,
      page: 2,
      source: ActivityRecordSource.LIVE,
    },
    {
      key: 'concurrent-video',
      resource: video,
      userSessionKey: 'current',
      startMinutesAgo: 14,
      active: 540,
      idle: 300,
      endReason: null,
      completed: false,
      startPosition: 0,
      finalPosition: 38,
      maxPosition: 44,
      page: null,
      source: ActivityRecordSource.LIVE,
    },
  ];

  const resourceSessionByKey = new Map<string, { id: number; uuid: string }>();
  for (const [index, template] of resourceTemplates.entries()) {
    const startedAt = ago(template.startMinutesAgo);
    const endedAt = template.endReason
      ? new Date(
          startedAt.getTime() + (template.active + template.idle) * 1_000,
        )
      : null;
    const resourceSessionUuid = uuid('33', index + 1);
    const userSession = sessionByKey.get(template.userSessionKey);
    if (!userSession)
      throw new Error(`Missing demo session ${template.userSessionKey}`);
    const data = {
      organizationId: context.organizationId,
      studentId: context.studentId,
      userActivitySessionId: userSession.id,
      sessionCourseId: context.sessionCourseId,
      folderId: template.resource.folderId,
      resourceId: template.resource.id,
      resourceTitleSnapshot: template.resource.title,
      resourceTypeCodeSnapshot: template.resource.resourceType.code,
      courseNameSnapshot: 'Competitive Exam Preparation',
      folderNameSnapshot: template.resource.folder.name,
      startedAt,
      lastHeartbeatAt: endedAt ?? anchor,
      endedAt,
      activeDurationSeconds: template.active,
      idleDurationSeconds: template.idle,
      endReason: template.endReason,
      startPositionSeconds: template.startPosition,
      finalPositionSeconds: template.finalPosition,
      maxPositionSeconds: template.maxPosition,
      lastDocumentPage: template.page,
      completed: template.completed,
      source: template.source,
    };
    const resourceSession = await prisma.studentResourceActivitySession.upsert({
      where: { uuid: resourceSessionUuid },
      update: data,
      create: { uuid: resourceSessionUuid, ...data },
    });
    resourceSessionByKey.set(template.key, resourceSession);
  }

  const mainDocumentSession = resourceSessionByKey.get('document-completed');
  if (!mainDocumentSession) throw new Error('Missing primary document session');
  const pageVisits = [
    { page: 1, active: 180, enteredAgo: 20_149, exitedAgo: 20_146 },
    { page: 2, active: 240, enteredAgo: 20_146, exitedAgo: 20_142 },
    { page: 3, active: 300, enteredAgo: 20_142, exitedAgo: 20_137 },
    { page: 2, active: 120, enteredAgo: 20_137, exitedAgo: 20_135 },
  ];
  for (const [index, visit] of pageVisits.entries()) {
    await prisma.studentDocumentPageActivity.upsert({
      where: { uuid: uuid('34', index + 1) },
      update: {
        resourceActivitySessionId: mainDocumentSession.id,
        pageNumber: visit.page,
        visitSequence: index + 1,
        enteredAt: ago(visit.enteredAgo),
        lastHeartbeatAt: ago(visit.exitedAgo),
        exitedAt: ago(visit.exitedAgo),
        activeDurationSeconds: visit.active,
      },
      create: {
        uuid: uuid('34', index + 1),
        resourceActivitySessionId: mainDocumentSession.id,
        pageNumber: visit.page,
        visitSequence: index + 1,
        enteredAt: ago(visit.enteredAgo),
        lastHeartbeatAt: ago(visit.exitedAgo),
        exitedAt: ago(visit.exitedAgo),
        activeDurationSeconds: visit.active,
      },
    });
  }

  let eventSequence = 1;
  const event = async (
    eventType: StudentActivityEventType,
    occurredAt: Date,
    extra: {
      userActivitySessionId?: number | null;
      resourceActivitySessionId?: number | null;
      sessionCourseId?: number | null;
      resourceId?: number | null;
      examAttemptId?: number | null;
      activeDurationDeltaSeconds?: number;
      pageNumber?: number | null;
      videoPositionSeconds?: number | null;
      metadata?: Prisma.InputJsonValue;
      resourceTitleSnapshot?: string | null;
      resourceTypeCodeSnapshot?: string | null;
      courseNameSnapshot?: string | null;
      source?: ActivityRecordSource;
    } = {},
  ) => {
    const eventUuid = uuid('35', eventSequence);
    const clientEventId = `demo-activity-event-${eventSequence}`;
    eventSequence += 1;
    const data = {
      clientEventId,
      organizationId: context.organizationId,
      studentId: context.studentId,
      eventType,
      occurredAt,
      ...extra,
    };
    await prisma.studentActivityEvent.upsert({
      where: { uuid: eventUuid },
      update: data,
      create: { uuid: eventUuid, ...data },
    });
  };

  for (const [index, template] of sessionTemplates.entries()) {
    const session = sessionByKey.get(template.key)!;
    const loginAt = ago(template.loginMinutesAgo);
    await event(StudentActivityEventType.LOGIN_SUCCESS, loginAt, {
      userActivitySessionId: session.id,
      metadata: { scenario: template.key },
    });
    if (template.endReason) {
      await event(
        template.endReason === ActivitySessionEndReason.MANUAL_LOGOUT
          ? StudentActivityEventType.LOGOUT
          : StudentActivityEventType.SESSION_TIMEOUT,
        new Date(loginAt.getTime() + template.elapsed * 1_000),
        {
          userActivitySessionId: session.id,
          metadata: { reason: template.endReason },
        },
      );
    }
    if (index === sessionTemplates.length - 1) break;
  }

  for (const template of resourceTemplates) {
    const resourceSession = resourceSessionByKey.get(template.key)!;
    const userSession = sessionByKey.get(template.userSessionKey)!;
    const startedAt = ago(template.startMinutesAgo);
    const common = {
      userActivitySessionId: userSession.id,
      resourceActivitySessionId: resourceSession.id,
      sessionCourseId: context.sessionCourseId,
      resourceId: template.resource.id,
      resourceTitleSnapshot: template.resource.title,
      resourceTypeCodeSnapshot: template.resource.resourceType.code,
      courseNameSnapshot: 'Competitive Exam Preparation',
      source: template.source,
    };
    await event(StudentActivityEventType.RESOURCE_OPEN, startedAt, common);
    if (template.endReason) {
      await event(
        StudentActivityEventType.RESOURCE_CLOSE,
        new Date(
          startedAt.getTime() + (template.active + template.idle) * 1_000,
        ),
        {
          ...common,
          pageNumber: template.page,
          videoPositionSeconds: template.finalPosition,
          metadata: {
            reason: template.endReason,
            completed: template.completed,
          },
        },
      );
    }
  }

  for (const visit of pageVisits) {
    const common = {
      userActivitySessionId: sessionByKey.get('manual')!.id,
      resourceActivitySessionId: mainDocumentSession.id,
      sessionCourseId: context.sessionCourseId,
      resourceId: document.id,
      pageNumber: visit.page,
      resourceTitleSnapshot: document.title,
      resourceTypeCodeSnapshot: document.resourceType.code,
      courseNameSnapshot: 'Competitive Exam Preparation',
    };
    await event(
      StudentActivityEventType.DOCUMENT_PAGE_ENTER,
      ago(visit.enteredAgo),
      common,
    );
    await event(
      StudentActivityEventType.DOCUMENT_PAGE_EXIT,
      ago(visit.exitedAgo),
      {
        ...common,
        activeDurationDeltaSeconds: visit.active,
      },
    );
  }

  const documentCommon = {
    userActivitySessionId: sessionByKey.get('manual')!.id,
    resourceActivitySessionId: mainDocumentSession.id,
    sessionCourseId: context.sessionCourseId,
    resourceId: document.id,
    resourceTitleSnapshot: document.title,
    resourceTypeCodeSnapshot: document.resourceType.code,
    courseNameSnapshot: 'Competitive Exam Preparation',
  };
  await event(StudentActivityEventType.RESOURCE_DOWNLOAD, ago(20_145), {
    ...documentCommon,
    metadata: { filename: 'welcome-guide.pdf' },
  });
  await event(StudentActivityEventType.DOCUMENT_FULLSCREEN_ENTER, ago(20_144), {
    ...documentCommon,
    pageNumber: 2,
  });
  await event(StudentActivityEventType.DOCUMENT_FULLSCREEN_EXIT, ago(20_140), {
    ...documentCommon,
    pageNumber: 3,
  });

  const videoSession = resourceSessionByKey.get('video-completed')!;
  const videoCommon = {
    userActivitySessionId: sessionByKey.get('disconnected')!.id,
    resourceActivitySessionId: videoSession.id,
    sessionCourseId: context.sessionCourseId,
    resourceId: video.id,
    resourceTitleSnapshot: video.title,
    resourceTypeCodeSnapshot: video.resourceType.code,
    courseNameSnapshot: 'Competitive Exam Preparation',
  };
  await event(StudentActivityEventType.VIDEO_PLAY, ago(2_869), {
    ...videoCommon,
    videoPositionSeconds: 0,
  });
  await event(StudentActivityEventType.VIDEO_PAUSE, ago(2_860), {
    ...videoCommon,
    videoPositionSeconds: 22,
  });
  await event(StudentActivityEventType.VIDEO_SEEK, ago(2_855), {
    ...videoCommon,
    videoPositionSeconds: 38,
    metadata: { fromSeconds: 22, toSeconds: 38 },
  });
  await event(StudentActivityEventType.VIDEO_COMPLETE, ago(2_845), {
    ...videoCommon,
    videoPositionSeconds: 55,
  });

  const examSession = resourceSessionByKey.get('exam-closed')!;
  const examCommon = {
    userActivitySessionId: sessionByKey.get('concurrent-desktop')!.id,
    resourceActivitySessionId: examSession.id,
    sessionCourseId: context.sessionCourseId,
    resourceId: examResource.id,
    resourceTitleSnapshot: examResource.title,
    resourceTypeCodeSnapshot: examResource.resourceType.code,
    courseNameSnapshot: 'Competitive Exam Preparation',
  };
  await event(StudentActivityEventType.EXAM_START, ago(1_000), {
    ...examCommon,
    examAttemptId: examAttempts[0].id,
  });
  await event(StudentActivityEventType.EXAM_RESUME, ago(990), {
    ...examCommon,
    examAttemptId: examAttempts[0].id,
  });
  await event(StudentActivityEventType.EXAM_SUBMIT, ago(980), {
    ...examCommon,
    examAttemptId: examAttempts[0].id,
    metadata: { score: 10, maximumScore: 10 },
  });
  await event(StudentActivityEventType.EXAM_START, ago(800), {
    ...examCommon,
    examAttemptId: examAttempts[1].id,
  });
  await event(StudentActivityEventType.EXAM_AUTO_SUBMIT, ago(785), {
    ...examCommon,
    examAttemptId: examAttempts[1].id,
    metadata: {
      reason: ExamSubmissionReason.EXAM_TIMEOUT,
      score: 3,
      maximumScore: 10,
    },
  });
  await event(StudentActivityEventType.EXAM_START, ago(600), {
    ...examCommon,
    examAttemptId: examAttempts[2].id,
  });
  await event(StudentActivityEventType.EXAM_CANCEL, ago(595), {
    ...examCommon,
    examAttemptId: examAttempts[2].id,
    metadata: { reason: 'STUDENT_CANCELLED' },
  });

  await event(StudentActivityEventType.REPORT_VIEW, ago(70), {
    userActivitySessionId: staffSessions[1].id,
    metadata: {
      actorUserId: context.counselorUserId,
      actorRoles: ['COUNSELOR'],
      scenario: 'Student report reviewed by counselor',
    },
  });
  await event(StudentActivityEventType.REPORT_EXPORT, ago(40), {
    userActivitySessionId: staffSessions[0].id,
    metadata: {
      actorUserId: context.adminUserId,
      actorRoles: ['ADMIN'],
      format: 'xlsx',
      scenario: 'Student report exported by administrator',
    },
  });

  return {
    authenticationAttempts: sessionTemplates.length + failureReasons.length,
    userSessions: sessionTemplates.length,
    staffSessions: staffSessions.length,
    resourceSessions: resourceTemplates.length,
    documentPageVisits: pageVisits.length,
    examAttempts: examAttempts.length,
    activityEvents: eventSequence - 1,
  };
}

async function upsertStaffSession(
  prisma: PrismaClient,
  input: {
    uuid: string;
    organizationId: number;
    userId: number;
    loginAt: Date;
    endedAt: Date;
    device: TestDevice;
  },
) {
  const elapsed = Math.floor(
    (input.endedAt.getTime() - input.loginAt.getTime()) / 1_000,
  );
  const data = {
    organizationId: input.organizationId,
    userId: input.userId,
    studentId: null,
    loginAt: input.loginAt,
    lastSeenAt: input.endedAt,
    endedAt: input.endedAt,
    elapsedDurationSeconds: elapsed,
    activeDurationSeconds: elapsed,
    idleDurationSeconds: 0,
    endReason: ActivitySessionEndReason.MANUAL_LOGOUT,
    ...input.device,
    source: ActivityRecordSource.LIVE,
  };
  return prisma.userActivitySession.upsert({
    where: { uuid: input.uuid },
    update: data,
    create: { uuid: input.uuid, ...data },
  });
}

async function upsertExamAttempt(
  prisma: PrismaClient,
  context: DemoActivityContext,
  sourceResourceId: number,
  attemptNumber: number,
  input: {
    uuid: string;
    status: ExamAttemptStatus;
    startedAt: Date;
    submittedAt: Date | null;
    submissionReason: ExamSubmissionReason | null;
    score: number | null;
    reportFixture?:
      | 'PASSED_STUDENT_SUBMISSION'
      | 'FAILED_TIMEOUT_WITH_UNANSWERED';
  },
) {
  const expiresAt = new Date(input.startedAt.getTime() + 15 * 60_000);
  const durationSeconds = input.submittedAt
    ? Math.floor(
        (input.submittedAt.getTime() - input.startedAt.getTime()) / 1_000,
      )
    : 300;
  const data = {
    uuid: input.uuid,
    sessionCourseId: context.sessionCourseId,
    sourceResourceId,
    status: input.status,
    startedAt: input.startedAt,
    expiresAt,
    submittedAt: input.submittedAt,
    durationSeconds,
    remainingSecondsAtLastSave: Math.max(0, 900 - durationSeconds),
    lastSavedAt: input.submittedAt ?? input.startedAt,
    evaluatedAt:
      input.status === ExamAttemptStatus.EVALUATED ? input.submittedAt : null,
    submissionReason: input.submissionReason,
    score: input.score,
    maximumScore: input.score === null ? null : 10,
    configurationSnapshot: {
      source: 'DEMO_ACTIVITY_FIXTURE',
      ...(input.reportFixture
        ? { reportFixture: input.reportFixture }
        : {}),
    },
  };
  return prisma.studentExamAttempt.upsert({
    where: {
      studentId_examId_attemptNumber: {
        studentId: context.studentId,
        examId: context.examId,
        attemptNumber,
      },
    },
    update: data,
    create: {
      studentId: context.studentId,
      examId: context.examId,
      attemptNumber,
      ...data,
    },
  });
}
