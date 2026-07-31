import { Injectable } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { CourseQueryDto } from '../dto/course-query.dto';

export interface CourseCreateData {
  name: string;
  code: string;
  description?: string;
  thumbnail?: string;
  durationInDays?: number;
  status: CourseStatus;
  isActive?: boolean;
}

export type CourseUpdateData = Partial<CourseCreateData>;

export interface NormalizedCourseQuery extends Required<
  Omit<CourseQueryDto, 'status'>
> {
  status?: CourseQueryDto['status'];
}

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CourseCreateData) {
    return this.prisma.course.create({
      data,
    });
  }

  findById(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
    });
  }

  findByName(name: string) {
    return this.prisma.course.findUnique({
      where: { name },
    });
  }

  findByCode(code: string) {
    return this.prisma.course.findUnique({
      where: { code },
    });
  }

  findByNameExcludingId(name: string, id: number) {
    return this.prisma.course.findFirst({
      where: {
        name,
        id: {
          not: id,
        },
      },
    });
  }

  findByCodeExcludingId(code: string, id: number) {
    return this.prisma.course.findFirst({
      where: {
        code,
        id: {
          not: id,
        },
      },
    });
  }

  async findMany(query: NormalizedCourseQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.limit,
      }),
      this.prisma.course.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  update(id: number, data: CourseUpdateData) {
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  softDelete(id: number) {
    return this.prisma.course.update({
      where: { id },
      data: {
        isActive: false,
        status: CourseStatus.ARCHIVED,
      },
    });
  }

  private buildWhere(query: NormalizedCourseQuery) {
    const where: {
      status?: CourseStatus;
      OR?: Array<{
        name?: { contains: string };
        code?: { contains: string };
      }>;
    } = {};

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
