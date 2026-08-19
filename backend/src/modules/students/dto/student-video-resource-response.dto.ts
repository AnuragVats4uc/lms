import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ResourceTypeDataDto } from '../../resource/dto/resource-type-response.dto';

class StudentVideoCourseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Quantitative Aptitude' })
  name: string;

  @ApiProperty({ example: 'IPMAT Foundation 2027' })
  sessionName: string;
}

class StudentVideoSubjectDto {
  @ApiProperty({ example: 18 })
  id: number;

  @ApiProperty({ example: 'Number Systems' })
  name: string;
}

class StudentVideoInstructorDto {
  @ApiProperty({ example: 8 })
  id: number;

  @ApiProperty({ example: 'Ritika Mehra' })
  name: string;
}

export class StudentVideoProgressDto {
  @ApiProperty({ example: 482 })
  currentPositionSeconds: number;

  @ApiProperty({ example: 42 })
  percentage: number;

  @ApiProperty({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] })
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiPropertyOptional({ nullable: true })
  lastWatchedAt: Date | null;
}

class StudentVideoUpNextResourceDto {
  @ApiProperty({ example: 35 })
  id: number;

  @ApiProperty({ example: 'Percentage and Profit/Loss - Problem Solving' })
  title: string;

  @ApiProperty({ example: 1 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiPropertyOptional({ nullable: true })
  thumbnail: string | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationInSeconds: number | null;
}

class StudentVideoResourceDataDto {
  @ApiProperty({ example: 34 })
  id: number;

  @ApiProperty({ example: 'Number Systems - Concept Introduction' })
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 2 })
  resourceTypeId: number;

  @ApiProperty({ type: ResourceTypeDataDto })
  resourceType: ResourceTypeDataDto;

  @ApiProperty({ example: 'https://vimeo.com/76979871' })
  videoUrl: string;

  @ApiPropertyOptional({ nullable: true })
  thumbnail: string | null;

  @ApiPropertyOptional({ nullable: true })
  mimeType: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationInSeconds: number | null;

  @ApiProperty({ type: StudentVideoCourseDto })
  course: StudentVideoCourseDto;

  @ApiProperty({ type: StudentVideoSubjectDto })
  subject: StudentVideoSubjectDto;

  @ApiPropertyOptional({ type: StudentVideoInstructorDto, nullable: true })
  instructor: StudentVideoInstructorDto | null;

  @ApiProperty({ type: StudentVideoProgressDto })
  progress: StudentVideoProgressDto;

  @ApiProperty({ type: [StudentVideoUpNextResourceDto] })
  upNext: StudentVideoUpNextResourceDto[];
}

export class StudentVideoResourceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: StudentVideoResourceDataDto })
  data: StudentVideoResourceDataDto;
}
