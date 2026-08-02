import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FolderStatus } from '@prisma/client';

export class FolderTreeNodeDto {
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

  @ApiProperty({ type: () => [FolderTreeNodeDto] })
  children: FolderTreeNodeDto[];

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  updatedAt: Date;
}
