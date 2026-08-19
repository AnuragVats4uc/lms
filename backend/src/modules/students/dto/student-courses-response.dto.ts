import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ResourceTypeDataDto } from '../../resource/dto/resource-type-response.dto';

class StudentCourseResourceCountsDto {
  @ApiProperty({ example: 24 })
  videos: number;

  @ApiProperty({ example: 15 })
  documents: number;

  @ApiProperty({ example: 8 })
  exams: number;
}

class StudentCourseLastAccessedDto {
  @ApiProperty({ example: 1 })
  resourceId: number;

  @ApiProperty({ example: 'Linear Equations - Part 2' })
  title: string;

  @ApiProperty({ example: 2 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiProperty({ example: '2026-08-12T08:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: '/student/resources?sessionCourseId=1&resourceId=1' })
  path: string;
}

export class StudentCourseItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  enrollmentId: number;

  @ApiProperty({ example: 1 })
  sessionCourseId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'IPMAT Foundation 2027' })
  title: string;

  @ApiProperty({ example: 'IP' })
  shortCode: string;

  @ApiProperty({ example: 'IPMAT Program' })
  program: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 'Ritika Mehra' })
  instructor: string;

  @ApiProperty({ example: 68 })
  completionPercentage: number;

  @ApiProperty({ example: 'IN_PROGRESS' })
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty({ type: StudentCourseResourceCountsDto })
  resourceCounts: StudentCourseResourceCountsDto;

  @ApiPropertyOptional({ type: StudentCourseLastAccessedDto, nullable: true })
  lastAccessed: StudentCourseLastAccessedDto | null;

  @ApiProperty({ example: '/student/resources?sessionCourseId=1' })
  continuePath: string;

  @ApiProperty({ example: 'Continue Learning' })
  actionLabel: string;
}

class StudentCoursesMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

class StudentCoursesDataDto {
  @ApiProperty({ type: [StudentCourseItemDto] })
  items: StudentCourseItemDto[];

  @ApiProperty({ type: StudentCoursesMetaDto })
  meta: StudentCoursesMetaDto;

  @ApiProperty({ example: ['IPMAT Foundation 2027'] })
  categories: string[];
}

export class StudentCoursesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: StudentCoursesDataDto })
  data: StudentCoursesDataDto;

  @ApiProperty({ example: '2026-08-12T08:00:00.000Z' })
  timestamp: string;
}
