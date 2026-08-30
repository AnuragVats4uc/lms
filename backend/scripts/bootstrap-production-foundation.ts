import { readFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';

import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { seedResourceTypes } from '../prisma/seed/resource-types';

if (!process.env.DATABASE_URL) {
  loadEnvFile();
}

const prisma = new PrismaClient();

const GLOBAL_SCOPE = 'GLOBAL';
const SUPER_ADMIN_EMAIL = 'superadmin@lms.com';

const foundationRoles = [
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
    name: 'Teacher',
    code: 'TEACHER',
    description: 'Organization-scoped instructor access',
  },
  {
    name: 'Student',
    code: 'STUDENT',
    description: 'Organization-scoped learner access',
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

const permissionActions = ['create', 'read', 'update', 'delete'] as const;

const foundationPermissions = permissionModules.flatMap((module) =>
  permissionActions.map((action) => ({
    module,
    action,
    key: `${module}.${action}`,
    description: `Allows ${action} access for ${module}`,
  })),
);
async function readSuperAdminPassword() {
  const passwordFile = process.env.SUPER_ADMIN_PASSWORD_FILE;
  if (!passwordFile) {
    throw new Error('SUPER_ADMIN_PASSWORD_FILE is required');
  }

  const password = (await readFile(passwordFile, 'utf8')).trim();
  if (password.length < 12) {
    throw new Error(
      'The super-admin password must contain at least 12 characters',
    );
  }

  return password;
}

async function ensureFoundationRoles() {
  const rolesByCode = new Map<string, { id: number }>();

  for (const role of foundationRoles) {
    const conflictingRole = await prisma.role.findFirst({
      where: {
        scope: GLOBAL_SCOPE,
        OR: [{ name: role.name }, { code: role.code }],
        NOT: { name: role.name, code: role.code },
      },
      select: { name: true, code: true },
    });

    if (conflictingRole) {
      throw new Error(
        `Role mapping conflict for ${role.code}: found ${conflictingRole.name}/${conflictingRole.code}`,
      );
    }

    const savedRole = await prisma.role.upsert({
      where: {
        scope_code: {
          scope: GLOBAL_SCOPE,
          code: role.code,
        },
      },
      update: {
        organizationId: null,
        name: role.name,
        description: role.description,
        isSystem: true,
        isActive: true,
      },
      create: {
        organizationId: null,
        scope: GLOBAL_SCOPE,
        name: role.name,
        code: role.code,
        description: role.description,
        isSystem: true,
        isActive: true,
      },
      select: { id: true },
    });

    rolesByCode.set(role.code, savedRole);
  }

  return rolesByCode;
}

async function ensureFoundationPermissions() {
  const permissionsByKey = new Map<string, { id: number }>();

  for (const permission of foundationPermissions) {
    const conflictingPermission = await prisma.permission.findFirst({
      where: {
        OR: [
          { key: permission.key },
          { module: permission.module, action: permission.action },
        ],
        NOT: {
          key: permission.key,
          module: permission.module,
          action: permission.action,
        },
      },
      select: { module: true, action: true, key: true },
    });

    if (conflictingPermission) {
      throw new Error(
        `Permission mapping conflict for ${permission.key}: found ${conflictingPermission.key}`,
      );
    }

    const savedPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
      select: { id: true },
    });

    permissionsByKey.set(permission.key, savedPermission);
  }

  return permissionsByKey;
}

async function syncRolePermissions(roleId: number, permissionIds: number[]) {
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { notIn: permissionIds } },
    }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    }),
  ]);
}
async function ensureSuperAdmin(password: string, superAdminRoleId: number) {
  const existingUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true },
  });

  const passwordHash = existingUser
    ? undefined
    : await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12));

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          organizationId: null,
          firstName: 'Super',
          lastName: 'Admin',
          status: UserStatus.ACTIVE,
          isActive: true,
          isVerified: true,
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          organizationId: null,
          firstName: 'Super',
          lastName: 'Admin',
          email: SUPER_ADMIN_EMAIL,
          password: passwordHash!,
          status: UserStatus.ACTIVE,
          isActive: true,
          isVerified: true,
        },
        select: { id: true },
      });

  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: superAdminRoleId,
      organizationId: null,
    },
    select: { id: true },
  });

  if (existingAssignment) {
    await prisma.userRole.update({
      where: { id: existingAssignment.id },
      data: { isActive: true },
    });
  } else {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRoleId,
        organizationId: null,
        isActive: true,
      },
    });
  }

  return existingUser ? 'verified' : 'created';
}

async function main() {
  const password = await readSuperAdminPassword();

  await seedResourceTypes(prisma);
  const rolesByCode = await ensureFoundationRoles();
  const permissionsByKey = await ensureFoundationPermissions();
  const superAdminRole = rolesByCode.get('SUPER_ADMIN');
  const adminRole = rolesByCode.get('ADMIN');
  if (!superAdminRole || !adminRole) {
    throw new Error('SUPER_ADMIN and ADMIN roles must be initialized');
  }

  await syncRolePermissions(
    superAdminRole.id,
    [...permissionsByKey.values()].map(({ id }) => id),
  );
  await syncRolePermissions(
    adminRole.id,
    foundationPermissions
      .filter(({ module, action }) =>
        module === 'organizations'
          ? action === 'read' || action === 'update'
          : module === 'permissions'
            ? action === 'read'
            : true,
      )
      .map(({ key }) => permissionsByKey.get(key)!.id),
  );

  const accountResult = await ensureSuperAdmin(password, superAdminRole.id);

  console.log('Production foundation initialized successfully');
  console.log(`Roles: ${foundationRoles.map(({ code }) => code).join(', ')}`);
  console.log('Resource types: DOCUMENT, VIDEO, EXAM');
  console.log(`Permissions: ${foundationPermissions.length}`);
  console.log(`Super admin: ${SUPER_ADMIN_EMAIL} (${accountResult})`);
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : 'Production bootstrap failed',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
