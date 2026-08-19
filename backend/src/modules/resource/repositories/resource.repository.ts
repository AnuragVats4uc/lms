import { Injectable } from '@nestjs/common';
import { Prisma, ResourceStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { RESOURCE_TYPE_IDS } from '../constants/resource-type.constants';
import { ResourceQueryDto } from '../dto/resource-query.dto';

const resourceInclude = {
  resourceType: true,
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
  videoUrl?: string | null;
  examId?: number | null;
  thumbnail?: string | null;
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
  constructor(private readonly prisma: PrismaService) {}

  create(data: ResourceCreateData) {
    return this.prisma.resource.create({ data, include: resourceInclude });
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
    });
  }

  findById(folderId: number, id: number) {
    return this.prisma.resource.findFirst({
      where: { id, folderId },
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
    return this.prisma.resource.update({
      where: { id },
      data,
      include: resourceInclude,
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
}
