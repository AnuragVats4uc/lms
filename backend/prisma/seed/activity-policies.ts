import { PrismaClient } from '@prisma/client';

export async function ensureOrganizationActivityPolicies(
  prisma: PrismaClient,
) {
  const organizations = await prisma.organization.findMany({
    select: { id: true },
  });

  if (!organizations.length) return;

  await prisma.organizationActivityPolicy.createMany({
    data: organizations.map(({ id }) => ({ organizationId: id })),
    skipDuplicates: true,
  });
}
