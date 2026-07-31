import { Injectable } from '@nestjs/common';
import { Prisma, SessionCourseStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { SessionCourseQueryDto } from '../dto/session-course-query.dto';

export interface SessionCourseCreateData {
  sessionId: number;
  courseId: number;
  displayName?: string;
  description?: string;
  sortOrder?: number;
  isPublished?: boolean;
  status: SessionCourseStatus;
  isActive?: boolean;
}

export type SessionCourseUpdateData = Partial<
  Omit<SessionCourseCreateData, 'sessionId' | 'courseId'>
>;

export interface NormalizedSessionCourseQuery extends Required<
  Omit<SessionCourseQueryDto, 'status'>
> {
  status?: SessionCourseQueryDto['status'];
}

const sessionCourseInclude = {
  course: true,
} satisfies Prisma.SessionCourseInclude;

export type SessionCourseWithCourse = Prisma.SessionCourseGetPayload<{
  include: typeof sessionCourseInclude;
}>;

@Injectable()
export class SessionCourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: SessionCourseCreateData) {
    return this.prisma.sessionCourse.create({
      data,
      include: sessionCourseInclude,
    });
  }

  findSessionById(sessionId: number) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
    });
  }

  findCourseById(courseId: number) {
    return this.prisma.course.findUnique({
      where: { id: courseId },
    });
  }

  findById(sessionId: number, id: number) {
    return this.prisma.sessionCourse.findFirst({
      where: {
        id,
        sessionId,
      },
      include: sessionCourseInclude,
    });
  }

  findBySessionAndCourse(sessionId: number, courseId: number) {
    return this.prisma.sessionCourse.findUnique({
      where: {
        sessionId_courseId: {
          sessionId,
          courseId,
        },
      },
      include: sessionCourseInclude,
    });
  }

  async findMany(sessionId: number, query: NormalizedSessionCourseQuery) {
    const where = this.buildWhere(sessionId, query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sessionCourse.findMany({
        where,
        include: sessionCourseInclude,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: query.limit,
      }),
      this.prisma.sessionCourse.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  }

  update(id: number, data: SessionCourseUpdateData) {
    return this.prisma.sessionCourse.update({
      where: { id },
      data,
      include: sessionCourseInclude,
    });
  }

  softDelete(id: number) {
    return this.prisma.sessionCourse.update({
      where: { id },
      data: {
        isActive: false,
        status: SessionCourseStatus.ARCHIVED,
      },
      include: sessionCourseInclude,
    });
  }

  private buildWhere(
    sessionId: number,
    query: NormalizedSessionCourseQuery,
  ): Prisma.SessionCourseWhereInput {
    const where: Prisma.SessionCourseWhereInput = {
      sessionId,
    };

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        {
          displayName: {
            contains: search,
          },
        },
        {
          course: {
            name: {
              contains: search,
            },
          },
        },
        {
          course: {
            code: {
              contains: search.toUpperCase(),
            },
          },
        },
      ];
    }

    return where;
  }
}
