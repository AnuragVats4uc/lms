import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/types/current-user.types';
import {
  TeacherCoursesQueryDto,
  TeacherResourcesQueryDto,
  TeacherStudentsQueryDto,
} from './dto/teacher-query.dto';
import { TeacherDashboardService } from './teacher-dashboard.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Teacher')
@ApiBearerAuth('access-token')
@Controller('teacher')
@Roles('TEACHER')
export class TeacherDashboardController {
  constructor(
    private readonly teacherDashboardService: TeacherDashboardService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get authenticated teacher dashboard data' })
  @ApiOkResponse({ description: 'Teacher dashboard fetched successfully' })
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.teacherDashboardService.getDashboard(request.user);
  }

  @Get('courses')
  @ApiOperation({ summary: 'List authenticated teacher assigned courses' })
  @ApiOkResponse({ description: 'Teacher courses fetched successfully' })
  getCourses(
    @Req() request: AuthenticatedRequest,
    @Query() query: TeacherCoursesQueryDto,
  ) {
    return this.teacherDashboardService.getCourses(request.user, query);
  }

  @Get('resources')
  @ApiOperation({ summary: 'List resources for authenticated teacher courses' })
  @ApiOkResponse({ description: 'Teacher resources fetched successfully' })
  getResources(
    @Req() request: AuthenticatedRequest,
    @Query() query: TeacherResourcesQueryDto,
  ) {
    return this.teacherDashboardService.getResources(request.user, query);
  }

  @Get('students')
  @ApiOperation({ summary: 'List students for authenticated teacher courses' })
  @ApiOkResponse({ description: 'Teacher students fetched successfully' })
  getStudents(
    @Req() request: AuthenticatedRequest,
    @Query() query: TeacherStudentsQueryDto,
  ) {
    return this.teacherDashboardService.getStudents(request.user, query);
  }

  @Get('resource-types')
  @ApiOperation({ summary: 'List resource types for teacher filters' })
  @ApiOkResponse({ description: 'Resource types fetched successfully' })
  getResourceTypes() {
    return this.teacherDashboardService.getResourceTypes();
  }
}
