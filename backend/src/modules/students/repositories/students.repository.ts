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
