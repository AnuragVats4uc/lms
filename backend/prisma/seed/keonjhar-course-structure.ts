import 'dotenv/config';
import {
  CourseStatus,
  FolderStatus,
  Prisma,
  PrismaClient,
  SessionCourseStatus,
  SessionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const ORGANIZATION_CODE = 'KDL';
const ORGANIZATION_NAME = 'KeonjharDigitalLibrary';
const DEFAULT_STUDENT_EMAIL = 'student@gmail.com';
const SESSION_NAME = 'Keonjhar-2026-2027';
const SESSION_CODE = 'KDL-2026-2027';

interface FolderSeed {
  name: string;
  description?: string;
  children?: readonly FolderSeed[];
}

interface CourseSeed {
  code: string;
  name: string;
  description: string;
  folders: readonly FolderSeed[];
}

const standaloneMaterials: readonly FolderSeed[] = [
  {
    name: 'Study Materials',
    description: 'PDF study materials for this course.',
  },
];

const courses: readonly CourseSeed[] = [
  {
    code: 'STUDY-MATERIAL',
    name: 'Study Material',
    description:
      'Core quantitative, reasoning, and general-knowledge material.',
    folders: [{ name: 'Quant' }, { name: 'LR' }, { name: 'GK' }],
  },
  {
    code: 'GS-NCERT',
    name: 'GS NCERT',
    description: 'General Studies and NCERT learning resources.',
    folders: [
      { name: 'Polity' },
      { name: 'Indian Economy' },
      {
        name: 'History',
        children: [
          { name: 'Modern History' },
          { name: 'Medieval History' },
          { name: 'Ancient History' },
        ],
      },
      {
        name: 'Geography',
        children: [
          { name: 'Transport, Communication & Trade' },
          { name: 'Resources' },
          { name: 'Population Geography' },
          { name: 'Geomorphology' },
          { name: 'Disaster & Management' },
          { name: 'Climatology' },
          { name: 'Bio Geography' },
        ],
      },
    ],
  },
  {
    code: 'GS-MNEMONICS',
    name: 'GS Mnemonics',
    description: 'Memory aids and revision material for General Studies.',
    folders: standaloneMaterials,
  },
  {
    code: 'GS-MIND-MAPS',
    name: 'GS Mind Maps',
    description: 'Visual revision maps for General Studies.',
    folders: standaloneMaterials,
  },
  {
    code: 'SSC-CHSL',
    name: 'SSC CHSL',
    description: 'Preparation material for SSC CHSL.',
    folders: standaloneMaterials,
  },
  {
    code: 'SSC-CGL',
    name: 'SSC CGL',
    description: 'Preparation material for SSC CGL.',
    folders: standaloneMaterials,
  },
  {
    code: 'IBPS-PO',
    name: 'IBPS PO',
    description: 'Preparation material for IBPS PO.',
    folders: standaloneMaterials,
  },
  {
    code: 'IBPS-CHSL',
    name: 'IBPS CHSL',
    description: 'Preparation material for IBPS CHSL.',
    folders: standaloneMaterials,
  },
];

const apply = process.argv.includes('--apply');
const confirmation = process.argv
  .find((argument) => argument.startsWith('--confirm='))
  ?.slice('--confirm='.length);
const studentEmail =
  process.env.KEONJHAR_DEMO_STUDENT_EMAIL?.trim().toLowerCase() ??
  DEFAULT_STUDENT_EMAIL;

async function main() {
  if (apply && confirmation !== ORGANIZATION_CODE) {
    throw new Error(
      `Applying this seed requires --apply --confirm=${ORGANIZATION_CODE}.`,
    );
  }

  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ code: ORGANIZATION_CODE }, { name: ORGANIZATION_NAME }],
    },
    select: { id: true, code: true, name: true },
  });
  if (!organization) {
    throw new Error(
      `Organization ${ORGANIZATION_CODE}/${ORGANIZATION_NAME} was not found.`,
    );
  }

  const student = await prisma.student.findFirst({
    where: {
      organizationId: organization.id,
      user: { email: studentEmail },
    },
    select: {
      id: true,
      studentCode: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });
  if (!student) {
    throw new Error(
      `Existing Demo Student ${studentEmail} was not found in ${organization.name}.`,
    );
  }

  const current = await inspectCurrentStructure(organization.id);
  const plan = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    organization,
    student,
    current,
    target: {
      session: SESSION_NAME,
      courses: courses.map((course) => course.name),
      courseCount: courses.length,
      folderCount: courses.reduce(
        (total, course) => total + countFolders(course.folders),
        0,
      ),
      courseEnrollmentCount: courses.length,
    },
  };

  console.log(JSON.stringify(plan, null, 2));
  if (!apply) {
    console.log(
      `Dry run only. Re-run with --apply --confirm=${ORGANIZATION_CODE} after reviewing this report.`,
    );
    return;
  }

  if (current.examCount > 0) {
    throw new Error(
      `Cleanup stopped: ${current.examCount} scheduled exam(s) still reference Keonjhar sessions. Remove or migrate them first.`,
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const existingSessions = await tx.session.findMany({
        where: { organizationId: organization.id },
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      });
      const retainedSession =
        existingSessions.find((session) => session.name === SESSION_NAME) ??
        existingSessions[0];

      const oldSessionCourses = await tx.sessionCourse.findMany({
        where: { session: { organizationId: organization.id } },
        select: { courseId: true },
      });
      const oldCourseIds = [
        ...new Set(oldSessionCourses.map((item) => item.courseId)),
      ];

      await tx.sessionCourse.deleteMany({
        where: { session: { organizationId: organization.id } },
      });

      if (retainedSession) {
        await tx.session.deleteMany({
          where: {
            organizationId: organization.id,
            id: { not: retainedSession.id },
          },
        });
      }

      await tx.course.deleteMany({
        where: {
          id: { in: oldCourseIds },
          sessionCourses: { none: {} },
        },
      });

      const session = retainedSession
        ? await tx.session.update({
            where: { id: retainedSession.id },
            data: {
              code: SESSION_CODE,
              description:
                'Keonjhar Digital Library academic preparation session.',
              endDate: new Date('2027-12-30T23:59:59.999Z'),
              isActive: true,
              name: SESSION_NAME,
              startDate: new Date('2026-08-30T00:00:00.000Z'),
              status: SessionStatus.ACTIVE,
            },
            select: { id: true, name: true },
          })
        : await tx.session.create({
            data: {
              code: SESSION_CODE,
              description:
                'Keonjhar Digital Library academic preparation session.',
              endDate: new Date('2027-12-30T23:59:59.999Z'),
              isActive: true,
              name: SESSION_NAME,
              organizationId: organization.id,
              startDate: new Date('2026-08-30T00:00:00.000Z'),
              status: SessionStatus.ACTIVE,
            },
            select: { id: true, name: true },
          });

      const sessionCourses: Array<{ id: number; name: string }> = [];
      for (const [courseIndex, courseSeed] of courses.entries()) {
        const course = await upsertCourse(tx, courseSeed);
        const sessionCourse = await tx.sessionCourse.create({
          data: {
            courseId: course.id,
            description: courseSeed.description,
            displayName: courseSeed.name,
            isActive: true,
            isPublished: true,
            sessionId: session.id,
            sortOrder: courseIndex + 1,
            status: SessionCourseStatus.ACTIVE,
          },
          select: { id: true },
        });

        await createFolders(tx, sessionCourse.id, null, courseSeed.folders);
        sessionCourses.push({ id: sessionCourse.id, name: courseSeed.name });
      }

      const enrollment = await tx.studentEnrollment.upsert({
        where: {
          studentId_sessionId: {
            sessionId: session.id,
            studentId: student.id,
          },
        },
        update: {
          isActive: true,
          organizationId: organization.id,
          status: 'ACTIVE',
        },
        create: {
          isActive: true,
          organizationId: organization.id,
          sessionId: session.id,
          status: 'ACTIVE',
          studentId: student.id,
        },
        select: { id: true },
      });

      await tx.studentCourseEnrollment.createMany({
        data: sessionCourses.map((sessionCourse) => ({
          enrollmentId: enrollment.id,
          isActive: true,
          sessionCourseId: sessionCourse.id,
          status: 'ACTIVE',
        })),
      });
      await tx.studentCourseProgress.createMany({
        data: sessionCourses.map((sessionCourse) => ({
          completionPercentage: 0,
          sessionCourseId: sessionCourse.id,
          studentId: student.id,
        })),
      });

      const registrationPages = await tx.organizationRegistrationPage.findMany({
        where: { organizationId: organization.id, sessionId: session.id },
        select: { id: true },
      });
      if (registrationPages.length) {
        await tx.organizationRegistrationPageCourse.createMany({
          data: registrationPages.flatMap((page) =>
            sessionCourses.map((sessionCourse, index) => ({
              isActive: true,
              registrationPageId: page.id,
              sessionCourseId: sessionCourse.id,
              sortOrder: index + 1,
            })),
          ),
        });
      }

      return { session, sessionCourses };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  const verified = await inspectCurrentStructure(organization.id);
  if (
    verified.sessionCount !== 1 ||
    verified.sessionCourseCount !== courses.length ||
    verified.folderCount !== 23 ||
    verified.demoStudentCourseEnrollmentCount !== courses.length
  ) {
    throw new Error(
      `Post-seed verification failed: ${JSON.stringify(verified)}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        session: result.session,
        courseCards: result.sessionCourses,
        verified,
      },
      null,
      2,
    ),
  );
}

async function inspectCurrentStructure(organizationId: number) {
  const student = await prisma.student.findFirst({
    where: {
      organizationId,
      user: { email: studentEmail },
    },
    select: { id: true },
  });
  const sessionWhere = { organizationId };
  const sessionCourseWhere = { session: sessionWhere };

  const [
    sessionCount,
    sessionCourseCount,
    folderCount,
    resourceCount,
    examCount,
    registrationPageCount,
    demoStudentCourseEnrollmentCount,
  ] = await Promise.all([
    prisma.session.count({ where: sessionWhere }),
    prisma.sessionCourse.count({ where: sessionCourseWhere }),
    prisma.folder.count({ where: { sessionCourse: sessionCourseWhere } }),
    prisma.resource.count({
      where: { folder: { sessionCourse: sessionCourseWhere } },
    }),
    prisma.exam.count({ where: { organizationId } }),
    prisma.organizationRegistrationPage.count({ where: { organizationId } }),
    student
      ? prisma.studentCourseEnrollment.count({
          where: {
            enrollment: { studentId: student.id, organizationId },
            sessionCourse: sessionCourseWhere,
          },
        })
      : Promise.resolve(0),
  ]);

  return {
    sessionCount,
    sessionCourseCount,
    folderCount,
    resourceCount,
    examCount,
    registrationPageCount,
    demoStudentCourseEnrollmentCount,
  };
}

async function upsertCourse(
  tx: Prisma.TransactionClient,
  courseSeed: CourseSeed,
) {
  const matches = await tx.course.findMany({
    where: {
      OR: [{ code: courseSeed.code }, { name: courseSeed.name }],
    },
    select: { id: true, code: true, name: true },
  });
  if (matches.length > 1) {
    throw new Error(
      `Course identity conflict for ${courseSeed.name}/${courseSeed.code}.`,
    );
  }

  const data = {
    code: courseSeed.code,
    description: courseSeed.description,
    isActive: true,
    name: courseSeed.name,
    status: CourseStatus.ACTIVE,
  };
  return matches[0]
    ? tx.course.update({
        where: { id: matches[0].id },
        data,
        select: { id: true },
      })
    : tx.course.create({ data, select: { id: true } });
}

async function createFolders(
  tx: Prisma.TransactionClient,
  sessionCourseId: number,
  parentFolderId: number | null,
  folders: readonly FolderSeed[],
) {
  for (const [index, folderSeed] of folders.entries()) {
    const folder = await tx.folder.create({
      data: {
        description:
          folderSeed.description ?? `${folderSeed.name} learning resources.`,
        isActive: true,
        name: folderSeed.name,
        parentFolderId,
        sessionCourseId,
        sortOrder: index + 1,
        status: FolderStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (folderSeed.children?.length) {
      await createFolders(tx, sessionCourseId, folder.id, folderSeed.children);
    }
  }
}

function countFolders(folders: readonly FolderSeed[]): number {
  return folders.reduce(
    (count, folder) =>
      count + 1 + (folder.children ? countFolders(folder.children) : 0),
    0,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Keonjhar course-structure seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
