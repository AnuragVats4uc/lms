import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Organization, OrganizationStatus } from '@prisma/client';

import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { OrganizationQueryDto } from '../dto/organization-query.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { CurrentUser } from '../../auth/types/current-user.types';
import { generateInternalCode } from '../../../common/utils/internal-code';
import {
  NormalizedOrganizationQuery,
  OrganizationUpdateData,
  OrganizationRepository,
} from '../repositories/organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async create(dto: CreateOrganizationDto, actor: CurrentUser) {
    this.assertIsSuperAdmin(actor);
    await this.ensureNameIsUnique(dto.name);
    const code = await generateInternalCode({
      fallback: 'ORG',
      isTaken: async (candidate) =>
        Boolean(await this.organizationRepository.findByCode(candidate)),
      maxLength: 20,
      source: dto.name,
    });

    const organization = await this.organizationRepository.create({
      ...dto,
      code,
      status: dto.status ?? OrganizationStatus.ACTIVE,
    });

    return this.toResponse(organization);
  }

  async findAll(query: OrganizationQueryDto, actor: CurrentUser) {
    const paginationQuery = this.normalizeQuery(query, actor);
    const result = await this.organizationRepository.findMany(paginationQuery);
    const totalPages = Math.ceil(result.total / paginationQuery.limit);

    return {
      items: result.items.map((organization) => this.toResponse(organization)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async findOne(id: number, actor: CurrentUser) {
    this.assertCanAccessOrganization(id, actor);
    const organization = await this.findExisting(id);

    return this.toResponse(organization);
  }

  async update(id: number, dto: UpdateOrganizationDto, actor: CurrentUser) {
    this.assertCanAccessOrganization(id, actor);
    await this.findExisting(id);

    if (dto.name) {
      await this.ensureNameIsUnique(dto.name, id);
    }

    const organization = await this.organizationRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    return this.toResponse(organization);
  }

  async remove(id: number, actor: CurrentUser) {
    this.assertCanAccessOrganization(id, actor);
    await this.findExisting(id);

    const organization = await this.organizationRepository.softDelete(id);

    return this.toResponse(organization);
  }

  private async findExisting(id: number) {
    const organization = await this.organizationRepository.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private async ensureNameIsUnique(name: string, excludeId?: number) {
    const organization = excludeId
      ? await this.organizationRepository.findByNameExcludingId(name, excludeId)
      : await this.organizationRepository.findByName(name);

    if (organization) {
      throw new ConflictException('Organization name already exists');
    }
  }

  private normalizeQuery(
    query: OrganizationQueryDto,
    actor: CurrentUser,
  ): NormalizedOrganizationQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status ?? undefined,
      organizationId: this.isSuperAdmin(actor)
        ? undefined
        : this.requireOrganizationId(actor),
    };
  }

  private assertIsSuperAdmin(actor: CurrentUser) {
    if (!this.isSuperAdmin(actor)) {
      throw new ForbiddenException(
        'Only a super admin can create an organization',
      );
    }
  }

  private assertCanAccessOrganization(id: number, actor: CurrentUser) {
    if (this.isSuperAdmin(actor)) return;
    if (this.requireOrganizationId(actor) !== id) {
      throw new ForbiddenException('Cannot access another organization');
    }
  }

  private requireOrganizationId(actor: CurrentUser) {
    if (!actor.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }
    return actor.organizationId;
  }

  private isSuperAdmin(actor: CurrentUser) {
    return Boolean(actor.roles?.includes('SUPER_ADMIN'));
  }

  private toUpdateInput(dto: UpdateOrganizationDto): OrganizationUpdateData {
    return Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as OrganizationUpdateData;
  }

  private toResponse(organization: Organization) {
    return organization;
  }
}
