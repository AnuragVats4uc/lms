import 'dotenv/config';
import {
  FolderStatus,
  Prisma,
  PrismaClient,
  ResourceStatus,
} from '@prisma/client';

import {
  RESOURCE_TYPE_IDS,
  ResourceTypeId,
} from '../../src/modules/resource/constants/resource-type.constants';
import { seedResourceTypes } from './resource-types';

const prisma = new PrismaClient();

const requiredCourseCodes = ['QA', 'VA', 'LR', 'MT'] as const;
const organizationPreference = [
  'LMS-DEMO',
  'IIFM-DEMO',
  'DEMO',
  'PRATHAM-DEMO-1',
  'PRATHAM-DEMO-2',
] as const;

const targetSessionSelect = Prisma.validator<Prisma.SessionSelect>()({
  id: true,
  name: true,
  organization: {
    select: { id: true, code: true, name: true },
  },
  sessionCourses: {
    where: {
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      course: { select: { code: true, name: true } },
      folders: {
        where: { isActive: true, status: FolderStatus.ACTIVE },
        orderBy: [{ parentFolderId: 'asc' }, { sortOrder: 'asc' }],
        select: { id: true, name: true, parentFolderId: true },
      },
    },
  },
});

type TargetSession = Prisma.SessionGetPayload<{
  select: typeof targetSessionSelect;
}>;

interface ResourceSeed {
  courseCodes: readonly string[];
  description: string;
  documentUrl?: string;
  durationInSeconds?: number;
  fileSize?: bigint;
  thumbnail?: string;
  title: string;
  type: ResourceTypeId;
  uuid: string;
  videoUrl?: string;
}

const resourceSeeds: readonly ResourceSeed[] = [
  {
    uuid: '5eed0000-0001-4000-8000-000000000001',
    title: 'Number Systems – Complete Revision Notes',
    description:
      'Concept notes covering divisibility, factors, multiples, remainders, unit digits, and number-system shortcuts for IPMAT preparation.',
    type: RESOURCE_TYPE_IDS.DOCUMENT,
    courseCodes: ['QA'],
    documentUrl: 'https://digital.nios.ac.in/content/211en/Chapter-1.pdf',
    fileSize: BigInt(1_842_176),
  },
  {
    uuid: '5eed0000-0002-4000-8000-000000000002',
    title: 'Vocabulary Builder – High-Frequency IPMAT Words',
    description:
      'A practical vocabulary workbook with high-frequency words, contextual examples, roots, synonyms, antonyms, and short revision exercises.',
    type: RESOURCE_TYPE_IDS.DOCUMENT,
    courseCodes: ['VA'],
    documentUrl:
      'https://cbseacademic.nic.in/web_material/publication/Class_X_ENGLISH_WORKBOOK/001-010.pdf',
    fileSize: BigInt(2_154_496),
  },
  {
    uuid: '5eed0000-0003-4000-8000-000000000003',
    title: 'Analytical Reasoning – Core Concepts and Practice',
    description:
      'Structured notes on statements, assumptions, deductions, arrangements, and analytical puzzles with worked examples and practice questions.',
    type: RESOURCE_TYPE_IDS.DOCUMENT,
    courseCodes: ['LR'],
    documentUrl:
      'https://www.ncert.nic.in/pdf/publication/journalsandperiodicals/indianeducationalreview/IER_July_2019.pdf',
    fileSize: BigInt(2_736_128),
  },
  {
    uuid: '5eed0000-0004-4000-8000-000000000004',
    title: 'Current Affairs – July 2026 Monthly Revision',
    description:
      'Monthly revision notes covering major national, international, economic, science, sports, and awards-related developments for entrance exams.',
    type: RESOURCE_TYPE_IDS.DOCUMENT,
    courseCodes: ['GEN-KNOW', 'MT'],
    documentUrl:
      'https://cdnbbsr.s3waas.gov.in/s3b2ab001909a8a6f04b51920306046ce5/uploads/2025/07/202507112006113203.pdf',
    fileSize: BigInt(3_018_752),
  },
  {
    uuid: '5eed0000-0005-4000-8000-000000000005',
    title: 'IPMAT Preparation – Exam Strategy Guide',
    description:
      'A complete planning guide for section order, time allocation, accuracy targets, mock-test analysis, and final-month revision strategy.',
    type: RESOURCE_TYPE_IDS.DOCUMENT,
    courseCodes: ['MT'],
    documentUrl:
      'https://cbseacademic.nic.in/web_material/ASL/2014/2_ASL_Guidelines_for_Teachers_Principals_2014.pdf',
    fileSize: BigInt(1_527_808),
  },
  {
    uuid: '5eed0000-0006-4000-8000-000000000006',
    title: 'Number Systems – Concept Introduction',
    description:
      'A guided introduction to natural numbers, integers, divisibility, prime factorization, remainders, and common IPMAT question patterns.',
    type: RESOURCE_TYPE_IDS.VIDEO,
    courseCodes: ['QA'],
    videoUrl: 'https://vimeo.com/76979871',
    thumbnail: '/resources/thumbnails/number-systems.svg',
    durationInSeconds: 1_584,
  },
  {
    uuid: '5eed0000-0007-4000-8000-000000000007',
    title: 'Percentage & Profit/Loss – Problem Solving',
    description:
      'Practice session covering percentage change, successive percentages, cost and selling price, discounts, profit and loss, and shortcut techniques.',
    type: RESOURCE_TYPE_IDS.VIDEO,
    courseCodes: ['QA'],
    videoUrl: 'https://vimeo.com/22439234',
    thumbnail: '/resources/thumbnails/percentage-profit-loss.svg',
    durationInSeconds: 2_146,
  },
  {
    uuid: '5eed0000-0008-4000-8000-000000000008',
    title: 'Reading Comprehension – Strategy Session',
    description:
      'A strategy lesson on passage mapping, identifying central ideas, handling inference questions, eliminating options, and improving reading speed.',
    type: RESOURCE_TYPE_IDS.VIDEO,
    courseCodes: ['VA'],
    videoUrl: 'https://vimeo.com/148751763',
    thumbnail: '/resources/thumbnails/reading-comprehension.svg',
    durationInSeconds: 1_872,
  },
  {
    uuid: '5eed0000-0009-4000-8000-000000000009',
    title: 'Logical Reasoning – Seating Arrangement Workshop',
    description:
      'Step-by-step workshop on linear and circular seating arrangements, constraint notation, case analysis, and timed problem-solving methods.',
    type: RESOURCE_TYPE_IDS.VIDEO,
    courseCodes: ['LR'],
    videoUrl: 'https://vimeo.com/1084537',
    thumbnail: '/resources/thumbnails/seating-arrangement.svg',
    durationInSeconds: 2_328,
  },
  {
    uuid: '5eed0000-0010-4000-8000-000000000010',
    title: 'IPMAT Mock Test 05 – Complete Solution Discussion',
    description:
      'Detailed solution discussion for Mock Test 05 with alternate approaches, common mistakes, time-management observations, and score-improvement actions.',
    type: RESOURCE_TYPE_IDS.VIDEO,
    courseCodes: ['MT'],
    videoUrl: 'https://vimeo.com/395212534',
    thumbnail: '/resources/thumbnails/mock-test-solutions.svg',
    durationInSeconds: 3_486,
  },
];

