import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardMetricDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 10 })
  active: number;

  @ApiProperty({ example: 2 })
  inactive: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({ type: DashboardMetricDto })
  organizations: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  sessions: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  courses: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  sessionCourses: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  folders: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  resources: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  users: DashboardMetricDto;

  @ApiProperty({ type: DashboardMetricDto })
  roles: DashboardMetricDto;

  @ApiProperty({ example: 32 })
  permissions: number;
}

export class DashboardContextOrganizationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ABC Institute' })
  name: string;

  @ApiProperty({ example: 'ABC' })
  code: string;
}

export class DashboardContextSessionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2025-2026' })
  name: string;
}

export class DashboardContextCourseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'JEE Foundation' })
  name: string;

  @ApiProperty({ example: 'JEE-FDN' })
  code: string;
}

export class DashboardContextDto {
  @ApiPropertyOptional({ type: DashboardContextOrganizationDto, nullable: true })
  organization: DashboardContextOrganizationDto | null;

  @ApiPropertyOptional({ type: DashboardContextSessionDto, nullable: true })
  session: DashboardContextSessionDto | null;

  @ApiPropertyOptional({ type: DashboardContextCourseDto, nullable: true })
  course: DashboardContextCourseDto | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  sessionCourseId: number | null;
}

export class DashboardFolderDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Physics' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 4 })
  resourceCount: number;

  @ApiProperty({ example: 3 })
  folderCount: number;

  @ApiProperty({ example: '2026-08-05T10:00:00.000Z' })
  updatedAt: Date;
}

export class DashboardTreeNodeDto {
  @ApiProperty({ example: 'folder-1' })
  id: string;

  @ApiProperty({ example: 'folder' })
  type: string;

  @ApiProperty({ example: 'Physics' })
  label: string;

  @ApiPropertyOptional({ type: () => [DashboardTreeNodeDto] })
  children?: DashboardTreeNodeDto[];
}

export class DashboardRoleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Super Admin' })
  name: string;

  @ApiProperty({ example: 'SUPER_ADMIN' })
  code: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 24 })
  permissionCount: number;

  @ApiProperty({ example: 1 })
  userCount: number;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class DashboardDataDto {
  @ApiProperty({ type: DashboardStatisticsDto })
  statistics: DashboardStatisticsDto;

  @ApiProperty({ type: DashboardContextDto })
  context: DashboardContextDto;

  @ApiProperty({ type: [DashboardFolderDto] })
  folders: DashboardFolderDto[];

  @ApiProperty({ type: [DashboardTreeNodeDto] })
  tree: DashboardTreeNodeDto[];

  @ApiProperty({ type: [DashboardRoleDto] })
  roles: DashboardRoleDto[];
}

export class DashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;

  @ApiProperty({ example: '2026-08-05T10:00:00.000Z' })
  timestamp: string;
}
