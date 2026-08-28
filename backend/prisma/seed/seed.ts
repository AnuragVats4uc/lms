import { ConfigService } from '@nestjs/config';
import {
  FolderStatus,
  OrganizationStatus,
  Prisma,
  PrismaClient,
  ResourceStatus,
  SessionCourseStatus,
  SessionStatus,
  CourseStatus,
  StudentNotificationType,
  ExamStatus,
  ExamTemplateStatus,
  ExamTemplateVersionStatus,
  QuestionStatus,
} from '@prisma/client';

import { PasswordService } from '../../src/modules/auth/services/password.service';
import {
  RESOURCE_TYPE_IDS,
  ResourceTypeId,
} from '../../src/modules/resource/constants/resource-type.constants';
import { seedResourceTypes } from './resource-types';
import { seedStudentLearningFlow } from './student-learning-flow';
import { ensureOrganizationActivityPolicies } from './activity-policies';

const prisma = new PrismaClient();
const BATCH_SIZE = 2_000;

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
const passwordService = new PasswordService({
  get: (key: string) => (key === 'bcrypt.saltRounds' ? saltRounds : undefined),
} as ConfigService);

const defaultRoles = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Full platform access',
  },
  {
    name: 'Admin',
    code: 'ADMIN',
    description: 'Organization-scoped administrator access',
  },
  {
    name: 'Student',
    code: 'STUDENT',
    description: 'Learner access',
  },
] as const;

const permissionModules = [
  'organizations',
  'users',
  'students',
  'roles',
  'permissions',
  'session',
  'course',
  'session-course',
  'folder',
  'resource',
  'dashboard',
  'subject',
  'question',
  'exam-template',
  'exam',
  'exam-import',
] as const;

const crudActions = ['create', 'read', 'update', 'delete'] as const;

const defaultPermissions = permissionModules.flatMap((module) =>
  crudActions.map((action) => ({
    module,
    action,
    key: `${module}.${action}`,
    description: `Allows ${action} access for ${module}`,
  })),
);

const organizationCatalog = [
  ['Northstar Learning Institute', 'NORTHSTAR'],
  ['Pioneer Academic Center', 'PIONEER'],
  ['Summit Scholars Academy', 'SUMMIT'],
  ['Blue Oak Education', 'BLUEOAK'],
  ['Cedar Grove Institute', 'CEDARGROVE'],
  ['Horizon Preparatory School', 'HORIZON'],
  ['Aspire Learning Hub', 'ASPIRE'],
  ['BrightPath Academy', 'BRIGHTPATH'],
  ['Meridian Knowledge Center', 'MERIDIAN'],
  ['Evergreen Tutorials', 'EVERGREEN'],
  ['Oakridge Learning House', 'OAKRIDGE'],
  ['Crescent Education Group', 'CRESCENT'],
  ['Vertex Competitive Academy', 'VERTEX'],
  ['Atlas Learning Network', 'ATLAS'],
  ['Maple Leaf Institute', 'MAPLELEAF'],
  ['Sterling Academic Works', 'STERLING'],
  ['Riverstone Education', 'RIVERSTONE'],
  ['Beacon Scholars Institute', 'BEACON'],
  ['Crown Point Academy', 'CROWNPOINT'],
  ['Lighthouse Learning Center', 'LIGHTHOUSE'],
] as const;

const courseCatalog = [
  ['Mathematics Foundation', 'MATH-FDN'],
  ['Physics Mastery', 'PHYS-MST'],
  ['Chemistry Essentials', 'CHEM-ESS'],
  ['Biology Core', 'BIO-CORE'],
  ['English Language Skills', 'ENG-LANG'],
  ['Computer Science Basics', 'CS-BASIC'],
  ['Data Structures', 'DS-CORE'],
  ['Web Development', 'WEB-DEV'],
  ['Database Systems', 'DB-SYS'],
  ['Calculus and Applications', 'CALC-APP'],
  ['Algebra and Number Theory', 'ALG-NTH'],
  ['Organic Chemistry', 'ORG-CHEM'],
  ['Mechanics and Motion', 'MECH-MOT'],
  ['Electromagnetism', 'ELECTRO'],
  ['Statistics and Probability', 'STAT-PROB'],
  ['Communication Skills', 'COMM-SKL'],
  ['Logical Reasoning', 'LOGIC-REA'],
  ['Environmental Science', 'ENV-SCI'],
  ['General Knowledge', 'GEN-KNOW'],
  ['Competitive Exam Strategies', 'COMP-STR'],
] as const;

const rootFolderNames = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'English',
] as const;
const childFolderNames = [
  'Foundations',
  'Concepts',
  'Practice',
  'Revision',
] as const;

type Id = { id: number };
type SessionRecord = Id & { organizationId: number; name: string };
type SessionCourseRecord = Id & { sessionId: number; courseId: number };
type FolderRecord = Id & {
  sessionCourseId: number;
  parentFolderId: number | null;
  name: string;
};