async function main() {
  await seedResourceTypes(prisma);
  const session = await findTargetSession();
  const folderByCourseCode = await resolveFolders(session);

  await prisma.$transaction(
    resourceSeeds.map((resource, index) => {
      const courseCode = resolveCourseCode(resource, session);
      const folderId = folderByCourseCode.get(courseCode);

      if (!folderId) {
        throw new Error(`No folder resolved for course ${courseCode}`);
      }

      const isDocument = resource.type === RESOURCE_TYPE_IDS.DOCUMENT;
      const data: Prisma.ResourceUncheckedCreateInput = {
        folderId,
        title: resource.title,
        description: resource.description,
        resourceTypeId: resource.type,
        documentUrl: resource.documentUrl ?? null,
        videoUrl: resource.videoUrl ?? null,
        examId: null,
        thumbnail: resource.thumbnail ?? null,
        mimeType: isDocument ? 'application/pdf' : 'video/mp4',
        fileSize: resource.fileSize ?? null,
        durationInSeconds: resource.durationInSeconds ?? null,
        sortOrder: index + 10,
        status: ResourceStatus.PUBLISHED,
        isPublished: true,
        isDownloadable: isDocument,
        isActive: true,
      };

      return prisma.resource.upsert({
        where: { uuid: resource.uuid },
        update: data,
        create: { ...data, uuid: resource.uuid },
      });
    }),
  );

  const verified = await verifyResources(session);
  printSummary(session, verified);
}

async function findTargetSession() {
  const candidates = await prisma.session.findMany({
    where: {
      isActive: true,
      organization: { isActive: true },
      AND: requiredCourseCodes.map((code) => ({
        sessionCourses: {
          some: {
            isActive: true,
            course: { code },
          },
        },
      })),
    },
    orderBy: { id: 'asc' },
    select: targetSessionSelect,
  });

  if (!candidates.length) {
    throw new Error(
      `No active session contains the required existing courses: ${requiredCourseCodes.join(', ')}. Run the existing student seed first.`,
    );
  }

  return candidates.sort(
    (left, right) => sessionScore(right) - sessionScore(left),
  )[0];
}

function sessionScore(session: TargetSession) {
  const organizationIndex = organizationPreference.indexOf(
    session.organization.code as (typeof organizationPreference)[number],
  );
  const organizationScore =
    organizationIndex === -1
      ? 0
      : (organizationPreference.length - organizationIndex) * 10;
  const ipmatScore = session.name.toLowerCase().includes('ipmat') ? 5 : 0;
  const generalKnowledgeScore = session.sessionCourses.some(
    ({ course }) => course.code === 'GEN-KNOW',
  )
    ? 1
    : 0;

  return organizationScore + ipmatScore + generalKnowledgeScore;
}

