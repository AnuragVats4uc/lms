import { ConfigService } from '@nestjs/config';
import { PrismaClient, ResourceType } from '@prisma/client';

import { PasswordService } from '../../src/modules/auth/services/password.service';

const prisma = new PrismaClient();

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

async function main() {
  const rolesByCode = await seedRoles();
  const permissionsByKey = await seedPermissions();

  await assignPermissionsToRole(
    rolesByCode.get('SUPER_ADMIN')!.id,
    defaultPermissions.map((permission) => permission.key),
    permissionsByKey,
  );

  const superAdmin = await seedSuperAdmin();

  await assignRoleToUser(superAdmin.id, rolesByCode.get('SUPER_ADMIN')!.id);

  await seedDemoStudent(rolesByCode.get('STUDENT')!.id);
  await seedDemoFolderHierarchy();

  console.log('Seed completed successfully');
}

async function seedDemoFolderHierarchy() {
  const organization = await prisma.organization.upsert({
    where: { code: 'ABC' },
    update: {
      name: 'ABC Institute',
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      name: 'ABC Institute',
      code: 'ABC',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const session = await prisma.session.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: '2025-2026',
      },
    },
    update: {
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      organizationId: organization.id,
      name: '2025-2026',
      status: 'ACTIVE',
      startDate: new Date('2025-04-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.999Z'),
      isActive: true,
    },
  });

  const course = await prisma.course.upsert({
    where: { code: 'JEE-FDN' },
    update: {
      name: 'JEE Foundation',
      status: 'ACTIVE',
      isActive: true,
    },
    create: {
      name: 'JEE Foundation',
      code: 'JEE-FDN',
      description: 'Foundation course for JEE aspirants.',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const sessionCourse = await prisma.sessionCourse.upsert({
    where: {
      sessionId_courseId: {
        sessionId: session.id,
        courseId: course.id,
      },
    },
    update: {
      displayName: 'JEE Foundation',
      status: 'ACTIVE',
      isPublished: true,
      isActive: true,
    },
    create: {
      sessionId: session.id,
      courseId: course.id,
      displayName: 'JEE Foundation',
      status: 'ACTIVE',
      isPublished: true,
      isActive: true,
    },
  });

  const roots = new Map<string, { id: number }>();
  for (const name of ['Physics', 'Chemistry', 'Mathematics']) {
    const root = await upsertSeedFolder(sessionCourse.id, name, null);
    roots.set(name, root);
  }

  const children: Record<string, string[]> = {
    Physics: ['Motion', 'Gravitation', 'Laws of Motion'],
    Chemistry: ['Organic', 'Inorganic'],
    Mathematics: ['Algebra', 'Calculus'],
  };

  for (const [parentName, childNames] of Object.entries(children)) {
    const parent = roots.get(parentName)!;
    for (const name of childNames) {
      await upsertSeedFolder(sessionCourse.id, name, parent.id);
    }
  }

  await seedDemoResources(sessionCourse.id);

  console.log('✓ ABC Institute folder hierarchy seeded');
}

async function seedDemoResources(sessionCourseId: number) {
  const resourcesByFolder: Record<
    string,
    Array<{
      title: string;
      type: ResourceType;
      documentUrl?: string;
      videoUrl?: string;
      mimeType?: string;
      durationInSeconds?: number;
    }>
  > = {
    Motion: [
      {
        title: 'Motion Notes',
        type: ResourceType.DOCUMENT,
        documentUrl: 'https://cdn.example.com/lms/motion-notes.pdf',
        mimeType: 'application/pdf',
      },
      {
        title: 'Motion Lecture',
        type: ResourceType.VIDEO,
        videoUrl: 'https://cdn.example.com/lms/motion-lecture.mp4',
        durationInSeconds: 3600,
      },
    ],
    Organic: [
      {
        title: 'Organic Notes',
        type: ResourceType.DOCUMENT,
        documentUrl: 'https://cdn.example.com/lms/organic-notes.pdf',
        mimeType: 'application/pdf',
      },
      {
        title: 'Organic Lecture',
        type: ResourceType.VIDEO,
        videoUrl: 'https://cdn.example.com/lms/organic-lecture.mp4',
        durationInSeconds: 3600,
      },
    ],
    Algebra: [
      {
        title: 'Algebra Notes',
        type: ResourceType.DOCUMENT,
        documentUrl: 'https://cdn.example.com/lms/algebra-notes.pdf',
        mimeType: 'application/pdf',
      },
      {
        title: 'Algebra Lecture',
        type: ResourceType.VIDEO,
        videoUrl: 'https://cdn.example.com/lms/algebra-lecture.mp4',
        durationInSeconds: 3600,
      },
    ],
  };

  for (const [folderName, resources] of Object.entries(resourcesByFolder)) {
    const folder = await prisma.folder.findFirst({
      where: { sessionCourseId, name: folderName },
    });

    if (!folder) continue;

    for (const resource of resources) {
      await upsertSeedResource(folder.id, resource);
    }
  }

  console.log(
    'âœ“ Document and video resources seeded; exam resources skipped because no Exam module exists',
  );
}

async function upsertSeedResource(
  folderId: number,
  resource: {
    title: string;
    type: ResourceType;
    documentUrl?: string;
    videoUrl?: string;
    mimeType?: string;
    durationInSeconds?: number;
  },
) {
  const existing = await prisma.resource.findFirst({
    where: {
      folderId,
      title: resource.title,
      type: resource.type,
    },
  });

  const data = {
    ...resource,
    status: 'PUBLISHED' as const,
    isPublished: true,
    isActive: true,
  };

  if (existing) {
    return prisma.resource.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.resource.create({
    data: {
      folderId,
      ...data,
    },
  });
}

async function upsertSeedFolder(
  sessionCourseId: number,
  name: string,
  parentFolderId: number | null,
) {
  const existing = await prisma.folder.findFirst({
    where: { sessionCourseId, parentFolderId, name },
  });

  if (existing) {
    return prisma.folder.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', isActive: true },
      select: { id: true },
    });
  }

  return prisma.folder.create({
    data: {
      sessionCourseId,
      parentFolderId,
      name,
      status: 'ACTIVE',
      isActive: true,
    },
    select: { id: true },
  });
}

async function seedRoles() {
  const rolesByCode = new Map<string, { id: number }>();

  for (const role of defaultRoles) {
    const seededRole = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isActive: true,
      },
      create: {
        ...role,
        isActive: true,
      },
    });

    rolesByCode.set(seededRole.code, seededRole);
  }

  return rolesByCode;
}

