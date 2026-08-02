import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Resource, ResourceStatus, ResourceType } from '@prisma/client';

import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import {
  NormalizedResourceQuery,
  ResourceRepository,
  ResourceUpdateData,
} from '../repositories/resource.repository';

@Injectable()
export class ResourceService {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async create(folderId: number, dto: CreateResourceDto) {
    await this.ensureFolderExists(folderId);
    const normalized = this.normalizeResourceData(dto);

    const resource = await this.resourceRepository.create({
      folderId,
      title: dto.title.trim(),
      description: dto.description,
      ...normalized,
      sortOrder: dto.sortOrder ?? 0,
      status: dto.status ?? ResourceStatus.DRAFT,
      isPublished: dto.isPublished ?? false,
      isDownloadable: dto.isDownloadable ?? true,
    });

    return this.toResponse(resource);
  }

  async findAll(folderId: number, query: ResourceQueryDto) {
    await this.ensureFolderExists(folderId);

    const normalizedQuery = this.normalizeQuery(query);
    const result = await this.resourceRepository.findMany(
      folderId,
      normalizedQuery,
    );

    return {
      items: result.items.map((resource) => this.toResponse(resource)),
      meta: {
        page: normalizedQuery.page,
        limit: normalizedQuery.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalizedQuery.limit),
      },
    };
  }

  async findOne(folderId: number, id: number) {
    await this.ensureFolderExists(folderId);
    const resource = await this.findExisting(folderId, id);

    return this.toResponse(resource);
  }

  async update(folderId: number, id: number, dto: UpdateResourceDto) {
    await this.ensureFolderExists(folderId);
    const existing = await this.findExisting(folderId, id);
    const normalized = this.normalizeResourceData(dto, existing);
    const data = this.toUpdateInput(dto, normalized);

    const resource = await this.resourceRepository.update(id, data);

    return this.toResponse(resource);
  }

  async remove(folderId: number, id: number) {
    await this.ensureFolderExists(folderId);
    await this.findExisting(folderId, id);

    const resource = await this.resourceRepository.softDelete(id);

    return this.toResponse(resource);
  }

  private async ensureFolderExists(folderId: number) {
    const folder = await this.resourceRepository.findFolderById(folderId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
  }

  private async findExisting(folderId: number, id: number) {
    const resource = await this.resourceRepository.findById(folderId, id);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  private normalizeResourceData(
    dto: CreateResourceDto | UpdateResourceDto,
    existing?: Resource,
  ) {
    const type = dto.type ?? existing?.type;

    if (!type) {
      throw new BadRequestException('Resource type is required');
    }

    const typeChanged = Boolean(
      existing && dto.type && dto.type !== existing.type,
    );
    const documentUrl =
      dto.documentUrl !== undefined
        ? dto.documentUrl
        : typeChanged
          ? undefined
          : existing?.documentUrl;
    const videoUrl =
      dto.videoUrl !== undefined
        ? dto.videoUrl
        : typeChanged
          ? undefined
          : existing?.videoUrl;
    const examId =
      dto.examId !== undefined
        ? dto.examId
        : typeChanged
          ? undefined
          : existing?.examId;

    if (type === ResourceType.DOCUMENT) {
      if (!documentUrl) {
        throw new BadRequestException(
          'documentUrl is required for document resources',
        );
      }
      if (videoUrl || (examId !== null && examId !== undefined)) {
        throw new BadRequestException(
          'Document resources cannot contain videoUrl or examId',
        );
      }
    }

    if (type === ResourceType.VIDEO) {
      if (!videoUrl) {
        throw new BadRequestException(
          'videoUrl is required for video resources',
        );
      }
      if (documentUrl || (examId !== null && examId !== undefined)) {
        throw new BadRequestException(
          'Video resources cannot contain documentUrl or examId',
        );
      }
    }

    if (type === ResourceType.EXAM) {
      if (examId === null || examId === undefined) {
        throw new BadRequestException('examId is required for exam resources');
      }
      if (documentUrl || videoUrl) {
        throw new BadRequestException(
          'Exam resources cannot contain documentUrl or videoUrl',
        );
      }
    }

    return {
      type,
      documentUrl: type === ResourceType.DOCUMENT ? documentUrl : null,
      videoUrl: type === ResourceType.VIDEO ? videoUrl : null,
      examId: type === ResourceType.EXAM ? examId : null,
      thumbnail: dto.thumbnail ?? existing?.thumbnail,
      mimeType: dto.mimeType ?? existing?.mimeType,
      fileSize:
        dto.fileSize !== undefined
          ? this.toBigInt(dto.fileSize)
          : existing?.fileSize,
      durationInSeconds: dto.durationInSeconds ?? existing?.durationInSeconds,
    };
  }

  private toUpdateInput(
    dto: UpdateResourceDto,
    normalized: ReturnType<ResourceService['normalizeResourceData']>,
  ): ResourceUpdateData {
    const data: ResourceUpdateData = {
      ...normalized,
    };

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.isDownloadable !== undefined) {
      data.isDownloadable = dto.isDownloadable;
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return data;
  }

  private normalizeQuery(query: ResourceQueryDto): NormalizedResourceQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      type: query.type,
      status: query.status,
      published: query.published,
    };
  }

  private toBigInt(value: string) {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('fileSize must be a valid integer string');
    }
  }

  private toResponse(resource: Resource) {
    return {
      ...resource,
      fileSize:
        resource.fileSize === null ? null : resource.fileSize.toString(),
    };
  }
}
