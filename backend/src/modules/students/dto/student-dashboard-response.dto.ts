import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ResourceType,
  StudentNotificationType,
} from '@prisma/client';

export class StudentDashboardOrganizationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Demo Organization' })
  name: string;

  @ApiProperty({ example: 'DEMO' })
  code: string;
}

export class StudentDashboardSessionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'IPMAT Foundation 2027' })
  name: string;

  @ApiPropertyOptional({ example: 'IPMAT-2027', nullable: true })
  code: string | null;
}

export class StudentDashboardStudentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Demo Student' })
  name: string;

  @ApiProperty({ example: 'Demo' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Student', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'student@example.com' })
  email: string;

  @ApiPropertyOptional({ nullable: true })
  avatar: string | null;

  @ApiPropertyOptional({ nullable: true })
  batch: string | null;

  @ApiPropertyOptional({ type: StudentDashboardOrganizationDto, nullable: true })
  organization: StudentDashboardOrganizationDto | null;

  @ApiPropertyOptional({ type: StudentDashboardSessionDto, nullable: true })
  session: StudentDashboardSessionDto | null;
}

export class StudentDashboardCourseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sessionCourseId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'Quantitative Aptitude' })
  title: string;

  @ApiProperty({ example: 'QA' })
  shortCode: string;

  @ApiProperty({ example: 'Ritika Mehra' })
  instructor: string;

  @ApiProperty({ example: 68 })
  completionPercentage: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty({ example: '/student/resources?sessionCourseId=1' })
  continuePath: string;
}

export class StudentDashboardNotificationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: StudentNotificationType })
  type: StudentNotificationType;

  @ApiProperty({ example: 'Assignment Reminder' })
  title: string;

  @ApiProperty({ example: 'Logical Reasoning Set 04 is due tomorrow.' })
  description: string;

  @ApiProperty({ example: '2026-08-12T08:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: false })
  isRead: boolean;
}

export class StudentDashboardContentUpdateDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  resourceId: number;

  @ApiProperty({ enum: ResourceType })
  resourceType: ResourceType;

  @ApiProperty({ example: 'New PDF Added' })
  title: string;

  @ApiProperty({ example: 'Permutation & Combination Notes' })
  description: string;

  @ApiProperty({ example: '2026-08-12T08:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: '/student/resources?resourceId=1' })
  path: string;
}

export class StudentDashboardContinueLearningDto {
  @ApiPropertyOptional({ example: 1, nullable: true })
  sessionCourseId: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  resourceId: number | null;

  @ApiProperty({ example: '/student/my-courses' })
  path: string;
}

export class StudentDashboardDataDto {
  @ApiProperty({ type: StudentDashboardStudentDto })
  student: StudentDashboardStudentDto;

  @ApiProperty({ type: [StudentDashboardCourseDto] })
  courses: StudentDashboardCourseDto[];

  @ApiProperty({ type: [StudentDashboardNotificationDto] })
  notifications: StudentDashboardNotificationDto[];

  @ApiProperty({ type: [StudentDashboardContentUpdateDto] })
  contentUpdates: StudentDashboardContentUpdateDto[];

  @ApiProperty({ type: StudentDashboardContinueLearningDto })
  continueLearning: StudentDashboardContinueLearningDto;
}

export class StudentDashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: StudentDashboardDataDto })
  data: StudentDashboardDataDto;

  @ApiProperty({ example: '2026-08-12T08:00:00.000Z' })
  timestamp: string;
}
