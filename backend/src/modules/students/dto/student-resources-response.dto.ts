import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatus } from '@prisma/client';

import { ResourceTypeDataDto } from '../../resource/dto/resource-type-response.dto';

class StudentResourceCourseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'Quantitative Aptitude' })
  name: string;

  @ApiProperty({ example: 'QA' })
  code: string;

  @ApiProperty({ example: 1 })
  sessionId: number;

  @ApiProperty({ example: 'IPMAT Foundation 2027' })
  sessionName: string;
}

class StudentResourceSubjectDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Aptitude Notes' })
  name: string;
}

class StudentResourceUploaderDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ritika Mehra' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  avatar: string | null;
}

class StudentResourceItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '58592738-88e3-44ff-a72f-5ad4c767518d' })
  uuid: string;

  @ApiProperty({ example: 'Number Systems – Complete Revision Notes' })
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 1 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiPropertyOptional({ nullable: true })
  documentUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  videoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnail: string | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiPropertyOptional({ nullable: true, example: '1842176' })
  fileSize: string | null;

  @ApiPropertyOptional({ nullable: true, example: 1584 })
  durationInSeconds: number | null;

  @ApiProperty({ enum: ResourceStatus })
  status: ResourceStatus;

  @ApiProperty({ example: true })
  isDownloadable: boolean;

  @ApiProperty({ example: '2026-08-19T08:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: StudentResourceCourseDto })
  course: StudentResourceCourseDto;

  @ApiProperty({ type: StudentResourceSubjectDto })
  subject: StudentResourceSubjectDto;

  @ApiPropertyOptional({ type: StudentResourceUploaderDto, nullable: true })
  uploadedBy: StudentResourceUploaderDto | null;
}

class StudentResourcesMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

class StudentResourcesSummaryDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 5 })
  videos: number;

  @ApiProperty({ example: 5 })
  documents: number;
}

class StudentResourceCourseOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Quantitative Aptitude' })
  name: string;
}

class StudentResourceSubjectOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sessionCourseId: number;

  @ApiProperty({ example: 'Aptitude Notes' })
  name: string;
}

class StudentResourcesFilterOptionsDto {
  @ApiProperty({ type: [StudentResourceCourseOptionDto] })
  courses: StudentResourceCourseOptionDto[];

  @ApiProperty({ type: [StudentResourceSubjectOptionDto] })
  subjects: StudentResourceSubjectOptionDto[];

  @ApiProperty({ type: [ResourceTypeDataDto] })
  types: ResourceTypeDataDto[];

  @ApiProperty({ enum: ResourceStatus, isArray: true })
  statuses: ResourceStatus[];
}

class StudentResourcesDataDto {
  @ApiProperty({ type: [StudentResourceItemDto] })
  items: StudentResourceItemDto[];

  @ApiProperty({ type: StudentResourcesMetaDto })
  meta: StudentResourcesMetaDto;

  @ApiProperty({ type: StudentResourcesSummaryDto })
  summary: StudentResourcesSummaryDto;

  @ApiProperty({ type: StudentResourcesFilterOptionsDto })
  filters: StudentResourcesFilterOptionsDto;
}

export class StudentResourcesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: StudentResourcesDataDto })
  data: StudentResourcesDataDto;

  @ApiProperty({ example: '2026-08-19T08:30:00.000Z' })
  timestamp: string;
}
