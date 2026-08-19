import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResourceStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';

import { CreateDocumentUploadDto } from '../dto/create-document-upload.dto';
import { RESOURCE_TYPE_IDS } from '../constants/resource-type.constants';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { ResourceQueryDto } from '../dto/resource-query.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import {
  NormalizedResourceQuery,
  ResourceRepository,
  ResourceUpdateData,
  ResourceWithType,
} from '../repositories/resource.repository';

const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.doc',
  '.docx',
  '.pdf',
  '.ppt',
  '.pptx',
  '.txt',
]);

export interface ResourceUploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class ResourceService {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async createUploadedDocument(
    folderId: number,
    dto: CreateDocumentUploadDto,
    file: ResourceUploadFile | undefined,
  ) {
    await this.ensureFolderExists(folderId);
    const storedFile = await this.storeDocumentFile(folderId, file);

    try {
      const resource = await this.resourceRepository.create({
        folderId,
        title: dto.title.trim(),
        description: dto.description,
        resourceTypeId: RESOURCE_TYPE_IDS.DOCUMENT,
        documentUrl: storedFile.url,
        videoUrl: null,
        examId: null,
        mimeType: file?.mimetype,
        fileSize: BigInt(file?.size ?? 0),
        durationInSeconds: null,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? ResourceStatus.DRAFT,
        isPublished: dto.isPublished ?? false,
        isDownloadable: dto.isDownloadable ?? true,
      });

      return this.toResponse(resource);
    } catch (error) {
      await this.removeStoredFile(storedFile.path);
      throw error;
    }
  }

  async replaceDocumentFile(
    folderId: number,
    id: number,
    file: ResourceUploadFile | undefined,
  ) {
    await this.ensureFolderExists(folderId);
    const existing = await this.findExisting(folderId, id);

    if (existing.resourceTypeId !== RESOURCE_TYPE_IDS.DOCUMENT) {
      throw new BadRequestException(
        'Only document resources can have an uploaded file replaced',
      );
    }

    const storedFile = await this.storeDocumentFile(folderId, file);
    try {
      const resource = await this.resourceRepository.update(id, {
        documentUrl: storedFile.url,
        mimeType: file?.mimetype,
        fileSize: BigInt(file?.size ?? 0),
      });

      await this.removeStoredFile(this.storedPathFromUrl(existing.documentUrl));
      return this.toResponse(resource);
    } catch (error) {
      await this.removeStoredFile(storedFile.path);
      throw error;
    }
  }

  async create(folderId: number, dto: CreateResourceDto) {
    await this.ensureFolderExists(folderId);
    await this.ensureResourceTypeExists(dto.resourceTypeId);
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
    if (dto.resourceTypeId !== undefined) {
      await this.ensureResourceTypeExists(dto.resourceTypeId);
    }
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

  async findResourceTypes() {
    return this.resourceRepository.findActiveResourceTypes();
  }

  async readDocumentFile(folderId: number, filename: string) {
    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new BadRequestException('Invalid document filename');
    }

    const resource = await this.resourceRepository.findByDocumentFilename(
      folderId,
      safeFilename,
    );
    if (!resource) {
      throw new NotFoundException('Document file not found');
    }

    const path = this.storedPathFromUrl(resource.documentUrl);
    if (!path) {
      throw new NotFoundException('Document file not found');
    }

    try {
      await stat(path);
    } catch {
      throw new NotFoundException('Document file not found');
    }

    return {
      fileName: safeFilename,
      mimeType: resource.mimeType ?? 'application/octet-stream',
      stream: createReadStream(path),
    };
  }

  private async ensureFolderExists(folderId: number) {
    const folder = await this.resourceRepository.findFolderById(folderId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
  }

  private async ensureResourceTypeExists(resourceTypeId: number) {
    const resourceType =
      await this.resourceRepository.findResourceTypeById(resourceTypeId);

    if (!resourceType) {
      throw new BadRequestException('Resource type is invalid or inactive');
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
    existing?: ResourceWithType,
  ) {
    const resourceTypeId = dto.resourceTypeId ?? existing?.resourceTypeId;

    if (!resourceTypeId) {
      throw new BadRequestException('Resource type is required');
    }

    const typeChanged = Boolean(
      existing &&
      dto.resourceTypeId &&
      dto.resourceTypeId !== existing.resourceTypeId,
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

    if (resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT) {
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

    if (resourceTypeId === RESOURCE_TYPE_IDS.VIDEO) {
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
      if (!this.isSupportedVideoUrl(videoUrl)) {
        throw new BadRequestException(
          'Video URL must point to YouTube or Vimeo',
        );
      }
    }

    if (resourceTypeId === RESOURCE_TYPE_IDS.EXAM) {
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
      resourceTypeId,
      documentUrl:
        resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT ? documentUrl : null,
      videoUrl: resourceTypeId === RESOURCE_TYPE_IDS.VIDEO ? videoUrl : null,
      examId: resourceTypeId === RESOURCE_TYPE_IDS.EXAM ? examId : null,
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
      resourceTypeId: query.resourceTypeId,
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

  private isSupportedVideoUrl(value: string) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return false;
      const hostname = url.hostname.toLowerCase();
      return (
        hostname === 'youtu.be' ||
        hostname === 'youtube.com' ||
        hostname.endsWith('.youtube.com') ||
        hostname === 'vimeo.com' ||
        hostname.endsWith('.vimeo.com')
      );
    } catch {
      return false;
    }
  }

  private async storeDocumentFile(
    folderId: number,
    file: ResourceUploadFile | undefined,
  ) {
    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException('A non-empty document file is required');
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new BadRequestException('Document file must not exceed 25 MB');
    }

    const extension = extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype) ||
      !ALLOWED_DOCUMENT_EXTENSIONS.has(extension)
    ) {
      throw new BadRequestException(
        'Only PDF, DOC, DOCX, PPT, PPTX, and TXT documents are supported',
      );
    }

    const directory = join(process.cwd(), 'uploads', 'resources');
    const filename = `${randomUUID()}${extension}`;
    const path = join(directory, filename);
    await mkdir(directory, { recursive: true });
    await writeFile(path, file.buffer, { flag: 'wx' });

    const publicBaseUrl = (
      process.env.PUBLIC_API_URL ??
      `http://localhost:${process.env.PORT ?? '5000'}`
    ).replace(/\/$/, '');

    return {
      path,
      url: `${publicBaseUrl}/api/v1/folders/${folderId}/resources/file/${filename}`,
    };
  }

  private storedPathFromUrl(url: string | null) {
    if (!url) return null;
    const marker = '/resources/file/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) return null;
    const filename = basename(url.slice(markerIndex + marker.length));
    if (filename !== url.slice(markerIndex + marker.length)) return null;
    return filename
      ? join(process.cwd(), 'uploads', 'resources', filename)
      : null;
  }

  private async removeStoredFile(path: string | null) {
    if (!path) return;
    await unlink(path).catch(() => undefined);
  }

  private toResponse(resource: ResourceWithType) {
    return {
      ...resource,
      fileSize:
        resource.fileSize === null ? null : resource.fileSize.toString(),
    };
  }
}
