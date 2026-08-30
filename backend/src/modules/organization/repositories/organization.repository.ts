import { Injectable } from '@nestjs/common';
import { OrganizationStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { OrganizationQueryDto } from '../dto/organization-query.dto';

export interface OrganizationCreateData {
  name: string;
  code: string;
  status: OrganizationStatus;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export type OrganizationUpdateData = Partial<OrganizationCreateData>;

export interface NormalizedOrganizationQuery extends Required<
  Omit<OrganizationQueryDto, 'status'>
> {
  organizationId?: number;
  status?: OrganizationQueryDto['status'];
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: OrganizationCreateData) {
    return this.prisma.organization.create({
      data: {
        ...data,
        activityPolicy: {
          create: {},
        },
      },
    });
  }

  findById(id: number) {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  findByName(name: string) {
    return this.prisma.organization.findUnique({
      where: { name },
    });
  }

  findByCode(code: string) {
    return this.prisma.organization.findUnique({
      where: { code },
    });
  }

  findByNameExcludingId(name: string, id: number) {
    return this.prisma.organization.findFirst({
      where: {
        name,
        id: {
          not: id,
        },
      },
    });
  }

  findByCodeExcludingId(code: string, id: number) {
    return this.prisma.organization.findFirst({
      where: {
        code,
        id: {
          not: id,
        },
      },
    });
  }

  async findMany(query: NormalizedOrganizationQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.limit,
      }),
      this.prisma.organization.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  update(id: number, data: OrganizationUpdateData) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  softDelete(id: number) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        isActive: false,
        status: OrganizationStatus.INACTIVE,
      },
    });
  }

  private buildWhere(query: NormalizedOrganizationQuery) {
    const where: {
      id?: number;
      status?: OrganizationStatus;
      OR?: Array<{
        name?: { contains: string };
        code?: { contains: string };
      }>;
    } = {};

    if (query.organizationId) {
      where.id = query.organizationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
          },
        },
        {
          code: {
            contains: search.toUpperCase(),
          },
        },
      ];
    }

    return where;
  }
}
