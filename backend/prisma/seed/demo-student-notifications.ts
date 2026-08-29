import 'dotenv/config';
import { PrismaClient, StudentNotificationType } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_STUDENT_EMAIL = 'student@lmsdemo.example.com';
const DEMO_EXAM_RESOURCE_UUID = '10000000-0000-4000-8000-000000000301';
const DEMO_STUDY_RESOURCE_UUID = '10000000-0000-4000-8000-000000000101';

async function main() {
  const account = await prisma.user.findUnique({
    where: { email: DEMO_STUDENT_EMAIL },
    select: {
      student: { select: { id: true, organizationId: true } },
    },
  });
  const student = account?.student;
  if (!student?.organizationId) {
    throw new Error(
      `Demo student ${DEMO_STUDENT_EMAIL} was not found. Run the demo seed first.`,
    );
  }

  const [examResource, studyResource] = await Promise.all([
    prisma.resource.findUnique({
      where: { uuid: DEMO_EXAM_RESOURCE_UUID },
      select: {
        id: true,
        title: true,
        exam: {
          select: {
            attempts: {
              where: {
                studentId: student.id,
                status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'] },
              },
              orderBy: { submittedAt: 'desc' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.resource.findUnique({
      where: { uuid: DEMO_STUDY_RESOURCE_UUID },
      select: { id: true, title: true },
    }),
  ]);

  if (!examResource || !studyResource) {
    throw new Error(
      'Demo exam or study resource is missing. Run the demo seed before this targeted seed.',
    );
  }

  const now = new Date();
  const completedAttemptId = examResource.exam?.attempts[0]?.id;
  const scenarios = [
    ...(completedAttemptId
      ? [
          {
            type: StudentNotificationType.EXAM,
            title: `${examResource.title} result is available`,
            description:
              'Your result has been released. Review the score, section, topic, difficulty, timing, and question-level analysis.',
            relatedEntity: `EXAM_RESULT_RESOURCE_${completedAttemptId}`,
            relatedEntityId: examResource.id,
            isRead: false,
            createdAt: minutesAgo(now, 25),
            expiresAt: null,
          },
        ]
      : []),
    {
      type: StudentNotificationType.EXAM,
      title: 'Exam instructions updated',
      description:
        'Review the timing, attempt limit, resume policy, navigation rules, and submission instructions before starting.',
      relatedEntity: 'EXAM_SCHEDULED_RESOURCE',
      relatedEntityId: examResource.id,
      isRead: true,
      createdAt: hoursAgo(now, 3),
      expiresAt: daysFrom(now, 14),
    },
    {
      type: StudentNotificationType.RESOURCE,
      title: 'New study resource published',
      description: `${studyResource.title} is now available in your enrolled course. Open it when you are ready to continue studying.`,
      relatedEntity: 'RESOURCE',
      relatedEntityId: studyResource.id,
      isRead: false,
      createdAt: hoursAgo(now, 7),
      expiresAt: null,
    },
    {
      type: StudentNotificationType.ANNOUNCEMENT,
      title: 'Exam preparation guidance',
      description:
        'Check your exam calendar, verify each exam window, and read the instructions before beginning an attempt.',
      relatedEntity: 'ANNOUNCEMENT_EXAM_PREPARATION',
      relatedEntityId: student.organizationId,
      isRead: true,
      createdAt: daysAgo(now, 1),
      expiresAt: daysFrom(now, 30),
    },
    {
      type: StudentNotificationType.SYSTEM,
      title: 'Secure your student account',
      description:
        'Review your contact information and use the Security tab in your profile whenever your password needs to be changed.',
      relatedEntity: 'SYSTEM_ACCOUNT_SECURITY',
      relatedEntityId: student.id,
      isRead: false,
      createdAt: daysAgo(now, 2),
      expiresAt: null,
    },
    {
      type: StudentNotificationType.SYSTEM,
      title: 'Notification preferences available',
      description:
        'Choose whether exam reminders, result alerts, and resource updates appear in your Notification Center.',
      relatedEntity: 'SYSTEM_NOTIFICATION_PREFERENCES',
      relatedEntityId: student.id,
      isRead: true,
      createdAt: daysAgo(now, 4),
      expiresAt: null,
    },
    {
      type: StudentNotificationType.SYSTEM,
      title: 'Expired demo notification',
      description:
        'This record verifies that expired notifications stay out of the active Notification Center.',
      relatedEntity: 'SYSTEM_EXPIRED_VISIBILITY_CHECK',
      relatedEntityId: student.id,
      isRead: false,
      createdAt: daysAgo(now, 10),
      expiresAt: daysAgo(now, 1),
    },
  ];

  await prisma.$transaction(async (transaction) => {
    await transaction.studentNotification.deleteMany({
      where: {
        studentId: student.id,
        organizationId: student.organizationId!,
        OR: [
          {
            type: StudentNotificationType.ASSIGNMENT,
            title: 'Assignment Reminder',
          },
          {
            type: StudentNotificationType.EVENT,
            title: 'Upcoming Event',
          },
        ],
      },
    });

    for (const scenario of scenarios) {
      await transaction.studentNotification.upsert({
        where: {
          studentId_relatedEntity_relatedEntityId: {
            studentId: student.id,
            relatedEntity: scenario.relatedEntity,
            relatedEntityId: scenario.relatedEntityId,
          },
        },
        update: scenario,
        create: {
          ...scenario,
          studentId: student.id,
          organizationId: student.organizationId!,
        },
      });
    }
  });

  console.log(
    `Seeded ${scenarios.length} notification scenarios for ${DEMO_STUDENT_EMAIL}.`,
  );
}

function minutesAgo(now: Date, minutes: number) {
  return new Date(now.getTime() - minutes * 60 * 1000);
}

function hoursAgo(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFrom(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

main()
  .catch((error: unknown) => {
    console.error('Demo student notification seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