async function main() {
  console.log('Starting LMS relational seed');
  await seedResourceTypes(prisma);

  if (process.env.SEED_DASHBOARD === 'true') {
    console.log('Dashboard seed mode enabled: preserving existing data');
    const rolesByCode = await seedRoles();
    const permissionsByKey = await seedPermissions();
    await assignPermissionsToRole(
      rolesByCode.get('ADMIN')!.id,
      defaultPermissions
        .filter(
          (permission) =>
            permission.module !== 'organizations' &&
            !(
              permission.module === 'permissions' &&
              permission.action !== 'read'
            ),
        )
        .map((permission) => permission.key),
      permissionsByKey,
    );
    await seedStudentDashboardDemo();
    await ensureOrganizationActivityPolicies(prisma);
    await seedStudentLearningFlow();
    console.log('Dashboard seed completed successfully');
    return;
  }

  if (process.env.SEED_RESUME === 'true') {
    console.log('Resume mode enabled: preserving existing generated hierarchy');
    await ensureOrganizationActivityPolicies(prisma);
    const folders = await findSeedFolders();
    await seedResources(folders);
    console.log('Resource resume completed successfully');
    return;
  }

  console.log(
    'Stage 1/7: preserving system reference data and cleaning sample data',
  );
  await cleanOrganizationData();

  console.log('Stage 2/7: seeding roles and permissions');
  const rolesByCode = await seedRoles();
  const permissionsByKey = await seedPermissions();
  await assignPermissionsToRole(
    rolesByCode.get('SUPER_ADMIN')!.id,
    defaultPermissions.map((permission) => permission.key),
    permissionsByKey,
  );
  await assignPermissionsToRole(
    rolesByCode.get('ADMIN')!.id,
    defaultPermissions
      .filter(
        (permission) =>
          permission.module !== 'organizations' &&
          !(
            permission.module === 'permissions' &&
            permission.action !== 'read'
          ),
      )
      .map((permission) => permission.key),
    permissionsByKey,
  );
  const superAdmin = await seedSuperAdmin();
  await assignRoleToUser(superAdmin.id, rolesByCode.get('SUPER_ADMIN')!.id);

  console.log('Stage 3/7: creating 20 organizations');
  const organizations = await seedOrganizations();
  await ensureOrganizationActivityPolicies(prisma);

  console.log(
    'Stage 4/7: creating 20 courses and 20 sessions per organization',
  );
  const courses = await seedCourses();
  const sessions = await seedSessions(organizations);

  console.log('Stage 5/7: creating 20 session courses per session');
  const sessionCourses = await seedSessionCourses(sessions, courses);

  console.log('Stage 6/7: creating 20 folders per session course');
  const folders = await seedFolders(sessionCourses);

  console.log('Stage 7/7: creating 20 resources per folder');
  await seedResources(folders);

  console.log(
    `Seed completed: ${organizations.length} organizations, ${sessions.length} sessions, ${sessionCourses.length} session courses, ${folders.length} folders, and ${folders.length * 20} resources`,
  );
}

async function cleanOrganizationData() {
  const organizations = await prisma.organization.findMany({
    select: { id: true },
  });
  const organizationIds = organizations.map(({ id }) => id);

  if (!organizationIds.length) {
    console.log('No organization-scoped data found; system data retained');
    return;
  }

  const users = await prisma.user.findMany({
    where: { organizationId: { in: organizationIds } },
    select: { id: true },
  });
  const userIds = users.map(({ id }) => id);

  const relatedCourses = await prisma.course.findMany({
    where: {
      OR: [
        { code: { in: courseCatalog.map(([, code]) => code) } },
        {
          sessionCourses: {
            some: { session: { organizationId: { in: organizationIds } } },
          },
        },
      ],
    },
    select: { id: true },
  });
  const courseIds = relatedCourses.map(({ id }) => id);

  await prisma.$transaction(
    async (tx) => {
      await tx.studentActivityEvent.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.studentResourceActivitySession.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.authenticationAttempt.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.userActivitySession.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.examImportJob.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.exam.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.examTemplate.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.question.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.subject.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      if (userIds.length) {
        await tx.refreshToken.deleteMany({
          where: { userId: { in: userIds } },
        });
        await tx.userRole.deleteMany({ where: { userId: { in: userIds } } });
        await tx.user.deleteMany({ where: { id: { in: userIds } } });
      }

      await tx.userRole.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.resource.deleteMany({
        where: {
          folder: {
            sessionCourse: {
              session: { organizationId: { in: organizationIds } },
            },
          },
        },
      });
      await tx.folder.deleteMany({
        where: {
          sessionCourse: {
            session: { organizationId: { in: organizationIds } },
          },
        },
      });
      await tx.sessionCourse.deleteMany({
        where: { session: { organizationId: { in: organizationIds } } },
      });
      await tx.session.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });

      if (courseIds.length) {
        await tx.course.deleteMany({ where: { id: { in: courseIds } } });
      }

      await tx.organization.deleteMany({
        where: { id: { in: organizationIds } },
      });
    },
    {
      maxWait: 60_000,
      timeout: 600_000,
    },
  );

  console.log(
    `Removed ${organizationIds.length} organizations and their dependent sample data; preserved roles, permissions, and unscoped system users`,
  );
}

