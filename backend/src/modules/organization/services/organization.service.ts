import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Organization,
  OrganizationStatus,
} from '@prisma/client';

import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { OrganizationQueryDto } from '../dto/organization-query.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
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

  async create(dto: CreateOrganizationDto) {
    await this.ensureNameIsUnique(dto.name);
    await this.ensureCodeIsUnique(dto.code);

    const organization = await this.organizationRepository.create({
      ...dto,
      status: dto.status ?? OrganizationStatus.ACTIVE,
    });

    return this.toResponse(organization);
  }

  async findAll(query: OrganizationQueryDto) {
    const paginationQuery = this.normalizeQuery(query);
    const result =
      await this.organizationRepository.findMany(paginationQuery);
    const totalPages = Math.ceil(
      result.total / paginationQuery.limit,
    );

    return {
      items: result.items.map((organization) =>
        this.toResponse(organization),
      ),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const organization = await this.findExisting(id);

    return this.toResponse(organization);
  }

  async update(id: number, dto: UpdateOrganizationDto) {
    await this.findExisting(id);

    if (dto.name) {
      await this.ensureNameIsUnique(dto.name, id);
    }

    if (dto.code) {
      await this.ensureCodeIsUnique(dto.code, id);
    }

    const organization = await this.organizationRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    return this.toResponse(organization);
  }

  async remove(id: number) {
    await this.findExisting(id);

    const organization =
      await this.organizationRepository.softDelete(id);

    return this.toResponse(organization);
  }

  private async findExisting(id: number) {
    const organization =
      await this.organizationRepository.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private async ensureNameIsUnique(
    name: string,
    excludeId?: number,
  ) {
    const organization = excludeId
      ? await this.organizationRepository.findByNameExcludingId(
          name,
          excludeId,
        )
      : await this.organizationRepository.findByName(name);

    if (organization) {
      throw new ConflictException(
        'Organization name already exists',
      );
    }
  }

  private async ensureCodeIsUnique(
    code: string,
    excludeId?: number,
  ) {
    const organization = excludeId
      ? await this.organizationRepository.findByCodeExcludingId(
          code,
          excludeId,
        )
      : await this.organizationRepository.findByCode(code);

    if (organization) {
      throw new ConflictException(
        'Organization code already exists',
      );
    }
  }

  private normalizeQuery(
    query: OrganizationQueryDto,
  ): NormalizedOrganizationQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status ?? undefined,
    };
  }

  private toUpdateInput(
    dto: UpdateOrganizationDto,
  ): OrganizationUpdateData {
    return Object.fromEntries(
      Object.entries(dto).filter(
        ([, value]) => value !== undefined,
      ),
    ) as OrganizationUpdateData;
  }

  private toResponse(organization: Organization) {
    return organization;
  }
}
