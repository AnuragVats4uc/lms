import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { PasswordService } from '../../src/modules/auth/services/password.service';

const prisma = new PrismaClient();

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
const passwordService = new PasswordService({
  get: (key: string) =>
    key === 'bcrypt.saltRounds' ? saltRounds : undefined,
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
] as const;

const crudActions = [
  'create',
  'read',
  'update',
  'delete',
] as const;

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

  await assignRoleToUser(
    superAdmin.id,
    rolesByCode.get('SUPER_ADMIN')!.id,
  );

  await seedDemoStudent(rolesByCode.get('STUDENT')!.id);

  console.log('Seed completed successfully');
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

    permissionsByKey.set(
      seededPermission.key,
      seededPermission,
    );
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
    const existingOrganization =
      await tx.organization.findUnique({
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

    if (
      existingStudent &&
      existingStudent.organizationId !== organization.id
    ) {
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

  logDemoSeedResult(
    'Demo Organization',
    'created',
    result.organizationCreated,
  );
  logDemoSeedResult(
    'Demo Student',
    'created',
    result.studentCreated,
  );
  logDemoSeedResult(
    'STUDENT role',
    'assigned',
    result.roleAssigned,
  );
}

function logDemoSeedResult(
  label: string,
  action: string,
  created: boolean,
) {
  console.log(
    created ? `✓ ${label} ${action}` : `✓ ${label} already exists`,
  );
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
