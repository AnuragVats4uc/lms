import { Injectable } from '@nestjs/common';
import { FolderStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { FolderQueryDto } from '../dto/folder-query.dto';

export interface FolderCreateData {
  sessionCourseId: number;
  parentFolderId?: number | null;
  name: string;
  description?: string;
  sortOrder?: number;
  icon?: string;
  color?: string;
  status: FolderStatus;
  isActive?: boolean;
}

export type FolderUpdateData = Partial<
  Omit<FolderCreateData, 'sessionCourseId'>
>;

export interface NormalizedFolderQuery extends Required<
  Omit<FolderQueryDto, 'parentFolderId' | 'status'>
> {
  parentFolderId?: FolderQueryDto['parentFolderId'];
  status?: FolderQueryDto['status'];
}

@Injectable()
export class FolderRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: FolderCreateData) {
    return this.prisma.folder.create({ data });
  }

  findSessionCourseById(sessionCourseId: number) {
    return this.prisma.sessionCourse.findUnique({
      where: { id: sessionCourseId },
    });
  }

  findById(sessionCourseId: number, id: number) {
    return this.prisma.folder.findFirst({
      where: { id, sessionCourseId },
    });
  }

  findByName(
    sessionCourseId: number,
    parentFolderId: number | null,
    name: string,
  ) {
    return this.prisma.folder.findFirst({
      where: { sessionCourseId, parentFolderId, name },
    });
  }

  findByNameExcludingId(
    sessionCourseId: number,
    parentFolderId: number | null,
    name: string,
    id: number,
  ) {
    return this.prisma.folder.findFirst({
      where: {
        sessionCourseId,
        parentFolderId,
        name,
        id: { not: id },
      },
    });
  }

  findParentById(sessionCourseId: number, parentFolderId: number) {
    return this.prisma.folder.findFirst({
      where: { id: parentFolderId, sessionCourseId },
    });
  }

  async findMany(sessionCourseId: number, query: NormalizedFolderQuery) {
    const where = this.buildWhere(sessionCourseId, query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.folder.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.folder.count({ where }),
    ]);

    return { items, total };
  }

  findTree(sessionCourseId: number) {
    return this.prisma.folder.findMany({
      where: { sessionCourseId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findAllRelations(sessionCourseId: number) {
    return this.prisma.folder.findMany({
      where: { sessionCourseId },
      select: { id: true, parentFolderId: true },
    });
  }

  update(id: number, data: FolderUpdateData) {
    return this.prisma.folder.update({ where: { id }, data });
  }

  softDelete(id: number) {
    return this.prisma.folder.update({
      where: { id },
      data: { isActive: false, status: FolderStatus.ARCHIVED },
    });
  }

  private buildWhere(
    sessionCourseId: number,
    query: NormalizedFolderQuery,
  ): Prisma.FolderWhereInput {
    const where: Prisma.FolderWhereInput = { sessionCourseId };

    if (query.parentFolderId !== undefined) {
      where.parentFolderId = query.parentFolderId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search.trim();

    if (search) {
      where.name = { contains: search };
    }

    return where;
  }
}
