import { Injectable } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { SessionQueryDto } from '../dto/session-query.dto';

export interface SessionCreateData {
  organizationId: number;
  name: string;
  code?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: SessionStatus;
  isActive?: boolean;
}

export type SessionUpdateData = Partial<SessionCreateData>;

export interface NormalizedSessionQuery extends Required<
  Omit<SessionQueryDto, 'status'>
> {
  status?: SessionQueryDto['status'];
}

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: SessionCreateData) {
    return this.prisma.session.create({
      data,
    });
  }

  findOrganizationById(organizationId: number) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  findById(organizationId: number, id: number) {
    return this.prisma.session.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  findByName(organizationId: number, name: string) {
    return this.prisma.session.findFirst({
      where: {
        organizationId,
        name,
      },
    });
  }

  findByNameExcludingId(organizationId: number, name: string, id: number) {
    return this.prisma.session.findFirst({
      where: {
        organizationId,
        name,
        id: {
          not: id,
        },
      },
    });
  }

  async findMany(organizationId: number, query: NormalizedSessionQuery) {
    const where = this.buildWhere(organizationId, query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.limit,
      }),
      this.prisma.session.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  update(id: number, data: SessionUpdateData) {
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  softDelete(id: number) {
    return this.prisma.session.update({
      where: { id },
      data: {
        isActive: false,
        status: SessionStatus.ARCHIVED,
      },
    });
  }

  private buildWhere(organizationId: number, query: NormalizedSessionQuery) {
    const where: {
      organizationId: number;
      status?: SessionStatus;
      OR?: Array<{
        name?: { contains: string };
        code?: { contains: string };
      }>;
    } = {
      organizationId,
    };

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
