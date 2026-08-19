import { PrismaClient } from '@prisma/client';

import { RESOURCE_TYPE_IDS } from '../../src/modules/resource/constants/resource-type.constants';

const resourceTypes = [
  {
    id: RESOURCE_TYPE_IDS.DOCUMENT,
    code: 'DOCUMENT',
    name: 'Document',
    description: 'Downloadable or viewable document learning material.',
  },
  {
    id: RESOURCE_TYPE_IDS.VIDEO,
    code: 'VIDEO',
    name: 'Video',
    description: 'Streamed or externally hosted video lesson.',
  },
  {
    id: RESOURCE_TYPE_IDS.EXAM,
    code: 'EXAM',
    name: 'Exam',
    description: 'Assessment or examination resource.',
  },
] as const;

export async function seedResourceTypes(prisma: PrismaClient) {
  const existing = await prisma.resourceType.findMany({
    where: {
      OR: [
        { id: { in: resourceTypes.map(({ id }) => id) } },
        { code: { in: resourceTypes.map(({ code }) => code) } },
      ],
    },
    select: { id: true, code: true },
  });

  for (const resourceType of resourceTypes) {
    const conflicting = existing.find(
      (item) =>
        (item.id === resourceType.id || item.code === resourceType.code) &&
        (item.id !== resourceType.id || item.code !== resourceType.code),
    );
    if (conflicting) {
      throw new Error(
        `Resource type mapping conflict: expected ${resourceType.id}=${resourceType.code}, found ${conflicting.id}=${conflicting.code}`,
      );
    }
  }

  await prisma.$transaction(
    resourceTypes.map((resourceType) =>
      prisma.resourceType.upsert({
        where: { id: resourceType.id },
        update: {
          code: resourceType.code,
          name: resourceType.name,
          description: resourceType.description,
          isActive: true,
        },
        create: { ...resourceType, isActive: true },
      }),
    ),
  );

  return resourceTypes;
}