async function seedPermissions() {
  const permissionsByKey = new Map<string, { id: number }>();

  for (const permission of defaultPermissions) {
    const seededPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });

    permissionsByKey.set(seededPermission.key, seededPermission);
  }

  return permissionsByKey;
}

async function assignPermissionsToRole(
  roleId: number,
  permissionKeys: string[],
  permissionsByKey: Map<string, { id: number }>,
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
      password,
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
  });
}

async function seedDemoStudent(studentRoleId: number) {
  const password = await passwordService.hash('Student@123');

  const result = await prisma.$transaction(async (tx) => {
    const existingOrganization = await tx.organization.findUnique({
      where: { code: 'DEMO' },
    });

    const organization =
      existingOrganization ??
      (await tx.organization.create({
        data: {
          name: 'Demo Organization',
          code: 'DEMO',
          status: 'ACTIVE',
          isActive: true,
        },
      }));

    const existingStudent = await tx.user.findUnique({
      where: { email: 'student@demo.com' },
    });

    const student =
      existingStudent ??
      (await tx.user.create({
        data: {
          organizationId: organization.id,
          firstName: 'Demo',
          lastName: 'Student',
          email: 'student@demo.com',
          password,
          isActive: true,
          isVerified: true,
          status: 'ACTIVE',
        },
      }));

    if (existingStudent && existingStudent.organizationId !== organization.id) {
      await tx.user.update({
        where: { id: existingStudent.id },
        data: { organizationId: organization.id },
      });
    }

    const existingUserRole = await tx.userRole.findFirst({
      where: {
        userId: student.id,
        roleId: studentRoleId,
        organizationId: organization.id,
      },
    });

    if (existingUserRole) {
      await tx.userRole.update({
        where: { id: existingUserRole.id },
        data: { isActive: true },
      });
    } else {
      await tx.userRole.create({
        data: {
          userId: student.id,
          roleId: studentRoleId,
          organizationId: organization.id,
          isActive: true,
        },
      });
    }

    return {
      organizationCreated: !existingOrganization,
      studentCreated: !existingStudent,
      roleAssigned: !existingUserRole,
    };
  });

  logDemoSeedResult('Demo Organization', 'created', result.organizationCreated);
  logDemoSeedResult('Demo Student', 'created', result.studentCreated);
  logDemoSeedResult('STUDENT role', 'assigned', result.roleAssigned);
}

function logDemoSeedResult(label: string, action: string, created: boolean) {
  console.log(created ? `✓ ${label} ${action}` : `✓ ${label} already exists`);
}

async function assignRoleToUser(userId: number, roleId: number) {
  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId,
      organizationId: null,
    },
  });

  if (existingAssignment) {
    await prisma.userRole.update({
      where: { id: existingAssignment.id },
      data: { isActive: true },
    });
    return;
  }

  await prisma.userRole.create({
    data: {
      userId,
      roleId,
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
