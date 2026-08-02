import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FolderStatus } from '@prisma/client';

import { FolderTreeNodeDto } from './folder-tree.dto';

export class FolderDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '58592738-88e3-44ff-a72f-5ad4c767518d' })
  uuid: string;

  @ApiProperty({ example: 1 })
  sessionCourseId: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  parentFolderId: number | null;

  @ApiProperty({ example: 'Physics' })
  name: string;

  @ApiPropertyOptional({ example: 'Physics learning materials.' })
  description: string | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ example: 'atom' })
  icon: string | null;

  @ApiPropertyOptional({ example: '#2563EB' })
  color: string | null;

  @ApiProperty({ enum: FolderStatus })
  status: FolderStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class FolderListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class FolderListDataDto {
  @ApiProperty({ type: [FolderDataDto] })
  items: FolderDataDto[];

  @ApiProperty({ type: FolderListMetaDto })
  meta: FolderListMetaDto;
}

export class FolderTreeDataDto {
  @ApiProperty({ type: [FolderDataDto] })
  items: FolderDataDto[];
}

export class FolderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: FolderDataDto })
  data: FolderDataDto;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  timestamp: string;
}

export class FolderListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: FolderListDataDto })
  data: FolderListDataDto;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  timestamp: string;
}

export class FolderTreeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: () => [FolderTreeNodeDto] })
  data: FolderTreeNodeDto[];

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  timestamp: string;
}
