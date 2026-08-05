import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { Permissions } from '../../auth/permissions/permissions.decorator';
import { CurrentUser } from '../../auth/types/current-user.types';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { DashboardService } from '../services/dashboard.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Get the admin dashboard summary' })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiQuery({ name: 'sessionId', required: false, type: Number })
  @ApiQuery({ name: 'sessionCourseId', required: false, type: Number })
  @ApiOkResponse({
    description: 'Dashboard summary fetched successfully',
    type: DashboardResponseDto,
  })
  getSummary(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getSummary(request.user, query);
  }
}
