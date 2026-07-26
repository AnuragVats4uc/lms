import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma';
import { PermissionQueryDto } from '../dto/permission-query.dto';

export interface PermissionCreateData {
  module: string;
  action: string;
  key: string;
  description?: string;
}

export interface NormalizedPermissionQuery
  extends Required<Omit<PermissionQueryDto, 'module'>> {
  module?: string;
}

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: PermissionCreateData) {
    return this.prisma.permission.create({
      data,
    });
  }

  findById(id: number) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  findByKey(key: string) {
    return this.prisma.permission.findUnique({
      where: { key },
    });
  }

  findByModuleAndAction(module: string, action: string) {
    return this.prisma.permission.findUnique({
      where: {
        module_action: {
          module,
          action,
        },
      },
    });
  }

  findByIds(ids: number[]) {
    return this.prisma.permission.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findMany(query: NormalizedPermissionQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.permission.count({ where }),
    ]);

    return { items, total };
  }

  private buildWhere(query: NormalizedPermissionQuery) {
    const where: {
      module?: string;
      OR?: Array<{
        module?: { contains: string };
        action?: { contains: string };
        key?: { contains: string };
      }>;
    } = {};

    if (query.module) {
      where.module = query.module.trim().toLowerCase();
    }

    const search = query.search.trim().toLowerCase();

    if (search) {
      where.OR = [
        { module: { contains: search } },
        { action: { contains: search } },
        { key: { contains: search } },
      ];
    }

    return where;
  }
}
