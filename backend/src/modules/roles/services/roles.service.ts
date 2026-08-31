import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/types/current-user.types';
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
import { generateInternalCode } from '../../../common/utils/internal-code';

export interface UserAccessContext {
  roles: string[];
  permissions: string[];
}

const GLOBAL_SCOPE = 'GLOBAL';
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Injectable()
export class RolesService {
  constructor(
    @Inject(RolesRepository)
    private readonly rolesRepository: RolesRepository,
    @Inject(PermissionsService)
    private readonly permissionsService: PermissionsService,
  ) {}

  async create(dto: CreateRoleDto, user?: CurrentUser) {
    const organizationId = await this.resolveRoleOrganizationId(
      user,
      dto.organizationId,
    );
    const scope = this.scopeForOrganization(organizationId);
    const code = await generateInternalCode({
      fallback: 'ROLE',
      isTaken: async (candidate) =>
        Boolean(await this.rolesRepository.findByCode(candidate, scope)),
      maxLength: 50,
      separator: '_',
      source: dto.name,
    });

    if (!this.isSuperAdmin(user) && code === SUPER_ADMIN_ROLE) {
      throw new ForbiddenException('Only a super admin can create this role');
    }

    await this.ensureNameIsUnique(dto.name, scope);

    const role = await this.rolesRepository.create({
      organizationId,
      scope,
      name: dto.name,
      code,
      description: dto.description,
      isSystem: organizationId === undefined,
      isActive: dto.isActive ?? true,
    });

    if (dto.permissionIds?.length) {
      return this.assignPermissions(
        role.id,
        { permissionIds: dto.permissionIds },
        user,
      );
    }

    return this.findOne(role.id, user);
  }

  async findAll(query: RoleQueryDto, user?: CurrentUser) {
    const normalized = this.normalizeQuery(query, user);
    const result = await this.rolesRepository.findMany(normalized);

    return {
      items: result.items.map((role) => this.toRoleResponse(role)),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
    };
  }

  async findOne(id: number, user?: CurrentUser) {
    const role = await this.findExisting(id);
    this.assertCanAccessRole(user, role);

    return this.toRoleResponse(role);
  }

  async update(id: number, dto: UpdateRoleDto, user?: CurrentUser) {
    const existing = await this.findExisting(id);
    this.assertCanManageRole(user, existing);

    if (dto.name) {
      await this.ensureNameIsUnique(dto.name, existing.scope, id);
    }

    let role = await this.rolesRepository.update(id, this.toUpdateInput(dto));

    if (dto.permissionIds) {
      const updatedRole = await this.rolesRepository.replacePermissions(
        id,
        dto.permissionIds,
      );
      if (!updatedRole) {
        throw new NotFoundException('Role not found');
      }
      role = updatedRole;
    }

    return this.toRoleResponse(role);
  }

  async assignPermissions(
    roleId: number,
    dto: AssignRolePermissionsDto,
    user?: CurrentUser,
  ) {
    const role = await this.findExisting(roleId);
    this.assertCanManageRole(user, role);

    const permissions = await this.permissionsService.findManyByIds(
      dto.permissionIds,
    );

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }

    const updatedRole = await this.rolesRepository.replacePermissions(
      roleId,
      dto.permissionIds,
    );

