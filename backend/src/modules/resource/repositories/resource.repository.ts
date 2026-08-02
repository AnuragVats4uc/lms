import { Injectable } from '@nestjs/common';
import { Prisma, ResourceStatus, ResourceType } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { ResourceQueryDto } from '../dto/resource-query.dto';

export interface ResourceCreateData {
  folderId: number;
  title: string;
  description?: string;
  type: ResourceType;
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
  Omit<ResourceQueryDto, 'type' | 'status' | 'published'>
> {
  type?: ResourceQueryDto['type'];
  status?: ResourceQueryDto['status'];
  published?: ResourceQueryDto['published'];
}

@Injectable()
export class ResourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: ResourceCreateData) {
    return this.prisma.resource.create({ data });
  }

  findFolderById(folderId: number) {
    return this.prisma.folder.findUnique({
      where: { id: folderId },
    });
  }

  findById(folderId: number, id: number) {
    return this.prisma.resource.findFirst({
      where: { id, folderId },
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
      }),
      this.prisma.resource.count({ where }),
    ]);

    return { items, total };
  }

  update(id: number, data: ResourceUpdateData) {
    return this.prisma.resource.update({
      where: { id },
      data,
    });
  }

  softDelete(id: number) {
    return this.prisma.resource.update({
      where: { id },
      data: {
        isActive: false,
        status: ResourceStatus.ARCHIVED,
      },
    });
  }

  private buildWhere(
    folderId: number,
    query: NormalizedResourceQuery,
  ): Prisma.ResourceWhereInput {
    const where: Prisma.ResourceWhereInput = { folderId };

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.published !== undefined) where.isPublished = query.published;

    const search = query.search.trim();
    if (search) where.title = { contains: search };

    return where;
  }
}
