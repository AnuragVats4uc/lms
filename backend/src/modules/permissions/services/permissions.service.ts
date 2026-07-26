import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionQueryDto } from '../dto/permission-query.dto';
import {
  NormalizedPermissionQuery,
  PermissionsRepository,
} from '../repositories/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async create(dto: CreatePermissionDto) {
    const key = this.buildKey(dto.module, dto.action);
    const existing =
      await this.permissionsRepository.findByKey(key);

    if (existing) {
      throw new ConflictException('Permission already exists');
    }

    return this.permissionsRepository.create({
      module: dto.module,
      action: dto.action,
      key,
      description: dto.description,
    });
  }

  async findAll(query: PermissionQueryDto) {
    const normalized = this.normalizeQuery(query);
    const result =
      await this.permissionsRepository.findMany(normalized);

    return {
      items: result.items,
      meta: {
        page: normalized.page,
        limit: normalized.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalized.limit),
      },
    };
  }

  async findOne(id: number) {
    const permission =
      await this.permissionsRepository.findById(id);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async findManyByIds(ids: number[]) {
    return this.permissionsRepository.findByIds(ids);
  }

  private buildKey(module: string, action: string) {
    return `${module}.${action}`;
  }

  private normalizeQuery(
    query: PermissionQueryDto,
  ): NormalizedPermissionQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      module: query.module,
    };
  }
}