async function seedStudentDashboardDemo() {
  const rolesByCode = await seedRoles();
  const password = await passwordService.hash('Admin@123');
  const now = new Date();
  const organization = await prisma.organization.upsert({
    where: { code: 'LMS-DEMO' },
    update: {
      name: 'LMS Demo Organization',
      description: 'Development organization for student dashboard validation.',
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
    create: {
      name: 'LMS Demo Organization',
      code: 'LMS-DEMO',
      description: 'Development organization for student dashboard validation.',
      status: OrganizationStatus.ACTIVE,
      isActive: true,
    },
    select: { id: true },
  });
  const session = await prisma.session.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'IPMAT Foundation 2027',
      },
    },
    update: {
      code: 'IPMAT-2027',
      description: 'IPMAT Foundation 2027 dashboard validation batch.',
      status: SessionStatus.ACTIVE,
      isActive: true,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
    },
    create: {
      organizationId: organization.id,
      name: 'IPMAT Foundation 2027',
      code: 'IPMAT-2027',
      description: 'IPMAT Foundation 2027 dashboard validation batch.',
      status: SessionStatus.ACTIVE,
      isActive: true,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
    },
    select: { id: true },
  });
  const student = await prisma.user.upsert({
    where: { email: 'student.demo@lms.test' },
    update: {
      organizationId: organization.id,
      firstName: 'Demo',
      lastName: 'Student',
      password,
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      firstName: 'Demo',
      lastName: 'Student',
      email: 'student.demo@lms.test',
      password,
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  const studentRecord = await prisma.student.upsert({
    where: { userId: student.id },
    update: {
      isActive: true,
      organizationId: organization.id,
      status: 'ACTIVE',
      studentCode: `STU-${student.id}`,
      profile: {
        upsert: {
          create: {
            firstName: 'Demo',
            lastName: 'Student',
          },
          update: {
            firstName: 'Demo',
            lastName: 'Student',
          },
        },
      },
    },
    create: {
      isActive: true,
      organizationId: organization.id,
      status: 'ACTIVE',
      studentCode: `STU-${student.id}`,
      userId: student.id,
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'Student',
        },
      },
    },
    select: { id: true },
  });

  await assignOrganizationRoleToUser(
    student.id,
    rolesByCode.get('STUDENT')!.id,
    organization.id,
  );

  const enrollment = await prisma.studentEnrollment.upsert({
    where: {
      studentId_sessionId: {
        studentId: studentRecord.id,
        sessionId: session.id,
      },
    },
    update: {
      organizationId: organization.id,
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      studentId: studentRecord.id,
      organizationId: organization.id,
      sessionId: session.id,
      status: 'ACTIVE',
      isActive: true,
    },
    select: { id: true },
  });

  const dashboardCourses = [
    {
      name: 'Quantitative Aptitude',
      code: 'QA',
      instructor: ['Ritika', 'Mehra', 'ritika.mehra@lms.test'],
      completion: 68,
      resource: ['Permutation & Combination Notes', RESOURCE_TYPE_IDS.DOCUMENT],
      folder: 'Aptitude Notes',
      sortOrder: 0,
    },
    {
      name: 'Verbal Ability',
      code: 'VA',
      instructor: ['Nidhi', 'Arora', 'nidhi.arora@lms.test'],
      completion: 56,
      resource: ['Linear Equations - Part 2', RESOURCE_TYPE_IDS.VIDEO],
      folder: 'Verbal Lessons',
      sortOrder: 1,
    },
    {
      name: 'Logical Reasoning',
      code: 'LR',
      instructor: ['Aman', 'Verma', 'aman.verma@lms.test'],
      completion: 42,
      resource: [
        'Reading Comprehension Strategies',
        RESOURCE_TYPE_IDS.DOCUMENT,
      ],
      folder: 'Reasoning Practice',
      sortOrder: 2,
    },
    {
      name: 'Mock Tests',
      code: 'MT',
      instructor: ['Test', 'Series', 'test.series@lms.test'],
      completion: 75,
      resource: [
        'Logical Reasoning Practice Set 05',
        RESOURCE_TYPE_IDS.DOCUMENT,
      ],
      folder: 'Mock Test Assignments',
      sortOrder: 3,
    },
  ] as const;

  for (const item of dashboardCourses) {
    const course = await prisma.course.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        description: `${item.name} for the IPMAT Foundation 2027 batch.`,
        status: CourseStatus.ACTIVE,
        isActive: true,
      },
      create: {
        name: item.name,
        code: item.code,
        description: `${item.name} for the IPMAT Foundation 2027 batch.`,
        status: CourseStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });
    const sessionCourse = await prisma.sessionCourse.upsert({
      where: {
        sessionId_courseId: {
          sessionId: session.id,
          courseId: course.id,
        },
      },
      update: {
        displayName: item.name,
        sortOrder: item.sortOrder,
        status: SessionCourseStatus.ACTIVE,
        isPublished: true,
        isActive: true,
      },
      create: {
        sessionId: session.id,
        courseId: course.id,
        displayName: item.name,
        sortOrder: item.sortOrder,
        status: SessionCourseStatus.ACTIVE,
        isPublished: true,
        isActive: true,
      },
      select: { id: true },
    });
    await prisma.studentCourseEnrollment.upsert({
      where: {
        enrollmentId_sessionCourseId: {
          enrollmentId: enrollment.id,
          sessionCourseId: sessionCourse.id,
        },
      },
      update: { status: 'ACTIVE', isActive: true },
      create: {
        enrollmentId: enrollment.id,
        sessionCourseId: sessionCourse.id,
        status: 'ACTIVE',
        isActive: true,
      },
    });
    const instructor = await prisma.user.upsert({
      where: { email: item.instructor[2] },
      update: {
        organizationId: organization.id,
        firstName: item.instructor[0],
        lastName: item.instructor[1],
        password,
        isActive: true,
        isVerified: true,
        status: 'ACTIVE',
      },
      create: {
        organizationId: organization.id,
        firstName: item.instructor[0],
        lastName: item.instructor[1],
        email: item.instructor[2],
        password,
        isActive: true,
        isVerified: true,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await assignOrganizationRoleToUser(
      instructor.id,
      rolesByCode.get('ADMIN')!.id,
      organization.id,
    );
    await prisma.courseInstructor.upsert({
      where: {
        sessionCourseId_instructorId: {
          sessionCourseId: sessionCourse.id,
          instructorId: instructor.id,
        },
      },
      update: {},
      create: {
        sessionCourseId: sessionCourse.id,
        instructorId: instructor.id,
      },
    });

    const folder = await upsertDashboardFolder(
      sessionCourse.id,
      item.folder,
      item.sortOrder,
    );
    const resource = await upsertDashboardResource(
      folder.id,
      item.resource[0],
      item.resource[1],
      item.sortOrder,
      new Date(now.getTime() - (item.sortOrder + 1) * 24 * 60 * 60 * 1000),
    );
    await prisma.studentCourseProgress.upsert({
      where: {
        studentId_sessionCourseId: {
          studentId: studentRecord.id,
          sessionCourseId: sessionCourse.id,
        },
      },
      update: {
        completionPercentage: item.completion,
        lastAccessedResourceId: resource.id,
      },
      create: {
        studentId: studentRecord.id,
        sessionCourseId: sessionCourse.id,
        completionPercentage: item.completion,
        lastAccessedResourceId: resource.id,
      },
    });
  }

  await seedDashboardNotification(
    studentRecord.id,
    organization.id,
    StudentNotificationType.ASSIGNMENT,
    'Assignment Reminder',
    'Logical Reasoning Set 04 is due tomorrow.',
    new Date(now.getTime() - 2 * 60 * 60 * 1000),
  );
  await seedDashboardNotification(
    studentRecord.id,
    organization.id,
    StudentNotificationType.ANNOUNCEMENT,
    'Important Announcement',
    'IPMAT Mock Test on Sunday at 11:00 AM.',
    new Date(now.getTime() - 5 * 60 * 60 * 1000),
  );
  await seedDashboardNotification(
    studentRecord.id,
    organization.id,
    StudentNotificationType.EVENT,
    'Upcoming Event',
    'Verbal Ability Live Class at 4:30 PM today.',
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
  );

  console.log('Dashboard student login: student.demo@lms.test / Admin@123');
}

async function upsertDashboardFolder(
  sessionCourseId: number,
  name: string,
  sortOrder: number,
) {
  const existingFolder = await prisma.folder.findFirst({
    where: { sessionCourseId, parentFolderId: null, name },
    select: { id: true },
  });

  if (existingFolder) {
    return prisma.folder.update({
      where: { id: existingFolder.id },
      data: {
        description: `${name} resources for dashboard validation.`,
        sortOrder,
        status: FolderStatus.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });
  }

  return prisma.folder.create({
    data: {
      sessionCourseId,
      name,
      description: `${name} resources for dashboard validation.`,
      sortOrder,
      icon: 'folder',
      color: folderColor(sortOrder),
      status: FolderStatus.ACTIVE,
      isActive: true,
    },
    select: { id: true },
  });
}

async function upsertDashboardResource(
  folderId: number,
  title: string,
  type: ResourceTypeId,
  sortOrder: number,
  createdAt: Date,
) {
  const existingResource = await prisma.resource.findFirst({
    where: { folderId, title },
    select: { id: true },
  });
  const data = {
    title,
    description: `${title} dashboard validation content.`,
    resourceTypeId: type,
    documentUrl:
      type === RESOURCE_TYPE_IDS.DOCUMENT
        ? `https://cdn.example.com/lms/demo/${folderId}-${sortOrder}.pdf`
        : null,
    videoUrl:
      type === RESOURCE_TYPE_IDS.VIDEO
        ? `https://cdn.example.com/lms/demo/${folderId}-${sortOrder}.mp4`
        : null,
    examId: type === RESOURCE_TYPE_IDS.EXAM ? 900_000 + sortOrder : null,
    mimeType:
      type === RESOURCE_TYPE_IDS.VIDEO
        ? 'video/mp4'
        : type === RESOURCE_TYPE_IDS.EXAM
          ? 'application/json'
          : 'application/pdf',
    fileSize:
      type === RESOURCE_TYPE_IDS.DOCUMENT
        ? BigInt(420_000 + sortOrder * 15_000)
        : null,
    durationInSeconds:
      type === RESOURCE_TYPE_IDS.VIDEO ? 1_200 + sortOrder * 120 : null,
    sortOrder,
    status: ResourceStatus.PUBLISHED,
    isPublished: true,
    isDownloadable: type !== RESOURCE_TYPE_IDS.VIDEO,
    isActive: true,
    createdAt,
  };

  if (existingResource) {
    return prisma.resource.update({
      where: { id: existingResource.id },
      data,
      select: { id: true },
    });
  }

  return prisma.resource.create({
    data: { ...data, folderId },
    select: { id: true },
  });
}

async function seedDashboardNotification(
  studentId: number,
  organizationId: number,
  type: StudentNotificationType,
  title: string,
  description: string,
  createdAt: Date,
) {
  const existingNotification = await prisma.studentNotification.findFirst({
    where: { studentId, organizationId, type, title },
    select: { id: true },
  });
  const data = {
    description,
    isRead: false,
    expiresAt: null,
    createdAt,
  };

  if (existingNotification) {
    await prisma.studentNotification.update({
      where: { id: existingNotification.id },
      data,
    });
    return;
  }

  await prisma.studentNotification.create({
    data: {
      studentId,
      organizationId,
      type,
      title,
      ...data,
    },
  });
}

async function seedOrganizations() {
  await prisma.organization.createMany({
    data: organizationCatalog.map(([name, code], index) => ({
      name,
      code,
      description: `${name} provides structured academic programs and digital learning resources.`,
      website: `https://www.example.com/academies/${code.toLowerCase()}`,
      email: `admin@${code.toLowerCase()}.example.com`,
      phone: `+1-555-010-${String(index + 1).padStart(2, '0')}`,
      address: `${100 + index} Learning Avenue, Academic City`,
      status:
        index % 10 === 0
          ? OrganizationStatus.INACTIVE
          : OrganizationStatus.ACTIVE,
      isActive: index % 10 !== 0,
    })),
  });

  return prisma.organization.findMany({
    where: { code: { in: organizationCatalog.map(([, code]) => code) } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  });
}

async function seedCourses() {
  await prisma.course.createMany({
    data: courseCatalog.map(([name, code], index) => ({
      name,
      code,
      description: `${name} curriculum with guided lessons, practice work, and assessment resources.`,
      thumbnail: `https://images.example.com/courses/${code.toLowerCase()}.jpg`,
      durationInDays: 45 + (index % 6) * 15,
      status: index % 8 === 0 ? CourseStatus.DRAFT : CourseStatus.ACTIVE,
      isActive: true,
    })),
  });

  return prisma.course.findMany({
    where: { code: { in: courseCatalog.map(([, code]) => code) } },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  });
}

async function seedSessions(organizations: Array<Id & { code: string }>) {
  const data: Prisma.SessionCreateManyInput[] = [];

  for (const organization of organizations) {
    for (let sessionIndex = 0; sessionIndex < 20; sessionIndex += 1) {
      const startYear = 2025 + sessionIndex;
      const status = sessionStatusForIndex(sessionIndex);
      data.push({
        organizationId: organization.id,
        name: `${startYear}-${startYear + 1}`,
        code: `${organization.code}-${startYear}`,
        description: `Academic session ${startYear}-${startYear + 1} for ${organization.code}.`,
        startDate: new Date(`${startYear}-04-01T00:00:00.000Z`),
        endDate: new Date(`${startYear + 1}-03-31T23:59:59.999Z`),
        status,
        isActive: status !== SessionStatus.ARCHIVED,
      });
    }
  }

  await createManyInBatches(data, (batch) =>
    prisma.session.createMany({ data: batch }),
  );

  return prisma.session.findMany({
    where: {
      organizationId: { in: organizations.map(({ id }) => id) },
    },
    select: { id: true, organizationId: true, name: true },
    orderBy: [{ organizationId: 'asc' }, { name: 'asc' }],
  });
}

async function seedSessionCourses(
  sessions: SessionRecord[],
  courses: Array<Id & { code: string }>,
) {
  const data: Prisma.SessionCourseCreateManyInput[] = [];

  for (const session of sessions) {
    for (const [courseIndex, course] of courses.entries()) {
      const status =
        courseIndex % 10 === 0
          ? SessionCourseStatus.DRAFT
          : SessionCourseStatus.ACTIVE;
      data.push({
        sessionId: session.id,
        courseId: course.id,
        displayName: `${course.code} · ${session.name}`,
        description: `${course.code} delivery plan for the ${session.name} academic session.`,
        sortOrder: courseIndex,
        isPublished: status === SessionCourseStatus.ACTIVE,
        status,
        isActive: true,
      });
    }
  }

  await createManyInBatches(data, (batch) =>
    prisma.sessionCourse.createMany({ data: batch }),
  );

  return prisma.sessionCourse.findMany({
    where: { sessionId: { in: sessions.map(({ id }) => id) } },
    select: { id: true, sessionId: true, courseId: true },
    orderBy: [{ sessionId: 'asc' }, { courseId: 'asc' }],
  });
}

async function seedFolders(sessionCourses: SessionCourseRecord[]) {
  const rootData: Prisma.FolderCreateManyInput[] = [];

  for (const sessionCourse of sessionCourses) {
    for (const [sortOrder, name] of rootFolderNames.entries()) {
      rootData.push({
        sessionCourseId: sessionCourse.id,
        name,
        description: `${name} learning materials and curriculum resources.`,
        sortOrder,
        icon: name.toLowerCase(),
        color: folderColor(sortOrder),
        status: FolderStatus.ACTIVE,
        isActive: true,
      });
    }
  }

  await createManyInBatches(rootData, (batch) =>
    prisma.folder.createMany({ data: batch }),
  );

  const roots = await prisma.folder.findMany({
    where: {
      sessionCourseId: { in: sessionCourses.map(({ id }) => id) },
      parentFolderId: null,
    },
    select: {
      id: true,
      sessionCourseId: true,
      parentFolderId: true,
      name: true,
    },
    orderBy: [{ sessionCourseId: 'asc' }, { sortOrder: 'asc' }],
  });

  const childData: Prisma.FolderCreateManyInput[] = [];
  for (const root of roots) {
    for (const [offset, name] of childFolderNames.entries()) {
      childData.push({
        sessionCourseId: root.sessionCourseId,
        parentFolderId: root.id,
        name,
        description: `${name} materials for ${root.name}.`,
        sortOrder: offset,
        icon: 'folder',
        color: folderColor(offset + 1),
        status:
          offset === childFolderNames.length - 1
            ? FolderStatus.ARCHIVED
            : FolderStatus.ACTIVE,
        isActive: offset !== childFolderNames.length - 1,
      });
    }
  }

  await createManyInBatches(childData, (batch) =>
    prisma.folder.createMany({ data: batch }),
  );

  return prisma.folder.findMany({
    where: {
      sessionCourseId: { in: sessionCourses.map(({ id }) => id) },
    },
    select: {
      id: true,
      sessionCourseId: true,
      parentFolderId: true,
      name: true,
    },
    orderBy: [{ sessionCourseId: 'asc' }, { id: 'asc' }],
  });
}

async function seedResources(folders: FolderRecord[]) {
  const total = folders.length * 20;
  const folderIndexById = new Map(
    folders.map((folder, index) => [folder.id, index]),
  );
  const lastResource = await prisma.resource.findFirst({
    where: {
      folder: {
        sessionCourse: {
          session: {
            organization: {
              code: { in: organizationCatalog.map(([, code]) => code) },
            },
          },
        },
      },
    },
    orderBy: { folderId: 'desc' },
    select: { folderId: true },
  });
  const lastFolderIndex = lastResource
    ? (folderIndexById.get(lastResource.folderId) ?? -1)
    : -1;
  const lastFolderCount = lastResource
    ? await prisma.resource.count({
        where: { folderId: lastResource.folderId },
      })
    : 0;
  let created = Math.max(0, lastFolderIndex) * 20 + lastFolderCount;
  let batch: Prisma.ResourceCreateManyInput[] = [];

  const flush = async () => {
    if (!batch.length) return;
    await prisma.resource.createMany({ data: batch });
    created += batch.length;
    if (created % 100_000 < batch.length || created === total) {
      console.log(`  resources: ${created}/${total}`);
    }
    batch = [];
  };

  for (const [folderIndex, folder] of folders.entries()) {
    if (folderIndex < lastFolderIndex) continue;
    const existingCount =
      folderIndex === lastFolderIndex ? Math.min(lastFolderCount, 20) : 0;
    for (
      let resourceIndex = existingCount;
      resourceIndex < 20;
      resourceIndex += 1
    ) {
      const type = resourceTypeForIndex(resourceIndex);
      const status = resourceStatusForIndex(resourceIndex);
      const baseTitle = `${folder.name} ${resourceLabel(type)} ${String(resourceIndex + 1).padStart(2, '0')}`;
      const resource: Prisma.ResourceCreateManyInput = {
        folderId: folder.id,
        title: baseTitle,
        description: `${resourceLabel(type)} for the ${folder.name} learning track.`,
        resourceTypeId: type,
        documentUrl:
          type === RESOURCE_TYPE_IDS.DOCUMENT
            ? `https://cdn.example.com/lms/documents/${folder.id}/${resourceIndex + 1}.pdf`
            : null,
        videoUrl:
          type === RESOURCE_TYPE_IDS.VIDEO
            ? `https://cdn.example.com/lms/videos/${folder.id}/${resourceIndex + 1}.mp4`
            : null,
        examId:
          type === RESOURCE_TYPE_IDS.EXAM
            ? 100_000 + folderIndex * 20 + resourceIndex
            : null,
        thumbnail: `https://images.example.com/resources/${resourceTypeCode(type).toLowerCase()}/${folder.id}-${resourceIndex + 1}.jpg`,
        mimeType:
          type === RESOURCE_TYPE_IDS.DOCUMENT
            ? 'application/pdf'
            : type === RESOURCE_TYPE_IDS.VIDEO
              ? 'video/mp4'
              : 'application/json',
        fileSize:
          type === RESOURCE_TYPE_IDS.DOCUMENT
            ? BigInt(250_000 + resourceIndex * 17_500)
            : type === RESOURCE_TYPE_IDS.VIDEO
              ? BigInt(12_000_000 + resourceIndex * 250_000)
              : null,
        durationInSeconds:
          type === RESOURCE_TYPE_IDS.VIDEO ? 1_800 + resourceIndex * 60 : null,
        sortOrder: resourceIndex,
        status,
        isPublished: status === ResourceStatus.PUBLISHED,
        isDownloadable:
          type !== RESOURCE_TYPE_IDS.VIDEO || resourceIndex % 2 === 0,
        isActive: status !== ResourceStatus.ARCHIVED,
      };

      batch.push(resource);
      if (batch.length >= BATCH_SIZE) await flush();
    }
  }

  await flush();
}

async function findSeedFolders() {
  return prisma.folder.findMany({
    where: {
      sessionCourse: {
        session: {
          organization: {
            code: { in: organizationCatalog.map(([, code]) => code) },
          },
        },
      },
    },
    select: {
      id: true,
      sessionCourseId: true,
      parentFolderId: true,
      name: true,
    },
    orderBy: [{ sessionCourseId: 'asc' }, { id: 'asc' }],
  });
}

async function seedDemoExamModule() {
  const questionTypeIds = {
    SINGLE_CHOICE: 1,
    NUMERIC: 2,
    ONE_WORD: 3,
  } as const;
  const questionTypeSeeds = [
    {
      id: questionTypeIds.SINGLE_CHOICE,
      code: 'SINGLE_CHOICE',
      name: 'Single Answer',
      description: 'Options are provided and exactly one option is correct.',
    },
    {
      id: questionTypeIds.NUMERIC,
      code: 'NUMERIC',
      name: 'Numeric Answer',
      description:
        'A numeric response is evaluated with an optional tolerance.',
    },
    {
      id: questionTypeIds.ONE_WORD,
      code: 'ONE_WORD',
      name: 'One Word Answer',
      description:
        'A text response is matched against one or more accepted answers.',
    },
  ] as const;
  for (const questionType of questionTypeSeeds) {
    await prisma.questionType.upsert({
      where: { id: questionType.id },
      update: {
        code: questionType.code,
        name: questionType.name,
        description: questionType.description,
        isActive: true,
      },
      create: questionType,
    });
  }

  const organization = await prisma.organization.findUnique({
    where: { code: 'LMS-DEMO' },
  });
  if (!organization) return;
  const session = await prisma.session.findFirst({
    where: { organizationId: organization.id, code: 'IPMAT-2027' },
  });
  if (!session) return;
  const sessionCourses = await prisma.sessionCourse.findMany({
    where: { sessionId: session.id, isActive: true },
    include: { course: true, folders: { where: { isActive: true }, take: 1 } },
    orderBy: { sortOrder: 'asc' },
  });
  if (!sessionCourses.length) return;

  const subjectSeeds = [
    ['ENGLISH', 'English Language'],
    ['MATHEMATICS', 'Quantitative Aptitude'],
    ['REASONING', 'Logical Reasoning'],
  ] as const;
  const subjects = new Map<string, { id: number }>();
  for (const [code, name] of subjectSeeds) {
    const subject = await prisma.subject.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { name, isActive: true },
      create: {
        organizationId: organization.id,
        code,
        name,
        description: `${name} questions for competitive entrance exams.`,
      },
      select: { id: true },
    });
    subjects.set(code, subject);
  }

  const questionSeeds: Array<{
    code: string;
    subject: string;
    type: keyof typeof questionTypeIds;
    content: string;
    answer: string;
    options?: Array<[string, string]>;
  }> = [
    {
      code: 'ENG-SC-001',
      subject: 'ENGLISH',
      type: 'SINGLE_CHOICE',
      content: 'Choose the word closest in meaning to “concise”.',
      answer: 'A',
      options: [
        ['A', 'Brief'],
        ['B', 'Lengthy'],
        ['C', 'Unclear'],
        ['D', 'Ancient'],
      ],
    },
    {
      code: 'ENG-OW-001',
      subject: 'ENGLISH',
      type: 'ONE_WORD',
      content: 'Write one word meaning “a person who loves books”.',
      answer: 'bibliophile',
    },
    {
      code: 'MAT-NUM-001',
      subject: 'MATHEMATICS',
      type: 'NUMERIC',
      content: 'What is 15% of 240?',
      answer: '36',
    },
    {
      code: 'MAT-SC-001',
      subject: 'MATHEMATICS',
      type: 'SINGLE_CHOICE',
      content: 'If 2x + 5 = 17, what is x?',
      answer: 'C',
      options: [
        ['A', '4'],
        ['B', '5'],
        ['C', '6'],
        ['D', '7'],
      ],
    },
    {
      code: 'REA-SC-001',
      subject: 'REASONING',
      type: 'SINGLE_CHOICE',
      content: 'Complete the series: 2, 6, 12, 20, __.',
      answer: 'D',
      options: [
        ['A', '24'],
        ['B', '26'],
        ['C', '28'],
        ['D', '30'],
      ],
    },
    {
      code: 'REA-OW-001',
      subject: 'REASONING',
      type: 'ONE_WORD',
      content:
        'If all pens are tools and some tools are blue, can we conclude all pens are blue? Answer yes or no.',
      answer: 'no',
    },
  ];
  const questionVersions = new Map<string, number>();
  for (const seed of questionSeeds) {
    let question = await prisma.question.findUnique({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: seed.code,
        },
      },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });
    if (!question) {
      question = await prisma.question.create({
        data: {
          organizationId: organization.id,
          subjectId: subjects.get(seed.subject)!.id,
          code: seed.code,
          status: QuestionStatus.PUBLISHED,
          versions: {
            create: {
              versionNumber: 1,
              questionTypeId: questionTypeIds[seed.type],
              content: seed.content,
              defaultMarks: 5,
              defaultNegativeMarks: seed.type === 'SINGLE_CHOICE' ? 1 : 0,
              isPublished: true,
              options: seed.options?.length
                ? {
                    create: seed.options.map(([code, content], sortOrder) => ({
                      code,
                      content,
                      isCorrect: code === seed.answer,
                      sortOrder,
                    })),
                  }
                : undefined,
              acceptedAnswers:
                seed.type !== 'SINGLE_CHOICE'
                  ? {
                      create: [
                        {
                          textValue:
                            seed.type === 'ONE_WORD' ? seed.answer : undefined,
                          normalizedText:
                            seed.type === 'ONE_WORD'
                              ? seed.answer.toLowerCase()
                              : undefined,
                          numericValue:
                            seed.type === 'NUMERIC' ? seed.answer : undefined,
                          numericTolerance:
                            seed.type === 'NUMERIC' ? 0 : undefined,
                          isPrimary: true,
                        },
                      ],
                    }
                  : undefined,
            },
          },
        },
        include: { versions: true },
      });
    }
    questionVersions.set(seed.code, question.versions[0].id);
  }

  const template = await prisma.examTemplate.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'CUET-DEMO',
      },
    },
    update: {
      name: 'CUET General Test Template',
      status: ExamTemplateStatus.PUBLISHED,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      code: 'CUET-DEMO',
      name: 'CUET General Test Template',
      description:
        'A timed CUET-style exam with language, quantitative aptitude, and reasoning sections.',
      status: ExamTemplateStatus.PUBLISHED,
    },
  });
  let version = await prisma.examTemplateVersion.findUnique({
    where: {
      examTemplateId_versionNumber: {
        examTemplateId: template.id,
        versionNumber: 1,
      },
    },
    include: { slots: true },
  });
  if (!version) {
    version = await prisma.examTemplateVersion.create({
      data: {
        examTemplateId: template.id,
        versionNumber: 1,
        defaultDurationMinutes: 90,
        status: ExamTemplateVersionStatus.PUBLISHED,
        publishedAt: new Date(),
        instructions: 'Complete each timed section before it closes.',
      },
      include: { slots: true },
    });
  }
  if (!version.slots.length) {
    await prisma.examTemplateSlot.create({
      data: {
        examTemplateVersionId: version.id,
        code: 'CUET_SLOT_1',
        name: 'CUET Slot 1',
        durationMinutes: 90,
        sections: {
          create: subjectSeeds.map(
            ([subjectCode, subjectName], sectionIndex) => ({
              code:
                subjectCode === 'ENGLISH'
                  ? 'LANGUAGE'
                  : subjectCode === 'MATHEMATICS'
                    ? 'QUANT'
                    : 'REASONING',
              name: subjectName,
              durationMinutes: 30,
              questionsToAttempt: 2,
              sortOrder: sectionIndex,
              subjects: {
                create: [
                  {
                    subjectId: subjects.get(subjectCode)!.id,
                    questions: {
                      create: questionSeeds
                        .filter((question) => question.subject === subjectCode)
                        .map((question, sortOrder) => ({
                          questionVersionId: questionVersions.get(
                            question.code,
                          )!,
                          marks: 5,
                          negativeMarks:
                            question.type === 'SINGLE_CHOICE' ? 1 : 0,
                          sortOrder,
                        })),
                    },
                  },
                ],
              },
            }),
          ),
        },
      },
    });
    version = await prisma.examTemplateVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: { slots: true },
    });
  }

  const selectedSlot = version.slots[0];
  const exam = await prisma.exam.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'CUET-MOCK-01',
      },
    },
    update: {
      title: 'CUET Full-Length Mock Test 01',
      attemptLimit: 2,
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      sessionId: session.id,
      examTemplateVersionId: version.id,
      code: 'CUET-MOCK-01',
      title: 'CUET Full-Length Mock Test 01',
      instructions:
        'One 90-minute slot with separately timed subject sections. Two attempts are allowed.',
      availableFrom: new Date('2026-08-20T00:00:00.000Z'),
      availableUntil: new Date('2027-03-31T23:59:59.000Z'),
      durationMinutes: 90,
      attemptLimit: 2,
      status: ExamStatus.SCHEDULED,
      selectedSlots: { create: [{ examTemplateSlotId: selectedSlot.id }] },
      courseAssignments: {
        create: sessionCourses
          .slice(0, 3)
          .map((course) => ({ sessionCourseId: course.id })),
      },
    },
  });
  const folder = sessionCourses.find((course) => course.folders.length)
    ?.folders[0];
  if (folder) {
    const existingResource = await prisma.resource.findFirst({
      where: { examId: exam.id },
    });
    const resourceData = {
      folderId: folder.id,
      resourceTypeId: RESOURCE_TYPE_IDS.EXAM,
      examId: exam.id,
      title: exam.title,
      description: exam.instructions,
      status: ResourceStatus.PUBLISHED,
      isPublished: true,
      isDownloadable: false,
      isActive: true,
    };
    if (existingResource)
      await prisma.resource.update({
        where: { id: existingResource.id },
        data: resourceData,
      });
    else await prisma.resource.create({ data: resourceData });
  }
  console.log(
    'Exam module seed completed: 3 subjects, 6 questions, 1 template, 1 slot, 3 sections, and 1 scheduled exam',
  );
}

