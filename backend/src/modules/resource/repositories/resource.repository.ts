import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ResourceStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { RESOURCE_TYPE_IDS } from '../constants/resource-type.constants';
import { ResourceQueryDto } from '../dto/resource-query.dto';

const resourceInclude = {
  resourceType: true,
  documentObject: {
    select: {
      id: true,
      uuid: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
    },
  },
  thumbnailObject: {
    select: {
      id: true,
      uuid: true,
      originalFileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
    },
  },
} satisfies Prisma.ResourceInclude;

export type ResourceWithType = Prisma.ResourceGetPayload<{
  include: typeof resourceInclude;
}>;

export interface ResourceCreateData {
  folderId: number;
  title: string;
  description?: string;
  resourceTypeId: number;
  documentUrl?: string | null;
  documentObjectId?: number | null;
  videoUrl?: string | null;
  examId?: number | null;
  thumbnail?: string | null;
  thumbnailObjectId?: number | null;
  mimeType?: string | null;
  fileSize?: bigint | null;
  durationInSeconds?: number | null;
  sortOrder?: number;
  status: ResourceStatus;
  isPublished?: boolean;
  isDownloadable?: boolean;
  isActive?: boolean;
}

export type ResourceUpdateData = Partial<Omit<ResourceCreateData, 'folderId'>>;

export interface NormalizedResourceQuery extends Required<
  Omit<ResourceQueryDto, 'resourceTypeId' | 'status' | 'published'>
> {
  resourceTypeId?: ResourceQueryDto['resourceTypeId'];
  status?: ResourceQueryDto['status'];
  published?: ResourceQueryDto['published'];
}

@Injectable()
export class ResourceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  create(data: ResourceCreateData) {
    return this.prisma.$transaction(async (tx) => {
      const resource = await tx.resource.create({
        data,
        include: resourceInclude,
      });
      await this.createPublishedResourceNotifications(tx, resource);
      return resource;
    });
  }

  findActiveResourceTypes() {
    return this.prisma.resourceType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  findResourceTypeById(id: number) {
    return this.prisma.resourceType.findFirst({
      where: { id, isActive: true },
    });
  }

  findFolderById(folderId: number) {
    return this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        sessionCourse: {
          select: {
            id: true,
            session: {
              select: {
                organizationId: true,
                organization: { select: { id: true, uuid: true } },
              },
            },
          },
        },
      },
    });
  }

  findExamForFolder(
    examId: number,
    organizationId: number,
    sessionCourseId: number,
  ) {
    return this.prisma.exam.findFirst({
      where: {
        id: examId,
        organizationId,
        isActive: true,
        courseAssignments: { some: { sessionCourseId } },
      },
      select: { id: true },
    });
  }

  findById(folderId: number, id: number) {
    return this.prisma.resource.findFirst({
      where: { id, folderId },
      include: resourceInclude,
    });
  }

  findByIdAndUuid(folderId: number, id: number, uuid: string) {
    return this.prisma.resource.findFirst({
      where: { id, uuid, folderId },
      include: resourceInclude,
    });
  }

  findByDocumentFilename(folderId: number, filename: string) {
    return this.prisma.resource.findFirst({
      where: {
        folderId,
        resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT,
        isActive: true,
        documentUrl: { endsWith: filename },
      },
    });
  }

  async findMany(folderId: number, query: NormalizedResourceQuery) {
    const where = this.buildWhere(folderId, query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.resource.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
        include: resourceInclude,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return { items, total };
  }

  update(id: number, data: ResourceUpdateData) {
    return this.prisma.$transaction(async (tx) => {
      const resource = await tx.resource.update({
        where: { id },
        data,
        include: resourceInclude,
      });
      await this.createPublishedResourceNotifications(tx, resource);
      return resource;
    });
  }

  softDelete(id: number) {
    return this.prisma.resource.update({
      where: { id },
      data: {
        isActive: false,
        status: ResourceStatus.ARCHIVED,
      },
      include: resourceInclude,
    });
  }

  hardDelete(id: number) {
    return this.prisma.resource.delete({ where: { id } });
  }

  private buildWhere(
    folderId: number,
    query: NormalizedResourceQuery,
  ): Prisma.ResourceWhereInput {
    const where: Prisma.ResourceWhereInput = {
      folderId,
      ...(query.status === ResourceStatus.ARCHIVED
        ? { status: ResourceStatus.ARCHIVED }
        : { isActive: true }),
    };

    if (query.resourceTypeId) {
      where.resourceTypeId = query.resourceTypeId;
    }
    if (query.status && query.status !== ResourceStatus.ARCHIVED) {
      where.status = query.status;
    }
    if (query.published !== undefined) where.isPublished = query.published;

    const search = query.search.trim();
    if (search) where.title = { contains: search };

    return where;
  }

  private async createPublishedResourceNotifications(
    tx: Prisma.TransactionClient,
    resource: ResourceWithType,
  ) {
    if (
      resource.resourceTypeId === RESOURCE_TYPE_IDS.EXAM ||
      !resource.isActive ||
      !resource.isPublished ||
      resource.status !== ResourceStatus.PUBLISHED
    ) {
      return;
    }

    const folder = await tx.folder.findFirst({
      where: { id: resource.folderId, isActive: true },
      select: {
        sessionCourse: {
          select: {
            id: true,
            session: { select: { organizationId: true } },
            studentCourseEnrollments: {
              where: {
                isActive: true,
                status: { in: ['ACTIVE', 'COMPLETED'] },
                enrollment: {
                  isActive: true,
                  status: { in: ['ACTIVE', 'COMPLETED'] },
                  student: { isActive: true, user: { isActive: true } },
                },
              },
              select: {
                enrollment: {
                  select: {
                    organizationId: true,
                    student: {
                      select: {
                        id: true,
                        preferences: {
                          select: {
                            inAppNotifications: true,
                            resourceUpdates: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!folder) return;

    const organizationId = folder.sessionCourse.session.organizationId;
    const studentIds = [
      ...new Set(
        folder.sessionCourse.studentCourseEnrollments
          .filter(
            ({ enrollment }) =>
              enrollment.organizationId === organizationId &&
              (enrollment.student.preferences?.inAppNotifications ?? true) &&
              (enrollment.student.preferences?.resourceUpdates ?? true),
          )
          .map(({ enrollment }) => enrollment.student.id),
      ),
    ];
    if (!studentIds.length) return;

    await tx.studentNotification.createMany({
      data: studentIds.map((studentId) => ({
        studentId,
        organizationId,
        type: 'RESOURCE',
        title: `New resource: ${resource.title}`,
        description:
          'A new learning resource is available in one of your assigned courses.',
        relatedEntity: 'RESOURCE',
        relatedEntityId: resource.id,
      })),
      skipDuplicates: true,
    });
  }
}
