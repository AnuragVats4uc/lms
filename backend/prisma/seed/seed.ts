import { ConfigService } from '@nestjs/config';
import {
  FolderStatus,
  OrganizationStatus,
  Prisma,
  PrismaClient,
  ResourceStatus,
  ResourceType,
  SessionCourseStatus,
  SessionStatus,
  CourseStatus,
} from '@prisma/client';

import { PasswordService } from '../../src/modules/auth/services/password.service';

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
  'students',
  'roles',
  'permissions',
  'session',
  'course',
  'session-course',
  'folder',
  'resource',
  'dashboard',
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

const rootFolderNames = ['Physics', 'Chemistry', 'Mathematics', 'English'] as const;
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

  if (process.env.SEED_RESUME === 'true') {
    console.log('Resume mode enabled: preserving existing generated hierarchy');
    const folders = await findSeedFolders();
    await seedResources(folders);
    console.log('Resource resume completed successfully');
    return;
  }

  console.log('Stage 1/7: preserving system reference data and cleaning sample data');
  await cleanOrganizationData();

  console.log('Stage 2/7: seeding roles and permissions');
  const rolesByCode = await seedRoles();
  const permissionsByKey = await seedPermissions();
  await assignPermissionsToRole(
    rolesByCode.get('SUPER_ADMIN')!.id,
    defaultPermissions.map((permission) => permission.key),
    permissionsByKey,
  );
  const superAdmin = await seedSuperAdmin();
  await assignRoleToUser(superAdmin.id, rolesByCode.get('SUPER_ADMIN')!.id);

  console.log('Stage 3/7: creating 20 organizations');
  const organizations = await seedOrganizations();

  console.log('Stage 4/7: creating 20 courses and 20 sessions per organization');
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

  await prisma.$transaction(async (tx) => {
    if (userIds.length) {
      await tx.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
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

    await tx.organization.deleteMany({ where: { id: { in: organizationIds } } });
  }, {
    maxWait: 60_000,
    timeout: 600_000,
  });

  console.log(
    `Removed ${organizationIds.length} organizations and their dependent sample data; preserved roles, permissions, and unscoped system users`,
  );
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

  await createManyInBatches(
    data,
    (batch) => prisma.session.createMany({ data: batch }),
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
      const status = courseIndex % 10 === 0
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

  await createManyInBatches(
    data,
    (batch) => prisma.sessionCourse.createMany({ data: batch }),
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

  await createManyInBatches(
    rootData,
    (batch) => prisma.folder.createMany({ data: batch }),
  );

  const roots = await prisma.folder.findMany({
    where: {
      sessionCourseId: { in: sessionCourses.map(({ id }) => id) },
      parentFolderId: null,
    },
    select: { id: true, sessionCourseId: true, parentFolderId: true, name: true },
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
        status: offset === childFolderNames.length - 1
          ? FolderStatus.ARCHIVED
          : FolderStatus.ACTIVE,
        isActive: offset !== childFolderNames.length - 1,
      });
    }
  }

  await createManyInBatches(
    childData,
    (batch) => prisma.folder.createMany({ data: batch }),
  );

  return prisma.folder.findMany({
    where: {
      sessionCourseId: { in: sessionCourses.map(({ id }) => id) },
    },
    select: { id: true, sessionCourseId: true, parentFolderId: true, name: true },
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
    ? folderIndexById.get(lastResource.folderId) ?? -1
    : -1;
  const lastFolderCount = lastResource
    ? await prisma.resource.count({ where: { folderId: lastResource.folderId } })
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
    const existingCount = folderIndex === lastFolderIndex
      ? Math.min(lastFolderCount, 20)
      : 0;
    for (let resourceIndex = existingCount; resourceIndex < 20; resourceIndex += 1) {
      const type = resourceTypeForIndex(resourceIndex);
      const status = resourceStatusForIndex(resourceIndex);
      const baseTitle = `${folder.name} ${resourceLabel(type)} ${String(resourceIndex + 1).padStart(2, '0')}`;
      const resource: Prisma.ResourceCreateManyInput = {
        folderId: folder.id,
        title: baseTitle,
        description: `${resourceLabel(type)} for the ${folder.name} learning track.`,
        type,
        documentUrl: type === ResourceType.DOCUMENT
          ? `https://cdn.example.com/lms/documents/${folder.id}/${resourceIndex + 1}.pdf`
          : null,
        videoUrl: type === ResourceType.VIDEO
          ? `https://cdn.example.com/lms/videos/${folder.id}/${resourceIndex + 1}.mp4`
          : null,
        examId: type === ResourceType.EXAM
          ? 100_000 + folderIndex * 20 + resourceIndex
          : null,
        thumbnail: `https://images.example.com/resources/${type.toLowerCase()}/${folder.id}-${resourceIndex + 1}.jpg`,
        mimeType: type === ResourceType.DOCUMENT
          ? 'application/pdf'
          : type === ResourceType.VIDEO
            ? 'video/mp4'
            : 'application/json',
        fileSize: type === ResourceType.DOCUMENT
          ? BigInt(250_000 + resourceIndex * 17_500)
          : type === ResourceType.VIDEO
            ? BigInt(12_000_000 + resourceIndex * 250_000)
            : null,
        durationInSeconds: type === ResourceType.VIDEO
          ? 1_800 + resourceIndex * 60
          : null,
        sortOrder: resourceIndex,
        status,
        isPublished: status === ResourceStatus.PUBLISHED,
        isDownloadable: type !== ResourceType.VIDEO || resourceIndex % 2 === 0,
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
    select: { id: true, sessionCourseId: true, parentFolderId: true, name: true },
    orderBy: [{ sessionCourseId: 'asc' }, { id: 'asc' }],
  });
}

function sessionStatusForIndex(index: number): SessionStatus {
  if (index < 2) return SessionStatus.COMPLETED;
  if (index === 2) return SessionStatus.ACTIVE;
  if (index === 19) return SessionStatus.ARCHIVED;
  return SessionStatus.UPCOMING;
}

function resourceTypeForIndex(index: number): ResourceType {
  if (index % 3 === 0) return ResourceType.DOCUMENT;
  if (index % 3 === 1) return ResourceType.VIDEO;
  return ResourceType.EXAM;
}

function resourceStatusForIndex(index: number): ResourceStatus {
  if (index % 10 === 9) return ResourceStatus.ARCHIVED;
  if (index % 4 === 0) return ResourceStatus.DRAFT;
  return ResourceStatus.PUBLISHED;
}

function resourceLabel(type: ResourceType) {
  if (type === ResourceType.DOCUMENT) return 'Study Notes';
  if (type === ResourceType.VIDEO) return 'Lecture';
  return 'Practice Test';
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
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isActive: true,
      },
      create: { ...role, isActive: true },
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

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
