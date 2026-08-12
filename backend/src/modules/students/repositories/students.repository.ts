import { Inject, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { StudentQueryDto } from '../dto/student-query.dto';

export interface StudentCreateData {
  organizationId?: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  isVerified?: boolean;
}

export type StudentUpdateData = Partial<StudentCreateData> & {
  status?: UserStatus;
  isActive?: boolean;
};

export interface NormalizedStudentQuery
  extends Required<
    Omit<StudentQueryDto, 'status' | 'organizationId'>
  > {
  status?: UserStatus;
  organizationId?: number;
}

@Injectable()
export class StudentsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(data: StudentCreateData) {
    return this.prisma.user.create({
      data,
      include: this.includeRelations(),
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
  }

  findDashboardStudent(userId: number) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        userRoles: {
          some: {
            isActive: true,
            role: { code: 'STUDENT' },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  findActiveEnrollment(userId: number, organizationId?: number | null) {
    return this.prisma.studentEnrollment.findFirst({
      where: {
        userId,
        isActive: true,
        status: 'ACTIVE',
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        session: { select: { id: true, name: true, code: true } },
        courseEnrollments: {
          where: { isActive: true, status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          include: {
            sessionCourse: {
              include: {
                course: true,
                instructors: {
                  include: {
                    instructor: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
                studentCourseProgress: {
                  where: { userId },
                  include: {
                    lastAccessedResource: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findNotifications(userId: number, organizationId: number) {
    return this.prisma.studentNotification.findMany({
      where: {
        userId,
        organizationId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  findContentUpdates(sessionCourseIds: number[]) {
    if (!sessionCourseIds.length) {
      return Promise.resolve([]);
    }

    return this.prisma.resource.findMany({
      where: {
        isActive: true,
        isPublished: true,
        status: 'PUBLISHED',
        folder: { sessionCourseId: { in: sessionCourseIds } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        folder: {
          select: {
            id: true,
            sessionCourseId: true,
          },
        },
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  findByEmailExcludingId(email: string, id: number) {
    return this.prisma.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
    });
  }

  findByPhoneExcludingId(phone: string, id: number) {
    return this.prisma.user.findFirst({
      where: {
        phone,
        id: { not: id },
      },
    });
  }

  async findMany(query: NormalizedStudentQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  update(id: number, data: StudentUpdateData) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: this.includeRelations(),
    });
  }

  softDelete(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        status: UserStatus.INACTIVE,
      },
      include: this.includeRelations(),
    });
  }

  private includeRelations() {
    return {
      organization: true,
      userRoles: {
        where: { isActive: true },
        include: { role: true },
      },
    };
  }

  private buildWhere(query: NormalizedStudentQuery) {
    const where: {
      status?: UserStatus;
      organizationId?: number;
      OR?: Array<{
        firstName?: { contains: string };
        lastName?: { contains: string };
        email?: { contains: string };
      }>;
    } = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search.toLowerCase() } },
      ];
    }

    return where;
  }
}