function sessionStatusForIndex(index: number): SessionStatus {
  if (index < 2) return SessionStatus.COMPLETED;
  if (index === 2) return SessionStatus.ACTIVE;
  if (index === 19) return SessionStatus.ARCHIVED;
  return SessionStatus.UPCOMING;
}

function resourceTypeForIndex(index: number): ResourceTypeId {
  return index % 2 === 0 ? RESOURCE_TYPE_IDS.DOCUMENT : RESOURCE_TYPE_IDS.VIDEO;
}

function resourceStatusForIndex(index: number): ResourceStatus {
  if (index % 10 === 9) return ResourceStatus.ARCHIVED;
  if (index % 4 === 0) return ResourceStatus.DRAFT;
  return ResourceStatus.PUBLISHED;
}

function resourceLabel(type: ResourceTypeId) {
  if (type === RESOURCE_TYPE_IDS.DOCUMENT) return 'Study Notes';
  if (type === RESOURCE_TYPE_IDS.VIDEO) return 'Lecture';
  return 'Practice Test';
}

function resourceTypeCode(type: ResourceTypeId) {
  if (type === RESOURCE_TYPE_IDS.DOCUMENT) return 'DOCUMENT';
  if (type === RESOURCE_TYPE_IDS.VIDEO) return 'VIDEO';
  return 'EXAM';
}

