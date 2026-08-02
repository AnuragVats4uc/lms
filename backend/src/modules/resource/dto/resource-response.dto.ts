import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus, ResourceType } from '@prisma/client';

export class ResourceDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '58592738-88e3-44ff-a72f-5ad4c767518d' })
  uuid: string;

  @ApiProperty({ example: 1 })
  folderId: number;

  @ApiProperty({ example: 'Motion Notes' })
  title: string;

  @ApiPropertyOptional({ example: 'Chapter notes for motion.' })
  description: string | null;

  @ApiProperty({ enum: ResourceType })
  type: ResourceType;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/motion-notes.pdf' })
  documentUrl: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/motion-lecture.mp4',
  })
  videoUrl: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  examId: number | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/motion.png' })
  thumbnail: string | null;

  @ApiPropertyOptional({ example: 'application/pdf' })
  mimeType: string | null;

  @ApiPropertyOptional({
    example: '204800',
    nullable: true,
    description: 'File size in bytes as a decimal string.',
  })
  fileSize: string | null;

  @ApiPropertyOptional({ example: 3600, nullable: true })
  durationInSeconds: number | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ enum: ResourceStatus })
  status: ResourceStatus;

  @ApiProperty({ example: false })
  isPublished: boolean;

  @ApiProperty({ example: true })
  isDownloadable: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  updatedAt: Date;
}

export class ResourceListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class ResourceListDataDto {
  @ApiProperty({ type: [ResourceDataDto] })
  items: ResourceDataDto[];

  @ApiProperty({ type: ResourceListMetaDto })
  meta: ResourceListMetaDto;
}

export class ResourceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: ResourceDataDto })
  data: ResourceDataDto;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  timestamp: string;
}

export class ResourceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: ResourceListDataDto })
  data: ResourceListDataDto;

  @ApiProperty({ example: '2026-08-02T00:00:00.000Z' })
  timestamp: string;
}
