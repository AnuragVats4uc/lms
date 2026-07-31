import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, SessionCourseStatus } from '@prisma/client';

export class SessionCourseCourseDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '58592738-88e3-44ff-a72f-5ad4c767518d',
  })
  uuid: string;

  @ApiProperty({ example: 'JEE Foundation' })
  name: string;

  @ApiProperty({ example: 'JEE-FDN' })
  code: string;

  @ApiPropertyOptional({
    example: 'Foundation course for JEE aspirants.',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/courses/jee-foundation.png',
  })
  thumbnail?: string | null;

  @ApiPropertyOptional({ example: 365 })
  durationInDays?: number | null;

  @ApiProperty({ enum: CourseStatus })
  status: CourseStatus;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class SessionCourseDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    example: '58592738-88e3-44ff-a72f-5ad4c767518d',
  })
  uuid: string;

  @ApiProperty({ example: 1 })
  sessionId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiPropertyOptional({ example: 'JEE Foundation - Morning Batch' })
  displayName?: string | null;

  @ApiPropertyOptional({
    example: 'Session-specific display details for this course.',
  })
  description?: string | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: false })
  isPublished: boolean;

  @ApiProperty({ enum: SessionCourseStatus })
  status: SessionCourseStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: SessionCourseCourseDataDto })
  course: SessionCourseCourseDataDto;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}

export class SessionCourseListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class SessionCourseListDataDto {
  @ApiProperty({ type: [SessionCourseDataDto] })
  items: SessionCourseDataDto[];

  @ApiProperty({ type: SessionCourseListMetaDto })
  meta: SessionCourseListMetaDto;
}

export class SessionCourseResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: SessionCourseDataDto })
  data: SessionCourseDataDto;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  timestamp: string;
}

export class SessionCourseListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: SessionCourseListDataDto })
  data: SessionCourseListDataDto;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  timestamp: string;
}