async function resolveFolders(session: TargetSession) {
  const usedCourseCodes = new Set(
    resourceSeeds.map((resource) => resolveCourseCode(resource, session)),
  );
  const folderByCourseCode = new Map<string, number>();

  for (const courseCode of usedCourseCodes) {
    const sessionCourse = session.sessionCourses.find(
      ({ course }) => course.code === courseCode,
    );

    if (!sessionCourse) {
      throw new Error(`Session course ${courseCode} was not found`);
    }

    const existingFolder =
      sessionCourse.folders.find(
        ({ parentFolderId }) => parentFolderId === null,
      ) ?? sessionCourse.folders[0];

    if (existingFolder) {
      folderByCourseCode.set(courseCode, existingFolder.id);
      continue;
    }

    const folder = await prisma.folder.create({
      data: {
        sessionCourseId: sessionCourse.id,
        name: `${sessionCourse.course.name} Resources`,
        description: `Published learning resources for ${sessionCourse.course.name}.`,
        sortOrder: 0,
        icon: 'folder',
        color: '#2563EB',
        status: FolderStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });
    folderByCourseCode.set(courseCode, folder.id);
  }

  return folderByCourseCode;
}

function resolveCourseCode(resource: ResourceSeed, session: TargetSession) {
  const courseCode = resource.courseCodes.find((candidate) =>
    session.sessionCourses.some(({ course }) => course.code === candidate),
  );

  if (!courseCode) {
    throw new Error(
      `None of the expected courses (${resource.courseCodes.join(', ')}) exist in session ${session.name}`,
    );
  }

  return courseCode;
}

async function verifyResources(session: TargetSession) {
  const resources = await prisma.resource.findMany({
    where: { uuid: { in: resourceSeeds.map(({ uuid }) => uuid) } },
    include: {
      resourceType: true,
      folder: {
        include: {
          sessionCourse: {
            include: {
              course: true,
              session: { include: { organization: true } },
            },
          },
        },
      },
    },
  });
  const resourceByUuid = new Map(
    resources.map((resource) => [resource.uuid, resource]),
  );
  const documents = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
  );
  const videos = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.VIDEO,
  );

  if (
    resources.length !== 10 ||
    documents.length !== 5 ||
    videos.length !== 5
  ) {
    throw new Error(
      `Resource verification failed: expected 5 documents and 5 videos, found ${documents.length} documents and ${videos.length} videos`,
    );
  }

  for (const seed of resourceSeeds) {
    const resource = resourceByUuid.get(seed.uuid);
    if (!resource)
      throw new Error(`Seeded resource ${seed.uuid} was not found`);

    const relation = resource.folder.sessionCourse;
    const expectedCourseCode = resolveCourseCode(seed, session);
    const validDocument =
      seed.type !== RESOURCE_TYPE_IDS.DOCUMENT ||
      (Boolean(resource.documentUrl) && !resource.videoUrl && !resource.examId);
    const validVideo =
      seed.type !== RESOURCE_TYPE_IDS.VIDEO ||
      (Boolean(resource.videoUrl) &&
        Boolean(resource.thumbnail) &&
        Boolean(resource.durationInSeconds) &&
        !resource.documentUrl &&
        !resource.examId);

    if (
      relation.session.organization.id !== session.organization.id ||
      relation.session.id !== session.id ||
      relation.course.code !== expectedCourseCode ||
      resource.resourceType.id !== seed.type ||
      !resource.resourceType.isActive ||
      !validDocument ||
      !validVideo ||
      resource.status !== ResourceStatus.PUBLISHED ||
      !resource.isPublished ||
      !resource.isActive
    ) {
      throw new Error(
        `Relationship or metadata verification failed for ${seed.title}`,
      );
    }
  }

  return resourceSeeds.map((seed) => resourceByUuid.get(seed.uuid)!);
}

function printSummary(
  session: TargetSession,
  resources: Awaited<ReturnType<typeof verifyResources>>,
) {
  const documents = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT,
  );
  const videos = resources.filter(
    ({ resourceTypeId }) => resourceTypeId === RESOURCE_TYPE_IDS.VIDEO,
  );

  console.log('\n========================================');
  console.log('LMS RESOURCE SEED COMPLETED');
  console.log('========================================');
  console.log(`Organization:              ${session.organization.name}`);
  console.log(`Session:                   ${session.name}`);
  console.log(`Documents created/updated: ${documents.length}`);
  console.log(`Videos created/updated:    ${videos.length}`);
  console.log(`Total resources:           ${resources.length}`);
  console.log('\nDocuments:');
  documents.forEach((resource, index) =>
    console.log(`${index + 1}. ${resource.title}`),
  );
  console.log('\nVideos:');
  videos.forEach((resource, index) =>
    console.log(`${index + 1}. ${resource.title}`),
  );
  console.log('========================================\n');
}

main()
  .catch((error: unknown) => {
    console.error('LMS resource seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
