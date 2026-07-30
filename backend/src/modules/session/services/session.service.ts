import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Session, SessionStatus } from '@prisma/client';

import { CreateSessionDto } from '../dto/create-session.dto';
import { SessionQueryDto } from '../dto/session-query.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import {
  NormalizedSessionQuery,
  SessionRepository,
  SessionUpdateData,
} from '../repositories/session.repository';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async create(organizationId: number, dto: CreateSessionDto) {
    await this.ensureOrganizationExists(organizationId);
    await this.ensureNameIsUnique(organizationId, dto.name);

    const startDate = this.toDate(dto.startDate);
    const endDate = this.toDate(dto.endDate);

    this.ensureStartDateIsBeforeEndDate(startDate, endDate);

    const session = await this.sessionRepository.create({
      ...dto,
      organizationId,
      startDate,
      endDate,
      status: dto.status ?? SessionStatus.UPCOMING,
    });

    return this.toResponse(session);
  }

  async findAll(organizationId: number, query: SessionQueryDto) {
    await this.ensureOrganizationExists(organizationId);

    const paginationQuery = this.normalizeQuery(query);
    const result = await this.sessionRepository.findMany(
      organizationId,
      paginationQuery,
    );
    const totalPages = Math.ceil(result.total / paginationQuery.limit);

    return {
      items: result.items.map((session) => this.toResponse(session)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  async findOne(organizationId: number, id: number) {
    await this.ensureOrganizationExists(organizationId);

    const session = await this.findExisting(organizationId, id);

    return this.toResponse(session);
  }

  async update(organizationId: number, id: number, dto: UpdateSessionDto) {
    await this.ensureOrganizationExists(organizationId);

    const existing = await this.findExisting(organizationId, id);

    if (dto.name) {
      await this.ensureNameIsUnique(organizationId, dto.name, id);
    }

    const data = this.toUpdateInput(dto);
    const startDate = data.startDate ?? existing.startDate;
    const endDate = data.endDate ?? existing.endDate;

    this.ensureStartDateIsBeforeEndDate(startDate, endDate);

    const session = await this.sessionRepository.update(id, data);

    return this.toResponse(session);
  }

  async remove(organizationId: number, id: number) {
    await this.ensureOrganizationExists(organizationId);
    await this.findExisting(organizationId, id);

    const session = await this.sessionRepository.softDelete(id);

    return this.toResponse(session);
  }

  private async ensureOrganizationExists(organizationId: number) {
    const organization =
      await this.sessionRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async findExisting(organizationId: number, id: number) {
    const session = await this.sessionRepository.findById(organizationId, id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  private async ensureNameIsUnique(
    organizationId: number,
    name: string,
    excludeId?: number,
  ) {
    const session = excludeId
      ? await this.sessionRepository.findByNameExcludingId(
          organizationId,
          name,
          excludeId,
        )
      : await this.sessionRepository.findByName(organizationId, name);

    if (session) {
      throw new ConflictException(
        'Session name already exists in this organization',
      );
    }
  }

  private ensureStartDateIsBeforeEndDate(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }
  }

  private normalizeQuery(query: SessionQueryDto): NormalizedSessionQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      status: query.status ?? undefined,
    };
  }

  private toUpdateInput(dto: UpdateSessionDto): SessionUpdateData {
    const data: SessionUpdateData = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.code !== undefined) {
      data.code = dto.code;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.startDate !== undefined) {
      data.startDate = this.toDate(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      data.endDate = this.toDate(dto.endDate);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return data;
  }

  private toDate(value: string) {
    return new Date(value);
  }

  private toResponse(session: Session) {
    return session;
  }
}
