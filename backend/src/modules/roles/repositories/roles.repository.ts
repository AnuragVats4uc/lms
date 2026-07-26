import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma';
import { RoleQueryDto } from '../dto/role-query.dto';

export interface RoleCreateData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export type RoleUpdateData = Partial<RoleCreateData>;

export interface NormalizedRoleQuery
  extends Required<Omit<RoleQueryDto, 'isActive'>> {
  isActive?: boolean;
}

@Injectable()
export class RolesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(data: RoleCreateData) {
    return this.prisma.role.create({ data });
  }

  findById(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
    });
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  findByCodeExcludingId(code: string, id: number) {
    return this.prisma.role.findFirst({
      where: {
        code,
        id: { not: id },
      },
    });
  }

  findByNameExcludingId(name: string, id: number) {
    return this.prisma.role.findFirst({
      where: {
        name,
        id: { not: id },
      },
    });
  }

  async findMany(query: NormalizedRoleQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.role.count({ where }),
    ]);

    return { items, total };
  }

  update(id: number, data: RoleUpdateData) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async replacePermissions(
    roleId: number,
    permissionIds: number[],
  ) {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ]);

    return this.findById(roleId);
  }

  findUserRole(
    userId: number,
    roleId: number,
    organizationId?: number,
  ) {
    return this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        organizationId: organizationId ?? null,
      },
    });
  }

  createUserRole(
    userId: number,
    roleId: number,
    organizationId?: number,
  ) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        organizationId,
      },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  activateUserRole(id: number) {
    return this.prisma.userRole.update({
      where: { id },
      data: { isActive: true },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  findUserAccessContext(userId: bigint | string | number) {
    return this.prisma.userRole.findMany({
      where: {
        userId: Number(userId),
        isActive: true,
        role: {
          isActive: true,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  findOrganizationById(organizationId: number) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  private buildWhere(query: NormalizedRoleQuery) {
    const where: {
      isActive?: boolean;
      OR?: Array<{
        name?: { contains: string };
        code?: { contains: string };
      }>;
    } = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const search = query.search.trim();

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search.toUpperCase() } },
      ];
    }

    return where;
  }
}