function folderColor(index: number) {
  return ['#059669', '#2563EB', '#7C3AED', '#D97706', '#0F766E'][index % 5];
}

async function createManyInBatches<T>(
  rows: T[],
  createBatch: (batch: T[]) => Promise<unknown>,
) {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    await createBatch(rows.slice(offset, offset + BATCH_SIZE));
  }
}

async function seedRoles() {
  const rolesByCode = new Map<string, Id>();

  for (const role of defaultRoles) {
    const seededRole = await prisma.role.upsert({
      where: { scope_code: { scope: 'GLOBAL', code: role.code } },
      update: {
        name: role.name,
        description: role.description,
        scope: 'GLOBAL',
        isSystem: true,
        isActive: true,
      },
      create: { ...role, scope: 'GLOBAL', isSystem: true, isActive: true },
      select: { id: true, code: true },
    });
    rolesByCode.set(seededRole.code, seededRole);
  }

  return rolesByCode;
}

async function seedPermissions() {
  const permissionsByKey = new Map<string, Id>();

  for (const permission of defaultPermissions) {
    const seededPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
      select: { id: true, key: true },
    });
    permissionsByKey.set(seededPermission.key, seededPermission);
  }

  return permissionsByKey;
}

async function assignPermissionsToRole(
  roleId: number,
  permissionKeys: string[],
  permissionsByKey: Map<string, Id>,
) {
  await prisma.rolePermission.createMany({
    data: permissionKeys.map((permissionKey) => ({
      roleId,
      permissionId: permissionsByKey.get(permissionKey)!.id,
    })),
    skipDuplicates: true,
  });
}

async function seedSuperAdmin() {
  const password = await passwordService.hash('Admin@123');

  return prisma.user.upsert({
    where: { email: 'superadmin@lms.com' },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@lms.com',
      password,
      isActive: true,
      isVerified: true,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
}

async function assignRoleToUser(userId: number, roleId: number) {
  const existingAssignment = await prisma.userRole.findFirst({
    where: { userId, roleId, organizationId: null },
    select: { id: true },
  });

  if (existingAssignment) {
    await prisma.userRole.update({
      where: { id: existingAssignment.id },
      data: { isActive: true },
    });
    return;
  }

  await prisma.userRole.create({
    data: { userId, roleId, isActive: true },
  });
}

async function assignOrganizationRoleToUser(
  userId: number,
  roleId: number,
  organizationId: number,
) {
  const existingAssignment = await prisma.userRole.findFirst({
    where: { userId, roleId, organizationId },
    select: { id: true },
  });

  if (existingAssignment) {
    await prisma.userRole.update({
      where: { id: existingAssignment.id },
      data: { isActive: true },
    });
    return;
  }

  await prisma.userRole.create({
    data: { userId, roleId, organizationId, isActive: true },
  });
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