    return this.toRoleResponse(updatedRole!);
  }

  async assignToUser(
    roleId: number,
    dto: AssignUserRoleDto,
    user?: CurrentUser,
  ) {
    const role = await this.findExisting(roleId);
    const targetUser = await this.ensureUserExists(dto.userId);
    const organizationId = await this.resolveAssignmentOrganizationId(
      user,
      role,
      dto.organizationId,
    );

    if (
      organizationId &&
      targetUser.organizationId &&
      targetUser.organizationId !== organizationId
    ) {
      throw new ForbiddenException(
        'Cannot assign a role outside the user organization',
      );
    }

    const existing = await this.rolesRepository.findUserRole(
      dto.userId,
      roleId,
      organizationId,
    );

    if (existing) {
      return this.rolesRepository.activateUserRole(existing.id);
    }

    return this.rolesRepository.createUserRole(
      dto.userId,
      roleId,
      organizationId,
    );
  }

  async assignCodeToUser(
    roleCode: string,
    dto: AssignUserRoleDto,
    user?: CurrentUser,
  ) {
    const organizationId = dto.organizationId;
    const scopedRole = organizationId
      ? await this.rolesRepository.findByCode(
          roleCode,
          this.scopeForOrganization(organizationId),
        )
      : null;
    const role =
      scopedRole ??
      (await this.rolesRepository.findByCode(roleCode, GLOBAL_SCOPE));

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.assignToUser(role.id, dto, user);
  }

  async getUserAccessContext(
    userId: string | number,
  ): Promise<UserAccessContext> {
    const [accessUser, userRoles] = await Promise.all([
      this.rolesRepository.findAccessUser(userId),
      this.rolesRepository.findUserAccessContext(userId),
    ]);
    const roles = new Set<string>();
    const permissions = new Set<string>();
    const organizationId = accessUser?.organizationId ?? null;

    for (const userRole of userRoles) {
      const isSuperAdmin =
        userRole.role.code === SUPER_ADMIN_ROLE &&
        userRole.organizationId === null;
      const isOrganizationAssignment =
        organizationId !== null && userRole.organizationId === organizationId;

      if (!isSuperAdmin && !isOrganizationAssignment) {
        continue;
      }

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

    return user;
  }

  private async ensureOrganizationExists(organizationId?: number) {
    if (!organizationId) {
      return;
    }

    const organization =
      await this.rolesRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private isSuperAdmin(user?: CurrentUser) {
    return Boolean(user?.roles?.includes(SUPER_ADMIN_ROLE));
  }

  private scopeForOrganization(organizationId?: number) {
    return organizationId ? `ORG:${organizationId}` : GLOBAL_SCOPE;
  }

  private async resolveRoleOrganizationId(
    user: CurrentUser | undefined,
    requested?: number,
  ) {
    if (this.isSuperAdmin(user)) {
      await this.ensureOrganizationExists(requested);
      return requested;
    }

    if (!user) {
      await this.ensureOrganizationExists(requested);
      return requested;
    }

    if (!user.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    if (requested && requested !== user.organizationId) {
      throw new ForbiddenException('Cannot manage another organization');
    }

    return user.organizationId;
  }

  private async resolveAssignmentOrganizationId(
    user: CurrentUser | undefined,
    role: any,
    requested?: number,
  ) {
    if (role.code === SUPER_ADMIN_ROLE) {
      if (!this.isSuperAdmin(user)) {
        throw new ForbiddenException('Only a super admin can assign this role');
      }
      return undefined;
    }

    const organizationId = await this.resolveRoleOrganizationId(
      user,
      requested ?? role.organizationId ?? undefined,
    );

    if (!organizationId) {
      throw new BadRequestException(
        'organizationId is required for organization roles',
      );
    }

    if (role.organizationId && role.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot assign a role from another organization',
      );
    }

    return organizationId;
  }

  private assertCanAccessRole(user: CurrentUser | undefined, role: any) {
    if (!user || this.isSuperAdmin(user)) {
      return;
    }

    if (role.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access another organization role');
    }
  }

  private assertCanManageRole(user: CurrentUser | undefined, role: any) {
    this.assertCanAccessRole(user, role);

    if (!this.isSuperAdmin(user) && role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
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
    scope: string,
    excludeId?: number,
  ) {
    const role = excludeId
      ? await this.rolesRepository.findByNameExcludingId(name, scope, excludeId)
      : await this.rolesRepository.findByName(name, scope);

    if (role) {
      throw new ConflictException('Role name already exists');
    }
  }

  private normalizeQuery(
    query: RoleQueryDto,
    user?: CurrentUser,
  ): NormalizedRoleQuery {
    const organizationId = this.isSuperAdmin(user)
      ? query.organizationId
      : (user?.organizationId ?? query.organizationId);

    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      isActive: query.isActive,
      organizationId,
      includeGlobal:
        this.isSuperAdmin(user) && query.organizationId === undefined,
    };
  }

  private toUpdateInput(dto: UpdateRoleDto): RoleUpdateData {
    return Object.fromEntries(
      Object.entries(dto).filter(
        ([key, value]) =>
          value !== undefined &&
          !['organizationId', 'permissionIds'].includes(key),
      ),
    ) as RoleUpdateData;
  }

  private toRoleResponse(role: any) {
    return {
      ...role,
      permissions:
        role.permissions?.map((rolePermission) => rolePermission.permission) ??
        [],
    };
  }
}
