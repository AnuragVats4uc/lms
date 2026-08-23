import { Inject, Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma';
import { UserQueryDto } from '../dto/user-query.dto';

export interface UserCreateData {
  organizationId?: number;
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export type UserUpdateData = Partial<UserCreateData> & {
  status?: UserStatus;
  isActive?: boolean;
};

export interface NormalizedUserQuery extends Required<
  Omit<UserQueryDto, 'status' | 'organizationId'>
> {
  organizationId?: number;
  status?: UserStatus;
}

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(data: UserCreateData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        isVerified: true,
        lastName: data.lastName,
        organizationId: data.organizationId,
        password: data.password,
        phone: data.phone,
      },
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
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailExcludingId(email: string, id: number) {
    return this.prisma.user.findFirst({
      where: { email, id: { not: id } },
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findByPhoneExcludingId(phone: string, id: number) {
    return this.prisma.user.findFirst({
      where: { phone, id: { not: id } },
    });
  }

  findOrganizationById(organizationId: number) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  findRoleById(id: number) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async findMany(query: NormalizedUserQuery) {
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

  update(id: number, data: UserUpdateData) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: this.includeRelations(),
    });
  }

  remove(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, status: UserStatus.INACTIVE },
      include: this.includeRelations(),
    });
  }

  async replacePrimaryRole(
    userId: number,
    roleId: number,
    organizationId?: number,
  ) {
    await this.prisma.userRole.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        organizationId: organizationId ?? null,
      },
    });

    if (existing) {
      await this.prisma.userRole.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      return;
    }

    await this.prisma.userRole.create({
      data: { userId, roleId, organizationId, isActive: true },
    });
  }

  async ensureStudentProfile(userId: number, organizationId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    if (!user) {
      return null;
    }

    return this.prisma.student.upsert({
      where: { userId },
      update: {
        organizationId,
        isActive: true,
        status: 'ACTIVE',
      },
      create: {
        organizationId,
        studentCode: `STU-${userId.toString().padStart(5, '0')}`,
        userId,
        profile: {
          create: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          },
        },
      },
    });
  }

  private includeRelations() {
    return {
      organization: true,
      userRoles: {
        where: { isActive: true },
        include: {
          organization: true,
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private buildWhere(query: NormalizedUserQuery) {
    const where: Prisma.UserWhereInput = {};

    if (query.organizationId !== undefined) {
      where.organizationId = query.organizationId;
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    return where;
  }
}
