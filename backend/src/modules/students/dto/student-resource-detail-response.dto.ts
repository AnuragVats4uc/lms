import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ResourceTypeDataDto } from '../../resource/dto/resource-type-response.dto';

class StudentDocumentProgressDto {
  @ApiProperty({ example: 62 })
  percentage: number;

  @ApiProperty({ example: 5 })
  pagesRead: number;

  @ApiPropertyOptional({ nullable: true, example: 34 })
  totalPages: number | null;

  @ApiPropertyOptional({ nullable: true, example: 5 })
  lastPage: number | null;

  @ApiProperty({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] })
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiPropertyOptional({ nullable: true })
  lastOpenedAt: Date | null;
}

class StudentDocumentNavigationItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Current Affairs - Monthly Revision Notes' })
  title: string;
}

class StudentDocumentNavigationDto {
  @ApiProperty({ example: 3 })
  current: number;

  @ApiProperty({ example: 5 })
  total: number;

  @ApiPropertyOptional({
    type: StudentDocumentNavigationItemDto,
    nullable: true,
  })
  previous: StudentDocumentNavigationItemDto | null;

  @ApiPropertyOptional({
    type: StudentDocumentNavigationItemDto,
    nullable: true,
  })
  next: StudentDocumentNavigationItemDto | null;
}

class StudentRelatedResourceDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Weekly Current Affairs Quiz' })
  title: string;

  @ApiProperty({ example: 2 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiPropertyOptional({ nullable: true })
  videoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnail: string | null;
}

class StudentResourceDetailDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Current Affairs - Monthly Revision Notes' })
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 1 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiProperty({ example: 'Current Affairs - Monthly Revision Notes.pdf' })
  fileName: string;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiProperty({ example: true })
  isDownloadable: boolean;

  @ApiProperty({ type: StudentDocumentProgressDto })
  progress: StudentDocumentProgressDto;

  @ApiProperty({ type: [StudentRelatedResourceDto] })
  relatedResources: StudentRelatedResourceDto[];

  @ApiProperty({ type: StudentDocumentNavigationDto })
  navigation: StudentDocumentNavigationDto;
}

export class StudentResourceDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: StudentResourceDetailDataDto })
  data: StudentResourceDetailDataDto;
}
