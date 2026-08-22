import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { RESOURCE_TYPE_IDS } from '../src/modules/resource/constants/resource-type.constants';

const prisma = new PrismaClient();
const examCodes = [
  'SEED-QA-PRACTICE',
  'SEED-LR-SECTIONAL',
  'SEED-VERBAL-SECTIONAL',
  'SEED-MIXED-MOCK',
  'SEED-FULL-MOCK',
];
const contentUuids = Array.from(
  { length: 10 },
  (_, index) =>
    `5eed0000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(index + 1).padStart(12, '0')}`,
);

async function main() {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { code: 'LMS-DEMO' },
  });
  const session = await prisma.session.findFirstOrThrow({
    where: { organizationId: organization.id, code: 'IPMAT-2027' },
  });
  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { uuid: { in: contentUuids } },
        { exam: { organizationId: organization.id, code: { in: examCodes } } },
      ],
    },
    include: {
      resourceType: true,
      folder: {
        include: {
          sessionCourse: {
            include: {
              session: true,
              studentCourseEnrollments: {
                where: {
                  isActive: true,
                  enrollment: {
                    organizationId: organization.id,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      exam: {
        include: {
          courseAssignments: true,
          selectedSlots: {
            include: {
              templateSlot: {
                include: {
                  sections: {
                    include: { subjects: { include: { questions: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const documents = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
  );
  const videos = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.VIDEO,
  );
  const exams = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.EXAM,
  );
  const failures: string[] = [];

  if (documents.length !== 5)
    failures.push(`Expected 5 documents, found ${documents.length}`);
  if (videos.length !== 5)
    failures.push(`Expected 5 videos, found ${videos.length}`);
  if (exams.length !== 5)
    failures.push(`Expected 5 exams, found ${exams.length}`);
  if (new Set(resources.map(({ uuid }) => uuid)).size !== resources.length)
    failures.push('Duplicate resource UUIDs detected');

  for (const resource of resources) {
    const relation = resource.folder.sessionCourse;
    if (resource.folder.parentFolderId !== null)
      failures.push(`${resource.title} is in a nested folder`);
    if (
      relation.sessionId !== session.id ||
      relation.session.organizationId !== organization.id
    )
      failures.push(`${resource.title} crosses the target tenant/session`);
    if (!relation.studentCourseEnrollments.length)
      failures.push(`${resource.title} has no active enrolled student path`);
    if (
      !resource.isActive ||
      !resource.isPublished ||
      resource.status !== 'PUBLISHED'
    )
      failures.push(`${resource.title} is not a visible published resource`);
    if (resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM) {
      const exam = resource.exam;
      const questionCount =
        exam?.selectedSlots
          .flatMap(({ templateSlot }) => templateSlot.sections)
          .flatMap(({ subjects }) => subjects)
          .reduce((count, subject) => count + subject.questions.length, 0) ?? 0;
      if (!exam) failures.push(`${resource.title} has no exam relation`);
      else if (
        !exam.courseAssignments.some(
          ({ sessionCourseId }) => sessionCourseId === relation.id,
        )
      )
        failures.push(
          `${resource.title} is not assigned to its folder's SessionCourse`,
        );
      if (!questionCount)
        failures.push(`${resource.title} contains no questions`);
    }
  }

  if (failures.length)
    throw new Error(
      `Student learning flow verification failed:\n- ${failures.join('\n- ')}`,
    );
  console.log('\n========================================');
  console.log('STUDENT LEARNING FLOW VERIFIED');
  console.log('========================================');
  console.log(`Organization:      ${organization.name}`);
  console.log(`Session:           ${session.name}`);
  console.log(
    `Top-level folders: ${new Set(resources.map(({ folderId }) => folderId)).size}`,
  );
  console.log(`Documents:         ${documents.length}`);
  console.log(`Videos:            ${videos.length}`);
  console.log(`Exams:             ${exams.length}`);
  console.log(`Total resources:   ${resources.length}`);
  console.log('Tenant isolation:  valid');
  console.log('Enrollment paths:  valid');
  console.log('Exam assignments:  valid');
  console.log('Nested folders:    none in this flow');
  console.log('========================================\n');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
