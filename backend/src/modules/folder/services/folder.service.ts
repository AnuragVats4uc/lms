import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Folder, FolderStatus } from '@prisma/client';

import { CreateFolderDto } from '../dto/create-folder.dto';
import { FolderQueryDto } from '../dto/folder-query.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';
import {
  FolderRepository,
  FolderUpdateData,
  NormalizedFolderQuery,
} from '../repositories/folder.repository';

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

@Injectable()
export class FolderService {
  constructor(private readonly folderRepository: FolderRepository) {}

  async create(sessionCourseId: number, dto: CreateFolderDto) {
    await this.ensureSessionCourseExists(sessionCourseId);

    const parentFolderId = dto.parentFolderId ?? null;
    await this.ensureParentExists(sessionCourseId, parentFolderId);
    await this.ensureNameIsUnique(sessionCourseId, parentFolderId, dto.name);

    const folder = await this.folderRepository.create({
      ...dto,
      name: dto.name.trim(),
      parentFolderId,
      sessionCourseId,
      status: dto.status ?? FolderStatus.ACTIVE,
    });

    return this.toResponse(folder);
  }

  async findAll(sessionCourseId: number, query: FolderQueryDto) {
    await this.ensureSessionCourseExists(sessionCourseId);

    const normalizedQuery = this.normalizeQuery(query);
    const result = await this.folderRepository.findMany(
      sessionCourseId,
      normalizedQuery,
    );

    return {
      items: result.items.map((folder) => this.toResponse(folder)),
      meta: {
        page: normalizedQuery.page,
        limit: normalizedQuery.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalizedQuery.limit),
      },
    };
  }

  async findTree(sessionCourseId: number) {
    await this.ensureSessionCourseExists(sessionCourseId);

    const folders = await this.folderRepository.findTree(sessionCourseId);
    const nodes = new Map<number, FolderTreeNode>();

    for (const folder of folders) {
      nodes.set(folder.id, { ...folder, children: [] });
    }

    const roots: FolderTreeNode[] = [];

    for (const folder of folders) {
      const node = nodes.get(folder.id)!;
      const parent = folder.parentFolderId
        ? nodes.get(folder.parentFolderId)
        : undefined;

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(sessionCourseId: number, id: number) {
    await this.ensureSessionCourseExists(sessionCourseId);

    const folder = await this.findExisting(sessionCourseId, id);

    return this.toResponse(folder);
  }

  async update(sessionCourseId: number, id: number, dto: UpdateFolderDto) {
    await this.ensureSessionCourseExists(sessionCourseId);

    const existing = await this.findExisting(sessionCourseId, id);
    const parentFolderId =
      dto.parentFolderId === undefined
        ? existing.parentFolderId
        : dto.parentFolderId;

    await this.ensureParentExists(sessionCourseId, parentFolderId, id);
    await this.ensureNoCircularReference(sessionCourseId, id, parentFolderId);

    await this.ensureNameIsUnique(
      sessionCourseId,
      parentFolderId,
      dto.name ?? existing.name,
      id,
    );

    const folder = await this.folderRepository.update(
      id,
      this.toUpdateInput(dto, parentFolderId),
    );

    return this.toResponse(folder);
  }

  async remove(sessionCourseId: number, id: number) {
    await this.ensureSessionCourseExists(sessionCourseId);
    await this.findExisting(sessionCourseId, id);

    const folder = await this.folderRepository.softDelete(id);

    return this.toResponse(folder);
  }

  private async ensureSessionCourseExists(sessionCourseId: number) {
    const sessionCourse =
      await this.folderRepository.findSessionCourseById(sessionCourseId);

    if (!sessionCourse) {
      throw new NotFoundException('SessionCourse not found');
    }
  }

  private async findExisting(sessionCourseId: number, id: number) {
    const folder = await this.folderRepository.findById(sessionCourseId, id);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  private async ensureParentExists(
    sessionCourseId: number,
    parentFolderId: number | null,
    excludeId?: number,
  ) {
    if (parentFolderId === null) {
      return;
    }

    if (parentFolderId === excludeId) {
      throw new ConflictException('A folder cannot be its own parent');
    }

    const parent = await this.folderRepository.findParentById(
      sessionCourseId,
      parentFolderId,
    );

    if (!parent) {
      throw new NotFoundException('Parent folder not found');
    }
  }

  private async ensureNoCircularReference(
    sessionCourseId: number,
    folderId: number,
    parentFolderId: number | null,
  ) {
    if (parentFolderId === null) {
      return;
    }

    const relations =
      await this.folderRepository.findAllRelations(sessionCourseId);
    const parentById = new Map(
      relations.map((relation) => [relation.id, relation.parentFolderId]),
    );
    let currentParentId: number | null | undefined = parentFolderId;

    while (currentParentId !== null && currentParentId !== undefined) {
      if (currentParentId === folderId) {
        throw new ConflictException(
          'A folder cannot become a descendant of itself',
        );
      }

      currentParentId = parentById.get(currentParentId);
    }
  }

  private async ensureNameIsUnique(
    sessionCourseId: number,
    parentFolderId: number | null,
    name: string,
    excludeId?: number,
  ) {
    const normalizedName = name.trim();
    const folder = excludeId
      ? await this.folderRepository.findByNameExcludingId(
          sessionCourseId,
          parentFolderId,
          normalizedName,
          excludeId,
        )
      : await this.folderRepository.findByName(
          sessionCourseId,
          parentFolderId,
          normalizedName,
        );

    if (folder) {
      throw new ConflictException(
        'Folder name already exists within this parent folder',
      );
    }
  }

  private normalizeQuery(query: FolderQueryDto): NormalizedFolderQuery {
    return {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search ?? '',
      parentFolderId: query.parentFolderId,
      status: query.status,
    };
  }

  private toUpdateInput(
    dto: UpdateFolderDto,
    parentFolderId: number | null,
  ): FolderUpdateData {
    const data: FolderUpdateData = {
      parentFolderId,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return data;
  }

  private toResponse(folder: Folder) {
    return folder;
  }
}
