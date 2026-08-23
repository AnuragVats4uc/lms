import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma';
import { RoleQueryDto } from '../dto/role-query.dto';

export interface RoleCreateData {
  organizationId?: number;
  scope: string;
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

export type RoleUpdateData = Partial<RoleCreateData>;

export interface NormalizedRoleQuery extends Required<
  Omit<RoleQueryDto, 'isActive' | 'organizationId'>
> {
  isActive?: boolean;
  organizationId?: number;
  includeGlobal?: boolean;
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
        organization: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findByCode(code: string, scope = 'GLOBAL') {
    return this.prisma.role.findUnique({
      where: { scope_code: { scope, code } },
    });
  }

  findByName(name: string, scope = 'GLOBAL') {
    return this.prisma.role.findUnique({
      where: { scope_name: { scope, name } },
    });
  }

  findByCodeExcludingId(code: string, scope: string, id: number) {
    return this.prisma.role.findFirst({
      where: {
        code,
        scope,
        id: { not: id },
      },
    });
  }

  findByNameExcludingId(name: string, scope: string, id: number) {
    return this.prisma.role.findFirst({
      where: {
        name,
        scope,
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
          organization: true,
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
        organization: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async replacePermissions(roleId: number, permissionIds: number[]) {
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

  findUserRole(userId: number, roleId: number, organizationId?: number) {
    return this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        organizationId: organizationId ?? null,
      },
    });
  }

  createUserRole(userId: number, roleId: number, organizationId?: number) {
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

  findAccessUser(userId: bigint | string | number) {
    return this.prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, organizationId: true },
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
      organizationId?: number | null;
      isActive?: boolean;
      OR?: Array<{
        name?: { contains: string };
        code?: { contains: string };
      }>;
      AND?: Array<{
        OR?: Array<{
          organizationId?: number | null;
        }>;
      }>;
    } = {};

    if (query.organizationId !== undefined) {
      where.organizationId = query.organizationId;
    } else if (!query.includeGlobal) {
      where.organizationId = null;
    }

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
