import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/types/current-user.types';
import { PasswordService } from '../../auth/services/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import {
  NormalizedUserQuery,
  UserUpdateData,
  UsersRepository,
} from '../repositories/users.repository';

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

@Injectable()
export class UsersService {
  constructor(
    @Inject(PasswordService)
    private readonly passwordService: PasswordService,
    @Inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(dto: CreateUserDto, actor: CurrentUser) {
    const organizationId = await this.resolveOrganizationId(
      actor,
      dto.organizationId,
    );
    const role = await this.resolveAssignableRole(
      actor,
      dto.roleId,
      organizationId,
    );

    await this.ensureEmailIsUnique(dto.email);

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone);
    }

    const user = await this.usersRepository.create({
      organizationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: await this.passwordService.hash(dto.password),
      phone: dto.phone,
    });

    await this.usersRepository.replacePrimaryRole(
      user.id,
      role.id,
      organizationId,
    );
    await this.ensureStudentProfileIfNeeded(user.id, organizationId, role.code);

    return this.findOne(user.id, actor);
  }

  async findAll(query: UserQueryDto, actor: CurrentUser) {
    const normalized = this.normalizeQuery(query, actor);
    const result = await this.usersRepository.findMany(normalized);

    return {
      items: result.items.map((user) => this.toUserResponse(user)),
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
    };
  }

  async findOne(id: number, actor: CurrentUser) {
    const user = await this.findExisting(id);
    this.assertCanAccessUser(actor, user.organizationId);
    return this.toUserResponse(user);
  }

  async update(id: number, dto: UpdateUserDto, actor: CurrentUser) {
    const existing = await this.findExisting(id);
    this.assertCanAccessUser(actor, existing.organizationId);

    const organizationId = await this.resolveOrganizationId(
      actor,
      dto.organizationId ?? existing.organizationId ?? undefined,
    );
    const role = dto.roleId
      ? await this.resolveAssignableRole(actor, dto.roleId, organizationId)
      : null;

    if (dto.email) {
      await this.ensureEmailIsUnique(dto.email, id);
    }

    if (dto.phone) {
      await this.ensurePhoneIsUnique(dto.phone, id);
    }

    const data = await this.toUpdateInput(dto, organizationId);
    const user = await this.usersRepository.update(id, data);

    if (role) {
      await this.usersRepository.replacePrimaryRole(
        id,
        role.id,
        organizationId,
      );
      await this.ensureStudentProfileIfNeeded(id, organizationId, role.code);
    }

    return this.findOne(user.id, actor);
  }

  async remove(id: number, actor: CurrentUser) {
    const existing = await this.findExisting(id);
    this.assertCanAccessUser(actor, existing.organizationId);
    const user = await this.usersRepository.remove(id);
    return this.toUserResponse(user);
  }

  private async resolveOrganizationId(
    actor: CurrentUser,
    requested?: number | null,
  ) {
    if (this.isSuperAdmin(actor)) {
      if (!requested) {
        throw new BadRequestException('organizationId is required');
      }
      await this.ensureOrganizationExists(requested);
      return requested;
    }

    if (!actor.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    if (requested && requested !== actor.organizationId) {
      throw new ForbiddenException('Cannot manage another organization');
    }

    return actor.organizationId;
  }

  private async resolveAssignableRole(
    actor: CurrentUser,
    roleId: number,
    organizationId: number,
  ) {
    const role = await this.usersRepository.findRoleById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.code === SUPER_ADMIN_ROLE) {
      throw new ForbiddenException('Cannot assign the super admin role here');
    }

    if (role.organizationId && role.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot assign a role from another organization',
      );
    }

    if (!this.isSuperAdmin(actor) && role.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot assign a global role');
    }

    return role;
  }

  private assertCanAccessUser(
    actor: CurrentUser,
    organizationId?: number | null,
  ) {
    if (this.isSuperAdmin(actor)) {
      return;
    }

    if (!actor.organizationId || actor.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot access another organization user');
    }
  }

  private normalizeQuery(
    query: UserQueryDto,
    actor: CurrentUser,
  ): NormalizedUserQuery {
    const organizationId = this.isSuperAdmin(actor)
      ? query.organizationId
      : actor.organizationId;

    if (!this.isSuperAdmin(actor) && !organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status,
      organizationId: organizationId ?? undefined,
    };
  }

  private async ensureOrganizationExists(organizationId: number) {
    const organization =
      await this.usersRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async findExisting(id: number) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensureEmailIsUnique(email: string, excludeId?: number) {
    const user = excludeId
      ? await this.usersRepository.findByEmailExcludingId(email, excludeId)
      : await this.usersRepository.findByEmail(email);

    if (user) {
      throw new ConflictException('Email already exists');
    }
  }

  private async ensurePhoneIsUnique(phone: string, excludeId?: number) {
    const user = excludeId
      ? await this.usersRepository.findByPhoneExcludingId(phone, excludeId)
      : await this.usersRepository.findByPhone(phone);

    if (user) {
      throw new ConflictException('Phone already exists');
    }
  }

  private async toUpdateInput(
    dto: UpdateUserDto,
    organizationId: number,
  ): Promise<UserUpdateData> {
    const data: UserUpdateData = {
      organizationId,
    };

    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.password) {
      data.password = await this.passwordService.hash(dto.password);
    }

    return data;
  }

  private async ensureStudentProfileIfNeeded(
    userId: number,
    organizationId: number,
    roleCode: string,
  ) {
    if (roleCode !== 'STUDENT') {
      return;
    }

    await this.usersRepository.ensureStudentProfile(userId, organizationId);
  }

  private isSuperAdmin(actor: CurrentUser) {
    return actor.roles?.includes(SUPER_ADMIN_ROLE);
  }

  private toUserResponse(user: any) {
    const roles =
      user.userRoles?.map((userRole) => ({
        ...userRole.role,
        permissions:
          userRole.role.permissions?.map(
            (rolePermission) => rolePermission.permission,
          ) ?? [],
      })) ?? [];

    return {
      ...user,
      roles,
      userRoles: undefined,
    };
  }
}
