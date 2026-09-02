import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const permission = {
  module: 'exam-answer',
  action: 'read',
  key: 'exam-answer.read',
  description: 'Allows staff to review correct exam answers and explanations',
};

async function main() {
  const conflict = await prisma.permission.findFirst({
    where: {
      module: permission.module,
      action: permission.action,
      key: { not: permission.key },
    },
    select: { key: true },
  });
  if (conflict) {
    throw new Error(
      `Cannot create ${permission.key}; ${conflict.key} already uses the same module/action pair.`,
    );
  }

  const roles = await prisma.role.findMany({
    where: {
      scope: 'GLOBAL',
      code: { in: ['SUPER_ADMIN', 'ADMIN'] },
      isActive: true,
    },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  });
  console.log(
    `Permission audit: ${permission.key} will be assigned to ${roles.map((role) => role.code).join(', ') || 'no roles'}.`,
  );
  if (!apply) {
    console.log(
      'Dry run only. Re-run with --apply after reviewing the target roles and database backup.',
    );
    return;
  }

  const saved = await prisma.permission.upsert({
    where: { key: permission.key },
    update: permission,
    create: permission,
    select: { id: true },
  });
  await prisma.rolePermission.createMany({
    data: roles.map((role) => ({
      roleId: role.id,
      permissionId: saved.id,
    })),
    skipDuplicates: true,
  });
  console.log(
    `Permission sync complete: ${permission.key} is available to ${roles.length} role(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
