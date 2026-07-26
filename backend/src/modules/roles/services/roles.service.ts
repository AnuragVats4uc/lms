import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PermissionsService } from '../../permissions/services/permissions.service';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleQueryDto } from '../dto/role-query.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import {
  NormalizedRoleQuery,
  RoleUpdateData,
  RolesRepository,
} from '../repositories/roles.repository';

export interface UserAccessContext {
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(RolesRepository)
    private readonly rolesRepository: RolesRepository,
    @Inject(PermissionsService)
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(dto: CreateRoleDto) {
    await this.ensureNameIsUnique(dto.name);
    await this.ensureCodeIsUnique(dto.code);

    const role = await this.rolesRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    if (dto.permissionIds?.length) {
      return this.assignPermissions(role.id, {
        permissionIds: dto.permissionIds,
      });
    }

    return this.findOne(role.id);
  }

  async findAll(query: RoleQueryDto) {
    const normalized = this.normalizeQuery(query);
    const result = await this.rolesRepository.findMany(normalized);

    return {
      items: result.items.map((role) =>
        this.toRoleResponse(role),
      ),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
    };
  }

  async findOne(id: number) {
    const role = await this.findExisting(id);

    return this.toRoleResponse(role);
  }

  async update(id: number, dto: UpdateRoleDto) {
    await this.findExisting(id);

    if (dto.name) {
      await this.ensureNameIsUnique(dto.name, id);
    }

    if (dto.code) {
      await this.ensureCodeIsUnique(dto.code, id);
    }

    const role = await this.rolesRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    return this.toRoleResponse(role);
  }

  async assignPermissions(
    roleId: number,
    dto: AssignRolePermissionsDto,
  ) {
    await this.findExisting(roleId);

    const permissions =
      await this.permissionsService.findManyByIds(
        dto.permissionIds,
      );

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException(
        'One or more permissions were not found',
      );
    }

    const role = await this.rolesRepository.replacePermissions(
      roleId,
      dto.permissionIds,
    );

    return this.toRoleResponse(role!);
  }

  async assignToUser(roleId: number, dto: AssignUserRoleDto) {
    await this.findExisting(roleId);
    await this.ensureUserExists(dto.userId);
    await this.ensureOrganizationExists(dto.organizationId);

    const existing = await this.rolesRepository.findUserRole(
      dto.userId,
      roleId,
      dto.organizationId,
    );

    if (existing) {
      return this.rolesRepository.activateUserRole(existing.id);
    }

    return this.rolesRepository.createUserRole(
      dto.userId,
      roleId,
      dto.organizationId,
    );
  }

  async assignCodeToUser(
    roleCode: string,
    dto: AssignUserRoleDto,
  ) {
    const role = await this.rolesRepository.findByCode(roleCode);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.assignToUser(role.id, dto);
  }

  async getUserAccessContext(
    userId: string | number,
  ): Promise<UserAccessContext> {
    const userRoles =
      await this.rolesRepository.findUserAccessContext(userId);
    const roles = new Set<string>();
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      roles.add(userRole.role.code);

      for (const rolePermission of userRole.role.permissions) {
        permissions.add(rolePermission.permission.key);
      }
    }

    return {
      roles: [...roles],
      permissions: [...permissions],
    };
  }

  private async ensureUserExists(userId: number) {
    const user = await this.rolesRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async ensureOrganizationExists(organizationId?: number) {
    if (!organizationId) {
      return;
    }

    const organization =
      await this.rolesRepository.findOrganizationById(
        organizationId,
      );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async findExisting(id: number) {
    const role = await this.rolesRepository.findById(id);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private async ensureNameIsUnique(
    name: string,
    excludeId?: number,
  ) {
    const role = excludeId
      ? await this.rolesRepository.findByNameExcludingId(
          name,
          excludeId,
        )
      : await this.rolesRepository.findByName(name);

    if (role) {
      throw new ConflictException('Role name already exists');
    }
  }

  private async ensureCodeIsUnique(
    code: string,
    excludeId?: number,
  ) {
    const role = excludeId
      ? await this.rolesRepository.findByCodeExcludingId(
          code,
          excludeId,
        )
      : await this.rolesRepository.findByCode(code);

    if (role) {
      throw new ConflictException('Role code already exists');
    }
  }

  private normalizeQuery(query: RoleQueryDto): NormalizedRoleQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      isActive: query.isActive,
    };
  }

  private toUpdateInput(dto: UpdateRoleDto): RoleUpdateData {
    return Object.fromEntries(
      Object.entries(dto).filter(
        ([, value]) => value !== undefined,
      ),
    ) as RoleUpdateData;
  }

  private toRoleResponse(role: any) {
    return {
      ...role,
      permissions:
        role.permissions?.map(
          (rolePermission) => rolePermission.permission,
        ) ?? [],
    };
  }
}
