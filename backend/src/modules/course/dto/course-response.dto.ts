import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

export class CourseDataDto {
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

  @ApiPropertyOptional({ example: 9999 })
  price?: string | null;

  @ApiPropertyOptional({ example: 1000 })
  discount?: string | null;

  @ApiProperty({ enum: CourseStatus })
  status: CourseStatus;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  updatedAt: Date;
}

export class CourseListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class CourseListDataDto {
  @ApiProperty({ type: [CourseDataDto] })
  items: CourseDataDto[];

  @ApiProperty({ type: CourseListMetaDto })
  meta: CourseListMetaDto;
}

export class CourseResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: CourseDataDto })
  data: CourseDataDto;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  timestamp: string;
}

export class CourseListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: CourseListDataDto })
  data: CourseListDataDto;

  @ApiProperty({ example: '2026-07-31T00:00:00.000Z' })
  timestamp: string;
}
