import 'dotenv/config';
import { PrismaClient, StudentNotificationType } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_STUDENT_EMAIL = 'student@lmsdemo.example.com';
const supportedTypes = [
  StudentNotificationType.EXAM,
  StudentNotificationType.RESOURCE,
  StudentNotificationType.ANNOUNCEMENT,
  StudentNotificationType.SYSTEM,
];

async function main() {
  const student = await prisma.student.findFirst({
    where: { user: { email: DEMO_STUDENT_EMAIL } },
    select: { id: true, organizationId: true },
  });
  if (!student?.organizationId) {
    throw new Error(`Demo student ${DEMO_STUDENT_EMAIL} was not found.`);
  }

  const now = new Date();
  const [visible, expired, unsupported, duplicateGroups] = await Promise.all([
    prisma.studentNotification.findMany({
      where: {
        studentId: student.id,
        organizationId: student.organizationId,
        type: { in: supportedTypes },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        type: true,
        title: true,
        isRead: true,
        relatedEntity: true,
        relatedEntityId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.studentNotification.count({
      where: {
        studentId: student.id,
        relatedEntity: 'SYSTEM_EXPIRED_VISIBILITY_CHECK',
        expiresAt: { lte: now },
      },
    }),
    prisma.studentNotification.count({
      where: {
        studentId: student.id,
        type: {
          in: [
            StudentNotificationType.ASSIGNMENT,
            StudentNotificationType.EVENT,
          ],
        },
      },
    }),
    prisma.$queryRaw<Array<{ duplicateCount: bigint }>>`
      SELECT COUNT(*) AS duplicateCount
      FROM (
        SELECT student_id, related_entity, related_entity_id
        FROM student_notifications
        WHERE student_id = ${student.id}
          AND related_entity IS NOT NULL
          AND related_entity_id IS NOT NULL
        GROUP BY student_id, related_entity, related_entity_id
        HAVING COUNT(*) > 1
      ) duplicate_lifecycle_records
    `,
  ]);

  const visibleTypes = new Set(visible.map(({ type }) => type));
  const missingTypes = supportedTypes.filter((type) => !visibleTypes.has(type));
  const readStates = new Set(visible.map(({ isRead }) => isRead));
  const invalidActionTargets = visible.filter(
    ({ relatedEntity, relatedEntityId }) =>
      ['RESOURCE', 'EXAM_SCHEDULED_RESOURCE'].includes(relatedEntity ?? '') &&
      !relatedEntityId,
  );
  const duplicateCount = Number(duplicateGroups[0]?.duplicateCount ?? 0);

  const failures = [
    missingTypes.length
      ? `Missing visible categories: ${missingTypes.join(', ')}`
      : null,
    readStates.size < 2
      ? 'Both read and unread states are not represented.'
      : null,
    expired !== 1
      ? 'The expired visibility-check record is missing or duplicated.'
      : null,
    unsupported
      ? `${unsupported} unsupported notification records remain.`
      : null,
    duplicateCount
      ? `${duplicateCount} duplicate notification lifecycle keys remain.`
      : null,
    invalidActionTargets.length
      ? `${invalidActionTargets.length} actionable notifications lack a target.`
      : null,
  ].filter(Boolean);

  console.table(
    visible.map((notification) => ({
      category: notification.type,
      state: notification.isRead ? 'READ' : 'UNREAD',
      title: notification.title,
      context: notification.relatedEntity ?? 'NONE',
    })),
  );

  if (failures.length) {
    throw new Error(failures.join(' '));
  }

  console.log(
    `Verified ${visible.length} visible notifications, all four supported categories, read/unread states, expiration filtering, and unique lifecycle keys.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Student notification verification failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
